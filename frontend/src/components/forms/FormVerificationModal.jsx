import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Chip,
  Stack,
  Alert,
  Grid,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import PhonelinkRingRoundedIcon from "@mui/icons-material/PhonelinkRingRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import toast from "react-hot-toast";

import api from "../../api/api";

export default function FormVerificationModal({ open, onClose, form, onVerificationUpdated }) {
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [phoneOtpEnabled, setPhoneOtpEnabled] = useState(false);
  const [requireToSubmit, setRequireToSubmit] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form) {
      setEmailOtpEnabled(Boolean(form.is_email_otp_enabled));
      setPhoneOtpEnabled(Boolean(form.is_phone_otp_enabled));
      setRequireToSubmit(Boolean(form.require_verification_to_submit));
      setExpiryMinutes(form.otp_expiry_minutes || 10);
      setMaxAttempts(form.max_otp_attempts || 3);
      setCooldownSeconds(form.otp_cooldown_seconds || 60);
    }
  }, [form, open]);

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const payload = {
        is_email_otp_enabled: emailOtpEnabled,
        is_phone_otp_enabled: phoneOtpEnabled,
        require_verification_to_submit: requireToSubmit,
        otp_expiry_minutes: Number(expiryMinutes),
        max_otp_attempts: Number(maxAttempts),
        otp_cooldown_seconds: Number(cooldownSeconds),
      };

      const res = await api.put(`/forms/${form.id}`, payload);
      toast.success("Micro-verification settings saved successfully!", { id: "verif-settings-succ" });
      if (onVerificationUpdated) {
        onVerificationUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update verification settings");
    } finally {
      setSaving(false);
    }
  };

  const isAnyEnabled = emailOtpEnabled || phoneOtpEnabled;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.22)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          pb: 2,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: isAnyEnabled ? "#EEF2FF" : "#F8FAFC",
              color: isAnyEnabled ? "#4F46E5" : "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #C7D2FE",
            }}
          >
            <VerifiedUserRoundedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              Built-in Micro-Verification &amp; Anti-Spam
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
              Require Email or Phone OTP verification before public form submission
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#94A3B8" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FFFFFF" }}>
        <Stack spacing={3}>
          {/* Active Protection Overview Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: isAnyEnabled ? "#F5F3FF" : "#F8FAFC",
              border: "1px solid",
              borderColor: isAnyEnabled ? "#DDD6FE" : "#E2E8F0",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <ShieldRoundedIcon sx={{ color: isAnyEnabled ? "#7C3AED" : "#94A3B8", fontSize: 22 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                    Status: {isAnyEnabled ? "Micro-Verification Active" : "Verification Disabled"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                    {isAnyEnabled
                      ? "Respondents must verify identity via secure OTP."
                      : "Public form respondents can submit without OTP verification."}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                {emailOtpEnabled && <Chip label="✉️ Email OTP" size="small" sx={{ fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }} />}
                {phoneOtpEnabled && <Chip label="📱 Phone OTP" size="small" sx={{ fontWeight: 700, bgcolor: "#ECFDF5", color: "#059669" }} />}
                {requireToSubmit && <Chip label="🔒 Required to Submit" size="small" sx={{ fontWeight: 700, bgcolor: "#FEF3C7", color: "#D97706" }} />}
              </Stack>
            </Box>
          </Paper>

          {/* Verification Toggles Grid */}
          <Grid container spacing={2}>
            {/* Email OTP Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: emailOtpEnabled ? "#818CF8" : "#E2E8F0",
                  bgcolor: emailOtpEnabled ? "#EEF2FF" : "#FAFAFA",
                  transition: "all 0.2s ease",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MarkEmailReadRoundedIcon sx={{ color: emailOtpEnabled ? "#4F46E5" : "#64748B", fontSize: 22 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                      Email OTP Verification
                    </Typography>
                  </Box>
                  <Switch
                    checked={emailOtpEnabled}
                    onChange={(e) => setEmailOtpEnabled(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", display: "block" }}>
                  Sends a 6-digit verification code to the respondent's email address via SMTP before submission.
                </Typography>
              </Paper>
            </Grid>

            {/* Phone OTP Card */}
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: phoneOtpEnabled ? "#10B981" : "#E2E8F0",
                  bgcolor: phoneOtpEnabled ? "#ECFDF5" : "#FAFAFA",
                  transition: "all 0.2s ease",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhonelinkRingRoundedIcon sx={{ color: phoneOtpEnabled ? "#059669" : "#64748B", fontSize: 22 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                      Phone OTP Verification
                    </Typography>
                  </Box>
                  <Switch
                    checked={phoneOtpEnabled}
                    onChange={(e) => setPhoneOtpEnabled(e.target.checked)}
                    color="success"
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", display: "block" }}>
                  Validates phone number format and sends a 6-digit OTP code to the respondent's phone.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Submission Gate Switch */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: requireToSubmit ? "#FFFBEB" : "#FFFFFF",
              borderColor: requireToSubmit ? "#FCD34D" : "#E2E8F0",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={requireToSubmit}
                  onChange={(e) => setRequireToSubmit(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                    Require Verification Before Submission
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", display: "block" }}>
                    When enabled, the public form submit button remains locked until required OTP verification is completed.
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
            />
          </Paper>

          {/* Creator Configuration Controls */}
          <Box>
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 1.5, color: "#64748B", letterSpacing: "0.05em" }}>
              OTP Security &amp; Rate Limits
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="OTP Expiry Duration"
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(e.target.value)}
                  InputProps={{ startAdornment: <TimerRoundedIcon sx={{ fontSize: 16, color: "#64748B", mr: 1 }} /> }}
                >
                  <MenuItem value={5}>5 Minutes</MenuItem>
                  <MenuItem value={10}>10 Minutes (Default)</MenuItem>
                  <MenuItem value={15}>15 Minutes</MenuItem>
                  <MenuItem value={30}>30 Minutes</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Max Verification Attempts"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  InputProps={{ startAdornment: <LockRoundedIcon sx={{ fontSize: 16, color: "#64748B", mr: 1 }} /> }}
                >
                  <MenuItem value={3}>3 Attempts (Recommended)</MenuItem>
                  <MenuItem value={5}>5 Attempts</MenuItem>
                  <MenuItem value={10}>10 Attempts</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Resend Cooldown"
                  value={cooldownSeconds}
                  onChange={(e) => setCooldownSeconds(e.target.value)}
                  InputProps={{ startAdornment: <ReplayRoundedIcon sx={{ fontSize: 16, color: "#64748B", mr: 1 }} /> }}
                >
                  <MenuItem value={30}>30 Seconds</MenuItem>
                  <MenuItem value={60}>60 Seconds (Default)</MenuItem>
                  <MenuItem value={120}>120 Seconds</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Built-in Anti-Spam & Fraud Protection Badges */}
          <Alert severity="info" icon={<SecurityRoundedIcon sx={{ fontSize: 20 }} />} sx={{ borderRadius: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
              Automated Anti-Spam &amp; Security Guards Included:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              <Chip label="🚫 Disposable Email Blocker (Active)" size="small" variant="outlined" sx={{ fontSize: "0.7rem", fontWeight: 700 }} />
              <Chip label="📞 Phone Format Guard (Active)" size="small" variant="outlined" sx={{ fontSize: "0.7rem", fontWeight: 700 }} />
              <Chip label="🔐 SHA-256 Hashed OTP Storage" size="small" variant="outlined" sx={{ fontSize: "0.7rem", fontWeight: 700 }} />
              <Chip label="⏳ Rate Limited Cooldown" size="small" variant="outlined" sx={{ fontSize: "0.7rem", fontWeight: 700 }} />
            </Stack>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, px: 3, justifyContent: "space-between", bgcolor: "#FAFAFA", borderTop: "1px solid #E2E8F0" }}>
        <Button variant="outlined" onClick={onClose} disabled={saving} sx={{ fontWeight: 600, borderColor: "#CBD5E1" }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<SaveRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{ bgcolor: "#4F46E5", fontWeight: 700, px: 3, "&:hover": { bgcolor: "#4338CA" } }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
