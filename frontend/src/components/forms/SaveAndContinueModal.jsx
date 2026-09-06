import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Chip,
  Paper,
  Divider,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BookmarkAddedRoundedIcon from "@mui/icons-material/BookmarkAddedRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import toast from "react-hot-toast";

export default function SaveAndContinueModal({
  open,
  onClose,
  resumeUrl,
  savedAt,
  onSendEmail,
  sendingEmail,
  formTitle,
}) {
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleCopy = () => {
    if (!resumeUrl) return;
    navigator.clipboard.writeText(resumeUrl);
    setCopied(true);
    toast.success("Resume link copied to clipboard!", { id: "copy-resume-link" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      await onSendEmail(emailInput.trim());
      setEmailSent(true);
      toast.success(`Resume link sent to ${emailInput.trim()}!`);
    } catch {
      toast.error("Failed to send email. You can still copy the link above.");
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
          borderRadius: 4,
          p: 1,
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.18)",
        },
      }}
    >
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center" pb={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(79, 70, 229, 0.30)",
            }}
          >
            <BookmarkAddedRoundedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              Save & Continue Later
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
              {formTitle ? `"${formTitle}"` : "Public Form Progress"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8" }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ my: 1 }} />

      <DialogContent sx={{ py: 2 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Success Banner */}
          <Alert
            severity="success"
            icon={<BookmarkAddedRoundedIcon fontSize="inherit" />}
            sx={{ borderRadius: 3, fontWeight: 600, fontSize: "0.88rem" }}
          >
            Your progress has been securely saved to the cloud! {savedAt && `(Last saved: ${savedAt})`}
          </Alert>

          {/* Device Resume Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DevicesRoundedIcon sx={{ color: "#4F46E5", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                Unique Resume Link
              </Typography>
              <Chip
                label="Cross-Device Compatible"
                size="small"
                sx={{
                  ml: "auto",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  bgcolor: "#EEF2FF",
                  color: "#4338CA",
                  border: "1px solid #C7D2FE",
                }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: "#64748B", mb: 2, fontSize: "0.84rem" }}>
              Use this link to resume your form from any phone, laptop, or browser without losing your answers:
            </Typography>

            <TextField
              fullWidth
              size="small"
              value={resumeUrl || ""}
              readOnly
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleCopy}
                      startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                      sx={{
                        bgcolor: copied ? "#10B981" : "#4F46E5",
                        "&:hover": { bgcolor: copied ? "#059669" : "#4338CA" },
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2,
                        px: 2,
                      }}
                    >
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: "#FFFFFF",
                  borderRadius: 2.5,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  fontFamily: "monospace",
                },
              }}
            />
          </Paper>

          {/* Email Option Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EmailOutlinedIcon sx={{ color: "#0EA5E9", fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A" }}>
                Send Link to Email
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: "#64748B", mb: 2, fontSize: "0.84rem" }}>
              Receive your secure resume link directly in your inbox:
            </Typography>

            <Box component="form" onSubmit={handleEmailSubmit} display="flex" gap={1}>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="Enter your email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={sendingEmail}
                InputProps={{
                  sx: { borderRadius: 2.5, fontSize: "0.88rem" },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={sendingEmail || !emailInput.trim()}
                startIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#0EA5E9",
                  "&:hover": { bgcolor: "#0284C7" },
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {sendingEmail ? "Sending..." : emailSent ? "Sent!" : "Send"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            fontWeight: 700,
            borderRadius: 2.5,
            px: 4,
            py: 1,
            bgcolor: "#0F172A",
            "&:hover": { bgcolor: "#1E293B" },
            textTransform: "none",
          }}
        >
          Got It, Resume Later
        </Button>
      </DialogActions>
    </Dialog>
  );
}
