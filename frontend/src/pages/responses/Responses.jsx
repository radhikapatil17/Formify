import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  CircularProgress,
  Divider,
  Pagination,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Checkbox,
  Tooltip,
  TableSortLabel,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import api from "../../api/api";
import StatCard from "../../components/dashboard/StatCard";
import PageHeader from "../../components/common/PageHeader";
import AIResponseInsightsModal from "../../components/analytics/AIResponseInsightsModal";

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export default function Responses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFormId = searchParams.get("formId") || "";

  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(initialFormId);

  // Submissions Data State
  const [submissions, setSubmissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewingResponse, setViewingResponse] = useState(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'complete' | 'partial'
  const [dateRange, setDateRange] = useState("all"); // 'all' | '7d' | '30d' | '90d'

  // Sorting State
  const [orderBy, setOrderBy] = useState("submitted_at");
  const [order, setOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog Modals
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openInsightsModal, setOpenInsightsModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Load User Forms List for Dropdown Selector
  useEffect(() => {
    async function loadForms() {
      try {
        setLoading(true);
        const res = await api.get("/forms/");
        setForms(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load forms list", { id: "forms-load-err" });
      } finally {
        setLoading(false);
      }
    }
    loadForms();
  }, []);

  // Sync search state with URL search query parameter (?search=...)
  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearch(query);
      setPage(1);
    }
  }, [searchParams]);

  // Fetch Submissions from FastAPI backend
  const loadSubmissionsData = useCallback(async () => {
    try {
      setReloading(true);
      setSelectedIds([]);

      const param = selectedFormId ? `?form_id=${selectedFormId}` : "";
      const res = await api.get(`/submissions/${param}`);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load response submissions", { id: "subs-err" });
    } finally {
      setReloading(false);
    }
  }, [selectedFormId]);

  useEffect(() => {
    loadSubmissionsData();
  }, [loadSubmissionsData]);

  // Compute Summary KPI Counts from Real Database Submissions
  const summaryMetrics = useMemo(() => {
    const total = submissions.length;
    const complete = submissions.filter((s) => s.status.toLowerCase() === "complete").length;
    const partial = total - complete;

    return { total, complete, partial };
  }, [submissions]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Text Search
      const searchLower = search.toLowerCase();
      const matchesCode = sub.subCode.toLowerCase().includes(searchLower);
      const matchesForm = sub.form_title.toLowerCase().includes(searchLower);
      const matchesRespondent = sub.respondent.toLowerCase().includes(searchLower);
      const matchesAnswers = (sub.answers || []).some(
        (a) => a.label.toLowerCase().includes(searchLower) || String(a.value).toLowerCase().includes(searchLower)
      );

      const matchesSearch = !search || matchesCode || matchesForm || matchesRespondent || matchesAnswers;

      // 2. Status Filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "complete" && sub.status.toLowerCase() === "complete") ||
        (statusFilter === "partial" && sub.status.toLowerCase() === "partial");

      // 3. Date Range Filter
      let matchesDate = true;
      if (dateRange !== "all" && sub.submitted_at) {
        const subDate = new Date(sub.submitted_at);
        const now = new Date();
        const daysDiff = (now - subDate) / (1000 * 60 * 60 * 24);

        if (dateRange === "7d") matchesDate = daysDiff <= 7;
        else if (dateRange === "30d") matchesDate = daysDiff <= 30;
        else if (dateRange === "90d") matchesDate = daysDiff <= 90;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [submissions, search, statusFilter, dateRange]);

  // Sort Submissions
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];

      if (orderBy === "submitted_at") {
        aVal = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        bVal = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredSubmissions, orderBy, order]);

  // Pagination Logic
  const pageCount = Math.ceil(sortedSubmissions.length / rowsPerPage);
  const paginatedSubmissions = useMemo(() => {
    return sortedSubmissions.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [sortedSubmissions, page, rowsPerPage]);

  // Sorting Handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Checkbox Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Delete Submission Action (Single or Bulk)
  const handleConfirmDelete = async () => {
    const idsToDelete = deleteTargetId ? [deleteTargetId] : selectedIds;
    if (idsToDelete.length === 0) return;

    try {
      setDeleting(true);
      toast.loading(`Deleting ${idsToDelete.length} response(s)...`, { id: "del-res" });

      for (const id of idsToDelete) {
        await api.delete(`/submissions/${id}`);
      }

      toast.success(`${idsToDelete.length} response(s) deleted successfully!`, { id: "del-res" });
      setOpenDeleteModal(false);
      setOpenViewModal(false);
      setDeleteTargetId(null);
      setSelectedIds([]);
      loadSubmissionsData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete responses", { id: "del-res" });
    } finally {
      setDeleting(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = (targetRows = null) => {
    const rowsToExport = targetRows || (selectedIds.length > 0
      ? filteredSubmissions.filter((s) => selectedIds.includes(s.id))
      : filteredSubmissions);

    if (rowsToExport.length === 0) {
      toast.error("No responses available to export");
      return;
    }

    try {
      setExporting(true);

      // Collect all unique question labels across exported rows
      const questionLabelsSet = new Set();
      rowsToExport.forEach((sub) => {
        (sub.answers || []).forEach((ans) => questionLabelsSet.add(ans.label));
      });
      const questionLabels = Array.from(questionLabelsSet);

      const headers = ["Submission ID", "Form Title", "Respondent", "Submitted At", "Status", ...questionLabels];

      const csvRows = rowsToExport.map((sub) => {
        const valMap = {};
        (sub.answers || []).forEach((ans) => {
          valMap[ans.label] = ans.value;
        });

        const rowValues = [
          sub.subCode,
          `"${sub.form_title.replace(/"/g, '""')}"`,
          `"${sub.respondent.replace(/"/g, '""')}"`,
          formatDate(sub.submitted_at),
          sub.status,
          ...questionLabels.map((lbl) => `"${(valMap[lbl] || "").replace(/"/g, '""')}"`),
        ];
        return rowValues.join(",");
      });

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Formify_Responses_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Exported CSV file successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV export");
    } finally {
      setExporting(false);
    }
  };

  // Print Handler
  const handlePrintResponse = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="75vh">
        <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      <PageHeader
        title="Responses"
        subtitle="View and manage all form submissions"
        actions={
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            {/* Form Selector Dropdown */}
            <TextField
              select
              size="small"
              value={selectedFormId}
              onChange={(e) => {
                setSelectedFormId(e.target.value);
                setSearchParams(e.target.value ? { formId: e.target.value } : {});
                setPage(1);
              }}
              sx={{ minWidth: 180, bgcolor: "background.paper", borderRadius: 2 }}
              SelectProps={{
                sx: { fontWeight: 600, fontSize: "0.85rem" }
              }}
            >
              <MenuItem value="">All Forms ({forms.length})</MenuItem>
              {forms.map((f) => (
                <MenuItem key={f.id} value={String(f.id)}>
                  {f.title}
                </MenuItem>
              ))}
            </TextField>

            {/* Search Bar */}
            <TextField
              placeholder="Search responses..."
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 190, bgcolor: "background.paper" }}
              InputProps={{
                startAdornment: <SearchRoundedIcon sx={{ color: "text.disabled", fontSize: 18, mr: 1 }} />,
              }}
            />

            {/* Date Range Filter */}
            <TextField
              select
              size="small"
              value={dateRange}
              onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              sx={{ minWidth: 130, bgcolor: "background.paper" }}
              SelectProps={{ sx: { fontWeight: 600, fontSize: "0.85rem" } }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </TextField>

            {/* Status Filter */}
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              sx={{ minWidth: 130, bgcolor: "background.paper" }}
              SelectProps={{ sx: { fontWeight: 600, fontSize: "0.85rem" } }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="complete">Complete</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
            </TextField>

            {/* Refresh */}
            <Tooltip title="Refresh">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
                  onClick={loadSubmissionsData}
                  disabled={reloading}
                  sx={{ fontWeight: 600, fontSize: "0.8rem" }}
                >
                  Refresh
                </Button>
              </span>
            </Tooltip>

            {/* Export CSV */}
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => handleExportCSV()}
              disabled={exporting || submissions.length === 0}
              sx={{ fontWeight: 600, fontSize: "0.8rem" }}
            >
              Export CSV
            </Button>

            {/* AI Insights */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setOpenInsightsModal(true)}
              sx={{
                fontWeight: 700,
                fontSize: "0.8rem",
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                "&:hover": { background: "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)" },
              }}
            >
              AI Insights
            </Button>
          </Stack>
        }
      />

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY KPI STRIP (ALL REAL POSTGRESQL NUMBERS)
         ───────────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Responses"
            value={summaryMetrics.total}
            color="#4F46E5"
            subtitle="PostgreSQL submissions"
            trend="DB Live"
            trendType="neutral"
            icon={<AssignmentTurnedInRoundedIcon sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <StatCard
            title="Complete"
            value={summaryMetrics.complete}
            color="#10B981"
            subtitle="Fully submitted"
            trend="Submitted"
            trendType="success"
            icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <StatCard
            title="Partial"
            value={summaryMetrics.partial}
            color="#F59E0B"
            subtitle="Incomplete sessions"
            trend="Draft"
            trendType="warning"
            icon={<PendingActionsRoundedIcon sx={{ fontSize: 20 }} />}
          />
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          3. BULK ACTIONS TOOLBAR (VISIBLE WHEN ROWS ARE SELECTED)
         ───────────────────────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 3,
            borderRadius: 2.5,
            bgcolor: "#EEF2FF",
            border: "1px solid #C7D2FE",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.08)",
          }}
        >
          <Typography variant="body2" fontWeight={800} color="#4F46E5">
            {selectedIds.length} response(s) selected
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedIds([])}
              sx={{ fontWeight: 600, fontSize: "0.775rem", textTransform: "none", borderColor: "#C7D2FE", color: "#4F46E5" }}
            >
              Clear Selection
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => handleExportCSV()}
              sx={{ fontWeight: 700, fontSize: "0.775rem", textTransform: "none", borderColor: "#C7D2FE", color: "#4F46E5" }}
            >
              Export Selected
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                setDeleteTargetId(null);
                setOpenDeleteModal(true);
              }}
              sx={{ fontWeight: 700, fontSize: "0.775rem", textTransform: "none", px: 2 }}
            >
              Delete Selected
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. RESPONSES DATA TABLE / EMPTY STATE
         ───────────────────────────────────────────────────────────── */}
      {reloading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
        </Box>
      ) : sortedSubmissions.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 10,
            px: 2,
            borderRadius: 3.5,
            border: "1px dashed #CBD5E1",
            bgcolor: "#FFFFFF",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <InboxRoundedIcon sx={{ fontSize: 48, color: "#94A3B8" }} />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
              No responses yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, color: "#64748B" }}>
              Responses submitted through your published forms will appear here.
            </Typography>
          </Box>
        </Paper>
      ) : (
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
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                    <TableSortLabel
                      active={orderBy === "respondent"}
                      direction={orderBy === "respondent" ? order : "asc"}
                      onClick={() => handleRequestSort("respondent")}
                    >
                      RESPONDENT
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                    <TableSortLabel
                      active={orderBy === "form_title"}
                      direction={orderBy === "form_title" ? order : "asc"}
                      onClick={() => handleRequestSort("form_title")}
                    >
                      FORM
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                    <TableSortLabel
                      active={orderBy === "submitted_at"}
                      direction={orderBy === "submitted_at" ? order : "asc"}
                      onClick={() => handleRequestSort("submitted_at")}
                    >
                      SUBMITTED
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                    STATUS
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedSubmissions.map((sub) => {
                  const isChecked = selectedIds.includes(sub.id);

                  return (
                    <TableRow
                      key={sub.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        "& .MuiTableCell-root": { borderColor: "#F1F5F9", py: 2 },
                      }}
                      onClick={() => {
                        setViewingResponse(sub);
                        setOpenViewModal(true);
                      }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => handleSelectOne(sub.id)}
                        />
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>
                        {sub.respondent}
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#4F46E5" }}>
                        {sub.form_title}
                      </TableCell>

                      <TableCell sx={{ fontSize: "0.8rem", color: "#64748B" }}>
                        {formatDate(sub.submitted_at)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={sub.status}
                          size="small"
                          sx={{
                            fontSize: "0.675rem",
                            fontWeight: 700,
                            height: 22,
                            bgcolor: sub.status === "Complete" ? "#ECFDF5" : "#FFF7ED",
                            color: sub.status === "Complete" ? "#059669" : "#D97706",
                            border: `1px solid ${sub.status === "Complete" ? "#A7F3D0" : "#FDE68A"}`,
                          }}
                        />
                      </TableCell>

                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Response Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setViewingResponse(sub);
                                setOpenViewModal(true);
                              }}
                              sx={{ color: "#4F46E5" }}
                            >
                              <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Response">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDeleteTargetId(sub.id);
                                setOpenDeleteModal(true);
                              }}
                              sx={{ color: "#EF4444" }}
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {pageCount > 1 && (
            <Box p={2.5} display="flex" justifyContent="space-between" alignItems="center" borderTop="1px solid #E2E8F0" bgcolor="#FAFAFA">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, sortedSubmissions.length)} of {sortedSubmissions.length} responses
              </Typography>

              <Pagination
                count={pageCount}
                page={page}
                onChange={(e, p) => setPage(p)}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. VIEW RESPONSE DETAILS MODAL / DRAWER
         ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 3,
            pb: 2,
            bgcolor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              Response {viewingResponse?.subCode}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
              Form: {viewingResponse?.form_title}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handlePrintResponse}
              sx={{ textTransform: "none", fontWeight: 700, borderColor: "#CBD5E1" }}
            >
              Print
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => handleExportCSV([viewingResponse])}
              sx={{ textTransform: "none", fontWeight: 700, borderColor: "#CBD5E1" }}
            >
              Export
            </Button>
            <IconButton size="small" onClick={() => setOpenViewModal(false)} sx={{ color: "#94A3B8" }}>
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#FFFFFF" }}>
          {viewingResponse && (
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Respondent Information Card */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid #E2E8F0" }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 1.5, color: "#64748B" }}>
                  Respondent Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Respondent Name / Email</Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>
                      {viewingResponse.respondent}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">Submitted Timestamp</Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>
                      {formatDate(viewingResponse.submitted_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary" display="block">Completion Status</Typography>
                    <Chip
                      label={viewingResponse.status}
                      size="small"
                      sx={{
                        mt: 0.5,
                        fontSize: "0.675rem",
                        fontWeight: 800,
                        height: 22,
                        bgcolor: viewingResponse.status === "Complete" ? "#ECFDF5" : "#FFF7ED",
                        color: viewingResponse.status === "Complete" ? "#059669" : "#D97706",
                        border: `1px solid ${viewingResponse.status === "Complete" ? "#A7F3D0" : "#FDE68A"}`,
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Answers Section */}
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
                  Submitted Answers ({viewingResponse.answers?.length || 0} questions)
                </Typography>

                <Stack spacing={2}>
                  {(viewingResponse.answers || []).map((ans, idx) => (
                    <Paper key={idx} elevation={0} sx={{ p: 2.2, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#4F46E5" }}>
                          {ans.label}
                        </Typography>
                        <Chip label={ans.field_type} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, bgcolor: "#F1F5F9" }} />
                      </Box>
                      {ans.value ? (
                        ["file_upload", "image_upload"].includes(ans.field_type) || String(ans.value).startsWith("/uploads") || String(ans.value).startsWith("http") ? (
                          <Box display="flex" alignItems="center" gap={1.5} mt={0.5}>
                            {(ans.field_type === "image_upload" || String(ans.value).match(/\.(png|jpg|jpeg|gif|webp)$/i)) && (
                              <Box
                                component="img"
                                src={ans.value}
                                alt="Uploaded file preview"
                                sx={{ width: 52, height: 52, borderRadius: 2, objectFit: "cover", border: "1px solid #CBD5E1" }}
                              />
                            )}
                            <Button
                              component="a"
                              href={ans.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              variant="outlined"
                              size="small"
                              startIcon={<FileDownloadRoundedIcon sx={{ fontSize: 16 }} />}
                              sx={{ fontWeight: 700, fontSize: "0.775rem", textTransform: "none", borderColor: "#CBD5E1" }}
                            >
                              View / Download File ({ans.value.split("/").pop()})
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {ans.value}
                          </Typography>
                        )
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", color: "#94A3B8" }}>
                          — (No answer provided)
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, justifyContent: "space-between", bgcolor: "#FAFAFA", borderTop: "1px solid #E2E8F0" }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              setDeleteTargetId(viewingResponse?.id);
              setOpenDeleteModal(true);
            }}
            sx={{ fontWeight: 700 }}
          >
            Delete Response
          </Button>

          <Button variant="contained" onClick={() => setOpenViewModal(false)} sx={{ bgcolor: "#4F46E5", fontWeight: 700, px: 3 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          DELETION CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Confirm Response Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B" }}>
            Are you sure you want to delete {deleteTargetId ? "this submission" : `${selectedIds.length} selected submission(s)`}? This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={() => setOpenDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleConfirmDelete}
            sx={{ fontWeight: 700 }}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Response Insights Dashboard Modal */}
      <AIResponseInsightsModal
        open={openInsightsModal}
        onClose={() => setOpenInsightsModal(false)}
        formId={selectedFormId}
        formTitle={forms.find((f) => String(f.id) === String(selectedFormId))?.title}
      />
    </Box>
  );
}