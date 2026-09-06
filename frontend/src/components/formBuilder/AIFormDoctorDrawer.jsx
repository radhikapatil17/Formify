import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Stack,
  Divider,
  LinearProgress,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";

import api from "../../api/api";

export default function AIFormDoctorDrawer({
  open,
  onClose,
  form,
  fields = [],
  conditionalRules = [],
  onApplyFix,
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [appliedFixes, setAppliedFixes] = useState({});

  const runDoctorCheck = useCallback(async () => {
    if (!open) return;
    try {
      setLoading(true);
      const payload = {
        form_title: form?.title || "Untitled Form",
        description: form?.description || "",
        category: form?.category || "General",
        fields: fields.map((f) => ({
          id: f.id,
          label: f.label || "",
          field_type: f.field_type || f.type || "text",
          placeholder: f.placeholder || "",
          help_text: f.help_text || "",
          is_required: Boolean(f.is_required),
          is_hidden: Boolean(f.is_hidden),
          min_length: f.min_length,
          max_length: f.max_length,
          regex_pattern: f.regex_pattern,
          validation_message: f.validation_message,
          options: f.options || [],
        })),
        conditional_rules: conditionalRules || [],
      };

      const res = await api.post("/ai/doctor/analyze", payload);
      setReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to run AI Form Doctor audit", { id: "doc-err" });
    } finally {
      setLoading(false);
    }
  }, [open, form, fields, conditionalRules]);

  useEffect(() => {
    runDoctorCheck();
  }, [runDoctorCheck]);

  const handleFixClick = (issue) => {
    if (!issue.fix_action || !onApplyFix) return;
    try {
      onApplyFix(issue.fix_action);
      setAppliedFixes((prev) => ({ ...prev, [issue.id]: true }));
      toast.success(`Applied AI fix for "${issue.field_label}"!`, {
        id: `fix-${issue.id}`,
        icon: "✨",
      });
    } catch (err) {
      console.error("Error applying AI fix:", err);
      toast.error("Could not apply fix automatically.");
    }
  };

  const issuesList = report?.issues || [];
  const filteredIssues = issuesList.filter((issue) => {
    if (severityFilter === "all") return true;
    return issue.severity === severityFilter;
  });

  const criticalCount = issuesList.filter((i) => i.severity === "critical").length;
  const warningCount = issuesList.filter((i) => i.severity === "warning").length;
  const suggestionCount = issuesList.filter((i) => i.severity === "suggestion").length;

  const healthScore = report?.health_score ?? 100;
  const scoreColor =
    healthScore >= 80 ? "#10B981" : healthScore >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          bgcolor: "#F8FAFC",
          maxHeight: "75vh",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          m: 2,
        },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. DRAWER HEADER
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 1.2,
          px: 1.8,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)",
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.1, fontSize: "0.85rem" }}>
              AI Form Doctor
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", fontSize: "0.68rem" }}>
              Schema audit &amp; smart fix recommendations
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 13 }} />}
            onClick={runDoctorCheck}
            disabled={loading}
            sx={{
              borderRadius: 1.5,
              borderColor: "#CBD5E1",
              color: "#334155",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.72rem",
              px: 1,
              py: 0.2,
              minWidth: 0,
              "&:hover": { borderColor: "#94A3B8", bgcolor: "#F1F5F9" },
            }}
          >
            Re-check
          </Button>

          <IconButton onClick={onClose} size="small" sx={{ color: "#64748B", p: 0.4 }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. DRAWER BODY
         ───────────────────────────────────────────────────────────── */}
      <Box sx={{ p: 1.5, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.2 }}>
        {/* Loading State */}
        {loading && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2.5,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              my: "auto",
            }}
          >
            <CircularProgress size={28} thickness={4} sx={{ color: "#4F46E5" }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.85rem" }}>
                Analyzing Form Structure...
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: "block", color: "#64748B", fontSize: "0.7rem" }}>
                Inspecting labels, validation rules &amp; flow logic.
              </Typography>
            </Box>
          </Paper>
        )}

        {!loading && report && (
          <>
            {/* Health Score Overview Card */}
            <Paper
              elevation={0}
              sx={{
                p: 1.8,
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px -2px rgba(15, 23, 42, 0.03)",
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#64748B", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                  Form Health Score
                </Typography>
                <Chip
                  label={`${healthScore} / 100`}
                  size="small"
                  sx={{
                    bgcolor: scoreColor,
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    height: 20,
                    px: 0.5,
                  }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={healthScore}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "#E2E8F0",
                  mb: 1.2,
                  "& .MuiLinearProgress-bar": { bgcolor: scoreColor, borderRadius: 3 },
                }}
              />

              <Typography variant="caption" sx={{ color: "#334155", fontWeight: 600, fontSize: "0.76rem", lineHeight: 1.35, display: "block" }}>
                {report.summary}
              </Typography>
            </Paper>

            {/* Severity Filter Tabs */}
            <Box display="flex" gap={0.6} flexWrap="wrap">
              <Chip
                label={`All (${issuesList.length})`}
                size="small"
                onClick={() => setSeverityFilter("all")}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: severityFilter === "all" ? "#4F46E5" : "#FFFFFF",
                  color: severityFilter === "all" ? "#FFFFFF" : "#64748B",
                  border: "1px solid #E2E8F0",
                }}
              />
              <Chip
                icon={<ErrorOutlineRoundedIcon sx={{ fontSize: "13px !important", color: severityFilter === "critical" ? "#FFFFFF" : "#EF4444" }} />}
                label={`Critical (${criticalCount})`}
                size="small"
                onClick={() => setSeverityFilter("critical")}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: severityFilter === "critical" ? "#EF4444" : "#FEF2F2",
                  color: severityFilter === "critical" ? "#FFFFFF" : "#991B1B",
                  border: "1px solid #FEE2E2",
                }}
              />
              <Chip
                icon={<WarningAmberRoundedIcon sx={{ fontSize: "13px !important", color: severityFilter === "warning" ? "#FFFFFF" : "#F59E0B" }} />}
                label={`Warnings (${warningCount})`}
                size="small"
                onClick={() => setSeverityFilter("warning")}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: severityFilter === "warning" ? "#F59E0B" : "#FFFBEB",
                  color: severityFilter === "warning" ? "#FFFFFF" : "#92400E",
                  border: "1px solid #FEF3C7",
                }}
              />
              <Chip
                icon={<LightbulbRoundedIcon sx={{ fontSize: "13px !important", color: severityFilter === "suggestion" ? "#FFFFFF" : "#6366F1" }} />}
                label={`Suggestions (${suggestionCount})`}
                size="small"
                onClick={() => setSeverityFilter("suggestion")}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 24,
                  bgcolor: severityFilter === "suggestion" ? "#6366F1" : "#EEF2FF",
                  color: severityFilter === "suggestion" ? "#FFFFFF" : "#4338CA",
                  border: "1px solid #C7D2FE",
                }}
              />
            </Box>

            {/* Zero Issues State */}
            {filteredIssues.length === 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    bgcolor: "#ECFDF5",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.88rem" }}>
                  No Issues Found
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.73rem" }}>
                  Your form schema looks great for the selected filter!
                </Typography>
              </Paper>
            )}

            {/* Issues List */}
            {filteredIssues.map((issue) => {
              const isCritical = issue.severity === "critical";
              const isWarning = issue.severity === "warning";

              const badgeColor = isCritical ? "#EF4444" : isWarning ? "#F59E0B" : "#6366F1";
              const bgBoxColor = isCritical ? "#FEF2F2" : isWarning ? "#FFFBEB" : "#FFFFFF";
              const borderColor = isCritical ? "#FEE2E2" : isWarning ? "#FDE68A" : "#E2E8F0";

              const isFixed = appliedFixes[issue.id];

              return (
                <Paper
                  key={issue.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: bgBoxColor,
                    border: `1px solid ${borderColor}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    boxShadow: "0 2px 6px -1px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  {/* Issue Header Bar */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
                    <Box display="flex" alignItems="center" gap={0.8}>
                      <QuizRoundedIcon sx={{ fontSize: 15, color: badgeColor }} />
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.8rem" }}>
                        {issue.field_label || "Form Question"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={issue.category || "General"}
                        size="small"
                        sx={{ fontSize: "0.65rem", fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5", height: 18 }}
                      />
                      <Chip
                        label={issue.severity.toUpperCase()}
                        size="small"
                        sx={{
                          fontSize: "0.63rem",
                          fontWeight: 800,
                          bgcolor: badgeColor,
                          color: "#FFFFFF",
                          height: 18,
                        }}
                      />
                    </Stack>
                  </Box>

                  <Divider sx={{ borderColor: "rgba(0,0,0,0.06)" }} />

                  {/* Problem Description */}
                  <Box>
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#64748B", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", display: "block", mb: 0.2 }}>
                      Problem
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#1E293B", fontWeight: 600, fontSize: "0.78rem", lineHeight: 1.4 }}>
                      {issue.problem}
                    </Typography>
                  </Box>

                  {/* Recommendation */}
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#4F46E5", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.04em", display: "block", mb: 0.2 }}>
                      Recommended Fix
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, fontSize: "0.76rem", lineHeight: 1.4 }}>
                      {issue.recommendation}
                    </Typography>
                  </Box>

                  {/* Fix with AI Action Button */}
                  {issue.can_auto_fix && issue.fix_action && (
                    <Box display="flex" justifyContent="flex-end" mt={0.2}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isFixed}
                        startIcon={isFixed ? <CheckCircleRoundedIcon sx={{ fontSize: 13 }} /> : <BuildRoundedIcon sx={{ fontSize: 13 }} />}
                        onClick={() => handleFixClick(issue)}
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: isFixed ? "#10B981" : "#4F46E5",
                          color: "#FFFFFF",
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          px: 1.5,
                          py: 0.4,
                          boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)",
                          "&:hover": { bgcolor: isFixed ? "#059669" : "#4338CA" },
                        }}
                      >
                        {isFixed ? "Fix Applied ✓" : "Fix with AI"}
                      </Button>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </>
        )}
      </Box>
    </Dialog>
  );
}
