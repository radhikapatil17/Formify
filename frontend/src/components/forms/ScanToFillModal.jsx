import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Checkbox,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from "@mui/material";
import toast from "react-hot-toast";

import DocumentScannerRoundedIcon from "@mui/icons-material/DocumentScannerRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import api from "../../api/api";

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".csv", ".txt"];

export default function ScanToFillModal({ open, onClose, publicLink, onConfirmApply }) {
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filename, setFilename] = useState("");
  const [extractedData, setExtractedData] = useState(null); // API response object
  const [selectedFieldIds, setSelectedFieldIds] = useState(new Set());
  const [editedValues, setEditedValues] = useState({});

  // Reset state on close or re-scan
  const handleReset = () => {
    setExtracting(false);
    setFilename("");
    setExtractedData(null);
    setSelectedFieldIds(new Set());
    setEditedValues({});
  };

  const handleCloseModal = () => {
    handleReset();
    onClose();
  };

  // Upload and parse document file
  const processFile = async (file) => {
    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Unsupported file type '${ext}'. Please upload a PDF, PNG, JPG, WEBP, DOCX, or CSV.`, { id: "scan-file-err" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds maximum limit of 10MB.", { id: "scan-size-err" });
      return;
    }

    setFilename(file.name);
    setExtracting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(`/public/forms/${publicLink}/scan-to-fill`, formData);

      if (res.data && res.data.extracted_fields) {
        setExtractedData(res.data);

        // Pre-select fields that have extracted non-empty values
        const initialSelected = new Set();
        const initialEdited = {};

        for (const item of res.data.extracted_fields) {
          const val = item.extracted_value ?? "";
          initialEdited[item.field_id] = val;
          if (val && String(val).trim() !== "") {
            initialSelected.add(item.field_id);
          }
        }

        setSelectedFieldIds(initialSelected);
        setEditedValues(initialEdited);

        if (res.data.extracted_count > 0) {
          toast.success(`Successfully extracted ${res.data.extracted_count} values from document!`, { id: "scan-success" });
        } else {
          toast.error("No matching values found in document. You can still manually enter values below.", { id: "scan-warn" });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to extract data from document. Please try again or upload a clearer file.", { id: "scan-api-err" });
      setFilename("");
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Toggle individual field selection checkbox
  const handleToggleSelect = (fieldId) => {
    setSelectedFieldIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  // Select all or Deselect all
  const handleSelectAllToggle = () => {
    if (!extractedData || !extractedData.extracted_fields) return;
    if (selectedFieldIds.size === extractedData.extracted_fields.length) {
      setSelectedFieldIds(new Set());
    } else {
      const allIds = new Set(extractedData.extracted_fields.map((f) => f.field_id));
      setSelectedFieldIds(allIds);
    }
  };

  // Handle edited value change
  const handleValueChange = (fieldId, val) => {
    setEditedValues((prev) => ({ ...prev, [fieldId]: val }));
    // Auto-select field if user enters a value
    if (val && String(val).trim() !== "") {
      setSelectedFieldIds((prev) => new Set(prev).add(fieldId));
    }
  };

  // Confirm & Apply populated values back to public form state
  const handleConfirm = () => {
    if (selectedFieldIds.size === 0) {
      toast.error("Please select at least one field to populate into the form.", { id: "scan-none-err" });
      return;
    }

    const payload = {};
    for (const fieldId of selectedFieldIds) {
      const val = editedValues[fieldId];
      if (val !== undefined && val !== null) {
        payload[fieldId] = val;
      }
    }

    onConfirmApply(payload);
    toast.success(`Populated ${selectedFieldIds.size} fields into the form!`, { id: "scan-apply-success" });
    handleCloseModal();
  };

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "#EEF2FF",
              color: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DocumentScannerRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0F172A">
              Scan Document to Auto-Fill Form
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload receipt, invoice, business card, ID, or document to extract values automatically.
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleCloseModal} size="small" sx={{ color: "#64748B" }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        {/* State 1: Upload / Processing Zone */}
        {(!extractedData || extracting) && (
          <Box display="flex" flexDirection="column" gap={3}>
            <Paper
              elevation={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 5,
                borderRadius: 4,
                border: `2px dashed ${dragging ? "#4F46E5" : "#CBD5E1"}`,
                bgcolor: dragging ? "#EEF2FF" : "#F8FAFC",
                cursor: extracting ? "wait" : "pointer",
                textAlign: "center",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "#4F46E5",
                  bgcolor: "#F0F5FF",
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.csv,.txt"
                onChange={handleFileChange}
                disabled={extracting}
              />

              {extracting ? (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <CircularProgress size={44} sx={{ color: "#4F46E5" }} />
                  <Typography variant="subtitle1" fontWeight={700} color="#0F172A">
                    Analyzing "{filename}" with AI...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reading text, matching labels, and evaluating confidence scores...
                  </Typography>
                  <Box width="60%" mt={1}>
                    <LinearProgress sx={{ borderRadius: 2, height: 6, bgcolor: "#EEF2FF", "& .MuiLinearProgress-bar": { bgcolor: "#4F46E5" } }} />
                  </Box>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      bgcolor: "#EEF2FF",
                      color: "#4F46E5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#0F172A">
                    Drag & Drop your document or image here
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or <span style={{ color: "#4F46E5", fontWeight: 700, textDecoration: "underline" }}>Browse Files</span> on your computer
                  </Typography>

                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" justifyContent="center">
                    <Chip icon={<InsertDriveFileRoundedIcon sx={{ fontSize: 16 }} />} label="PDF / DOCX" size="small" variant="outlined" />
                    <Chip label="Receipts & Invoices" size="small" variant="outlined" />
                    <Chip label="Business Cards & IDs" size="small" variant="outlined" />
                    <Chip label="JPG, PNG, WEBP (Max 10MB)" size="small" variant="outlined" />
                  </Stack>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* State 2: Review & Edit Extracted Values */}
        {extractedData && !extracting && (
          <Box display="flex" flexDirection="column" gap={2.5}>
            {/* Summary Alert */}
            <Alert
              severity={extractedData.extracted_count > 0 ? "success" : "warning"}
              icon={<CheckCircleRoundedIcon fontSize="inherit" />}
              action={
                <Button size="small" startIcon={<RestartAltRoundedIcon />} onClick={handleReset} sx={{ color: "inherit", fontWeight: 700 }}>
                  Scan Another File
                </Button>
              }
              sx={{ borderRadius: 3, fontWeight: 500 }}
            >
              Extracted data from <strong>{filename}</strong>. Review, edit incorrect values, and confirm fields to populate into form.
            </Alert>

            {/* Controls Bar */}
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                Detected Field Mappings ({selectedFieldIds.size} of {extractedData.extracted_fields.length} selected)
              </Typography>
              <Button size="small" onClick={handleSelectAllToggle} sx={{ fontWeight: 700 }}>
                {selectedFieldIds.size === extractedData.extracted_fields.length ? "Deselect All" : "Select All"}
              </Button>
            </Box>

            {/* Field Review List */}
            <Stack spacing={2} maxHeight="380px" sx={{ overflowY: "auto", pr: 1 }}>
              {extractedData.extracted_fields.map((field) => {
                const isSelected = selectedFieldIds.has(field.field_id);
                const val = editedValues[field.field_id] ?? "";
                const conf = field.confidence ?? 0.0;
                const isHighConf = conf >= 0.8;
                const isNotFound = !val || String(val).trim() === "";

                return (
                  <Paper
                    key={field.field_id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: `1.5px solid ${isSelected ? "#6366F1" : "#E2E8F0"}`,
                      bgcolor: isSelected ? "#F8FAFC" : "#FFFFFF",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={1.5}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleToggleSelect(field.field_id)}
                        sx={{ mt: 0.5, color: "#94A3B8", "&.Mui-checked": { color: "#4F46E5" } }}
                      />

                      <Box flex={1} display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                              {field.field_label}
                            </Typography>
                            <Chip label={field.field_type} size="small" sx={{ fontSize: "0.7rem", height: 20, bgcolor: "#F1F5F9", color: "#475569" }} />
                          </Box>

                          {/* Confidence Chip */}
                          {isNotFound ? (
                            <Chip label="Not Found in Document" size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 22, color: "#94A3B8" }} />
                          ) : isHighConf ? (
                            <Chip
                              icon={<CheckCircleRoundedIcon style={{ fontSize: 14, color: "#10B981" }} />}
                              label={`High Confidence (${Math.round(conf * 100)}%)`}
                              size="small"
                              sx={{ fontSize: "0.7rem", height: 22, bgcolor: "#ECFDF5", color: "#065F46", fontWeight: 700 }}
                            />
                          ) : (
                            <Tooltip title={field.confidence_reason || "Low confidence extraction. Please verify value."} arrow placement="top">
                              <Chip
                                icon={<WarningAmberRoundedIcon style={{ fontSize: 14, color: "#F59E0B" }} />}
                                label={`Review Needed (${Math.round(conf * 100)}%)`}
                                size="small"
                                sx={{ fontSize: "0.7rem", height: 22, bgcolor: "#FFFBEB", color: "#92400E", fontWeight: 700, cursor: "help" }}
                              />
                            </Tooltip>
                          )}
                        </Box>

                        {/* Editable Field Input */}
                        <TextField
                          fullWidth
                          size="small"
                          value={val}
                          onChange={(e) => handleValueChange(field.field_id, e.target.value)}
                          placeholder="Extracted value (editable)"
                          InputProps={{
                            endAdornment: <EditRoundedIcon sx={{ fontSize: 16, color: "#94A3B8" }} />,
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "#FFFFFF",
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, justifyContent: "space-between" }}>
        <Button onClick={handleCloseModal} sx={{ color: "#64748B", fontWeight: 600 }}>
          Cancel
        </Button>

        {extractedData && !extracting && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={selectedFieldIds.size === 0}
            startIcon={<DocumentScannerRoundedIcon />}
            sx={{
              bgcolor: "#4F46E5",
              color: "#FFFFFF",
              fontWeight: 700,
              px: 3,
              borderRadius: 2.5,
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Confirm & Apply {selectedFieldIds.size > 0 ? `(${selectedFieldIds.size} Fields)` : ""}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
