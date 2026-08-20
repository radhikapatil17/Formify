import { useEffect, useState, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import toast from "react-hot-toast";

// Icons
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

import api from "../../api/api";
import StatCard from "../../components/dashboard/StatCard";

const PIE_COLORS = ["#4F46E5", "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];

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

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [dateRange, setDateRange] = useState("all"); // 'all', '7d', '30d', '90d'

  // DB Analytics State
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  // Fetch User's Forms List for Selector Dropdown
  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await api.get("/forms/");
        const formsList = res.data || [];
        setForms(formsList);
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

  const selectedFormTitle = forms.find((f) => String(f.id) === String(selectedFormId))?.title || "All Forms";
  const questionAnalytics = charts?.question_analytics || [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TOP FILTERS BAR (FORM SELECTOR + DATE RANGE)
         ───────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.03em", color: "#0F172A" }}>
            Form Analytics &amp; Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, color: "#64748B" }}>
            Performance metrics, response volume trends, and question completion rates
          </Typography>
        </Box>

        {/* Top Filters */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {/* Form Selector */}
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListRoundedIcon sx={{ fontSize: 18, color: "#64748B" }} />
            <TextField
              select
              size="small"
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              sx={{ minWidth: 200, bgcolor: "#FFFFFF", borderRadius: 2 }}
              SelectProps={{
                sx: { fontWeight: 700, fontSize: "0.85rem" }
              }}
            >
              <MenuItem value="">All Forms ({forms.length})</MenuItem>
              {forms.map((f) => (
                <MenuItem key={f.id} value={String(f.id)}>
                  {f.title}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Date Range Selector */}
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayRoundedIcon sx={{ fontSize: 16, color: "#64748B" }} />
            <TextField
              select
              size="small"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              sx={{ minWidth: 140, bgcolor: "#FFFFFF", borderRadius: 2 }}
              SelectProps={{
                sx: { fontWeight: 600, fontSize: "0.85rem" }
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </TextField>
          </Box>
        </Stack>
      </Box>

      {/* Loading Skeleton Indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
        </Box>
      )}

      {!loading && (
        <>
          {/* ─────────────────────────────────────────────────────────────
              2. SUMMARY KPI CARDS (4 REAL DATABASE METRICS)
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
              3. AUTOMATED AI INSIGHTS CARDS
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
                ].map((insight, idx) => (
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
                      <Typography variant="caption" fontWeight={700} sx={{ color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.5 }}>
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
              4. CHARTS GRID (TIMELINE TREND + COMPLETION RATIO + DAILY BREAKDOWN)
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
                  <Chip label={dateRange === "7d" ? "7 Days" : dateRange === "30d" ? "30 Days" : "Timeline"} size="small" sx={{ fontSize: "0.7rem", fontWeight: 700 }} />
                </Box>

                <Box height={280}>
                  {charts?.response_trend?.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                      <InboxRoundedIcon sx={{ fontSize: 36, color: "#CBD5E1" }} />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>No response trend data available</Typography>
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

            {/* CHART 2: Daily Responses */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)" }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A", mb: 0.5 }}>
                  Submissions by Weekday
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", display: "block", mb: 2 }}>
                  Submissions volume grouped by day of week
                </Typography>

                <Box height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.daily_responses || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                      <ChartTooltip content={<CustomChartTooltip unit="submissions" />} />
                      <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ─────────────────────────────────────────────────────────────
              5. QUESTION-LEVEL ANALYTICS SECTION (FORM SCOPED & CLEAN)
             ───────────────────────────────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              overflow: "hidden",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Box p={3} borderBottom="1px solid #E2E8F0" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <QuestionAnswerRoundedIcon sx={{ fontSize: 20, color: "#4F46E5" }} />
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.05rem" }}>
                    Question-Level Analytics ({selectedFormTitle})
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, color: "#64748B", fontSize: "0.775rem" }}>
                  Detailed completion rate, answer counts, and drop-off ratio per question
                </Typography>
              </Box>

              <Chip
                label={`${questionAnalytics.length} Questions`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" }}
              />
            </Box>

            {questionAnalytics.length === 0 ? (
              <Box py={6} textAlign="center">
                <InboxRoundedIcon sx={{ fontSize: 44, color: "#CBD5E1" }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A", mt: 1 }}>
                  No questions found for this form
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.5 }}>
                  Select a form with configured questions to inspect question-level completion rates.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                        QUESTION LABEL
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                        INPUT TYPE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                        ANSWERED RATIO
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em", width: 220 }}>
                        COMPLETION RATE
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {questionAnalytics.map((q) => (
                      <TableRow key={q.id} hover sx={{ "& .MuiTableCell-root": { borderColor: "#F1F5F9", py: 2 } }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A" }}>
                          {q.label}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={q.field_type}
                            size="small"
                            sx={{
                              fontSize: "0.675rem",
                              fontWeight: 700,
                              textTransform: "lowercase",
                              bgcolor: "#F1F5F9",
                              color: "#475569",
                              border: "1px solid #E2E8F0",
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700, fontSize: "0.85rem", color: q.has_data ? "#4F46E5" : "#94A3B8" }}>
                          {q.answered_ratio}
                        </TableCell>

                        <TableCell align="right">
                          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              sx={{
                                fontSize: "0.85rem",
                                color: !q.has_data
                                  ? "#64748B"
                                  : q.completion_pct >= 80
                                  ? "#10B981"
                                  : q.completion_pct >= 50
                                  ? "#F59E0B"
                                  : "#EF4444",
                              }}
                            >
                              {q.completion_rate}
                            </Typography>

                            {q.has_data && (
                              <Box sx={{ width: 140 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={q.completion_pct}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: "#E2E8F0",
                                    "& .MuiLinearProgress-bar": {
                                      borderRadius: 3,
                                      bgcolor:
                                        q.completion_pct >= 80
                                          ? "#10B981"
                                          : q.completion_pct >= 50
                                          ? "#F59E0B"
                                          : "#EF4444",
                                    },
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
