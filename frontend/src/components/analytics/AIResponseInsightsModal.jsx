import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Stack,
  Divider,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import SentimentNeutralRoundedIcon from "@mui/icons-material/SentimentNeutralRounded";
import SentimentDissatisfiedRoundedIcon from "@mui/icons-material/SentimentDissatisfiedRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";

import api from "../../api/api";

export default function AIResponseInsightsModal({ open, onClose, formId, formTitle }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!open) return;
    try {
      setLoading(true);
      const res = await api.post("/analytics/ai-insights/generate", {
        form_id: formId ? Number(formId) : null,
        date_range: "all",
      });
      setInsights(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI Insights", { id: "ai-insights-err" });
    } finally {
      setLoading(false);
    }
  }, [open, formId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Copy report markdown to clipboard
  const handleCopyReport = () => {
    if (!insights || !insights.has_responses) return;
    try {
      let reportText = `# ✨ AI Response Insights Report: ${insights.form_title || formTitle || "Form"}\n`;
      reportText += `Total Responses Analyzed: ${insights.total_responses}\n\n`;
      reportText += `## 📝 Overall Summary\n${insights.overall_summary}\n\n`;

      if (insights.key_findings?.length) {
        reportText += `## 🔍 Key Findings\n`;
        insights.key_findings.forEach((kf) => {
          reportText += `- ${kf}\n`;
        });
        reportText += `\n`;
      }

      if (insights.sentiment_analysis) {
        const sa = insights.sentiment_analysis;
        reportText += `## 😊 Sentiment Breakdown\n`;
        reportText += `- Overall Sentiment: ${sa.overall_sentiment}\n`;
        reportText += `- Positive: ${sa.positive_pct}%\n`;
        reportText += `- Neutral: ${sa.neutral_pct}%\n`;
        reportText += `- Negative: ${sa.negative_pct}%\n\n`;
      }

      if (insights.most_common_answers?.length) {
        reportText += `## 📊 Most Common Answers\n`;
        insights.most_common_answers.forEach((mca) => {
          reportText += `- **${mca.question}**: ${mca.answer} (${mca.percentage})\n`;
        });
        reportText += `\n`;
      }

      if (insights.frequently_mentioned_topics?.length) {
        reportText += `## 🏷️ Frequently Mentioned Topics\n`;
        insights.frequently_mentioned_topics.forEach((t) => {
          reportText += `- ${t.topic} (Count: ${t.count})\n`;
        });
        reportText += `\n`;
      }

      if (insights.unusual_or_important_responses?.length) {
        reportText += `## ⚠️ Notable / Outlier Responses\n`;
        insights.unusual_or_important_responses.forEach((ur) => {
          reportText += `- ${ur}\n`;
        });
        reportText += `\n`;
      }

      if (insights.actionable_insights?.length) {
        reportText += `## 💡 Actionable Recommendations\n`;
        insights.actionable_insights.forEach((ai) => {
          reportText += `- ${ai}\n`;
        });
      }

      navigator.clipboard.writeText(reportText);
      toast.success("AI Insights report copied to clipboard!", { id: "copy-insights-success" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy report", { id: "copy-insights-err" });
    }
  };

  const hasResponses = insights?.has_responses === true;
  const sentiment = insights?.sentiment_analysis;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          maxHeight: "90vh",
          bgcolor: "#F8FAFC",
        },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. MODAL HEADER
         ───────────────────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          p: 2.5,
          px: 3,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              AI Response Insights
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
              Deep AI analysis of submitted form responses &amp; sentiment
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {hasResponses && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={fetchInsights}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  borderColor: "#CBD5E1",
                  color: "#334155",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  "&:hover": { borderColor: "#94A3B8", bgcolor: "#F1F5F9" },
                }}
              >
                Regenerate
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={handleCopyReport}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  bgcolor: "#4F46E5",
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                  "&:hover": { bgcolor: "#4338CA" },
                }}
              >
                Copy Report
              </Button>
            </>
          )}

          <IconButton onClick={onClose} size="small" sx={{ color: "#64748B" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* ─────────────────────────────────────────────────────────────
          2. MODAL BODY
         ───────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Loading State */}
        {loading && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress size={56} thickness={4} sx={{ color: "#4F46E5" }} />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AutoAwesomeRoundedIcon sx={{ fontSize: 24, color: "#4F46E5" }} />
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A" }}>
                Generating AI Insights...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Analyzing submission patterns, extracting text sentiment, and identifying trends.
              </Typography>
            </Box>
          </Paper>
        )}

        {/* No Responses / Empty State */}
        {!loading && !hasResponses && (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InboxRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box sx={{ maxWidth: 420 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A" }}>
                No Responses Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, color: "#64748B" }}>
                {insights?.message || "This form has not received any submissions yet. Share your form link to collect responses and unlock AI Insights!"}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Full Insights Dashboard */}
        {!loading && hasResponses && insights && (
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Form Title & Meta Badge */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#0F172A" }}>
                Form: {insights.form_title || formTitle || "Selected Form"}
              </Typography>
              <Chip
                label={`${insights.total_responses} Submissions Analyzed`}
                size="small"
                sx={{
                  bgcolor: "#EEF2FF",
                  color: "#4F46E5",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderRadius: 1.5,
                }}
              />
            </Box>

            {/* 1. Executive Summary Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                color: "#FFFFFF",
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.25)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", opacity: 0.9 }}>
                  Executive Summary
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.6, fontSize: "0.98rem" }}>
                {insights.overall_summary}
              </Typography>
            </Paper>

            {/* 2. Key Findings & Patterns */}
            {insights.key_findings?.length > 0 && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 20, color: "#10B981" }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                    Key Findings &amp; Patterns
                  </Typography>
                </Box>
                <Grid container spacing={1.5}>
                  {insights.key_findings.map((finding, idx) => (
                    <Grid item xs={12} key={idx}>
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        gap={1.5}
                        sx={{
                          p: 1.5,
                          px: 2,
                          borderRadius: 2,
                          bgcolor: "#F8FAFC",
                          border: "1px solid #F1F5F9",
                        }}
                      >
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            bgcolor: "#EEF2FF",
                            color: "#4F46E5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            flexShrink: 0,
                            mt: 0.2,
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600, lineHeight: 1.5 }}>
                          {finding}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* 3. Sentiment Analysis */}
            {sentiment && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SentimentSatisfiedAltRoundedIcon sx={{ fontSize: 22, color: "#4F46E5" }} />
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                      Text Sentiment Analysis
                    </Typography>
                  </Box>
                  <Chip
                    label={`Overall: ${sentiment.overall_sentiment || "Positive"}`}
                    size="small"
                    sx={{
                      bgcolor:
                        sentiment.overall_sentiment === "Positive"
                          ? "#ECFDF5"
                          : sentiment.overall_sentiment === "Negative"
                          ? "#FEF2F2"
                          : "#FEF3C7",
                      color:
                        sentiment.overall_sentiment === "Positive"
                          ? "#059669"
                          : sentiment.overall_sentiment === "Negative"
                          ? "#DC2626"
                          : "#D97706",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                    }}
                  />
                </Box>

                {/* Sentiment Bars */}
                <Grid container spacing={2} mb={2.5}>
                  {/* Positive */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F0FDF4", border: "1px solid #DCFCE7" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#166534" }}>
                          Positive Sentiment
                        </Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#166534" }}>
                          {sentiment.positive_pct ?? 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sentiment.positive_pct ?? 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: "#DCFCE7", "& .MuiLinearProgress-bar": { bgcolor: "#10B981" } }}
                      />
                    </Box>
                  </Grid>

                  {/* Neutral */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#FFFBEB", border: "1px solid #FEF3C7" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#92400E" }}>
                          Neutral Sentiment
                        </Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#92400E" }}>
                          {sentiment.neutral_pct ?? 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sentiment.neutral_pct ?? 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: "#FEF3C7", "& .MuiLinearProgress-bar": { bgcolor: "#F59E0B" } }}
                      />
                    </Box>
                  </Grid>

                  {/* Negative */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#FEF2F2", border: "1px solid #FEE2E2" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#991B1B" }}>
                          Negative / Concerns
                        </Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#991B1B" }}>
                          {sentiment.negative_pct ?? 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sentiment.negative_pct ?? 0}
                        sx={{ height: 6, borderRadius: 3, bgcolor: "#FEE2E2", "& .MuiLinearProgress-bar": { bgcolor: "#EF4444" } }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                {/* Sample Quotes */}
                {sentiment.sample_quotes?.length > 0 && (
                  <Box sx={{ p: 1.8, borderRadius: 2, bgcolor: "#F8FAFC", borderLeft: "4px solid #4F46E5" }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#64748B", display: "block", mb: 0.5 }}>
                      Sample Respondent Quotes
                    </Typography>
                    <Stack spacing={0.5}>
                      {sentiment.sample_quotes.map((quote, qIdx) => (
                        <Typography key={qIdx} variant="body2" sx={{ fontStyle: "italic", color: "#334155", fontSize: "0.85rem" }}>
                          &ldquo;{quote}&rdquo;
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}

            {/* 4. Frequently Mentioned Topics */}
            {insights.frequently_mentioned_topics?.length > 0 && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocalOfferRoundedIcon sx={{ fontSize: 20, color: "#8B5CF6" }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                    Top Mentioned Topics &amp; Keywords
                  </Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {insights.frequently_mentioned_topics.map((t, tIdx) => (
                    <Chip
                      key={tIdx}
                      label={`${t.topic || t} (${t.count ?? 1})`}
                      sx={{
                        bgcolor: "#F3E8FF",
                        color: "#6B21A8",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        borderRadius: 2,
                        py: 0.5,
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            )}

            {/* 5. Most Common Answers */}
            {insights.most_common_answers?.length > 0 && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <QuizRoundedIcon sx={{ fontSize: 20, color: "#3B82F6" }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                    Most Common Answers
                  </Typography>
                </Box>
                <Grid container spacing={1.5}>
                  {insights.most_common_answers.map((mca, mIdx) => (
                    <Grid item xs={12} sm={6} key={mIdx}>
                      <Box sx={{ p: 1.5, px: 2, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ color: "#64748B" }}>
                          {mca.question}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                          <Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>
                            {mca.answer}
                          </Typography>
                          <Chip
                            label={mca.percentage}
                            size="small"
                            sx={{ bgcolor: "#DBEAFE", color: "#1E40AF", fontWeight: 700, fontSize: "0.72rem", height: 20 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* 6. Unusual / Outlier Responses */}
            {insights.unusual_or_important_responses?.length > 0 && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFBEB", border: "1px solid #FCD34D" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <WarningAmberRoundedIcon sx={{ fontSize: 20, color: "#D97706" }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#92400E" }}>
                    Notable &amp; Outlier Responses
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {insights.unusual_or_important_responses.map((ur, uIdx) => (
                    <Box key={uIdx} display="flex" alignItems="flex-start" gap={1.2}>
                      <Typography variant="body2" sx={{ color: "#78350F", fontWeight: 600, fontSize: "0.88rem" }}>
                        • {ur}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* 7. Actionable Recommendations */}
            {insights.actionable_insights?.length > 0 && (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LightbulbRoundedIcon sx={{ fontSize: 22, color: "#F59E0B" }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                    Actionable Insights &amp; Recommendations
                  </Typography>
                </Box>
                <Stack spacing={1.2}>
                  {insights.actionable_insights.map((rec, rIdx) => (
                    <Box
                      key={rIdx}
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                      sx={{
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: "#FEF3C7",
                        color: "#78350F",
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: "#F59E0B",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        {rIdx + 1}
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.88rem" }}>
                        {rec}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
