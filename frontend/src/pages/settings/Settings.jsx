import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  Chip,
  Grid,
  MenuItem,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import toast from "react-hot-toast";

import { useColorMode } from "../../context/ThemeContext";

// Icons
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import SettingsBrightnessRoundedIcon from "@mui/icons-material/SettingsBrightnessRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import api from "../../api/api";
import PageHeader from "../../components/common/PageHeader";

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const MENU_GROUPS = [
  {
    groupTitle: "Account & Security",
    items: [
      { id: 0, text: "Profile", icon: <PersonRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 1, text: "Password & Security", icon: <LockRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 5, text: "Email Preferences", icon: <EmailRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 6, text: "Notifications", icon: <NotificationsRoundedIcon sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    groupTitle: "Workspace & Branding",
    items: [
      { id: 9, text: "Workspace Settings", icon: <BusinessRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 7, text: "Custom Branding & Privacy", icon: <PaletteRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 8, text: "API Keys & Developer", icon: <VpnKeyRoundedIcon sx={{ fontSize: 18 }} /> },
    ],
  },
  {
    groupTitle: "System & Billing",
    items: [
      { id: 2, text: "Theme & Appearance", icon: <DarkModeRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 3, text: "Language & Region", icon: <LanguageRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 4, text: "Timezone", icon: <AccessTimeRoundedIcon sx={{ fontSize: 18 }} /> },
      { id: 10, text: "Billing & Subscription", icon: <ReceiptLongRoundedIcon sx={{ fontSize: 18 }} /> },
    ],
  },
];

const ALL_MENU_ITEMS = MENU_GROUPS.flatMap((g) => g.items);

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Profile State
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRole, setProfileRole] = useState("Administrator");

  // 2. Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 3. Theme, 4. Language, 5. Timezone State
  const { themeMode, setThemeMode } = useColorMode();
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC");

  // 6. Email & 7. Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // 8. Branding State
  const [brandLogoUrl, setBrandLogoUrl] = useState("https://formify.io/logo.png");
  const [brandColor, setBrandColor] = useState("#4F46E5");

  // 9. API Keys State
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // 10. Workspace State
  const [workspaceName, setWorkspaceName] = useState("Formify Pro Workspace");
  const [workspaceSubdomain, setWorkspaceSubdomain] = useState("formify-workspace");
  const [seatLimit, setSeatLimit] = useState(10);

  // Fetch PostgreSQL Settings on Component Mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await api.get("/settings/");
        const data = res.data;

        if (data.profile) {
          setProfileName(data.profile.name || "");
          setProfileEmail(data.profile.email || "");
          setProfileRole(data.profile.role || "Administrator");
        }

        if (data.preferences) {
          if (data.preferences.theme) setThemeMode(data.preferences.theme);
          if (data.preferences.language) setLanguage(data.preferences.language);
          if (data.preferences.timezone) setTimezone(data.preferences.timezone);

          setEmailAlerts(data.preferences.email_alerts ?? true);
          setWeeklyDigest(data.preferences.weekly_digest ?? true);
          setPushNotifications(data.preferences.push_notifications ?? true);

          if (data.preferences.brand_logo_url) setBrandLogoUrl(data.preferences.brand_logo_url);
          if (data.preferences.brand_color) setBrandColor(data.preferences.brand_color);

          if (data.preferences.workspace_name) setWorkspaceName(data.preferences.workspace_name);
          if (data.preferences.workspace_subdomain) setWorkspaceSubdomain(data.preferences.workspace_subdomain);
          if (data.preferences.seat_limit) setSeatLimit(data.preferences.seat_limit);

          if (data.preferences.api_key) setApiKey(data.preferences.api_key);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [setThemeMode]);

  // 1. Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Profile name is required", { id: "prof-err1" });
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes("@")) {
      toast.error("Valid email address is required", { id: "prof-err2" });
      return;
    }

    try {
      setSaving(true);
      await api.put("/settings/profile", { name: profileName.trim(), email: profileEmail.trim() });
      localStorage.setItem("user_name", profileName.trim());
      window.dispatchEvent(new Event("storage"));
      toast.success("Profile information updated successfully!", { id: "prof-succ" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update profile", { id: "prof-fail" });
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Password Handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password", { id: "pass-val1" });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long", { id: "pass-val2" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match", { id: "pass-val3" });
      return;
    }

    try {
      setSaving(true);
      await api.put("/settings/password", { current_password: currentPassword, new_password: newPassword });
      toast.success("Password updated successfully!", { id: "pass-succ" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update password", { id: "pass-err" });
    } finally {
      setSaving(false);
    }
  };

  // 3. Save Preferences Handler with Optional Parameter Overrides
  const handleSavePreferences = async (overrides = {}) => {
    try {
      setSaving(true);
      const payload = {
        theme: overrides.theme !== undefined ? overrides.theme : themeMode,
        language: overrides.language !== undefined ? overrides.language : language,
        timezone: overrides.timezone !== undefined ? overrides.timezone : timezone,
        email_alerts: overrides.email_alerts !== undefined ? overrides.email_alerts : emailAlerts,
        weekly_digest: overrides.weekly_digest !== undefined ? overrides.weekly_digest : weeklyDigest,
        push_notifications: overrides.push_notifications !== undefined ? overrides.push_notifications : pushNotifications,
        brand_logo_url: overrides.brand_logo_url !== undefined ? overrides.brand_logo_url : brandLogoUrl,
        brand_color: overrides.brand_color !== undefined ? overrides.brand_color : brandColor,
        workspace_name: overrides.workspace_name !== undefined ? overrides.workspace_name : workspaceName,
        workspace_subdomain: overrides.workspace_subdomain !== undefined ? overrides.workspace_subdomain : workspaceSubdomain,
        seat_limit: Math.max(1, Number(overrides.seat_limit !== undefined ? overrides.seat_limit : seatLimit) || 10),
      };
      await api.put("/settings/preferences", payload);
      toast.success("Preferences saved successfully!", { id: "pref-succ" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save preferences", { id: "pref-err" });
    } finally {
      setSaving(false);
    }
  };

  // 4. Rotate API Key Handler
  const handleRotateApiKey = async () => {
    try {
      setSaving(true);
      const res = await api.post("/settings/api-key/rotate");
      setApiKey(res.data.api_key);
      toast.success("Secret API key rotated successfully!", { id: "key-succ" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to rotate API key", { id: "key-err" });
    } finally {
      setSaving(false);
    }
  };

  // 5. Export Account Configuration JSON
  const handleExportAccountData = () => {
    try {
      const config = {
        profile: { name: profileName, email: profileEmail, role: profileRole },
        preferences: {
          theme: themeMode,
          language,
          timezone,
          emailAlerts,
          weeklyDigest,
          pushNotifications,
          brandLogoUrl,
          brandColor,
          workspaceName,
          workspaceSubdomain,
          seatLimit,
        },
        exported_at: new Date().toISOString(),
      };

      const jsonStr = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Formify_Account_Config_${profileName.replace(/\s+/g, "_")}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Account configuration exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export account data");
    }
  };

  // 6. Clear Local Cache Handler
  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      toast.success("Local session cache cleared!");
    } catch {
      toast.error("Failed to clear cache");
    }
  };

  // 7. Download Invoice Receipt
  const handleDownloadInvoice = () => {
    try {
      const receiptText = `FORMIFY PRO SUBSCRIPTION RECEIPT\nDate: ${new Date().toLocaleDateString()}\nPlan: Formify Pro Workspace (Active)\nAmount Paid: $29.00/mo\nStatus: Paid / Verified\nThank you for using Formify!`;
      const blob = new Blob([receiptText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Formify_Subscription_Receipt.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloaded subscription receipt!");
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="65vh">
        <CircularProgress size={32} sx={{ color: "#4F46E5" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Settings"
        subtitle="Manage your account profile, security, branding, API keys, and workspace"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE HORIZONTAL NAVIGATION (< sm)
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: "flex", sm: "none" },
          overflowX: "auto",
          gap: 1,
          pb: 1,
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#E2E8F0", borderRadius: 2 },
        }}
      >
        {ALL_MENU_ITEMS.map((item) => {
          const isSelected = item.id === activeTab;
          return (
            <Chip
              key={item.id}
              icon={item.icon}
              label={item.text}
              clickable
              onClick={() => setActiveTab(item.id)}
              sx={{
                fontWeight: isSelected ? 800 : 600,
                fontSize: "0.775rem",
                borderRadius: 2,
                bgcolor: isSelected ? "#4F46E5" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#475569",
                border: isSelected ? "1px solid #4F46E5" : "1px solid #E2E8F0",
                "& .MuiChip-icon": {
                  color: isSelected ? "#FFFFFF !important" : "#64748B !important",
                },
              }}
            />
          );
        })}
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          3. SEAMLESS TWO-COLUMN SETTINGS GRID (sm+ ALWAYS SIDE-BY-SIDE)
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "260px 1fr", lg: "280px 1fr" },
          gap: 3,
          width: "100%",
          alignItems: "start",
        }}
      >
        {/* Left Side Navigation Rail */}
        <Paper
          elevation={0}
          sx={{
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            p: 2,
            border: "1px solid #E2E8F0",
            borderRadius: 3.5,
            bgcolor: "#FFFFFF",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
          }}
        >
          {/* User Profile Mini Badge */}
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 2.5,
              bgcolor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#4F46E5",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.95rem",
                borderRadius: 2,
                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
              }}
            >
              {getInitials(profileName)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={800} noWrap sx={{ color: "#0F172A", fontSize: "0.85rem" }}>
                {profileName || "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ color: "#64748B", display: "block", fontSize: "0.725rem" }}>
                {profileEmail || "user@example.com"}
              </Typography>
            </Box>
          </Box>

          {/* Grouped Menu Sections */}
          <Stack spacing={2.2}>
            {MENU_GROUPS.map((group) => (
              <Box key={group.groupTitle}>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  sx={{
                    px: 1.5,
                    py: 0.4,
                    display: "block",
                    fontSize: "0.675rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#94A3B8",
                  }}
                >
                  {group.groupTitle}
                </Typography>
                <List dense disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.4, mt: 0.5 }}>
                  {group.items.map((item) => {
                    const isSelected = item.id === activeTab;
                    return (
                      <ListItemButton
                        key={item.id}
                        selected={isSelected}
                        onClick={() => setActiveTab(item.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          px: 1.5,
                          color: isSelected ? "#4F46E5" : "#475569",
                          transition: "all 0.15s ease",
                          "&.Mui-selected": {
                            bgcolor: "#EEF2FF",
                            color: "#4F46E5",
                            fontWeight: 700,
                          },
                          "&:hover": {
                            bgcolor: isSelected ? "#EEF2FF" : "#F8FAFC",
                            color: isSelected ? "#4F46E5" : "#0F172A",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: isSelected ? "#4F46E5" : "#94A3B8" }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.825rem",
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Right Content Viewport Panel (Fills full width seamlessly) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            border: "1px solid #E2E8F0",
            borderRadius: 3.5,
            bgcolor: "#FFFFFF",
            boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.04)",
            width: "100%",
            minHeight: 520,
          }}
        >
          {/* TAB 0: PROFILE */}
          {activeTab === 0 && (
            <Box component="form" onSubmit={handleSaveProfile} display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Profile Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Update your display name, email, and workspace access role
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2.5} p={2} sx={{ bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid #F1F5F9" }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "#4F46E5", color: "#FFFFFF", fontSize: "1.3rem", fontWeight: 800, borderRadius: 2.5 }}>
                  {getInitials(profileName)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={800} sx={{ color: "#0F172A" }}>
                    {profileName || "Your Name"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mb: 0.8 }}>
                    {profileEmail || "your.email@example.com"}
                  </Typography>
                  <Chip
                    icon={<VerifiedRoundedIcon sx={{ fontSize: "14px !important", color: "#4F46E5 !important" }} />}
                    label={profileRole}
                    size="small"
                    sx={{ fontSize: "0.7rem", height: 22, fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }}
                  />
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Full Display Name
                  </Typography>
                  <TextField fullWidth size="small" value={profileName} onChange={(e) => setProfileName(e.target.value)} sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Email Address
                  </Typography>
                  <TextField fullWidth size="small" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }} />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 1: PASSWORD & SECURITY */}
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleSavePassword} display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Password &amp; Security Credentials
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Verify your current password before updating account credentials
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={2.5} maxWidth={480}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Current Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showCurrentPassword ? "text" : "password"}
                    size="small"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    New Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showNewPassword ? "text" : "password"}
                    size="small"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Confirm New Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? "text" : "password"}
                    size="small"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Stack>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 2: THEME */}
          {activeTab === 2 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Theme &amp; Appearance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Select interface color theme and contrast mode (auto-saved immediately)
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2.5}>
                {[
                  { id: "light", title: "Light Mode", desc: "Clean off-white SaaS layout", icon: <LightModeRoundedIcon sx={{ fontSize: 24, color: "#F59E0B" }} /> },
                  { id: "dark", title: "Dark Mode", desc: "Sleek dark contrast interface", icon: <DarkModeRoundedIcon sx={{ fontSize: 24, color: "#6366F1" }} /> },
                  { id: "system", title: "System Default", desc: "Sync with operating system", icon: <SettingsBrightnessRoundedIcon sx={{ fontSize: 24, color: "#64748B" }} /> },
                ].map((t) => (
                  <Grid item xs={12} sm={4} key={t.id}>
                    <Paper
                      onClick={() => {
                        setThemeMode(t.id);
                        handleSavePreferences({ theme: t.id });
                      }}
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: themeMode === t.id ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                        bgcolor: themeMode === t.id ? "#EEF2FF" : "#F8FAFC",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2,
                        "&:hover": {
                          borderColor: "#4F46E5",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        {t.icon}
                        {themeMode === t.id && (
                          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: "#4F46E5" }} />
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={800} sx={{ color: themeMode === t.id ? "#4F46E5" : "#0F172A" }}>
                        {t.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                        {t.desc}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ theme: themeMode })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Theme"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 3: LANGUAGE */}
          {activeTab === 3 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Language &amp; Region
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Select primary language for workspace interface
                </Typography>
              </Box>

              <Divider />

              <Box maxWidth={400}>
                <TextField select fullWidth label="Primary Interface Language" value={language} onChange={(e) => setLanguage(e.target.value)} size="small" sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}>
                  {["English", "Spanish", "French", "German", "Japanese", "Hindi", "Portuguese", "Chinese"].map((l) => (
                    <MenuItem key={l} value={l}>{l}</MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ language })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Language"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 4: TIMEZONE */}
          {activeTab === 4 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Timezone Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Set regional timezone for submission timestamps and analytics reports
                </Typography>
              </Box>

              <Divider />

              <Box maxWidth={400}>
                <TextField select fullWidth label="Workspace Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} size="small" sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}>
                  {["UTC", "EST (Eastern)", "PST (Pacific)", "CST (Central)", "MST (Mountain)", "GMT (Greenwich)", "IST (India Standard)", "CET (Central Europe)", "JST (Japan)", "AEST (Australia)"].map((tz) => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ timezone })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Timezone"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 5: EMAIL PREFERENCES */}
          {activeTab === 5 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Email Preferences &amp; Subscriptions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Control automated email delivery settings (auto-persisted on change)
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={2}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailAlerts}
                        onChange={(e) => {
                          setEmailAlerts(e.target.checked);
                          handleSavePreferences({ email_alerts: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label={<Box><Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>Submission Email Alerts</Typography><Typography variant="caption" color="text.secondary">Receive immediate email alerts on new public form responses.</Typography></Box>}
                  />
                </Paper>

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={weeklyDigest}
                        onChange={(e) => {
                          setWeeklyDigest(e.target.checked);
                          handleSavePreferences({ weekly_digest: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label={<Box><Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>Weekly Analytics Digest</Typography><Typography variant="caption" color="text.secondary">Receive weekly performance summaries every Monday morning.</Typography></Box>}
                  />
                </Paper>
              </Stack>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ email_alerts: emailAlerts, weekly_digest: weeklyDigest })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Email Preferences"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 6 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Push &amp; In-App Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Configure real-time browser push notifications
                </Typography>
              </Box>

              <Divider />

              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pushNotifications}
                      onChange={(e) => {
                        setPushNotifications(e.target.checked);
                        handleSavePreferences({ push_notifications: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label={<Box><Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>In-App &amp; Push Alerts</Typography><Typography variant="caption" color="text.secondary">Enable live notification badge updates in Navbar.</Typography></Box>}
                />
              </Paper>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ push_notifications: pushNotifications })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Notifications"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 7: BRANDING & DATA PRIVACY */}
          {activeTab === 7 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Custom Workspace Branding &amp; Data Privacy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Personalize public forms with custom logo URL, accent colors, and manage account data
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Brand Logo URL
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      src={brandLogoUrl}
                      alt="Brand Logo"
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: "#EEF2FF", border: "1px solid #E2E8F0" }}
                    >
                      <PaletteRoundedIcon sx={{ color: "#4F46E5", fontSize: 20 }} />
                    </Avatar>
                    <TextField fullWidth size="small" value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} placeholder="https://domain.com/logo.png" sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }} />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Primary Accent Color
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <TextField size="small" type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} sx={{ width: 64, "& .MuiInputBase-input": { p: 0.5, height: 32 } }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#0F172A", fontFamily: "monospace" }}>
                      {brandColor}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Data & Privacy Actions */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                  Data &amp; Privacy Controls
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" gap={1.5}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={handleExportAccountData}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#E2E8F0", borderRadius: 2 }}
                  >
                    Export Account Data (.json)
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<CleaningServicesRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={handleClearCache}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                  >
                    Clear Local Session Cache
                  </Button>
                </Stack>
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ brand_logo_url: brandLogoUrl, brand_color: brandColor })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Branding"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 8: API KEYS & DEVELOPER */}
          {activeTab === 8 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Developer API Keys &amp; Tokens
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Secret API keys for programmatically managing forms and fetching database submissions
                </Typography>
              </Box>

              <Divider />

              <Box maxWidth={560}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                  Live Secret API Key
                </Typography>
                <Box display="flex" gap={1.5} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    type={showApiKey ? "text" : "password"}
                    readOnly
                    value={apiKey}
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2, fontFamily: "monospace" } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success("Copied API key to clipboard!");
                    }}
                    sx={{ bgcolor: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 2, p: 1 }}
                  >
                    <ContentCopyRoundedIcon sx={{ fontSize: 18, color: "#4F46E5" }} />
                  </IconButton>
                  <Button
                    variant="contained"
                    onClick={handleRotateApiKey}
                    disabled={saving}
                    sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, whiteSpace: "nowrap", borderRadius: 2 }}
                  >
                    {saving ? "Rotating..." : "Rotate Key"}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* TAB 9: WORKSPACE SETTINGS */}
          {activeTab === 9 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Workspace &amp; Organization Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Configure workspace name, custom subdomain slug, and seat limits
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Workspace Name
                  </Typography>
                  <TextField fullWidth size="small" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Subdomain Slug
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={workspaceSubdomain}
                    onChange={(e) => setWorkspaceSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    helperText={`Domain URL: https://${workspaceSubdomain || 'workspace'}.formify.io`}
                    sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Team Member Seat Limit
                  </Typography>
                  <TextField fullWidth type="number" size="small" value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} inputProps={{ min: 1, max: 100 }} sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }} />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={() => handleSavePreferences({ workspace_name: workspaceName, workspace_subdomain: workspaceSubdomain, seat_limit: seatLimit })} disabled={saving} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, px: 3, py: 0.9, borderRadius: 2 }}>
                  {saving ? "Saving..." : "Save Workspace"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 10: BILLING & SUBSCRIPTION */}
          {activeTab === 10 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                  Billing &amp; Subscription Plan
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Manage current plan status, seat allocation, and download subscription receipts
                </Typography>
              </Box>

              <Divider />

              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #C7D2FE", bgcolor: "#EEF2FF", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                    <Typography variant="subtitle1" fontWeight={800} color="#4F46E5">
                      Formify Pro Workspace
                    </Typography>
                    <Chip label="Active Plan" size="small" sx={{ bgcolor: "#10B981", color: "#FFFFFF", fontWeight: 800, height: 20, fontSize: "0.65rem" }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ color: "#475569" }}>
                    $29.00 / month • Renews on Sep 10, 2026
                  </Typography>
                </Box>

                <Button variant="contained" onClick={() => toast.success("Current plan is active! All Pro features unlocked.")} sx={{ bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" }, fontWeight: 700, borderRadius: 2 }}>
                  Manage Plan
                </Button>
              </Paper>

              {/* Plan Feature Badges */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                  Included In Your Plan
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    "Unlimited Forms & Submissions",
                    "AI Form Generator & Form Doctor",
                    "Custom Subdomain & Full Branding",
                    "API Access & Live Webhook Events",
                    "Collaborators & Real-Time Analytics",
                    "24/7 Priority Support & 99.9% SLA",
                  ].map((feat, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box display="flex" alignItems="center" gap={1} p={1.2} sx={{ bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #F1F5F9" }}>
                        <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#10B981" }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#1E293B" }}>
                          {feat}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                  Billing Receipts &amp; Documents
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleDownloadInvoice}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#E2E8F0", borderRadius: 2 }}
                >
                  Download Latest Receipt (.txt)
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
