import { useState, useEffect } from "react";
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
  Chip,
  Paper,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";

import api from "../../api/api";

const EXAMPLE_PROMPTS = [
  "Create Job Application Form",
  "Create Feedback Form",
  "Create College Admission Form",
  "Create Survey",
  "Create Registration Form",
];

const FIELD_TYPES = [
  "text",
  "email",
  "select",
  "radio",
  "checkbox",
  "date",
  "rating",
  "file_upload",
  "textarea",
  "phone",
  "number",
];

export default function AiGeneratorDialog({ open, onClose, onTemplateSaved }) {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [step, setStep] = useState(1); // 1 = Input, 2 = Generating, 3 = Preview/Edit
  const [generatedSchema, setGeneratedSchema] = useState(null);
  const [loading, setLoading] = useState(false);

  // Editable schema states
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [questions, setQuestions] = useState([]);

  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error", event);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied. Please allow access in browser settings.");
        } else if (event.error === "no-speech") {
          toast.error("No speech detected. Please try again.");
        }
      };

      rec.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setPrompt((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${finalTranscript}` : finalTranscript;
          });
        }
      };

      setRecognition(rec);
    }
  }, []);

  // Stop listening when dialog is closed
  useEffect(() => {
    if (!open && isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [open, isListening, recognition]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error("Voice recognition is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleGenerate = async (promptOverride) => {
    const textToUse = promptOverride || prompt;
    if (!textToUse.trim()) {
      toast.error("Please enter a form description prompt");
      return;
    }

    try {
      setStep(2);
      setLoading(true);

      const res = await api.post("/ai/generate-template", {
        prompt: textToUse.trim(),
      });

      const schema = res.data;
      setGeneratedSchema(schema);
      setEditTitle(schema.title || "AI Generated Form");
      setEditDesc(schema.description || "Synthesized form schema");
      setQuestions(schema.questions || []);
      setStep(3);
      toast.success("AI Form Schema generated!");
    } catch (err) {
      console.error(err);
      toast.error("AI Generation failed. Please try again.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBuildAndOpen = async (promptOverride) => {
    const textToUse = promptOverride || prompt;
    if (!textToUse.trim()) {
      toast.error("Please enter a form description prompt");
      return;
    }

    try {
      setStep(2);
      setLoading(true);

      const res = await api.post("/ai/generate-template", {
        prompt: textToUse.trim(),
      });

      const schema = res.data;
      const title = schema.title || "AI Generated Form";
      const desc = schema.description || "Synthesized form schema";
      const qList = schema.questions || [];

      const tmplRes = await api.post("/templates/", {
        title: title.trim(),
        category: schema.category || "Feedback",
        description: desc,
        template_schema: qList,
        is_public: false,
      });

      const useRes = await api.post("/templates/use", {
        template_id: tmplRes.data.id,
      });

      toast.success("AI Form built and opened in builder!");
      onClose();
      if (onTemplateSaved) onTemplateSaved();
      navigate(`/create-form?id=${useRes.data.form_id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "AI Form generation failed. Please try again.");
      setStep(1);
    } finally {
      setLoading(false);
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

  // Save as Template (DB POST)
  const handleSaveAsTemplate = async () => {
    try {
      setLoading(true);
      await api.post("/templates/", {
        title: editTitle.trim(),
        category: generatedSchema?.category || "Feedback",
        description: editDesc,
        template_schema: questions,
        is_public: false,
      });

      toast.success("AI Template created successfully!");
      if (onTemplateSaved) onTemplateSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  // Open in Form Builder (Creates template and instantiates form in 1 transaction)
  const handleOpenInFormBuilder = async () => {
    try {
      setLoading(true);

      // 1. Create custom template
      const tmplRes = await api.post("/templates/", {
        title: editTitle.trim(),
        category: generatedSchema?.category || "Feedback",
        description: editDesc,
        template_schema: questions,
        is_public: false,
      });

      // 2. Instantiate form from template in server transaction
      const useRes = await api.post("/templates/use", {
        template_id: tmplRes.data.id,
      });

      toast.success("Form created and opened in builder!");
      onClose();
      if (onTemplateSaved) onTemplateSaved();
      navigate(`/create-form?id=${useRes.data.form_id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to open form in builder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeRoundedIcon sx={{ color: "#8B5CF6", fontSize: 24 }} />
        AI Form &amp; Template Generator
      </DialogTitle>

      <DialogContent dividers>
        {/* STEP 1: PROMPT INPUT & SUGGESTIONS */}
        {step === 1 && (
          <Box display="flex" flexDirection="column" gap={3} py={1}>
            <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B" }}>
              Describe the form schema you want to generate. Formify AI will automatically create sections, question labels, input types, required toggles, choice options, and validation rules.
            </Typography>

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8, color: "#64748B" }}>
                Quick Prompt Suggestions (Click to autofill):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {EXAMPLE_PROMPTS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    onClick={() => setPrompt(p)}
                    clickable
                    sx={{
                      bgcolor: prompt === p ? "#EDE9FE" : "#F8FAFC",
                      color: prompt === p ? "#6D28D9" : "#475569",
                      border: prompt === p ? "1px solid #C4B5FD" : "1px solid #E2E8F0",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      "&:hover": { bgcolor: "#F5F3FF", color: "#6D28D9" },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", color: "#64748B" }}>
                  Your Custom AI Prompt:
                </Typography>
                
                {/* Voice Input Button & Status Indicator */}
                <Box display="flex" alignItems="center" gap={1}>
                  {isListening && (
                    <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <span className="listening-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#EF4444", display: "inline-block" }}></span>
                      Listening... Speak now
                    </Typography>
                  )}
                  <Tooltip title={!recognition ? "Voice recognition not supported in this browser" : isListening ? "Stop Voice Input" : "Start Voice Input"}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!recognition}
                        onClick={toggleListening}
                        sx={{
                          border: "1px solid",
                          borderColor: isListening ? "#EF4444" : "#E2E8F0",
                          bgcolor: isListening ? "#EF4444" : "#F8FAFC",
                          color: isListening ? "#FFFFFF" : "#64748B",
                          p: 0.75,
                          transition: "all 0.2s ease",
                          animation: isListening ? "pulse-mic 1.5s infinite" : "none",
                          "&:hover": {
                            bgcolor: isListening ? "#DC2626" : "#EEF2FF",
                            borderColor: isListening ? "#DC2626" : "#A5B4FC",
                            color: isListening ? "#FFFFFF" : "#4F46E5",
                          },
                          "@keyframes pulse-mic": {
                            "0%": {
                              boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)",
                            },
                            "70%": {
                              boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)",
                            },
                            "100%": {
                              boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)",
                            },
                          }
                        }}
                      >
                        {isListening ? <MicOffRoundedIcon sx={{ fontSize: 16 }} /> : <MicRoundedIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a College Admission Form with high school transcript upload, major selection dropdown, personal statement essay, and date of birth fields..."
              />
            </Box>

          </Box>
        )}

        {/* STEP 2: GENERATING SPINNER */}
        {step === 2 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
            <CircularProgress size={40} sx={{ color: "#8B5CF6" }} />
            <Typography variant="body1" fontWeight={800} sx={{ color: "#0F172A" }}>
              Formify AI is synthesizing your form schema...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generating fields, input validation rules, and choice options
            </Typography>
          </Box>
        )}

        {/* STEP 3: PREVIEW & EDIT SCHEMA */}
        {step === 3 && (
          <Box display="flex" flexDirection="column" gap={3} py={1}>
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#FAFAFA", borderRadius: 2.5, border: "1px solid #E2E8F0" }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 1, color: "#64748B" }}>
                AI Generated Schema Metadata:
              </Typography>
              <Stack spacing={2}>
                <TextField label="Form Title" fullWidth size="small" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <TextField label="Description" fullWidth size="small" multiline rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </Stack>
            </Paper>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body1" fontWeight={800} sx={{ color: "#0F172A" }}>
                Generated Questions ({questions.length})
              </Typography>
              <Button size="small" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={handleAddQuestion} sx={{ textTransform: "none", fontWeight: 700 }}>
                Add Field
              </Button>
            </Box>

            <Stack spacing={2} maxHeight={360} sx={{ overflowY: "auto", pr: 1 }}>
              {questions.map((q, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1.5} mb={1.5}>
                    <TextField
                      label={`Field #${idx + 1} Label`}
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
                    <IconButton size="small" onClick={() => handleDeleteQuestion(idx)} sx={{ color: "#EF4444" }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={q.is_required}
                        onChange={(e) => handleQuestionChange(idx, "is_required", e.target.checked)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography variant="caption" fontWeight={600}>Required Field</Typography>}
                  />

                  {["select", "radio", "checkbox"].includes(q.field_type) && q.options && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Options: {q.options.join(" • ")}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: "space-between" }}>
        {step === 1 && (
          <>
            <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 600 }}>Cancel</Button>
            <Box display="flex" gap={1.5}>
              <Button
                variant="outlined"
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />}
                sx={{
                  fontWeight: 700,
                  borderColor: "#DDD6FE",
                  color: "#6D28D9",
                  "&:hover": { bgcolor: "#F5F3FF", borderColor: "#C4B5FD" },
                }}
              >
                Preview &amp; Customize
              </Button>
              <Button
                variant="contained"
                onClick={() => handleQuickBuildAndOpen()}
                disabled={loading || !prompt.trim()}
                startIcon={<BuildRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: "#4F46E5",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#4338CA" },
                }}
              >
                Quick Build &amp; Open
              </Button>
            </Box>
          </>
        )}

        {step === 3 && (
          <>
            <Button
              variant="outlined"
              onClick={() => setStep(1)}
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
            >
              Regenerate
            </Button>

            <Box display="flex" gap={1.5}>
              <Button
                variant="outlined"
                disabled={loading}
                onClick={handleSaveAsTemplate}
                startIcon={<SaveRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{ fontWeight: 700, borderColor: "#E2E8F0" }}
              >
                Save as Template
              </Button>
              <Button
                variant="contained"
                disabled={loading}
                onClick={handleOpenInFormBuilder}
                startIcon={<BuildRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{ bgcolor: "#4F46E5", fontWeight: 700 }}
              >
                Open in Form Builder
              </Button>
            </Box>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
