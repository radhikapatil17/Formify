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

import api from "../../api/api";

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const MENU_SECTIONS = [
  { id: 0, text: "Profile", icon: <PersonRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 1, text: "Password & Security", icon: <LockRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 2, text: "Theme & Appearance", icon: <DarkModeRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 3, text: "Language & Region", icon: <LanguageRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 4, text: "Timezone", icon: <AccessTimeRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 5, text: "Email Preferences", icon: <EmailRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 6, text: "Notifications", icon: <NotificationsRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 7, text: "Custom Branding & Privacy", icon: <PaletteRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 8, text: "API Keys & Developer", icon: <VpnKeyRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 9, text: "Workspace Settings", icon: <BusinessRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: 10, text: "Billing & Subscription", icon: <ReceiptLongRoundedIcon sx={{ fontSize: 18 }} /> },
];

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

  // 3. Theme, 4. Language, 5. Timezone State
  const { themeMode, setThemeMode, isDark } = useColorMode();
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
          const prefs = data.preferences;
          setThemeMode(prefs.theme || "light");
          setLanguage(prefs.language || "English");
          setTimezone(prefs.timezone || "UTC");
          setEmailAlerts(prefs.email_alerts !== false);
          setWeeklyDigest(prefs.weekly_digest !== false);
          setPushNotifications(prefs.push_notifications !== false);
          setBrandLogoUrl(prefs.brand_logo_url || "https://formify.io/logo.png");
          setBrandColor(prefs.brand_color || "#4F46E5");
          setWorkspaceName(prefs.workspace_name || "Formify Pro Workspace");
          setWorkspaceSubdomain(prefs.workspace_subdomain || "formify-workspace");
          setSeatLimit(prefs.seat_limit || 10);
          if (prefs.api_key) setApiKey(prefs.api_key);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user settings", { id: "settings-load-err" });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // 1. Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const cleanName = profileName.trim();
    const cleanEmail = profileEmail.trim();

    if (!cleanName || !cleanEmail) {
      toast.error("Name and Email address are required", { id: "prof-val" });
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/settings/profile", { name: cleanName, email: cleanEmail });
      localStorage.setItem("user_name", res.data.name || cleanName);
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Profile updated successfully!", { id: "prof-succ" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update profile", { id: "prof-err" });
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Password Handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required", { id: "pass-val1" });
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

  // 3. Save Preferences Handler
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await api.put("/settings/preferences", {
        theme: themeMode,
        language,
        timezone,
        email_alerts: emailAlerts,
        weekly_digest: weeklyDigest,
        push_notifications: pushNotifications,
        brand_logo_url: brandLogoUrl,
        brand_color: brandColor,
        workspace_name: workspaceName,
        workspace_subdomain: workspaceSubdomain,
        seat_limit: Number(seatLimit),
      });
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
      <Box display="flex" justifyContent="center" alignItems="center" height="75vh">
        <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
         ───────────────────────────────────────────────────────────── */}
      <Box>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.03em", color: "#0F172A" }}>
          Settings &amp; Workspace Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, color: "#64748B" }}>
          Manage your account profile, security credentials, custom branding, developer API keys, and workspace settings
        </Typography>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. NOTION-STYLE SPLIT PANEL LAYOUT
         ───────────────────────────────────────────────────────────── */}
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3.5}>
        {/* Left Side Navigation Panel */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 260 },
            flexShrink: 0,
            p: 1.5,
            height: "fit-content",
            border: "1px solid #E2E8F0",
            borderRadius: 3,
            bgcolor: "#FFFFFF",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
          }}
        >
          <List dense disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {MENU_SECTIONS.map((item) => {
              const isSelected = item.id === activeTab;

              return (
                <ListItemButton
                  key={item.id}
                  selected={isSelected}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 2,
                    py: 1.1,
                    px: 1.5,
                    color: isSelected ? "#4F46E5" : "#64748B",
                    transition: "all 0.15s ease",
                    "&.Mui-selected": { bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700 },
                    "&:hover": { bgcolor: isSelected ? "#EEF2FF" : "#F8FAFC", color: isSelected ? "#4F46E5" : "#0F172A" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: isSelected ? "#4F46E5" : "#94A3B8" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "0.825rem", fontWeight: "inherit" }} />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>

        {/* Right Content Viewport Panel */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 4,
            border: "1px solid #E2E8F0",
            borderRadius: 3,
            bgcolor: "#FFFFFF",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* TAB 0: PROFILE */}
          {activeTab === 0 && (
            <Box component="form" onSubmit={handleSaveProfile} display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Profile Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Update your display name, email, and workspace access role
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: "#4F46E5", color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 800, borderRadius: 2 }}>
                  {getInitials(profileName)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={700} sx={{ color: "#0F172A" }}>
                    {profileName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                    {profileEmail} • <Chip label={profileRole} size="small" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }} />
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Full Display Name
                  </Typography>
                  <TextField fullWidth size="small" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Email Address
                  </Typography>
                  <TextField fullWidth size="small" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#4F46E5", fontWeight: 700, px: 3, borderRadius: 1.8 }}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 1: PASSWORD & SECURITY */}
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleSavePassword} display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Password &amp; Security Credentials
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Verify your current password before updating account credentials
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={2.5} maxWidth={460}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Current Password
                  </Typography>
                  <TextField fullWidth type="password" size="small" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    New Password
                  </Typography>
                  <TextField fullWidth type="password" size="small" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Confirm New Password
                  </Typography>
                  <TextField fullWidth type="password" size="small" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </Box>
              </Stack>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button type="submit" variant="contained" color="primary" disabled={saving} sx={{ fontWeight: 700, px: 3, borderRadius: 1.8 }}>
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 2: THEME */}
          {activeTab === 2 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Theme &amp; Appearance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Select interface color theme
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                {[
                  { id: "light", title: "Light Mode", desc: "Clean off-white SaaS layout" },
                  { id: "dark", title: "Dark Mode", desc: "Sleek dark contrast interface" },
                  { id: "system", title: "System Default", desc: "Sync with operating system" },
                ].map((t) => (
                  <Grid item xs={12} sm={4} key={t.id}>
                    <Paper
                      onClick={() => setThemeMode(t.id)}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        border: themeMode === t.id ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                        bgcolor: themeMode === t.id ? "#EEF2FF" : "#FAFAFA",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Typography variant="body2" fontWeight={800} sx={{ color: themeMode === t.id ? "#4F46E5" : "#0F172A", mb: 0.5 }}>
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
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Theme"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 3: LANGUAGE */}
          {activeTab === 3 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Language &amp; Region
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Select primary language for workspace interface
                </Typography>
              </Box>

              <Divider />

              <TextField select label="Primary Interface Language" value={language} onChange={(e) => setLanguage(e.target.value)} size="small" sx={{ maxWidth: 360 }}>
                {["English", "Spanish", "French", "German", "Japanese"].map((l) => (
                  <MenuItem key={l} value={l}>{l}</MenuItem>
                ))}
              </TextField>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Language"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 4: TIMEZONE */}
          {activeTab === 4 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Timezone Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Set regional timezone for submission timestamps and analytics reports
                </Typography>
              </Box>

              <Divider />

              <TextField select label="Workspace Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} size="small" sx={{ maxWidth: 360 }}>
                {["UTC", "EST (Eastern)", "PST (Pacific)", "GMT (Greenwich)", "IST (India Standard)", "CET (Central Europe)"].map((tz) => (
                  <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                ))}
              </TextField>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Timezone"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 5: EMAIL PREFERENCES */}
          {activeTab === 5 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Email Preferences &amp; Subscriptions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Control automated email delivery settings
                </Typography>
              </Box>

              <Divider />

              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} color="primary" />}
                  label={<Box><Typography variant="body2" fontWeight={700}>Submission Email Alerts</Typography><Typography variant="caption" color="text.secondary">Receive immediate email alerts on new public form responses.</Typography></Box>}
                />

                <FormControlLabel
                  control={<Switch checked={weeklyDigest} onChange={(e) => setWeeklyDigest(e.target.checked)} color="primary" />}
                  label={<Box><Typography variant="body2" fontWeight={700}>Weekly Analytics Digest</Typography><Typography variant="caption" color="text.secondary">Receive weekly performance summaries every Monday morning.</Typography></Box>}
                />
              </Stack>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Email Preferences"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 6 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Push &amp; In-App Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Configure real-time browser push notifications
                </Typography>
              </Box>

              <Divider />

              <FormControlLabel
                control={<Switch checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} color="primary" />}
                label={<Box><Typography variant="body2" fontWeight={700}>In-App &amp; Push Alerts</Typography><Typography variant="caption" color="text.secondary">Enable live notification badge updates in Navbar.</Typography></Box>}
              />

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Notifications"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 7: BRANDING & DATA PRIVACY */}
          {activeTab === 7 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Custom Workspace Branding &amp; Data Privacy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Personalize public forms with custom logo URL, accent colors, and manage account data
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Brand Logo URL
                  </Typography>
                  <TextField fullWidth size="small" value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} placeholder="https://domain.com/logo.png" />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Primary Accent Color
                  </Typography>
                  <TextField fullWidth size="small" type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} sx={{ height: 40 }} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Data & Privacy Actions */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                  Data &amp; Privacy Controls
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={handleExportAccountData}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#E2E8F0" }}
                  >
                    Export Account Data (.json)
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<CleaningServicesRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={handleClearCache}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Clear Local Session Cache
                  </Button>
                </Stack>
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Branding"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 8: API KEYS & DEVELOPER */}
          {activeTab === 8 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Developer API Keys &amp; Tokens
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Secret API keys for programmatically managing forms and fetching database submissions
                </Typography>
              </Box>

              <Divider />

              <Box maxWidth={520}>
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success("Copied API key to clipboard!");
                    }}
                    sx={{ bgcolor: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 2 }}
                  >
                    <ContentCopyRoundedIcon sx={{ fontSize: 18, color: "#4F46E5" }} />
                  </IconButton>
                  <Button variant="contained" onClick={handleRotateApiKey} disabled={saving} sx={{ bgcolor: "#4F46E5", fontWeight: 700, whiteSpace: "nowrap" }}>
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
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Workspace &amp; Organization Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                  Configure workspace name, custom subdomain slug, and seat limits
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Workspace Name
                  </Typography>
                  <TextField fullWidth size="small" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Subdomain Slug
                  </Typography>
                  <TextField fullWidth size="small" value={workspaceSubdomain} onChange={(e) => setWorkspaceSubdomain(e.target.value)} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                    Team Member Seat Limit
                  </Typography>
                  <TextField fullWidth type="number" size="small" value={seatLimit} onChange={(e) => setSeatLimit(e.target.value)} />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleSavePreferences} disabled={saving} sx={{ fontWeight: 700, px: 3 }}>
                  {saving ? "Saving..." : "Save Workspace"}
                </Button>
              </Box>
            </Box>
          )}

          {/* TAB 10: BILLING & SUBSCRIPTION */}
          {activeTab === 10 && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
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

                <Button variant="contained" onClick={() => toast.success("Current plan is active!")} sx={{ bgcolor: "#4F46E5", fontWeight: 700 }}>
                  Manage Plan
                </Button>
              </Paper>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                  Billing Receipts &amp; Documents
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleDownloadInvoice}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#E2E8F0" }}
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
