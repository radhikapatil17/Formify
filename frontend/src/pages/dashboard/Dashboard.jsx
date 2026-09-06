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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import StatCard from "../../components/dashboard/StatCard";
import PageHeader from "../../components/common/PageHeader";
import AiGeneratorDialog from "../../components/templates/AiGeneratorDialog";
import api from "../../api/api";
import toast from "react-hot-toast";

const BAR_COLORS = ["#4F46E5", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 26,
    },
  },
};

// Custom Glassmorphism Chart Tooltip
const CustomChartTooltip = ({ active, payload, label, unit = "responses" }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const val = item.value ?? item.payload?.submissions ?? item.payload?.value ?? 0;
    const titleText = item.payload?.form_title || label;
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
          {titleText}
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
            {val} <Typography component="span" sx={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>{unit}</Typography>
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
  const [invitations, setInvitations] = useState([]);
  const [openAiModal, setOpenAiModal] = useState(false);
  const [chartView, setChartView] = useState("form"); // "form" | "trend"

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/dashboard/summary");
      setSummary(res.data);

      const invRes = await api.get("/collaborators/invitations");
      setInvitations(invRes.data);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Unable to connect to dashboard metrics backend. Please check network connection.");
    } finally {
      setLoading(false);
    }
  }

  const handleAcceptInvite = async (inviteId) => {
    try {
      await api.post(`/collaborators/invitations/${inviteId}/accept`);
      toast.success("Invitation accepted! You now have access to the form.");
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept invitation.");
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await api.post(`/collaborators/invitations/${inviteId}/decline`);
      toast.success("Invitation declined.");
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to decline invitation.");
    }
  };

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Skeleton width={220} height={36} />
            <Skeleton width={320} height={20} />
          </Box>
          <Skeleton width={140} height={42} />
        </Box>

        <Grid container spacing={2.5} sx={{ width: "100%" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={136} sx={{ borderRadius: 3.5 }} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5} sx={{ width: "100%" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={136} sx={{ borderRadius: 3.5 }} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ width: "100%" }}>
          <Grid item xs={12} lg={8} size={{ xs: 12, lg: 8 }}>
            <Skeleton variant="rounded" height={390} sx={{ borderRadius: 3.5 }} />
          </Grid>
          <Grid item xs={12} lg={4} size={{ xs: 12, lg: 4 }}>
            <Skeleton variant="rounded" height={390} sx={{ borderRadius: 3.5 }} />
          </Grid>
        </Grid>

        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3.5 }} />
      </Box>
    );
  }

  // ERROR STATE WITH RETRY BUTTON
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

  const chartData = (summary?.chart_data || []).map((d) => ({
    ...d,
    submissions: d.submissions ?? d.value ?? 0,
    value: d.value ?? d.submissions ?? 0,
  }));
  const responseTrendData = summary?.response_trend || [];
  const hasSubmissions = (summary?.total_submissions || 0) > 0 || chartData.some((c) => (c.submissions || 0) > 0);
  const recentSubmissions = summary?.recent_submissions || [];
  const recentActivity = summary?.recent_activity || [];

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER WITH ACTIONS
         ───────────────────────────────────────────────────────────── */}
      <Box component={motion.div} variants={itemVariants} sx={{ width: "100%" }}>
        <PageHeader
          title="Workspace Dashboard"
          subtitle="Real-time analytics, response collection metrics, and form overview"
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: "#6366F1" }} />}
                onClick={() => setOpenAiModal(true)}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  px: 2.2,
                  py: 0.9,
                  borderRadius: 2.5,
                  borderColor: "#E2E8F0",
                  color: "#4F46E5",
                  bgcolor: "#FFFFFF",
                  "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
                  textTransform: "none",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                }}
              >
                Build with AI
              </Button>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={() => navigate("/create-form")}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  px: 2.5,
                  py: 0.9,
                  borderRadius: 2.5,
                  bgcolor: "#4F46E5",
                  "&:hover": { bgcolor: "#4338CA" },
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                  textTransform: "none",
                }}
              >
                Create Form
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. PENDING COLLABORATION INVITATIONS
         ───────────────────────────────────────────────────────────── */}
      {invitations.length > 0 && (
        <Box component={motion.div} variants={itemVariants} sx={{ width: "100%" }}>
          <Stack spacing={2}>
            {invitations.map((invite) => (
              <Paper
                key={invite.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#F8FAFC",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#EEF2FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PeopleRoundedIcon sx={{ color: "#4F46E5", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0F172A" }}>
                      Collaboration Invitation for "{invite.form_title}"
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", fontSize: "0.825rem" }}>
                      Invited by <strong>{invite.owner_email}</strong> to join as an <strong>{invite.role.toUpperCase()}</strong>.
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAcceptInvite(invite.id)}
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: "#4F46E5",
                      "&:hover": { bgcolor: "#4338CA" },
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDeclineInvite(invite.id)}
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      borderColor: "#CBD5E1",
                      color: "#64748B",
                      "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
                    }}
                  >
                    Decline
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. FORMS OVERVIEW ROW (4 BALANCED COLUMNS)
         ───────────────────────────────────────────────────────────── */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2.5,
        }}
      >
        <StatCard
          title="Total Forms"
          value={summary?.total_forms ?? 0}
          icon={<DescriptionRoundedIcon sx={{ fontSize: 20 }} />}
          color="#4F46E5"
          subtitle="Configured forms"
          trend="Live"
          trendType="neutral"
        />

        <StatCard
          title="Published Forms"
          value={summary?.published_forms ?? 0}
          icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />}
          color="#10B981"
          subtitle="Active public links"
          trend="Active"
          trendType="success"
        />

        <StatCard
          title="Draft Forms"
          value={summary?.draft_forms ?? 0}
          icon={<LayersRoundedIcon sx={{ fontSize: 20 }} />}
          color="#F59E0B"
          subtitle="Unpublished schemas"
          trend="Draft"
          trendType="neutral"
        />

        <StatCard
          title="Archived Forms"
          value={summary?.archived_forms ?? 0}
          icon={<InsertDriveFileRoundedIcon sx={{ fontSize: 20 }} />}
          color="#64748B"
          subtitle="Inactive forms"
          trend="Saved"
          trendType="info"
        />
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          4. SUBMISSION PERFORMANCE ROW (3 BALANCED COLUMNS)
         ───────────────────────────────────────────────────────────── */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2.5,
        }}
      >
        <StatCard
          title="Total Responses"
          value={summary?.total_submissions ?? 0}
          icon={<AssignmentTurnedInRoundedIcon sx={{ fontSize: 20 }} />}
          color="#3B82F6"
          subtitle="Form submissions"
          trend="Submissions"
          trendType="success"
        />

        <StatCard
          title="Responses Today"
          value={summary?.responses_today ?? 0}
          icon={<AccessTimeRoundedIcon sx={{ fontSize: 20 }} />}
          color="#8B5CF6"
          subtitle="Recorded past 24h"
          trend="Today"
          trendType="info"
        />

        <StatCard
          title="Avg Completion"
          value={summary?.avg_completion_rate || "0%"}
          icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />}
          color="#06B6D4"
          subtitle="Successful submissions"
          trend="Optimal"
          trendType="success"
        />
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          5. CHARTS & ACTIVITY (TWO-COLUMN RESPONSIVE LAYOUT)
         ───────────────────────────────────────────────────────────── */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.8fr 1.2fr",
          },
          gap: 3,
        }}
      >
        {/* Submissions Volume & Response Trends Chart */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            height: 390,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", color: "#0F172A" }}>
                {chartView === "form" ? "Submissions Volume per Form" : "7-Day Response Trends"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.775rem", color: "#64748B", mt: 0.2 }}>
                {chartView === "form" ? "Live response counts across active forms" : "Daily submission volume timeline over the last 7 days"}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1.2}>
              <ToggleButtonGroup
                value={chartView}
                exclusive
                onChange={(_, next) => next && setChartView(next)}
                size="small"
                sx={{
                  bgcolor: "#F8FAFC",
                  borderRadius: 2,
                  "& .MuiToggleButton-root": {
                    px: 1.3,
                    py: 0.35,
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    textTransform: "none",
                    borderColor: "#E2E8F0",
                    "&.Mui-selected": {
                      bgcolor: "#EEF2FF",
                      color: "#4F46E5",
                    },
                  },
                }}
              >
                <ToggleButton value="form">By Form</ToggleButton>
                <ToggleButton value="trend">7-Day Trend</ToggleButton>
              </ToggleButtonGroup>

              <Chip
                label="Live Sync"
                size="small"
                sx={{
                  bgcolor: "#ECFDF5",
                  color: "#059669",
                  fontWeight: 700,
                  fontSize: "0.675rem",
                  border: "1px solid #A7F3D0",
                  height: 24,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, width: "100%", pt: 1 }}>
            {!hasSubmissions ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                textAlign="center"
                px={3}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    bgcolor: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1.5,
                    color: "#94A3B8",
                  }}
                >
                  <BarChartRoundedIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 0.5 }}>
                  No response data available yet
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B", maxWidth: 300, mb: 2 }}>
                  Share your published forms to collect responses and visualize submission metrics here.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate("/forms")}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderRadius: 2,
                    borderColor: "#CBD5E1",
                    color: "#4F46E5",
                  }}
                >
                  View Forms
                </Button>
              </Box>
            ) : chartView === "form" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<CustomChartTooltip unit="submissions" />} cursor={{ fill: "#F8FAFC", opacity: 0.8 }} />
                  <Bar
                    dataKey="submissions"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={responseTrendData}
                  margin={{ top: 12, right: 12, left: -20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<CustomChartTooltip unit="responses" />} />
                  <Area
                    type="monotone"
                    dataKey="responses"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dashTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>

        {/* Recent Activity Live Feed */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            height: 390,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)",
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
                    component={motion.div}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
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
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          6. LATEST SUBMISSIONS TABLE
         ───────────────────────────────────────────────────────────── */}
      <Box component={motion.div} variants={itemVariants} sx={{ width: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3.5,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)",
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
                        transition: "background-color 0.15s ease",
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

      {/* ─────────────────────────────────────────────────────────────
          7. AI FORM GENERATOR DIALOG
         ───────────────────────────────────────────────────────────── */}
      <AiGeneratorDialog
        open={openAiModal}
        onClose={() => setOpenAiModal(false)}
        onTemplateSaved={() => {
          loadDashboardData();
        }}
      />
    </Box>
  );
}