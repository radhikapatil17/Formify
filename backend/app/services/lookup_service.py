import ipaddress
import json
import re
import socket
import time
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional

import httpx

# In-memory sliding window rate limiter: { client_ip: [timestamps] }
_RATE_LIMIT_BUCKETS: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 45

# Explicit blocked hosts and patterns
BLOCKED_HOSTNAMES = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "metadata.google.internal", "instance-data",
}

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),     # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),    # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local / Cloud metadata (169.254.169.254)
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("::1/128"),           # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
]


def check_rate_limit(client_ip: str) -> bool:
    """Returns True if within limit, False if rate limit exceeded."""
    if not client_ip:
        client_ip = "anonymous"

    now = time.time()
    timestamps = _RATE_LIMIT_BUCKETS.get(client_ip, [])
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]

    if len(valid_timestamps) >= MAX_REQUESTS_PER_WINDOW:
        _RATE_LIMIT_BUCKETS[client_ip] = valid_timestamps
        return False

    valid_timestamps.append(now)
    _RATE_LIMIT_BUCKETS[client_ip] = valid_timestamps
    return True


def validate_and_check_ssrf(url_str: str) -> str:
    """
    Validates URL scheme, hostname, and resolves IP addresses to prevent SSRF
    against internal systems, cloud metadata services, and loopback addresses.
    """
    if not url_str or not isinstance(url_str, str):
        raise ValueError("API endpoint URL is required.")

    parsed = urlparse(url_str.strip())
    scheme = parsed.scheme.lower()

    if scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS endpoints are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid URL: Hostname is missing.")

    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES or hostname_lower.endswith(".local") or hostname_lower.endswith(".internal"):
        raise ValueError("Security restriction (SSRF): Requests to localhost and internal domain names are blocked.")

    # Resolve hostname to all candidate IP addresses
    port = parsed.port or (443 if scheme == "https" else 80)
    try:
        addr_info = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise ValueError(f"Could not resolve host '{hostname}': {str(e)}")

    if not addr_info:
        raise ValueError(f"Could not resolve host '{hostname}'.")

    for addr in addr_info:
        sockaddr = addr[4]
        ip_str = sockaddr[0]

        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise ValueError(f"Invalid IP address resolved: {ip_str}")

        NAT64_NET = ipaddress.ip_network("64:ff9b::/96")
        is_nat64 = ip_obj in NAT64_NET

        # Check standard properties (allow NAT64 reserved prefix for public IPv4 translation)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or (ip_obj.is_reserved and not is_nat64)
            or ip_obj.is_unspecified
        ):
            raise ValueError("Security restriction (SSRF): Requests to private or local network addresses are blocked.")

        # Check explicitly configured subnets
        for blocked_net in BLOCKED_IP_NETWORKS:
            if ip_obj in blocked_net:
                raise ValueError(f"Security restriction (SSRF): Resolved IP {ip_str} is in a blocked network range.")

    return url_str.strip()


def resolve_json_path(data: Any, path: str) -> Any:
    """
    Safely resolves nested JSON paths like:
      - 'places.0.place name'
      - 'address.city'
      - 'results[0].geometry.location.lat'
      - 'data.attributes["full_name"]'
      - '[0].id'
    Returns None if path does not exist or input is null.
    """
    if data is None or not path:
        return None

    path = str(path).strip()
    if not path:
        return data

    # Normalize bracket notation to dot notation:
    cleaned = re.sub(r'\[["\']?([^"\'\]]+)["\']?\]', r'.\1', path)
    if cleaned.startswith('.'):
        cleaned = cleaned[1:]

    tokens = [t for t in cleaned.split('.') if t]

    current = data
    for token in tokens:
        if current is None:
            return None

        if isinstance(current, dict):
            if token in current:
                current = current[token]
            else:
                # Try case-insensitive fallback or stripped whitespace
                match = None
                for k, v in current.items():
                    if str(k).lower().strip() == token.lower().strip():
                        match = v
                        break
                if match is not None:
                    current = match
                else:
                    return None
        elif isinstance(current, (list, tuple)):
            try:
                idx = int(token)
                if 0 <= idx < len(current):
                    current = current[idx]
                else:
                    return None
            except ValueError:
                return None
        else:
            return None

    return current


