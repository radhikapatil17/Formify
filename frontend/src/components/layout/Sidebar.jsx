import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import toast from "react-hot-toast";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/dashboard",
  },
  {
    text: "Forms",
    icon: <DescriptionRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/forms",
  },
  {
    text: "Create Form",
    icon: <AddCircleRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/create-form",
  },
  {
    text: "Templates",
    icon: <LayersRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/templates",
  },
  {
    text: "Responses",
    icon: <AssignmentRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/responses",
  },
  {
    text: "Analytics",
    icon: <BarChartRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/analytics",
  },
  {
    text: "Settings",
    icon: <SettingsRoundedIcon sx={{ fontSize: 20 }} />,
    path: "/settings",
  },
];

// Decode JWT payload without verification for client-side user display
function decodeToken(token) {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function Sidebar({ collapsed = false, onToggleCollapse, onItemClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Derive user info from stored JWT & LocalStorage
  const token = localStorage.getItem("token");
  const payload = decodeToken(token);
  const userEmail = payload?.sub || "";

  const initialName = localStorage.getItem("user_name") || payload?.name || payload?.sub?.split("@")[0] || "User";
  const [displayName, setDisplayName] = useState(initialName);
  const userInitials = getInitials(displayName);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const updated = localStorage.getItem("user_name");
      if (updated) setDisplayName(updated);
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        width: "100%",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. SIDEBAR BRAND HEADER (FORMIFY LOGO AT TOP-LEFT)
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1.5 : 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          onClick={() => navigate("/dashboard")}
          sx={{ cursor: "pointer" }}
        >
          <Box
            component="img"
            src="/formify-logo.jpg"
            alt="Formify Logo"
            sx={{
              height: 36,
              width: "auto",
              maxWidth: 42,
              objectFit: "contain",
              borderRadius: 1,
            }}
          />
          {!collapsed && (
            <Box>
              <Typography
                variant="body1"
                fontWeight={800}
                sx={{
                  fontSize: "1.05rem",
                  letterSpacing: "-0.03em",
                  color: "text.primary",
                  lineHeight: 1.1,
                }}
              >
                Formify
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: "0.685rem", fontWeight: 600, color: "text.secondary" }}
              >
                Pro Workspace
              </Typography>
            </Box>
          )}
        </Box>

        {/* Desktop Collapse Toggle Icon Button */}
        {onToggleCollapse && !collapsed && (
          <Tooltip title="Collapse sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                color: "#64748B",
                p: 0.6,
                borderRadius: 1.8,
                transition: "all 0.15s ease",
                "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
              }}
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVIGATION MENU ITEMS
         ───────────────────────────────────────────────────────────── */}
      <List
        sx={{
          flex: 1,
          px: collapsed ? 1.2 : 2,
          py: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path.includes("?") && location.pathname === item.path.split("?")[0]);

          const buttonContent = (
            <ListItemButton
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (onItemClick) onItemClick();
              }}
              sx={{
                borderRadius: 2.5,
                py: 1.25,
                px: collapsed ? 1.5 : 2,
                justifyContent: collapsed ? "center" : "flex-start",
                color: isActive
                  ? isDark ? "#818CF8" : "#4F46E5"
                  : isDark ? "#94A3B8" : "#64748B",
                bgcolor: isActive
                  ? isDark ? "rgba(99, 102, 241, 0.15)" : "#EEF2FF"
                  : "transparent",
                fontWeight: isActive ? 700 : 500,
                position: "relative",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "& .MuiListItemIcon-root": {
                  color: isActive
                    ? isDark ? "#818CF8" : "#4F46E5"
                    : isDark ? "#64748B" : "#94A3B8",
                  minWidth: collapsed ? 0 : 36,
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                },
                "&:hover": {
                  bgcolor: isActive
                    ? isDark ? "rgba(99, 102, 241, 0.2)" : "#EEF2FF"
                    : isDark ? "rgba(99, 102, 241, 0.08)" : "#F8FAFC",
                  color: isActive
                    ? isDark ? "#818CF8" : "#4F46E5"
                    : isDark ? "#E2E8F0" : "#0F172A",
                  transform: collapsed ? "none" : "translateX(3px)",
                  "& .MuiListItemIcon-root": {
                    color: isDark ? "#818CF8" : "#4F46E5",
                    transform: "scale(1.1)",
                  },
                },
              }}
            >
              {/* Smooth Active Indicator Bar */}
              {isActive && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: 4,
                    bgcolor: isDark ? "#818CF8" : "#4F46E5",
                    borderRadius: "0 4px 4px 0",
                    boxShadow: isDark
                      ? "0 0 8px rgba(129, 140, 248, 0.5)"
                      : "0 0 8px rgba(79, 70, 229, 0.4)",
                  }}
                />
              )}

              <ListItemIcon>{item.icon}</ListItemIcon>

              {!collapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: "-0.01em",
                  }}
                />
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={item.text} title={item.text} placement="right" arrow>
              {buttonContent}
            </Tooltip>
          ) : (
            buttonContent
          );
        })}
      </List>

      {/* Expand Button for Collapsed Desktop Mode */}
      {collapsed && onToggleCollapse && (
        <Box display="flex" justifyContent="center" py={1.5}>
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                color: "#64748B",
                p: 0.8,
                borderRadius: 2,
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                "&:hover": { bgcolor: "#EEF2FF", color: "#4F46E5", borderColor: "#C7D2FE" },
              }}
            >
              <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Divider sx={{ mx: 2, borderColor: "#F1F5F9" }} />

      {/* ─────────────────────────────────────────────────────────────
          3. CLEANER USER PROFILE CARD AT BOTTOM
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: collapsed ? 1.2 : 1.75,
          m: collapsed ? 1.2 : 1.8,
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#F8FAFC",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "#CBD5E1",
            bgcolor: "#FFFFFF",
            boxShadow: "0 4px 12px -2px rgba(15, 23, 42, 0.08)",
          },
        }}
      >
        {collapsed ? (
          <Tooltip title={`${displayName} (${userEmail})`} placement="right">
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: "0.875rem",
                fontWeight: 700,
                bgcolor: "#4F46E5",
                color: "#FFFFFF",
                borderRadius: 2,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              }}
            >
              {userInitials}
            </Avatar>
          </Tooltip>
        ) : (
          <>
            <Box display="flex" alignItems="center" gap={1.5} sx={{ overflow: "hidden" }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  bgcolor: "#4F46E5",
                  color: "#FFFFFF",
                  borderRadius: 2,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ overflow: "hidden" }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  noWrap
                  sx={{ fontSize: "0.835rem", color: "#0F172A", lineHeight: 1.2 }}
                >
                  {displayName}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontSize: "0.725rem", color: "#64748B", display: "block", mt: 0.2 }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Log out">
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{
                  color: "#94A3B8",
                  p: 0.8,
                  borderRadius: 1.8,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#FEF2F2",
                    color: "#DC2626",
                  },
                }}
              >
                <LogoutRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}