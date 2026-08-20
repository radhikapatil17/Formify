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
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import toast from "react-hot-toast";
import api from "../../api/api";

// Helper to convert ISO or Date to datetime-local string (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (isoStr) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${mins}`;
  } catch {
    return "";
  }
};

// Helper to calculate current schedule status badge
const getScheduleStatus = (enabled, startStr, endStr) => {
  if (!enabled) return { label: "No Schedule Set", color: "default" };

  const now = new Date();
  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  if (start && !isNaN(start.getTime()) && now < start) {
    return { label: "Scheduled (Not Available Yet)", color: "info" };
  }
  if (end && !isNaN(end.getTime()) && now > end) {
    return { label: "Closed / Expired", color: "warning" };
  }
  return { label: "Schedule Active & Live", color: "success" };
};

export default function FormScheduleModal({ open, onClose, form, onScheduleUpdated }) {
  const [enabled, setEnabled] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form) {
      setEnabled(Boolean(form.is_scheduling_enabled));
      setStartTime(toDatetimeLocal(form.schedule_start_time));
      setEndTime(toDatetimeLocal(form.schedule_end_time));
    }
  }, [form, open]);

  const statusInfo = getScheduleStatus(enabled, startTime, endTime);

  const handleSave = async () => {
    if (!form) return;

    if (enabled && startTime && endTime) {
      if (new Date(startTime) >= new Date(endTime)) {
        toast.error("End date and time must be after start date and time");
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        is_scheduling_enabled: enabled,
        schedule_start_time: enabled && startTime ? new Date(startTime).toISOString() : null,
        schedule_end_time: enabled && endTime ? new Date(endTime).toISOString() : null,
      };

      const res = await api.put(`/forms/${form.id}`, payload);
      toast.success("Form schedule updated successfully!", { id: "sched-succ" });
      if (onScheduleUpdated) {
        onScheduleUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update form schedule:", err);
      toast.error(err.response?.data?.detail || "Failed to update form schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const payload = {
        is_scheduling_enabled: false,
        schedule_start_time: null,
        schedule_end_time: null,
      };

      const res = await api.put(`/forms/${form.id}`, payload);
      setEnabled(false);
      setStartTime("");
      setEndTime("");
      toast.success("Schedule removed. Form will accept responses normally.", { id: "sched-clear" });
      if (onScheduleUpdated) {
        onScheduleUpdated(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove schedule");
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
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EventAvailableRoundedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.15rem" }}>
              Form Availability Schedule
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Set start and end date/time limits for receiving responses
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#475569" }}>
              Current Status
            </Typography>
            <Chip
              label={statusInfo.label}
              color={statusInfo.color}
              sx={{ fontWeight: 800, fontSize: "0.75rem" }}
            />
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
                    Enable Schedule Restrictions
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#4338CA", display: "block" }}>
                    Only allow form submissions within the specified start and end timeframe.
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
            />
          </Paper>

          {/* Date Time Inputs */}
          {enabled && (
            <Stack spacing={2.5}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box flex={1} minWidth={220}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 0.8 }}>
                    START DATE &amp; TIME
                  </Typography>
                  <TextField
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", mt: 0.5, display: "block" }}>
                    Respondents opening form before this time will see "Form is not yet available".
                  </Typography>
                </Box>

                <Box flex={1} minWidth={220}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 0.8 }}>
                    END DATE &amp; TIME
                  </Typography>
                  <TextField
                    type="datetime-local"
                    fullWidth
                    size="small"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", mt: 0.5, display: "block" }}>
                    Respondents opening form after this time will see "Form is closed".
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ borderRadius: 2, fontSize: "0.8rem", py: 0.5 }}>
                Timezone is automatically synchronized with your local system time and saved in standard UTC format on the server.
              </Alert>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
        {(form?.is_scheduling_enabled || enabled) && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleClearSchedule}
            disabled={saving}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", mr: "auto" }}
          >
            Remove Schedule
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
          {saving ? "Saving..." : "Save Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
