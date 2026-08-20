import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Chip,
  Paper,
  Alert,
  Stack,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
  Tooltip,
  Grid,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FormatIndentIncreaseRoundedIcon from "@mui/icons-material/FormatIndentIncreaseRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import api from "../../api/api";

const FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "rating",
  "file_upload",
];

const SAMPLE_SCHEMA = {
  title: "Customer Feedback & Satisfaction",
  category: "Feedback",
  description: "Collect valuable customer ratings and product experience feedback.",
  questions: [
    {
      field_label: "Customer Full Name",
      field_type: "text",
      is_required: true,
      placeholder: "Jane Doe"
    },
    {
      field_label: "Email Address",
      field_type: "email",
      is_required: true,
      placeholder: "jane@example.com"
    },
    {
      field_label: "Overall Product Rating",
      field_type: "rating",
      is_required: true
    },
    {
      field_label: "Feedback Category",
      field_type: "select",
      is_required: true,
      options: ["User Experience", "Customer Support", "Pricing", "Features"]
    },
    {
      field_label: "Detailed Feedback & Suggestions",
      field_type: "textarea",
      is_required: false,
      placeholder: "Share your experience with us..."
    }
  ]
};

const SAMPLE_JSON_STRING = JSON.stringify(SAMPLE_SCHEMA, null, 2);

