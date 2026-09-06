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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import api from "../../api/api";

export default function AIFormSimulatorModal({
  open,
  onClose,
  form,
  fields = [],
  conditionalRules = [],
  onApplyFix,
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [appliedFixes, setAppliedFixes] = useState({});

  const runSimulation = useCallback(async () => {
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

      const res = await api.post("/ai/simulator/run", payload);
      setReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to run AI Form Simulator test", { id: "sim-err" });
    } finally {
      setLoading(false);
    }
  }, [open, form, fields, conditionalRules]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleFixClick = (issue) => {
    if (!issue.fix_action || !onApplyFix) return;
    try {
      onApplyFix(issue.fix_action);
      setAppliedFixes((prev) => ({ ...prev, [issue.id]: true }));
      toast.success(`Applied AI fix for "${issue.field_label}"!`, {
        id: `sim-fix-${issue.id}`,
        icon: "✨",
      });
    } catch (err) {
      console.error("Error applying AI fix:", err);
      toast.error("Could not apply fix automatically.");
    }
  };

  const overallStatus = report?.overall_status || "passed";
  const statusColor =
    overallStatus === "passed" ? "#10B981" : overallStatus === "warning" ? "#F59E0B" : "#EF4444";

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
          1. MODAL HEADER
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
              background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 2px 6px rgba(14, 165, 233, 0.2)",
            }}
          >
            <ScienceRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.1, fontSize: "0.85rem" }}>
              AI Form Simulator
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", fontSize: "0.68rem" }}>
              End-to-end respondent flow &amp; logic verification
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 13 }} />}
            onClick={runSimulation}
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
              "&:hover": { borderColor: "#0EA5E9", bgcolor: "#F0F9FF", color: "#0284C7" },
            }}
          >
            Run Simulation Again
          </Button>

          <IconButton onClick={onClose} size="small" sx={{ color: "#64748B", p: 0.4 }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. MODAL BODY
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
              my: 3,
            }}
          >
            <CircularProgress size={28} thickness={4} sx={{ color: "#0EA5E9" }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.85rem" }}>
                Simulating User Flows...
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: "block", color: "#64748B", fontSize: "0.7rem" }}>
                Testing form inputs, validations, required flags, and logic branches.
              </Typography>
            </Box>
          </Paper>
        )}

        {!loading && report && (
          <>
            {/* Overview Summary Card */}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#64748B", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                  Simulation Summary
                </Typography>
                <Chip
                  label={overallStatus.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: statusColor,
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    height: 20,
                    px: 0.5,
                  }}
                />
              </Box>

              {/* Stat Badges */}
              <Stack direction="row" spacing={0.8} mb={1}>
                <Chip
                  label={`${report.passed_count || 0} Passed`}
                  size="small"
                  icon={<CheckCircleRoundedIcon sx={{ fontSize: "12px !important", color: "#FFFFFF !important" }} />}
                  sx={{ bgcolor: "#10B981", color: "#FFFFFF", fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
                <Chip
                  label={`${report.warning_count || 0} Warnings`}
                  size="small"
                  icon={<WarningAmberRoundedIcon sx={{ fontSize: "12px !important", color: "#FFFFFF !important" }} />}
                  sx={{ bgcolor: "#F59E0B", color: "#FFFFFF", fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
                <Chip
                  label={`${report.failed_count || 0} Failed`}
                  size="small"
                  icon={<ErrorOutlineRoundedIcon sx={{ fontSize: "12px !important", color: "#FFFFFF !important" }} />}
                  sx={{ bgcolor: "#EF4444", color: "#FFFFFF", fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
              </Stack>

              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, fontSize: "0.76rem", lineHeight: 1.35, display: "block" }}>
                {report.summary}
              </Typography>
            </Paper>

            {/* Scenarios Accordion List */}
            <Typography variant="caption" fontWeight={800} sx={{ color: "#64748B", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em", mt: 0.3 }}>
              Tested Scenarios ({report.scenarios?.length || 0})
            </Typography>

            {report.scenarios?.map((scen, idx) => {
              const isPass = scen.status === "passed";
              const isWarn = scen.status === "warning";
              const scenBadgeColor = isPass ? "#10B981" : isWarn ? "#F59E0B" : "#EF4444";
              const scenBg = isPass ? "#F0FDF4" : isWarn ? "#FFFBEB" : "#FEF2F2";

              const validPathSteps = (scen.path_taken || []).filter(
                (stepItem) => Boolean(stepItem && (stepItem.field_label || stepItem.user_input))
              );

              return (
                <Accordion
                  key={scen.id || idx}
                  elevation={0}
                  defaultExpanded={idx === 0}
                  sx={{
                    borderRadius: "10px !important",
                    border: "1px solid #E2E8F0",
                    bgcolor: "#FFFFFF",
                    "&:before": { display: "none" },
                    overflow: "hidden",
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />} sx={{ bgcolor: "#FFFFFF", px: 1.5, py: 0.3, minHeight: 40 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={0.5} flexWrap="wrap" gap={0.5}>
                      <Box display="flex" alignItems="center" gap={0.8}>
                        <AltRouteRoundedIcon sx={{ fontSize: 15, color: "#0EA5E9" }} />
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.8rem" }}>
                          {scen.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={scen.status.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: scenBg,
                          color: scenBadgeColor,
                          fontWeight: 800,
                          fontSize: "0.63rem",
                          height: 18,
                          border: `1px solid ${scenBadgeColor}`,
                        }}
                      />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 1.5, pt: 0.8, bgcolor: "#FAFAFA", borderTop: "1px solid #F1F5F9" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontSize: "0.72rem" }}>
                      {scen.description}
                    </Typography>

                    {/* Step-by-Step Path Log */}
                    {validPathSteps.length > 0 && (
                      <>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", textTransform: "uppercase", fontSize: "0.63rem", letterSpacing: "0.04em", display: "block", mb: 0.6 }}>
                          Path Taken &amp; Question Evaluation
                        </Typography>

                        <Stack spacing={0.6} mb={1.5}>
                          {validPathSteps.map((stepItem, sIdx) => (
                            <Paper
                              key={sIdx}
                              elevation={0}
                              sx={{
                                p: 1,
                                px: 1.2,
                                borderRadius: 1.5,
                                bgcolor: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.8}>
                                <Typography variant="caption" fontWeight={800} sx={{ color: "#0EA5E9", fontSize: "0.7rem", minWidth: 16 }}>
                                  #{stepItem.step || sIdx + 1}
                                </Typography>
                                <Box>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.76rem" }}>
                                    {stepItem.field_label || "Question"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.68rem", display: "block" }}>
                                    Answer: <span style={{ fontWeight: 600, color: "#334155" }}>"{stepItem.user_input || "Sample Answer"}"</span>
                                  </Typography>
                                </Box>
                              </Box>

                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Chip
                                  icon={stepItem.is_visible ? <VisibilityRoundedIcon sx={{ fontSize: "11px !important" }} /> : <VisibilityOffRoundedIcon sx={{ fontSize: "11px !important" }} />}
                                  label={stepItem.is_visible ? "Visible" : "Hidden"}
                                  size="small"
                                  sx={{
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    height: 18,
                                    bgcolor: stepItem.is_visible ? "#EEF2FF" : "#F1F5F9",
                                    color: stepItem.is_visible ? "#4F46E5" : "#64748B",
                                  }}
                                />
                                <Chip
                                  label={stepItem.is_valid ? "Valid ✓" : "Invalid ❌"}
                                  size="small"
                                  sx={{
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    height: 18,
                                    bgcolor: stepItem.is_valid ? "#ECFDF5" : "#FEF2F2",
                                    color: stepItem.is_valid ? "#10B981" : "#EF4444",
                                  }}
                                />
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </>
                    )}

                    {/* Scenario Issues */}
                    {scen.issues && scen.issues.length > 0 && (
                      <Box display="flex" flexDirection="column" gap={0.8}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#DC2626", textTransform: "uppercase", fontSize: "0.63rem", letterSpacing: "0.04em" }}>
                          Detected Issues ({scen.issues.length})
                        </Typography>

                        {scen.issues.map((iss, iIdx) => {
                          const isFixed = appliedFixes[iss.id];
                          return (
                            <Paper
                              key={iss.id || iIdx}
                              elevation={0}
                              sx={{
                                p: 1,
                                px: 1.2,
                                borderRadius: 1.5,
                                bgcolor: "#FEF2F2",
                                border: "1px solid #FEE2E2",
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.4,
                              }}
                            >
                              <Typography variant="caption" fontWeight={800} sx={{ color: "#991B1B", fontSize: "0.73rem" }}>
                                🚨 {iss.field_label}: {iss.problem}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#7F1D1D", fontSize: "0.7rem" }}>
                                💡 Recommendation: {iss.recommendation}
                              </Typography>

                              {iss.can_auto_fix && iss.fix_action && (
                                <Box display="flex" justifyContent="flex-end" mt={0.2}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    disabled={isFixed}
                                    startIcon={isFixed ? <CheckCircleRoundedIcon sx={{ fontSize: 13 }} /> : <BuildRoundedIcon sx={{ fontSize: 13 }} />}
                                    onClick={() => handleFixClick(iss)}
                                    sx={{
                                      borderRadius: 1.5,
                                      bgcolor: isFixed ? "#10B981" : "#0EA5E9",
                                      color: "#FFFFFF",
                                      textTransform: "none",
                                      fontWeight: 700,
                                      fontSize: "0.68rem",
                                      px: 1.2,
                                      py: 0.3,
                                      boxShadow: "0 2px 6px rgba(14, 165, 233, 0.2)",
                                      "&:hover": { bgcolor: isFixed ? "#059669" : "#0284C7" },
                                    }}
                                  >
                                    {isFixed ? "Fix Applied ✓" : "Fix with AI"}
                                  </Button>
                                </Box>
                              )}
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}
      </Box>
    </Dialog>
  );
}
