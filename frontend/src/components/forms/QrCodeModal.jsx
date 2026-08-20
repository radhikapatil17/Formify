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
  Chip,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

export default function QrCodeModal({ open, onClose, form, publicUrl }) {
  const handleDownloadQr = () => {
    try {
      const canvas = document.getElementById("formify-qr-canvas");
      if (!canvas) {
        toast.error("QR Code canvas not ready");
        return;
      }

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      const cleanTitle = (form?.title || "form").toLowerCase().replace(/[^a-z0-9]/g, "-");
      downloadLink.href = pngUrl;
      downloadLink.download = `formify-qr-${cleanTitle}-${form?.id || "code"}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success("QR Code PNG downloaded successfully!", { id: "qr-download-succ" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to download QR code image");
    }
  };

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public link copied to clipboard!", { id: "qr-copy-succ" });
  };

  const isAvailable = Boolean(publicUrl && publicUrl.trim());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCode2RoundedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
              Form QR Code
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Scan with smartphone camera to open form
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {isAvailable ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2.5}>
            {/* QR Canvas Display Paper Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "#FFFFFF",
                border: "2px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.08)",
                position: "relative",
              }}
            >
              <QRCodeCanvas
                id="formify-qr-canvas"
                value={publicUrl}
                size={210}
                level="H"
                includeMargin={true}
                style={{ borderRadius: "8px" }}
              />

              <Box mt={1.5} display="flex" alignItems="center" gap={1}>
                <Chip
                  label="Scan to Open Form"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.68rem",
                    bgcolor: "#EEF2FF",
                    color: "#4F46E5",
                    border: "1px solid #C7D2FE",
                  }}
                />
              </Box>
            </Paper>

            {/* Public Link Text Box */}
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                p: 1.5,
                px: 2,
                borderRadius: 2.5,
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#0F172A",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {publicUrl}
              </Typography>

              <Tooltip title="Copy Public URL">
                <IconButton size="small" onClick={handleCopyLink} sx={{ color: "#4F46E5" }}>
                  <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Paper>
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: "#FFF7ED",
              border: "1px solid #FDE68A",
              borderRadius: 3,
            }}
          >
            <WarningAmberRoundedIcon sx={{ color: "#D97706", fontSize: 36, mb: 1 }} />
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#92400E" }}>
              Form Not Published Yet
            </Typography>
            <Typography variant="caption" sx={{ color: "#B45309", mt: 0.5, display: "block" }}>
              Please publish this form to generate an active QR code for respondents.
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: "1px solid #F1F5F9" }}>
        {isAvailable && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => window.open(publicUrl, "_blank")}
            sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", mr: "auto" }}
          >
            Test Link
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", borderColor: "#CBD5E1" }}
        >
          Close
        </Button>

        {isAvailable && (
          <Button
            variant="contained"
            onClick={handleDownloadQr}
            startIcon={<DownloadRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            }}
          >
            Download PNG
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