async def execute_lookup(
    endpoint: str,
    method: str = "GET",
    input_value: Optional[str] = None,
    query_params: Optional[List[Dict[str, str]]] = None,
    headers: Optional[List[Dict[str, str]]] = None,
    body: Optional[Any] = None,
    response_mappings: Optional[List[Dict[str, Any]]] = None,
    timeout_seconds: float = 6.0,
) -> Dict[str, Any]:
    """
    Executes an external REST API request securely through the FastAPI proxy.
    Performs SSRF validation, injects user input into template/query, extracts mapped values,
    and returns a clean JSON summary.
    """
    # Replace {value} placeholder in URL if present
    safe_input = (input_value or "").strip()
    effective_url = endpoint or ""
    if "{value}" in effective_url:
        effective_url = effective_url.replace("{value}", safe_input)

    # Validate URL and enforce SSRF safety
    validated_url = validate_and_check_ssrf(effective_url)

    # Prepare HTTP headers (safe defaults + creator headers)
    req_headers = {
        "User-Agent": "Formify-Lookup/1.0",
        "Accept": "application/json, text/plain, */*",
    }
    if headers and isinstance(headers, list):
        for h in headers:
            if isinstance(h, dict) and h.get("key"):
                k = str(h["key"]).strip()
                v = str(h.get("value", "")).replace("{value}", safe_input).strip()
                if "\r" not in k and "\n" not in k and "\r" not in v and "\n" not in v:
                    req_headers[k] = v

    # Prepare query parameters
    req_params = {}
    if query_params and isinstance(query_params, list):
        for p in query_params:
            if isinstance(p, dict) and p.get("key"):
                k = str(p["key"]).strip()
                v = str(p.get("value", "")).replace("{value}", safe_input).strip()
                req_params[k] = v

    # Prepare body for POST
    req_body = None
    if method.upper() == "POST":
        if isinstance(body, dict):
            def _replace_vals(obj):
                if isinstance(obj, str):
                    return obj.replace("{value}", safe_input)
                if isinstance(obj, dict):
                    return {k: _replace_vals(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [_replace_vals(x) for x in obj]
                return obj
            req_body = _replace_vals(body)
        elif isinstance(body, str) and body:
            req_body = body.replace("{value}", safe_input)

    start_time = time.time()

    async with httpx.AsyncClient(timeout=timeout_seconds, follow_redirects=False) as client:
        try:
            if method.upper() == "POST":
                if isinstance(req_body, dict):
                    resp = await client.post(validated_url, params=req_params, headers=req_headers, json=req_body)
                else:
                    resp = await client.post(validated_url, params=req_params, headers=req_headers, content=req_body)
            else:
                resp = await client.get(validated_url, params=req_params, headers=req_headers)
        except httpx.TimeoutException:
            raise ValueError(f"External API request timed out after {timeout_seconds} seconds.")
        except httpx.RequestError as exc:
            raise ValueError(f"External API connection failed: {str(exc)}")

    latency_ms = round((time.time() - start_time) * 1000)

    # Parse response JSON or text
    parsed_json = None
    try:
        parsed_json = resp.json()
    except Exception:
        parsed_json = {"raw_text": resp.text[:2000]}

    # Extract mapped values
    extracted_mappings: Dict[str, Any] = {}
    if response_mappings and isinstance(response_mappings, list):
        for mapping in response_mappings:
            if isinstance(mapping, dict):
                json_path = mapping.get("json_path") or ""
                target_field_id = mapping.get("target_field_id")
                if json_path and target_field_id is not None:
                    val = resolve_json_path(parsed_json, json_path)
                    if val is not None:
                        if isinstance(val, (dict, list)):
                            extracted_mappings[str(target_field_id)] = json.dumps(val)
                        else:
                            extracted_mappings[str(target_field_id)] = str(val)
                    else:
                        extracted_mappings[str(target_field_id)] = ""

    return {
        "success": 200 <= resp.status_code < 300,
        "status_code": resp.status_code,
        "latency_ms": latency_ms,
        "raw_response": parsed_json,
        "mapped_values": extracted_mappings,
    }
