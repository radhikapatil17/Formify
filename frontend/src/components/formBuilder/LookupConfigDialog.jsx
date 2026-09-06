import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import api from "../../api/api";
import { toast } from "react-hot-toast";

const PRESETS = [
  {
    name: "US Zip Code (Zippopotam)",
    endpoint: "https://api.zippopotam.us/us/{value}",
    method: "GET",
    sampleInput: "90210",
    mappings: [
      { json_path: "places.0.place name", labelHint: "City" },
      { json_path: "places.0.state", labelHint: "State" },
      { json_path: "country", labelHint: "Country" },
    ],
  },
  {
    name: "Country Info (REST Countries)",
    endpoint: "https://restcountries.com/v3.1/name/{value}",
    method: "GET",
    sampleInput: "france",
    mappings: [
      { json_path: "[0].capital.0", labelHint: "Capital" },
      { json_path: "[0].region", labelHint: "Region" },
      { json_path: "[0].population", labelHint: "Population" },
    ],
  },
  {
    name: "Open-Meteo Geocoding",
    endpoint: "https://geocoding-api.open-meteo.com/v1/search?name={value}&count=1&format=json",
    method: "GET",
    sampleInput: "Berlin",
    mappings: [
      { json_path: "results.0.latitude", labelHint: "Latitude" },
      { json_path: "results.0.longitude", labelHint: "Longitude" },
      { json_path: "results.0.country", labelHint: "Country" },
    ],
  },
];

