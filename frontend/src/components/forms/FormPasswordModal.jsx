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
  Chip,
  Stack,
  Alert,
  InputAdornment,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockPersonRoundedIcon from "@mui/icons-material/LockPersonRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import toast from "react-hot-toast";
import api from "../../api/api";

export default function FormPasswordModal({ open, onClose, form, onPasswordUpdated }) {
  const [enabled, setEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state when form prop changes or dialog opens
  useEffect(() => {
    if (form) {
      setEnabled(Boolean(form.is_password_protected));
      // Never pre-fill the password — user must re-enter to change it
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [form, open]);

  const isAlreadyProtected = Boolean(form?.is_password_protected);

  // Validation
  const passwordMismatch = enabled && password && confirmPassword && password !== confirmPassword;
  const passwordTooShort = enabled && password && password.length < 4;
  const canSave =
    !saving &&
    (!enabled || (
      !passwordMismatch &&
      !passwordTooShort &&
      // If already protected and no new password entered, it's a "keep existing password" save
      // If not yet protected, a new password is required
      (isAlreadyProtected || (password.length >= 4 && password === confirmPassword))
    ));

  const handleSave = async () => {
    if (!form) return;

    if (enabled && password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (enabled && password && password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (enabled && !isAlreadyProtected && !password) {
      toast.error("Please set a password to enable password protection");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        is_password_protected: enabled,
      };

      // Only send the password field when a new password is being set
      if (enabled && password) {
        payload.password = password;
      }

      // When disabling, send explicit false (service will clear the hash)
      if (!enabled) {
        payload.is_password_protected = false;
      }

      const res = await api.put(`/forms/${form.id}`, payload);
      toast.success(
        enabled
          ? "Password protection enabled successfully!"
          : "Password protection removed.",
        { id: "pwd-succ" }
      );
      if (onPasswordUpdated) {
        onPasswordUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update password protection:", err);
      toast.error(err.response?.data?.detail || "Failed to update password protection");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const res = await api.put(`/forms/${form.id}`, {
        is_password_protected: false,
      });
      setEnabled(false);
      setPassword("");
      setConfirmPassword("");
      toast.success("Password protection removed. Form is now publicly accessible.", {
        id: "pwd-remove",
      });
      if (onPasswordUpdated) {
        onPasswordUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove password protection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 0.5,
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.18)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: enabled ? "#EEF2FF" : "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s ease",
            }}
          >
            {enabled ? (
              <LockPersonRoundedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />
            ) : (
              <LockOpenRoundedIcon sx={{ color: "#94A3B8", fontSize: 24 }} />
            )}
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: "#0F172A", fontSize: "1.15rem" }}
            >
              Password Protection
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Require a password before respondents can access this form
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          {/* Status badge */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              px: 2.5,
              borderRadius: 2.5,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#475569" }}>
                Current Status
              </Typography>
              <Chip
                label={isAlreadyProtected ? "Password Protected" : "No Password Set"}
                color={isAlreadyProtected ? "primary" : "default"}
                sx={{ fontWeight: 800, fontSize: "0.75rem" }}
              />
            </Box>
            {isAlreadyProtected && (
              <Typography
                variant="caption"
                sx={{ color: "#64748B", display: "block", mt: 1 }}
              >
                This form is currently protected. Visitors must enter the correct password
                before they can view or submit responses.
              </Typography>
            )}
          </Paper>

          {/* Enable toggle */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #C7D2FE",
              bgcolor: enabled ? "#EEF2FF" : "#FFFFFF",
              transition: "all 0.2s ease",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(e) => {
                    setEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setPassword("");
                      setConfirmPassword("");
                    }
                  }}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{ color: "#1E1B4B" }}
                  >
                    Enable Password Protection
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#4338CA", display: "block" }}
                  >
                    Visitors will see a password prompt before accessing the form.
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
            />
          </Paper>

          {/* Password inputs */}
          {enabled && (
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: "#475569", display: "block", mb: 0.8 }}
                >
                  {isAlreadyProtected ? "NEW PASSWORD (leave blank to keep current)" : "SET PASSWORD"}
                </Typography>
                <TextField
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isAlreadyProtected
                      ? "Enter new password to change it"
                      : "Enter a password (min. 4 characters)"
                  }
                  error={Boolean(passwordTooShort)}
                  helperText={passwordTooShort ? "Password must be at least 4 characters" : ""}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          sx={{ color: "#94A3B8" }}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              {/* Only show confirm if a new password is being entered */}
              {password.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: "#475569", display: "block", mb: 0.8 }}
                  >
                    CONFIRM PASSWORD
                  </Typography>
                  <TextField
                    type={showConfirm ? "text" : "password"}
                    fullWidth
                    size="small"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter the password"
                    error={Boolean(passwordMismatch)}
                    helperText={passwordMismatch ? "Passwords do not match" : ""}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowConfirm((v) => !v)}
                            edge="end"
                            sx={{ color: "#94A3B8" }}
                          >
                            {showConfirm ? (
                              <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                            ) : (
                              <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>
              )}

              <Alert severity="info" sx={{ borderRadius: 2, fontSize: "0.8rem", py: 0.5 }}>
                The password is stored securely as an encrypted hash and is never
                visible in API responses.
              </Alert>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}
      >
        {isAlreadyProtected && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleRemovePassword}
            disabled={saving}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              textTransform: "none",
              mr: "auto",
            }}
          >
            Remove Password
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={onClose}
          disabled={saving}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            textTransform: "none",
            borderColor: "#CBD5E1",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          startIcon={<SaveRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            bgcolor: "#4F46E5",
            "&:hover": { bgcolor: "#4338CA" },
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
