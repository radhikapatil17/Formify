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
  LinearProgress,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import toast from "react-hot-toast";
import api from "../../api/api";

// Helper to calculate current limit status
const getLimitStatus = (enabled, currentCount, maxLimit) => {
  if (!enabled || !maxLimit || maxLimit <= 0) return { label: "No Limit Set", color: "default" };
  if (currentCount >= maxLimit) return { label: "Limit Reached — Closed", color: "error" };
  const pct = Math.round((currentCount / maxLimit) * 100);
  if (pct >= 80) return { label: `${currentCount} / ${maxLimit} — Almost Full`, color: "warning" };
  return { label: `${currentCount} / ${maxLimit} — Accepting Responses`, color: "success" };
};

export default function ResponseLimitModal({ open, onClose, form, onLimitUpdated }) {
  const [enabled, setEnabled] = useState(false);
  const [maxLimit, setMaxLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const currentCount = form?.submissions_count ?? 0;

  useEffect(() => {
    if (form) {
      setEnabled(Boolean(form.is_response_limit_enabled));
      setMaxLimit(form.max_response_limit != null ? String(form.max_response_limit) : "");
    }
  }, [form, open]);

  const numericMax = parseInt(maxLimit, 10);
  const validMax = !isNaN(numericMax) && numericMax > 0;
  const statusInfo = getLimitStatus(enabled, currentCount, validMax ? numericMax : 0);
  const progressPct = enabled && validMax ? Math.min(100, Math.round((currentCount / numericMax) * 100)) : 0;

  const handleSave = async () => {
    if (!form) return;

    if (enabled && !validMax) {
      toast.error("Please enter a valid maximum response limit (positive number)");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        is_response_limit_enabled: enabled,
        max_response_limit: enabled && validMax ? numericMax : null,
      };

      const res = await api.put(`/forms/${form.id}`, payload);
      toast.success("Response limit updated successfully!", { id: "limit-succ" });
      if (onLimitUpdated) {
        onLimitUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update response limit:", err);
      toast.error(err.response?.data?.detail || "Failed to update response limit");
    } finally {
      setSaving(false);
    }
  };

  const handleClearLimit = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const payload = {
        is_response_limit_enabled: false,
        max_response_limit: null,
      };

      const res = await api.put(`/forms/${form.id}`, payload);
      setEnabled(false);
      setMaxLimit("");
      toast.success("Response limit removed. Form will accept unlimited responses.", { id: "limit-clear" });
      if (onLimitUpdated) {
        onLimitUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove response limit");
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
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 2.5, px: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BlockRoundedIcon sx={{ color: "#EF4444", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.15rem" }}>
              Response Limit
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Limit the maximum number of submissions this form can accept
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          {/* Status Chip Header */}
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={enabled && validMax ? 1.5 : 0}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#475569" }}>
                Current Status
              </Typography>
              <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                sx={{ fontWeight: 800, fontSize: "0.75rem" }}
              />
            </Box>

            {enabled && validMax && (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "#E2E8F0",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      bgcolor: progressPct >= 100 ? "#EF4444" : progressPct >= 80 ? "#F59E0B" : "#4F46E5",
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5, textAlign: "right" }}>
                  {currentCount} of {numericMax} responses collected ({progressPct}%)
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Enable Switch Toggle */}
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
                  onChange={(e) => setEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1E1B4B" }}>
                    Enable Response Limit
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#4338CA", display: "block" }}>
                    Stop accepting new submissions after the maximum limit is reached.
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
            />
          </Paper>

          {/* Max Limit Input */}
          {enabled && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 0.8 }}>
                  MAXIMUM NUMBER OF RESPONSES
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={maxLimit}
                  onChange={(e) => setMaxLimit(e.target.value)}
                  placeholder="e.g. 100"
                  inputProps={{ min: 1 }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", mt: 0.5, display: "block" }}>
                  Once this number of submissions is received, the form will automatically stop accepting new responses.
                </Typography>
              </Box>

              {validMax && currentCount >= numericMax && (
                <Alert severity="error" sx={{ borderRadius: 2, fontSize: "0.8rem", py: 0.5 }}>
                  This form has already reached its limit of {numericMax} responses. Increase the limit or remove it to accept more responses.
                </Alert>
              )}

              {validMax && currentCount > 0 && currentCount < numericMax && (
                <Alert severity="info" sx={{ borderRadius: 2, fontSize: "0.8rem", py: 0.5 }}>
                  {numericMax - currentCount} more response{numericMax - currentCount !== 1 ? "s" : ""} will be accepted before the limit is reached.
                </Alert>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
        {(form?.is_response_limit_enabled || enabled) && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleClearLimit}
            disabled={saving}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", mr: "auto" }}
          >
            Remove Limit
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={onClose}
          disabled={saving}
          sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", borderColor: "#CBD5E1" }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
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
          {saving ? "Saving..." : "Save Limit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
