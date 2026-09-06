import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import toast from "react-hot-toast";

// Icons
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

import api from "../../api/api";
import StatCard from "../../components/dashboard/StatCard";
import PageHeader from "../../components/common/PageHeader";

const CustomChartTooltip = ({ active, payload, label, unit = "responses" }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          px: 2,
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 2.5,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12)",
          minWidth: 140,
        }}
      >
        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.75rem", display: "block", mb: 0.5 }}>
          {label}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.fill || item.color || "#4F46E5" }} />
          <Typography variant="body2" sx={{ color: "#0F172A", fontWeight: 800, fontSize: "0.95rem" }}>
            {item.value} <Typography component="span" sx={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>{unit}</Typography>
          </Typography>
        </Box>
      </Paper>
    );
  }
  return null;
};

// Helper to pick icon according to field type
function getFieldIcon(fieldType) {
  const t = (fieldType || "").toLowerCase();
  if (["select", "dropdown", "radio", "checkbox"].includes(t)) {
    return <RadioButtonCheckedRoundedIcon sx={{ fontSize: 16 }} />;
  }
  if (["rating", "star_rating", "scale"].includes(t)) {
    return <StarRoundedIcon sx={{ fontSize: 16 }} />;
  }
  if (["number", "currency"].includes(t)) {
    return <NumbersRoundedIcon sx={{ fontSize: 16 }} />;
  }
  return <TextFieldsRoundedIcon sx={{ fontSize: 16 }} />;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [dateRange, setDateRange] = useState("all"); // 'all', '7d', '30d', '90d'

  // DB Analytics State
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  // Master-Detail State
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'choice', 'text', 'rating', 'number'

  // Fetch User's Forms List for Selector Dropdown
  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await api.get("/forms/");
        const formsList = res.data || [];
        setForms(formsList);
        // Default to the first form if available to prevent mixing questions
        if (formsList.length > 0 && !selectedFormId) {
          setSelectedFormId(String(formsList[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchForms();
  }, []);

  // Fetch Scoped Analytics Datasets
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFormId) params.append("form_id", selectedFormId);
      if (dateRange) params.append("date_range", dateRange);

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const [overviewRes, chartsRes, insightsRes] = await Promise.all([
        api.get(`/analytics/overview${queryString}`),
        api.get(`/analytics/charts${queryString}`),
        api.get(`/analytics/ai-insights${queryString}`),
      ]);

      setOverview(overviewRes.data);
      setCharts(chartsRes.data);
      setAiInsights(insightsRes.data);

      // Auto-select first question in dataset if none or current selected is not in dataset
      const qList = chartsRes.data?.question_analytics || [];
      if (qList.length > 0) {
        setSelectedQuestionId((prev) => {
          const exists = qList.some((q) => q.id === prev);
          return exists ? prev : qList[0].id;
        });
      } else {
        setSelectedQuestionId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics metrics", { id: "analytics-err" });
    } finally {
      setLoading(false);
    }
  }, [selectedFormId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const selectedFormTitle = forms.find((f) => String(f.id) === String(selectedFormId))?.title || "All Forms (Overview)";
  const rawQuestions = charts?.question_analytics || [];

  // Filtered Questions for Master List
  const filteredQuestions = useMemo(() => {
    return rawQuestions.filter((q) => {
      // Type Filter
      if (typeFilter === "choice" && !["select", "dropdown", "radio", "checkbox"].includes(q.field_type)) return false;
      if (typeFilter === "rating" && !["rating", "star_rating", "scale"].includes(q.field_type)) return false;
      if (typeFilter === "number" && !["number", "currency"].includes(q.field_type)) return false;
      if (typeFilter === "text" && ["select", "dropdown", "radio", "checkbox", "rating", "star_rating", "scale", "number", "currency"].includes(q.field_type)) return false;

      // Search Query
      if (!questionSearchQuery.trim()) return true;
      const query = questionSearchQuery.toLowerCase();
      return (
        q.label.toLowerCase().includes(query) ||
        q.field_type.toLowerCase().includes(query) ||
        (q.form_title && q.form_title.toLowerCase().includes(query))
      );
    });
  }, [rawQuestions, typeFilter, questionSearchQuery]);

  // Selected Question Object
  const selectedQuestion = useMemo(() => {
    return rawQuestions.find((q) => q.id === selectedQuestionId) || filteredQuestions[0] || null;
  }, [rawQuestions, selectedQuestionId, filteredQuestions]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER & PROMINENT FORM SELECTOR
         ───────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Analytics & Insights"
        subtitle="Performance metrics, response volume trends, and question-level completion analytics"
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {/* Form Selector Dropdown */}
            <Box sx={{ minWidth: 240 }}>
              <TextField
                select
                size="small"
                fullWidth
                value={selectedFormId}
                onChange={(e) => {
                  setSelectedFormId(e.target.value);
                  setQuestionSearchQuery("");
                }}
                sx={{
                  bgcolor: "background.paper",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  },
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (val) => {
                    if (!val) return "🌐 All Forms (Overview)";
                    const found = forms.find((f) => String(f.id) === String(val));
                    return found ? `📋 ${found.title}` : "Select Form";
                  },
                }}
              >
                <MenuItem value="" sx={{ fontWeight: 600 }}>
                  🌐 All Forms (Overview)
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {forms.map((f) => (
                  <MenuItem key={f.id} value={String(f.id)} sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                    📋 {f.title}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Date Range Selector */}
            <TextField
              select
              size="small"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              sx={{
                minWidth: 135,
                bgcolor: "background.paper",
                "& .MuiOutlinedInput-root": { borderRadius: 2.5, fontWeight: 600, fontSize: "0.85rem" },
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </TextField>
          </Stack>
        }
      />

      {/* Loading Skeleton Indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={32} sx={{ color: "#4F46E5" }} />
        </Box>
      )}

      {!loading && (
        <>
          {/* ─────────────────────────────────────────────────────────────
              2. SUMMARY KPI OVERVIEW CARDS
             ───────────────────────────────────────────────────────────── */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Submissions"
                value={overview?.total_submissions ?? 0}
                color="#4F46E5"
                subtitle={selectedFormTitle}
                trend="Live"
                trendType="neutral"
                icon={<AssignmentRoundedIcon sx={{ fontSize: 20 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completion Rate"
                value={overview?.completion_rate || "No response data yet"}
                color="#10B981"
                subtitle="Form submissions ratio"
                trend={overview?.total_submissions > 0 ? "Active" : "Pending"}
                trendType={overview?.total_submissions > 0 ? "success" : "neutral"}
                icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Completion Time"
                value={overview?.avg_completion_time || "—"}
                color="#06B6D4"
                subtitle="Average fill duration"
                trend="Est"
                trendType="info"
                icon={<AccessTimeRoundedIcon sx={{ fontSize: 20 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Unique Respondents"
                value={overview?.active_respondents ?? 0}
                color="#8B5CF6"
                subtitle="Identified respondents"
                trend="DB Sync"
                trendType="neutral"
                icon={<PublicRoundedIcon sx={{ fontSize: 20 }} />}
              />
            </Grid>
          </Grid>

          {/* ─────────────────────────────────────────────────────────────
              3. AUTOMATED PERFORMANCE INSIGHTS CARDS
             ───────────────────────────────────────────────────────────── */}
          {aiInsights && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
                backgroundImage: "radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.03) 0px, transparent 50%)",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 20, color: "#4F46E5" }} />
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.05rem" }}>
                  Automated Performance Insights ({selectedFormTitle})
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {[
                  aiInsights.most_skipped_question,
                  aiInsights.highest_completion_time,
                  aiInsights.peak_submission_hours,
                  aiInsights.completion_percentage,
                ]
                  .filter(Boolean)
                  .map((insight, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.2,
                          borderRadius: 2.5,
                          border: "1px solid #E2E8F0",
                          bgcolor: "#FAFAFA",
                          height: "100%",
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{
                            color: "#64748B",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          {insight?.title}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#4F46E5", fontSize: "0.95rem", mb: 0.5 }}>
                          {insight?.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", lineHeight: 1.3, display: "block" }}>
                          {insight?.description}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
              </Grid>
            </Paper>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. CHARTS GRID (TIMELINE TREND + WEEKDAY BREAKDOWN)
             ───────────────────────────────────────────────────────────── */}
          <Grid container spacing={3}>
            {/* CHART 1: Response Volume Trend */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                      Response Volume Trend
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                      Submissions timeline for {selectedFormTitle}
                    </Typography>
                  </Box>
                  <Chip
                    label={dateRange === "7d" ? "7 Days" : dateRange === "30d" ? "30 Days" : "Timeline"}
                    size="small"
                    sx={{ fontSize: "0.7rem", fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }}
                  />
                </Box>

                <Box height={260}>
                  {charts?.response_trend?.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                      <InboxRoundedIcon sx={{ fontSize: 36, color: "#CBD5E1" }} />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        No response trend data available
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts?.response_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                        <ChartTooltip content={<CustomChartTooltip />} />
                        <Area type="monotone" dataKey="responses" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorArea)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* CHART 2: Daily Responses by Weekday */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)" }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A", mb: 0.5 }}>
                  Submissions by Weekday
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", display: "block", mb: 2 }}>
                  Submissions volume grouped by day of week
                </Typography>

                <Box height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.daily_responses || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                      <ChartTooltip content={<CustomChartTooltip unit="submissions" />} />
                      <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ─────────────────────────────────────────────────────────────
              5. MASTER-DETAIL QUESTION ANALYTICS SECTION
             ───────────────────────────────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3.5,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              overflow: "hidden",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            }}
          >
            {/* Section Header */}
            <Box
              p={2.5}
              px={3}
              borderBottom="1px solid #E2E8F0"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1.5}
              sx={{ bgcolor: "#FAFAFA" }}
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <QuestionAnswerRoundedIcon sx={{ fontSize: 22, color: "#4F46E5" }} />
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.05rem" }}>
                    Question Analytics Explorer
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                    Select a question from {selectedFormTitle} to view response breakdowns, rating distributions, and completion stats.
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={<LayersRoundedIcon sx={{ fontSize: "16px !important", color: "#4F46E5 !important" }} />}
                label={`${rawQuestions.length} Questions`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" }}
              />
            </Box>

            {rawQuestions.length === 0 ? (
              <Box py={8} textAlign="center">
                <InboxRoundedIcon sx={{ fontSize: 44, color: "#CBD5E1" }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A", mt: 1 }}>
                  No questions found for this form
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.5, maxWidth: 460, mx: "auto" }}>
                  The selected form has no configured questions or versions. Pick another form from the top dropdown to explore analytics.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "340px 1fr" },
                  minHeight: 560,
                }}
              >
                {/* ── LEFT RAIL: SEARCHABLE QUESTION MASTER LIST ───────────── */}
                <Box
                  sx={{
                    borderRight: { xs: "none", md: "1px solid #E2E8F0" },
                    borderBottom: { xs: "1px solid #E2E8F0", md: "none" },
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  {/* Search Bar */}
                  <Box p={2} borderBottom="1px solid #F1F5F9">
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search questions..."
                      value={questionSearchQuery}
                      onChange={(e) => setQuestionSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
                          </InputAdornment>
                        ),
                        endAdornment: questionSearchQuery ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setQuestionSearchQuery("")}>
                              <ClearRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </InputAdornment>
                        ) : null,
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          borderRadius: 2,
                          bgcolor: "#F8FAFC",
                          fontSize: "0.825rem",
                        },
                      }}
                    />

                    {/* Filter Type Pills */}
                    <Stack direction="row" spacing={0.8} mt={1.5} overflow="auto" pb={0.5}>
                      {[
                        { id: "all", label: "All" },
                        { id: "choice", label: "Choices" },
                        { id: "text", label: "Text" },
                        { id: "rating", label: "Rating" },
                        { id: "number", label: "Number" },
                      ].map((t) => (
                        <Chip
                          key={t.id}
                          label={t.label}
                          size="small"
                          clickable
                          onClick={() => setTypeFilter(t.id)}
                          sx={{
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: typeFilter === t.id ? 800 : 600,
                            bgcolor: typeFilter === t.id ? "#4F46E5" : "#F1F5F9",
                            color: typeFilter === t.id ? "#FFFFFF" : "#64748B",
                            "&:hover": { bgcolor: typeFilter === t.id ? "#4338CA" : "#E2E8F0" },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Question Scrollable List */}
                  <Box
                    sx={{
                      flex: 1,
                      maxHeight: { xs: 300, md: 540 },
                      overflowY: "auto",
                      p: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {filteredQuestions.length === 0 ? (
                      <Box py={4} textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                          No matching questions found
                        </Typography>
                      </Box>
                    ) : (
                      filteredQuestions.map((q) => {
                        const isSelected = selectedQuestion?.id === q.id;
                        return (
                          <Box
                            key={q.id}
                            onClick={() => setSelectedQuestionId(q.id)}
                            sx={{
                              p: 1.6,
                              borderRadius: 2.5,
                              cursor: "pointer",
                              border: isSelected ? "1.5px solid #4F46E5" : "1px solid #E2E8F0",
                              bgcolor: isSelected ? "#EEF2FF" : "#FFFFFF",
                              transition: "all 0.15s ease",
                              "&:hover": {
                                bgcolor: isSelected ? "#EEF2FF" : "#F8FAFC",
                                borderColor: isSelected ? "#4F46E5" : "#CBD5E1",
                              },
                            }}
                          >
                            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                              <Typography
                                variant="body2"
                                fontWeight={isSelected ? 800 : 700}
                                sx={{
                                  color: isSelected ? "#1E1B4B" : "#0F172A",
                                  fontSize: "0.85rem",
                                  lineHeight: 1.35,
                                }}
                              >
                                {q.label}
                                {q.is_required && (
                                  <Typography component="span" sx={{ color: "#EF4444", ml: 0.4 }}>
                                    *
                                  </Typography>
                                )}
                              </Typography>
                            </Box>

                            {/* Subtitle with field type, answered count, and form title if All Forms */}
                            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                              <Box display="flex" alignItems="center" gap={0.8}>
                                <Chip
                                  icon={getFieldIcon(q.field_type)}
                                  label={q.field_type}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    textTransform: "lowercase",
                                    bgcolor: isSelected ? "#E0E7FF" : "#F1F5F9",
                                    color: isSelected ? "#4338CA" : "#475569",
                                  }}
                                />
                                {!selectedFormId && q.form_title && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: "0.65rem",
                                      color: "#64748B",
                                      fontWeight: 600,
                                      maxWidth: 100,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {q.form_title}
                                  </Typography>
                                )}
                              </Box>

                              <Typography
                                variant="caption"
                                fontWeight={800}
                                sx={{
                                  fontSize: "0.725rem",
                                  color: q.has_data ? "#4F46E5" : "#94A3B8",
                                }}
                              >
                                {q.answered_ratio.replace(" answered", "")}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Box>

                {/* ── RIGHT VIEWPORT: SELECTED QUESTION DETAIL ANALYTICS ──── */}
                <Box sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: "#FFFFFF", display: "flex", flexDirection: "column", gap: 3 }}>
                  {selectedQuestion ? (
                    <>
                      {/* Mobile Question Selector (< md) */}
                      <Box sx={{ display: { xs: "block", md: "none" }, mb: 1 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Select Question"
                          value={selectedQuestion.id}
                          onChange={(e) => setSelectedQuestionId(Number(e.target.value))}
                          sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
                        >
                          {rawQuestions.map((q) => (
                            <MenuItem key={q.id} value={q.id}>
                              {q.label} ({q.field_type})
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>

                      {/* Detail Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1.5}>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.15rem" }}>
                              {selectedQuestion.label}
                            </Typography>
                            {selectedQuestion.is_required && (
                              <Chip
                                label="Required"
                                size="small"
                                sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700, bgcolor: "#FEE2E2", color: "#DC2626" }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", display: "block", mt: 0.3 }}>
                            Field Type: <strong>{selectedQuestion.field_type}</strong>
                            {selectedQuestion.form_title && ` • Form: ${selectedQuestion.form_title}`}
                          </Typography>
                        </Box>

                        <Chip
                          icon={<CheckCircleRoundedIcon sx={{ fontSize: "14px !important", color: "#10B981 !important" }} />}
                          label={`${selectedQuestion.completion_pct}% Completion`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: "#ECFDF5",
                            color: "#059669",
                            border: "1px solid #A7F3D0",
                          }}
                        />
                      </Box>

                      {/* Detail KPI Metrics Row */}
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                              Answered
                            </Typography>
                            <Typography variant="h6" fontWeight={800} sx={{ color: "#4F46E5", mt: 0.3 }}>
                              {selectedQuestion.responses_count}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                              Unanswered
                            </Typography>
                            <Typography variant="h6" fontWeight={800} sx={{ color: "#64748B", mt: 0.3 }}>
                              {selectedQuestion.unanswered_count}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                              Total Submissions
                            </Typography>
                            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", mt: 0.3 }}>
                              {selectedQuestion.total_submissions}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                              Drop-off Rate
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight={800}
                              sx={{
                                mt: 0.3,
                                color: selectedQuestion.completion_pct >= 80 ? "#10B981" : "#F59E0B",
                              }}
                            >
                              {selectedQuestion.total_submissions > 0
                                ? `${round(100 - selectedQuestion.completion_pct, 1)}%`
                                : "0%"}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Completion Progress Bar */}
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: "#64748B" }}>
                            Question Fill Rate
                          </Typography>
                          <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A" }}>
                            {selectedQuestion.answered_ratio}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={selectedQuestion.completion_pct}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "#F1F5F9",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              bgcolor:
                                selectedQuestion.completion_pct >= 80
                                  ? "#10B981"
                                  : selectedQuestion.completion_pct >= 50
                                  ? "#F59E0B"
                                  : "#EF4444",
                            },
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* ── TAILORED VISUALIZATIONS BASED ON FIELD TYPE ───────── */}

                      {/* 1. CHOICE FIELDS (Select, Radio, Checkbox, Dropdown) */}
                      {["select", "dropdown", "radio", "checkbox"].includes(selectedQuestion.field_type) && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 2 }}>
                            Choice Distribution & Selection Breakdown
                          </Typography>

                          {selectedQuestion.distribution?.length > 0 ? (
                            <Stack spacing={2}>
                              {selectedQuestion.distribution.map((opt, idx) => (
                                <Box key={idx} sx={{ p: 1.8, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A" }}>
                                      {opt.label}
                                    </Typography>
                                    <Typography variant="caption" fontWeight={800} sx={{ color: "#4F46E5" }}>
                                      {opt.count} answers ({opt.percentage}%)
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={opt.percentage}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: "#E2E8F0",
                                      "& .MuiLinearProgress-bar": {
                                        borderRadius: 3,
                                        bgcolor: "#4F46E5",
                                      },
                                    }}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Box py={4} textAlign="center">
                              <Typography variant="caption" color="text.secondary">
                                No option distributions recorded yet.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* 2. RATING FIELDS (Rating, Scale, Star) */}
                      {["rating", "star_rating", "scale"].includes(selectedQuestion.field_type) && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 2 }}>
                            Rating Score Breakdown
                          </Typography>

                          <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} sm={4}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 3,
                                  textAlign: "center",
                                  borderRadius: 3,
                                  bgcolor: "#FFFBEB",
                                  border: "1px solid #FEF3C7",
                                }}
                              >
                                <Typography variant="h3" fontWeight={900} sx={{ color: "#B45309" }}>
                                  {selectedQuestion.rating_stats?.average || "—"}
                                </Typography>
                                <Box display="flex" justifyContent="center" gap={0.5} my={1}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <StarRoundedIcon
                                      key={star}
                                      sx={{
                                        fontSize: 22,
                                        color:
                                          star <= Math.round(selectedQuestion.rating_stats?.average || 0)
                                            ? "#F59E0B"
                                            : "#D1D5DB",
                                      }}
                                    />
                                  ))}
                                </Box>
                                <Typography variant="caption" fontWeight={700} sx={{ color: "#92400E" }}>
                                  Average Score out of 5
                                </Typography>
                              </Paper>
                            </Grid>

                            <Grid item xs={12} sm={8}>
                              <Stack spacing={1.2}>
                                {selectedQuestion.rating_stats?.breakdown?.map((b) => (
                                  <Box key={b.score} display="flex" alignItems="center" gap={1.5}>
                                    <Typography variant="caption" fontWeight={700} sx={{ width: 55, color: "#64748B" }}>
                                      {b.score}
                                    </Typography>
                                    <Box flex={1}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={b.percentage}
                                        sx={{
                                          height: 8,
                                          borderRadius: 4,
                                          bgcolor: "#F1F5F9",
                                          "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: "#F59E0B" },
                                        }}
                                      />
                                    </Box>
                                    <Typography variant="caption" fontWeight={800} sx={{ width: 45, textAlign: "right", color: "#0F172A" }}>
                                      {b.count}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* 3. NUMBER / CURRENCY FIELDS */}
                      {["number", "currency"].includes(selectedQuestion.field_type) && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 2 }}>
                            Numeric Statistical Summary
                          </Typography>

                          {selectedQuestion.number_stats ? (
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    AVERAGE VALUE
                                  </Typography>
                                  <Typography variant="h5" fontWeight={800} sx={{ color: "#4F46E5", mt: 0.5 }}>
                                    {selectedQuestion.number_stats.average}
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    MINIMUM
                                  </Typography>
                                  <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A", mt: 0.5 }}>
                                    {selectedQuestion.number_stats.min}
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    MAXIMUM
                                  </Typography>
                                  <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A", mt: 0.5 }}>
                                    {selectedQuestion.number_stats.max}
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          ) : (
                            <Box py={3} textAlign="center">
                              <Typography variant="caption" color="text.secondary">
                                No numeric responses available yet.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* 4. TEXT / CONTACT / LOOKUP / DATE / FILE UPLOAD FIELDS */}
                      {!["select", "dropdown", "radio", "checkbox", "rating", "star_rating", "scale", "number", "currency"].includes(
                        selectedQuestion.field_type
                      ) && (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                            Sample Responses ({selectedQuestion.sample_responses?.length || 0})
                          </Typography>

                          {selectedQuestion.sample_responses?.length > 0 ? (
                            <Stack spacing={1.2}>
                              {selectedQuestion.sample_responses.map((resp, idx) => (
                                <Paper
                                  key={idx}
                                  elevation={0}
                                  sx={{
                                    p: 1.8,
                                    borderRadius: 2,
                                    bgcolor: "#F8FAFC",
                                    border: "1px solid #E2E8F0",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                  }}
                                >
                                  <Chip
                                    label={`#${idx + 1}`}
                                    size="small"
                                    sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }}
                                  />
                                  <Typography variant="body2" sx={{ color: "#0F172A", fontWeight: 600, wordBreak: "break-word" }}>
                                    {resp}
                                  </Typography>
                                </Paper>
                              ))}
                            </Stack>
                          ) : (
                            <Box py={4} textAlign="center" sx={{ bgcolor: "#FAFAFA", borderRadius: 2.5, border: "1px dashed #E2E8F0" }}>
                              <Typography variant="caption" color="text.secondary">
                                No response text recorded yet for this question.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box py={8} textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Select a question from the left navigation rail to view its analytics.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

function round(val, dec = 1) {
  return Number(Math.round(val + "e" + dec) + "e-" + dec);
}
