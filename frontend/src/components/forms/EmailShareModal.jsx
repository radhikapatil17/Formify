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
  CircularProgress,
  IconButton,
  Paper,
  InputAdornment,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import toast from "react-hot-toast";
import api from "../../api/api";

export default function EmailShareModal({ open, onClose, form, publicUrl }) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (form?.title) {
      setSubject(`Invitation to fill out: ${form.title}`);
    } else {
      setSubject("Invitation to fill out form");
    }
    setCustomMessage("Please take a moment to fill out this form. Your response is greatly appreciated!");
    setRecipientEmail("");
    setEmailError("");
  }, [form, open]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const cleanEmail = recipientEmail.trim();

    if (!cleanEmail) {
      setEmailError("Recipient email address is required");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setEmailError("Please enter a valid email address (e.g. name@example.com)");
      return;
    }

    setEmailError("");

    try {
      setSending(true);
      const res = await api.post("/share/email", {
        form_id: form.id,
        recipient_email: cleanEmail,
        subject: subject.trim(),
        custom_message: customMessage.trim(),
        public_url: publicUrl,
      });

      toast.success(res.data.message || "Email invitation sent successfully!", { id: "email-share-succ" });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to send email invitation", { id: "email-share-err" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !sending && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0.5,
          boxShadow: "0 20px 40px -8px rgba(15, 23, 42, 0.15)",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 2.5, px: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EmailOutlinedIcon sx={{ color: "#4F46E5", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
              Share Form via Email
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Send a direct invitation with clickable form link to respondents
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} disabled={sending} sx={{ color: "#64748B" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSendEmail}>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Public Link Included Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2.5,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <LinkRoundedIcon sx={{ color: "#4F46E5", fontSize: 20 }} />
            <Box flex={1} overflow="hidden">
              <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block" }}>
                INCLUDED PUBLIC LINK
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#0F172A",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {publicUrl || `${window.location.origin}/public/form/${form?.id}`}
              </Typography>
            </Box>
          </Paper>

          {/* Form Fields */}
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Recipient Email Field */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.6, color: "#334155" }}>
                RECIPIENT EMAIL ADDRESS <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="colleague@example.com"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                error={Boolean(emailError)}
                helperText={emailError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
            </Box>

            {/* Subject Field */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.6, color: "#334155" }}>
                EMAIL SUBJECT
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Invitation to fill out form"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
            </Box>

            {/* Custom Message Field */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.6, color: "#334155" }}>
                CUSTOM MESSAGE (OPTIONAL)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Add a personalized message for the recipient..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={sending}
            sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", borderColor: "#CBD5E1" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 0.9,
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            }}
          >
            {sending ? "Sending..." : "Send Email Invitation"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