export default function LookupConfigDialog({
  open,
  onClose,
  field,
  allFields = [],
  onSave,
}) {
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("GET");
  const [triggerFieldId, setTriggerFieldId] = useState("");
  const [triggerBehavior, setTriggerBehavior] = useState("after_valid_input");
  const [minChars, setMinChars] = useState(3);
  const [buttonLabel, setButtonLabel] = useState("Lookup");
  const [queryParams, setQueryParams] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [responseMappings, setResponseMappings] = useState([]);

  // Testing states
  const [testInput, setTestInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  // Initialize config from field
  useEffect(() => {
    if (open) {
      setTestResult(null);
      setTestError(null);

      let config = null;
      try {
        if (field?.lookup_config) {
          config = typeof field.lookup_config === "string"
            ? JSON.parse(field.lookup_config)
            : field.lookup_config;
        }
      } catch {
        config = null;
      }

      if (config) {
        setEndpoint(config.endpoint || "");
        setMethod(config.method || "GET");
        setTriggerFieldId(config.trigger_field_id ? String(config.trigger_field_id) : "");
        setTriggerBehavior(config.trigger_behavior || "after_valid_input");
        setMinChars(config.min_chars ?? 3);
        setButtonLabel(config.button_label || "Lookup");
        setQueryParams(Array.isArray(config.query_params) ? config.query_params : []);
        setHeaders(Array.isArray(config.headers) ? config.headers : []);
        setResponseMappings(Array.isArray(config.response_mappings) ? config.response_mappings : []);
        setTestInput(config.sample_input || "90210");
      } else {
        // Defaults
        setEndpoint("https://api.zippopotam.us/us/{value}");
        setMethod("GET");
        setTriggerFieldId(""); // empty means this field itself
        setTriggerBehavior("after_valid_input");
        setMinChars(3);
        setButtonLabel("Lookup");
        setQueryParams([]);
        setHeaders([]);
        setTestInput("90210");

        // Try to auto-guess mapping targets based on existing field labels
        const defaultMaps = [];
        const cityField = allFields.find((f) => /city/i.test(f.label) && f.id !== field?.id);
        const stateField = allFields.find((f) => /state/i.test(f.label) && f.id !== field?.id);
        const countryField = allFields.find((f) => /country/i.test(f.label) && f.id !== field?.id);

        if (cityField) defaultMaps.push({ json_path: "places.0.place name", target_field_id: cityField.id });
        if (stateField) defaultMaps.push({ json_path: "places.0.state", target_field_id: stateField.id });
        if (countryField) defaultMaps.push({ json_path: "country", target_field_id: countryField.id });

        if (defaultMaps.length === 0) {
          defaultMaps.push({ json_path: "places.0.place name", target_field_id: "" });
        }
        setResponseMappings(defaultMaps);
      }
    }
  }, [open, field, allFields]);

  // Apply preset
  const handleApplyPreset = (preset) => {
    setEndpoint(preset.endpoint);
    setMethod(preset.method);
    setTestInput(preset.sampleInput);

    const newMaps = preset.mappings.map((m) => {
      const matchedField = allFields.find((f) =>
        f.id !== field?.id && new RegExp(m.labelHint, "i").test(f.label)
      );
      return {
        json_path: m.json_path,
        target_field_id: matchedField ? matchedField.id : "",
      };
    });
    setResponseMappings(newMaps);
    toast.success(`Applied "${preset.name}" preset`);
  };

  // Add response mapping row
  const handleAddMapping = () => {
    setResponseMappings((prev) => [...prev, { json_path: "", target_field_id: "" }]);
  };

  const handleUpdateMapping = (index, key, val) => {
    setResponseMappings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const handleDeleteMapping = (index) => {
    setResponseMappings((prev) => prev.filter((_, i) => i !== index));
  };

  // Run Test Lookup
  const handleRunTest = async () => {
    if (!endpoint.trim()) {
      setTestError("Please specify an API endpoint URL to test.");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const payload = {
        endpoint: endpoint.trim(),
        method,
        input_value: testInput,
        query_params: queryParams,
        headers,
        response_mappings: responseMappings.filter((m) => Boolean(m.json_path)),
      };

      const res = await api.post("/lookup/test", payload);
      setTestResult(res.data);
      if (res.data.success) {
        toast.success(`Lookup successful! (${res.data.latency_ms}ms)`);
      } else {
        toast.error(`API responded with status ${res.data.status_code}`);
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || "Failed to execute lookup test";
      setTestError(detail);
      toast.error(detail);
    } finally {
      setTesting(false);
    }
  };

  // Save Configuration
  const handleSaveConfig = () => {
    if (!endpoint.trim()) {
      toast.error("Please enter an API endpoint URL");
      return;
    }

    const configObj = {
      is_enabled: true,
      endpoint: endpoint.trim(),
      method,
      trigger_field_id: triggerFieldId ? Number(triggerFieldId) : null,
      trigger_behavior: triggerBehavior,
      min_chars: Number(minChars) || 1,
      button_label: buttonLabel || "Lookup",
      query_params: queryParams,
      headers,
      response_mappings: responseMappings.filter((m) => Boolean(m.json_path)),
      sample_input: testInput,
    };

    onSave(JSON.stringify(configObj));
    toast.success("API lookup configuration saved");
    onClose();
  };

  // Other fields available as targets (exclude non-input layout blocks)
  const candidateTargetFields = allFields.filter(
    (f) =>
      !["heading", "description", "section_divider", "page_break", "image", "video"].includes(
        f.field_type
      )
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: "hidden",
          boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.2)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: 1,
              bgcolor: "rgba(255,255,255,0.15)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SearchRoundedIcon sx={{ color: "#FFFFFF", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.1rem" }}>
              Configure Dynamic API Lookup
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem" }}>
              Automatically query an external REST API and populate mapped form fields
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#FFFFFF", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
        <Stack spacing={3}>
          {/* Quick Presets */}
          <Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}>
              Quick Templates
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PRESETS.map((p) => (
                <Chip
                  key={p.name}
                  icon={<AutoFixHighRoundedIcon sx={{ fontSize: "15px !important" }} />}
                  label={p.name}
                  onClick={() => handleApplyPreset(p)}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    "&:hover": { bgcolor: "#EEF2FF", borderColor: "#818CF8", color: "#4F46E5" },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Core Configuration Card */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 2 }}>
              1. Endpoint & Trigger Behavior
            </Typography>

            <Stack spacing={2}>
              {/* Endpoint URL + Method */}
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <FormControl size="small" sx={{ minWidth: 105 }}>
                  <InputLabel id="method-label">Method</InputLabel>
                  <Select
                    labelId="method-label"
                    value={method}
                    label="Method"
                    onChange={(e) => setMethod(e.target.value)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="REST API Endpoint URL *"
                  placeholder="https://api.example.com/v1/lookup/{value}"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  helperText="Use {value} in URL as placeholder for respondent's input (e.g. postal code or query)"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              {/* Trigger Input Field + Behavior */}
              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControl size="small" sx={{ flex: 1, minWidth: 220 }}>
                  <InputLabel id="trigger-field-label">Trigger / Input Field</InputLabel>
                  <Select
                    labelId="trigger-field-label"
                    value={triggerFieldId}
                    label="Trigger / Input Field"
                    onChange={(e) => setTriggerFieldId(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">
                      <em>This Field Itself ({field?.label || "Current Field"})</em>
                    </MenuItem>
                    {candidateTargetFields
                      .filter((f) => f.id !== field?.id)
                      .map((f) => (
                        <MenuItem key={f.id} value={String(f.id)}>
                          {f.label} ({f.field_type})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
                  <InputLabel id="trigger-behavior-label">Trigger Behavior</InputLabel>
                  <Select
                    labelId="trigger-behavior-label"
                    value={triggerBehavior}
                    label="Trigger Behavior"
                    onChange={(e) => setTriggerBehavior(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="after_valid_input">After Valid Input (Typing Pause)</MenuItem>
                    <MenuItem value="on_change">On Change (Real-time debounced)</MenuItem>
                    <MenuItem value="on_button">On Search Button Click / Enter</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  type="number"
                  label="Min Characters"
                  value={minChars}
                  onChange={(e) => setMinChars(Math.max(1, Number(e.target.value) || 1))}
                  sx={{ width: 130, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>
            </Stack>
          </Paper>

          {/* Response Field Mappings Card */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                  2. Response Field Mappings
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                  Map JSON attributes from the API response to target fields in this form
                </Typography>
              </Box>

              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddMapping}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "#4F46E5",
                  bgcolor: "#EEF2FF",
                  "&:hover": { bgcolor: "#E0E7FF" },
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Add Mapping
              </Button>
            </Box>

            {responseMappings.length === 0 ? (
              <Box p={3} textAlign="center" bgcolor="#F8FAFC" borderRadius={2} border="1px dashed #CBD5E1">
                <Typography variant="body2" color="text.secondary">
                  No field mappings defined yet. Click <strong>Add Mapping</strong> to map API response fields to form questions.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {responseMappings.map((mapping, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      bgcolor: "#F8FAFC",
                      borderRadius: 2,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <TextField
                      size="small"
                      label="Response JSON Path"
                      placeholder="e.g. places.0.place name"
                      value={mapping.json_path || ""}
                      onChange={(e) => handleUpdateMapping(idx, "json_path", e.target.value)}
                      sx={{ flex: 1.2, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                    />

                    <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />

                    <FormControl size="small" sx={{ flex: 1.2 }}>
                      <InputLabel id={`target-field-label-${idx}`}>Target Form Field</InputLabel>
                      <Select
                        labelId={`target-field-label-${idx}`}
                        value={mapping.target_field_id ? String(mapping.target_field_id) : ""}
                        label="Target Form Field"
                        onChange={(e) => handleUpdateMapping(idx, "target_field_id", e.target.value)}
                        sx={{ borderRadius: 1.8 }}
                      >
                        <MenuItem value="">
                          <em>Select question...</em>
                        </MenuItem>
                        {candidateTargetFields.map((f) => (
                          <MenuItem key={f.id} value={String(f.id)}>
                            {f.label} ({f.field_type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <IconButton
                      size="small"
                      onClick={() => handleDeleteMapping(idx)}
                      sx={{ color: "#EF4444", "&:hover": { bgcolor: "#FEE2E2" } }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Live Test Lookup Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1.5px solid #C7D2FE",
              background: "linear-gradient(180deg, #FFFFFF 0%, #F5F7FF 100%)",
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#3730A3" }}>
                  3. Test API Lookup Before Publishing
                </Typography>
                <Typography variant="caption" sx={{ color: "#6366F1", fontSize: "0.75rem" }}>
                  Verify connectivity, SSRF safety, and field mapping extraction in real-time
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={testing ? <CircularProgress size={14} color="inherit" /> : <PlayArrowRoundedIcon />}
                disabled={testing || !endpoint.trim()}
                onClick={handleRunTest}
                sx={{
                  bgcolor: "#4F46E5",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  px: 2.5,
                  py: 0.8,
                  "&:hover": { bgcolor: "#4338CA" },
                }}
              >
                {testing ? "Testing..." : "Test Lookup"}
              </Button>
            </Box>

            <Box display="flex" gap={1.5} alignItems="center" mt={1}>
              <TextField
                fullWidth
                size="small"
                label="Sample Input Value"
                placeholder="e.g. 90210"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FFFFFF" } }}
              />
            </Box>

            {/* Test Error Message */}
            {testError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {testError}
              </Alert>
            )}

            {/* Test Results Output */}
            {testResult && (
              <Box mt={2}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Chip
                    icon={testResult.success ? <CheckCircleRoundedIcon /> : <ErrorOutlineRoundedIcon />}
                    label={testResult.success ? `Status: ${testResult.status_code} OK` : `Error: ${testResult.status_code}`}
                    color={testResult.success ? "success" : "error"}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={`${testResult.latency_ms} ms`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderColor: "#CBD5E1" }}
                  />
                </Box>

                {/* Mapped Values Summary */}
                <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 0.5 }}>
                  Extracted Field Values:
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #E2E8F0",
                    bgcolor: "#FFFFFF",
                    mb: 1.5,
                  }}
                >
                  {Object.keys(testResult.mapped_values || {}).length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No mapped values were extracted. Check your JSON path syntax against the response below.
                    </Typography>
                  ) : (
                    <Stack spacing={0.6}>
                      {Object.entries(testResult.mapped_values).map(([fid, val]) => {
                        const targetObj = allFields.find((f) => String(f.id) === String(fid));
                        return (
                          <Box key={fid} display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: "#4F46E5", minWidth: 120 }}>
                              {targetObj?.label || `Field #${fid}`}:
                            </Typography>
                            <Chip label={val || "(empty)"} size="small" sx={{ bgcolor: "#EEF2FF", fontWeight: 600, fontSize: "0.75rem" }} />
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>

                {/* Raw JSON Accordion / Preview */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "#0F172A",
                    borderRadius: 2,
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      m: 0,
                      color: "#A5B4FC",
                      fontFamily: "monospace",
                      fontSize: "0.72rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(testResult.raw_response, null, 2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <Button onClick={onClose} sx={{ color: "#64748B", fontWeight: 700, textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveConfig}
          sx={{
            bgcolor: "#4F46E5",
            fontWeight: 800,
            borderRadius: 2,
            px: 3,
            textTransform: "none",
            "&:hover": { bgcolor: "#4338CA" },
          }}
        >
          Save Lookup Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}
