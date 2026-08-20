import { useEffect, useState } from "react";
import {
  Grid,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Skeleton,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";

// Icons
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import StatCard from "../../components/dashboard/StatCard";
import api from "../../api/api";

const BAR_COLORS = ["#4F46E5", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

// Custom Glassmorphism Chart Tooltip
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
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)",
          minWidth: 140,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.75rem", display: "block", mb: 0.5 }}
        >
          {label}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: item.fill || item.color || "#4F46E5",
              boxShadow: `0 0 0 2px ${item.fill || item.color || "#4F46E5"}30`,
            }}
          />
          <Typography variant="body2" sx={{ color: "#0F172A", fontWeight: 800, fontSize: "0.95rem" }}>
            {item.value} <Typography component="span" sx={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>{unit}</Typography>
          </Typography>
        </Box>
      </Paper>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/dashboard/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Unable to connect to dashboard metrics backend. Please check network connection.");
    } finally {
      setLoading(false);
    }
  }

  // 1. SKELETON LOADING STATE
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
        {/* Header Skeleton */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Skeleton width={220} height={36} />
            <Skeleton width={320} height={20} />
          </Box>
          <Skeleton width={140} height={42} />
        </Box>

        {/* 8 Stat Cards Grid Skeleton */}
        <Grid container spacing={2.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={108} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>

        {/* Chart & Activity Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>

        {/* Table Skeleton */}
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  // 2. ERROR STATE WITH RETRY BUTTON
  if (error) {
    return (
      <Box py={6}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3, border: "1px solid #FCA5A5" }}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={loadDashboardData}>
              Retry Connection
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Database Connection Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  const chartData = summary?.chart_data || [];
  const recentSubmissions = summary?.recent_submissions || [];
  const recentActivity = summary?.recent_activity || [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. DASHBOARD HEADER & QUICK ACTIONS BAR
         ───────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.03em", color: "#0F172A" }}>
            Workspace Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, color: "#64748B" }}>
            Real-time analytics, response collection metrics, and form schemas overview
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => navigate("/create-form")}
            sx={{
              fontWeight: 600,
              fontSize: "0.85rem",
              px: 2.5,
              py: 0.9,
              borderRadius: 2,
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
            }}
          >
            Create Form
          </Button>
        </Stack>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. KPI STAT CARDS (7 REAL DATABASE METRIC CARDS)
         ───────────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Forms"
            value={summary?.total_forms ?? 0}
            icon={<DescriptionRoundedIcon sx={{ fontSize: 22 }} />}
            color="#4F46E5"
            subtitle="Configured forms"
            trend="Live"
            trendType="neutral"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Published Forms"
            value={summary?.published_forms ?? 0}
            icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 22 }} />}
            color="#10B981"
            subtitle="Active public links"
            trend="Active"
            trendType="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Draft Forms"
            value={summary?.draft_forms ?? 0}
            icon={<LayersRoundedIcon sx={{ fontSize: 22 }} />}
            color="#F59E0B"
            subtitle="Unpublished schemas"
            trend="Draft"
            trendType="neutral"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Archived Forms"
            value={summary?.archived_forms ?? 0}
            icon={<InsertDriveFileRoundedIcon sx={{ fontSize: 22 }} />}
            color="#64748B"
            subtitle="Inactive forms"
            trend="Saved"
            trendType="info"
          />
        </Grid>

        <Grid item xs={12} sm={4} md={4}>
          <StatCard
            title="Total Responses"
            value={summary?.total_submissions ?? 0}
            icon={<AssignmentTurnedInRoundedIcon sx={{ fontSize: 22 }} />}
            color="#3B82F6"
            subtitle="Form submissions"
            trend="Submissions"
            trendType="success"
          />
        </Grid>

        <Grid item xs={12} sm={4} md={4}>
          <StatCard
            title="Responses Today"
            value={summary?.responses_today ?? 0}
            icon={<AccessTimeRoundedIcon sx={{ fontSize: 22 }} />}
            color="#8B5CF6"
            subtitle="Recorded past 24h"
            trend="Today"
            trendType="info"
          />
        </Grid>

        <Grid item xs={12} sm={4} md={4}>
          <StatCard
            title="Avg Completion"
            value={summary?.avg_completion_rate || "0%"}
            icon={<TrendingUpRoundedIcon sx={{ fontSize: 22 }} />}
            color="#06B6D4"
            subtitle="Successful submissions"
            trend="Optimal"
            trendType="success"
          />
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          3. CHARTS GRID: LIVE SUBMISSIONS BY FORM + RECENT ACTIVITY
         ───────────────────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Real Submissions BarChart */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              height: 380,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", color: "#0F172A" }}>
                  Submissions Volume per Form
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.775rem", color: "#64748B", mt: 0.2 }}>
                  Live response counts across active forms
                </Typography>
              </Box>

              <Chip
                label="Live Metrics"
                size="small"
                sx={{
                  bgcolor: "#ECFDF5",
                  color: "#059669",
                  fontWeight: 700,
                  fontSize: "0.675rem",
                  border: "1px solid #A7F3D0",
                }}
              />
            </Box>

            <Box sx={{ flexGrow: 1, width: "100%", pt: 1 }}>
              {chartData.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  gap={1}
                >
                  <BarChartRoundedIcon sx={{ fontSize: 40, color: "#CBD5E1" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B" }}>
                    No submission response volume recorded yet
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<CustomChartTooltip unit="responses" />} />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      barSize={32}
                      isAnimationActive={true}
                      animationDuration={1000}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Real Live Activity Feed */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              height: 380,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", color: "#0F172A" }}>
                Recent Activity Feed
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/responses")}
                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
                sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "none", color: "#4F46E5" }}
              >
                View All
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              {recentActivity.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  gap={1}
                >
                  <InboxRoundedIcon sx={{ fontSize: 36, color: "#CBD5E1" }} />
                  <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                    No activity logged in current workspace
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {recentActivity.map((item, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                        "&:hover": { bgcolor: "#F1F5F9" },
                      }}
                    >
                      <Box sx={{ minWidth: 0, pr: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                          sx={{ fontSize: "0.825rem", color: "#0F172A" }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ fontSize: "0.725rem", color: "#64748B", display: "block" }}
                        >
                          {item.details}
                        </Typography>
                      </Box>

                      <Chip
                        label={item.status}
                        size="small"
                        color={item.statusColor}
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          height: 20,
                          px: 0.5,
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT SUBMISSIONS FEED TABLE (REAL BACKEND DATA)
         ───────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", color: "#0F172A" }}>
              Latest Submissions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.775rem", color: "#64748B", mt: 0.2 }}>
              Real-time submission feed across all active workspace forms
            </Typography>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/responses")}
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
            sx={{ fontWeight: 600, fontSize: "0.775rem", textTransform: "none", borderColor: "#E2E8F0" }}
          >
            Manage Responses Matrix
          </Button>
        </Box>

        {recentSubmissions.length === 0 ? (
          <Box py={6} textAlign="center">
            <InboxRoundedIcon sx={{ fontSize: 44, color: "#94A3B8" }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: "#0F172A", mt: 1 }}>
              No submissions recorded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.5 }}>
              Publish a form and share its link to start receiving responses.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.725rem", color: "#64748B", letterSpacing: "0.02em" }}>SUB ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.725rem", color: "#64748B", letterSpacing: "0.02em" }}>FORM TITLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.725rem", color: "#64748B", letterSpacing: "0.02em" }}>RESPONDENT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.725rem", color: "#64748B", letterSpacing: "0.02em" }}>TIMESTAMP</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.725rem", color: "#64748B", letterSpacing: "0.02em" }}>STATUS</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentSubmissions.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      "& .MuiTableCell-root": { borderColor: "#F1F5F9" },
                    }}
                    onClick={() => navigate("/responses")}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.775rem", color: "#4F46E5" }}>
                      {row.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.825rem", color: "#0F172A" }}>
                      {row.form}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.775rem", color: "#475569" }}>
                      {row.respondent}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.775rem", color: "#64748B" }}>
                      {row.submittedAt}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          height: 20,
                          bgcolor: row.status === "Complete" ? "#ECFDF5" : "#FFF7ED",
                          color: row.status === "Complete" ? "#059669" : "#D97706",
                          border: `1px solid ${row.status === "Complete" ? "#A7F3D0" : "#FDE68A"}`,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}