export default function ImportTemplateModal({ open, onClose, onTemplateImported }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0); // 0 = Custom/Formify JSON, 1 = Google Forms, 2 = MS Forms
  const [step, setStep] = useState(1); // 1 = Upload/Paste, 2 = Preview & Edit Schema
  const [jsonContent, setJsonContent] = useState("");
  const [validationError, setValidationError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Parsed Schema State
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Feedback");
  const [editDesc, setEditDesc] = useState("");
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Handle File Upload Drop (.json)
  const processFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setValidationError("Invalid file format. Please upload a valid .json schema file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target.result;
        const parsed = JSON.parse(raw);
        setJsonContent(JSON.stringify(parsed, null, 2));
        setValidationError(null);
        toast.success(`Loaded "${file.name}" successfully!`);
      } catch (err) {
        setJsonContent(event.target.result);
        setValidationError(`File uploaded, but JSON has syntax errors: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  // Format Code helper
  const handleFormatJson = () => {
    if (!jsonContent.trim()) return;
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
      setValidationError(null);
      toast.success("JSON formatted cleanly!");
    } catch (err) {
      setValidationError(`Cannot format invalid JSON: ${err.message}`);
    }
  };

  // Validate & Normalize Schema
  const handleValidateAndPreview = () => {
    if (!jsonContent.trim()) {
      setValidationError("JSON content cannot be empty. Please upload a file or paste schema code.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);

      // Check title / name
      const title = parsed.title || parsed.name || parsed.form_title || parsed.formTitle;
      if (!title) {
        setValidationError("Schema missing required property: 'title' or 'name'.");
        return;
      }

      // Check questions / fields / elements array
      const rawQuestions = parsed.questions || parsed.fields || parsed.elements || parsed.items;
      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        setValidationError("Schema missing questions array: 'questions' or 'fields' must be a non-empty array.");
        return;
      }

      // Normalize question items into Formify format
      const normalizedQuestions = rawQuestions.map((q, idx) => ({
        field_label: q.field_label || q.label || q.title || q.name || `Question ${idx + 1}`,
        field_type: (q.field_type || q.type || "text").toLowerCase(),
        is_required: Boolean(q.is_required || q.required),
        options: Array.isArray(q.options) ? q.options : Array.isArray(q.choices) ? q.choices : [],
        placeholder: q.placeholder || "",
        help_text: q.help_text || q.help || "",
      }));

      setEditTitle(title);
      setEditCategory(parsed.category || "Custom");
      setEditDesc(parsed.description || "Imported custom form schema");
      setQuestions(normalizedQuestions);
      setValidationError(null);
      setStep(2);
      toast.success("Schema validated successfully!");
    } catch (err) {
      setValidationError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        field_label: `New Question ${prev.length + 1}`,
        field_type: "text",
        is_required: true,
        options: ["Option 1", "Option 2"],
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Save as Custom Template
  const handleSaveAsTemplate = async () => {
    try {
      setSaving(true);
      await api.post("/templates/", {
        title: editTitle.trim(),
        category: editCategory,
        description: editDesc,
        template_schema: questions,
        is_public: false,
      });

      toast.success("Template imported successfully!");
      if (onTemplateImported) onTemplateImported();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Open in Form Builder
  const handleOpenInFormBuilder = async () => {
    try {
      setSaving(true);

      const tmplRes = await api.post("/templates/", {
        title: editTitle.trim(),
        category: editCategory,
        description: editDesc,
        template_schema: questions,
        is_public: false,
      });

      const useRes = await api.post("/templates/use", {
        template_id: tmplRes.data.id,
      });

      toast.success("Form created and opened in builder!");
      handleClose();
      if (onTemplateImported) onTemplateImported();
      navigate(`/create-form?id=${useRes.data.form_id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to open form in builder");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setJsonContent("");
    setValidationError(null);
    setIsDragging(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          p: 3,
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#FFFFFF",
        }}
      >
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
              border: "1px solid #C7D2FE",
            }}
          >
            <FileUploadRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              Import Form Template
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
              Upload a .json file or paste raw schema code to import form structure
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {step === 2 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setStep(1)}
              sx={{ textTransform: "none", fontWeight: 700, borderColor: "#E2E8F0" }}
            >
              Back to Code
            </Button>
          )}
          <IconButton size="small" onClick={handleClose} sx={{ color: "#94A3B8" }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs Bar */}
      <Box sx={{ borderBottom: 1, borderColor: "#E2E8F0", px: 3, bgcolor: "#FAFAFA" }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab
            label="Formify / Custom JSON"
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.85rem", py: 1.5 }}
          />
          <Tab
            label="Google Forms"
            disabled
            icon={<Chip label="COMING SOON" size="small" sx={{ fontSize: "0.55rem", height: 16, bgcolor: "#E2E8F0", color: "#64748B", fontWeight: 700 }} />}
            iconPosition="end"
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.85rem", py: 1.5 }}
          />
          <Tab
            label="Microsoft Forms"
            disabled
            icon={<Chip label="COMING SOON" size="small" sx={{ fontSize: "0.55rem", height: 16, bgcolor: "#E2E8F0", color: "#64748B", fontWeight: 700 }} />}
            iconPosition="end"
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.85rem", py: 1.5 }}
          />
        </Tabs>
      </Box>

      {/* Main Content Body */}
      <DialogContent sx={{ p: 3, bgcolor: "#FFFFFF" }}>
        {/* STEP 1: UPLOAD FILE & CODE EDITOR */}
        {step === 1 && (
          <Box display="flex" flexDirection="column" gap={2.5}>
            {validationError && (
              <Alert severity="error" onClose={() => setValidationError(null)} sx={{ borderRadius: 2 }}>
                {validationError}
              </Alert>
            )}

            {/* Drag & Drop File Upload Box */}
            <Paper
              elevation={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              component="label"
              sx={{
                p: 3,
                border: isDragging ? "2px dashed #4F46E5" : "2px dashed #CBD5E1",
                borderRadius: 3,
                bgcolor: isDragging ? "#EEF2FF" : "#F8FAFC",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                "&:hover": {
                  bgcolor: "#F1F5F9",
                  borderColor: "#6366F1",
                },
              }}
            >
              <input type="file" accept=".json" hidden onChange={handleFileInputChange} />
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "#EEF2FF",
                  color: "#4F46E5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileUploadRoundedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>
                Click to upload, or drag &amp; drop a <code>.json</code> schema file
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Supports Formify JSON, custom schemas, or standard form definitions
              </Typography>
            </Paper>

            {/* Code Editor Box Header */}
            <Box
              sx={{
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                overflow: "hidden",
                boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 2.5,
                  py: 1.2,
                  bgcolor: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <CodeRoundedIcon sx={{ fontSize: 18, color: "#4F46E5" }} />
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A" }}>
                    Paste Raw JSON Schema
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      setJsonContent(SAMPLE_JSON_STRING);
                      setValidationError(null);
                      toast.success("Loaded Sample Schema!");
                    }}
                    sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, color: "#4F46E5" }}
                  >
                    Load Sample Schema
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FormatIndentIncreaseRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={handleFormatJson}
                    sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}
                  >
                    Format Code
                  </Button>
                  <Button
                    size="small"
                    startIcon={<RestartAltRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      setJsonContent("");
                      setValidationError(null);
                    }}
                    sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}
                  >
                    Clear
                  </Button>
                </Stack>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={9}
                value={jsonContent}
                onChange={(e) => {
                  setJsonContent(e.target.value);
                  setValidationError(null);
                }}
                placeholder={`{\n  "title": "Customer Feedback",\n  "category": "Feedback",\n  "questions": [\n    { "field_label": "Full Name", "field_type": "text", "is_required": true }\n  ]\n}`}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    p: 2,
                    bgcolor: "#0F172A",
                    color: "#F8FAFC",
                    fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                    fontSize: "0.825rem",
                    lineHeight: 1.5,
                    "& textarea": {
                      color: "#F8FAFC",
                    },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* STEP 2: INTERACTIVE PREVIEW & EDIT SCHEMA */}
        {step === 2 && (
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Alert severity="success" icon={<CheckCircleRoundedIcon sx={{ fontSize: 20 }} />} sx={{ borderRadius: 2.5 }}>
              Schema parsed successfully! Review metadata and fields below before importing into your workspace.
            </Alert>

            <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid #E2E8F0" }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 1.5, color: "#64748B" }}>
                Template Metadata
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Template Title"
                    fullWidth
                    size="small"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Category"
                    fullWidth
                    size="small"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" fontWeight={800} sx={{ color: "#0F172A" }}>
                Form Questions ({questions.length})
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={handleAddQuestion}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                Add Field
              </Button>
            </Box>

            <Stack spacing={2} maxHeight={360} sx={{ overflowY: "auto", pr: 0.5 }}>
              {questions.map((q, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1.5} mb={1.5}>
                    <Chip label={`#${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: "#EEF2FF", color: "#4F46E5" }} />
                    <TextField
                      label="Field Label"
                      fullWidth
                      size="small"
                      value={q.field_label}
                      onChange={(e) => handleQuestionChange(idx, "field_label", e.target.value)}
                    />
                    <TextField
                      select
                      label="Input Type"
                      size="small"
                      sx={{ minWidth: 140 }}
                      value={q.field_type}
                      onChange={(e) => handleQuestionChange(idx, "field_type", e.target.value)}
                    >
                      {FIELD_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </TextField>
                    <Tooltip title="Delete Field">
                      <IconButton size="small" onClick={() => handleDeleteQuestion(idx)} sx={{ color: "#EF4444" }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={q.is_required}
                          onChange={(e) => handleQuestionChange(idx, "is_required", e.target.checked)}
                          size="small"
                          color="primary"
                        />
                      }
                      label={<Typography variant="caption" fontWeight={600} sx={{ color: "#475569" }}>Required Question</Typography>}
                    />

                    {["select", "radio", "checkbox"].includes(q.field_type) && q.options && q.options.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mr: 0.5 }}>
                          Choices:
                        </Typography>
                        {q.options.map((opt, optIdx) => (
                          <Chip key={optIdx} label={opt} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>

      {/* Modal Actions Footer */}
      <DialogActions sx={{ p: 2.5, px: 3, justifyContent: "space-between", bgcolor: "#FAFAFA", borderTop: "1px solid #E2E8F0" }}>
        {step === 1 && (
          <>
            <Button variant="outlined" onClick={handleClose} sx={{ fontWeight: 600, color: "#64748B", borderColor: "#CBD5E1" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleValidateAndPreview}
              startIcon={<CodeRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{ bgcolor: "#4F46E5", fontWeight: 700, px: 3, "&:hover": { bgcolor: "#4338CA" } }}
            >
              Validate &amp; Preview
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Button variant="outlined" onClick={() => setStep(1)} sx={{ fontWeight: 600, borderColor: "#CBD5E1" }}>
              Back to JSON
            </Button>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                disabled={saving}
                onClick={handleSaveAsTemplate}
                startIcon={<SaveRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{ fontWeight: 700, borderColor: "#CBD5E1", color: "#0F172A" }}
              >
                Save as Template
              </Button>
              <Button
                variant="contained"
                disabled={saving}
                onClick={handleOpenInFormBuilder}
                startIcon={<BuildRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{ bgcolor: "#4F46E5", fontWeight: 700, px: 2.5, "&:hover": { bgcolor: "#4338CA" } }}
              >
                Open in Form Builder
              </Button>
            </Stack>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
