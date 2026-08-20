import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  CardContent,
  CardActions,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  ListItemIcon,
  Chip,
  Stack,
  Pagination,
  Tooltip,
  InputAdornment,
  Checkbox,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import DesignServicesRoundedIcon from "@mui/icons-material/DesignServicesRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import FileCopyRoundedIcon from "@mui/icons-material/FileCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";

import api from "../../api/api";

export default function Forms() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "published" | "draft" | "archived"
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "most_responses"
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  // Popover menu action anchor states
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);

  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Selection & Deletion State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFormIds, setSelectedFormIds] = useState([]);
  const [openBulkDelete, setOpenBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Share Dialog state
  const [openShare, setOpenShare] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  // Preview Modal state
  const [openPreview, setOpenPreview] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);

  useEffect(() => {
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

  async function loadForms() {
    try {
      setLoading(true);
      const res = await api.get("/forms/");
      const fetchedForms = (res.data || []).map((f) => ({
        ...f,
        publicLink: f.public_link,
        latestVersionId: f.latest_version_id || f.latestVersionId,
        submissionsCount: f.submissions_count || 0,
        fieldsCount: f.fields_count || 0,
        completionRate: (f.submissions_count || 0) > 0 ? "100%" : "0%",
      }));

      setForms(fetchedForms);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load forms", { id: "forms-load-error" });
    } finally {
      setLoading(false);
    }
  }

  // Bulk Delete Selected Forms
  const handleConfirmBulkDelete = async () => {
    if (selectedFormIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await Promise.all(
        selectedFormIds.map((id) =>
          api.delete(`/forms/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          })
        )
      );
      toast.success(`Successfully deleted ${selectedFormIds.length} form(s)!`);
      setOpenBulkDelete(false);
      setSelectedFormIds([]);
      setIsSelectMode(false);
      loadForms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected forms");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Create Form from Scratch
  const handleCreateForm = async () => {
    if (!createTitle.trim()) {
      toast.error("Form title is required");
      return;
    }

    try {
      setCreating(true);
      const formRes = await api.post(
        "/forms/",
        { title: createTitle, description: createDesc },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const newForm = formRes.data;

      toast.success("Form created successfully!");
      setOpenCreate(false);
      setCreateTitle("");
      setCreateDesc("");
      navigate(`/create-form?id=${newForm.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  // Duplicate Form Schema via Backend API
  const handleDuplicateForm = async (targetForm) => {
    try {
      toast.loading(`Duplicating "${targetForm.title}"...`, { id: "dup" });

      await api.post(
        `/forms/${targetForm.id}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      toast.success("Form duplicated successfully!", { id: "dup" });
      loadForms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate form", { id: "dup" });
    }
  };

  // Archive Form in Database
  const handleArchiveForm = async (targetForm) => {
    try {
      toast.loading(`Archiving "${targetForm.title}"...`, { id: "arch" });
      await api.put(
        `/forms/${targetForm.id}`,
        { status: "archived" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Form archived successfully!", { id: "arch" });
      loadForms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to archive form", { id: "arch" });
    }
  };

  // Delete Form from Database
  const handleDeleteForm = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/forms/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Form deleted successfully");
      setOpenDelete(false);
      setDeleteTarget(null);
      loadForms();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete form");
    } finally {
      setDeleting(false);
    }
  };

  // Popover Menu Handlers
  const openMenu = (e, form) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuTarget(form);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuTarget(null);
  };

  // Filtering & Sorting Logic
  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(search.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && form.status === statusFilter;
  });

  const sortedForms = [...filteredForms].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (sortBy === "most_responses") {
      return (b.submissionsCount || 0) - (a.submissionsCount || 0);
    }
    return 0;
  });

  // Pagination Logic
  const pageCount = Math.ceil(sortedForms.length / rowsPerPage);
  const paginatedForms = sortedForms.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 4 }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION
         ───────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.03em", color: "#0F172A" }}>
            Forms Portfolio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, color: "#64748B" }}>
            Design, publish, archive, and manage your dynamic forms
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant={isSelectMode ? "contained" : "outlined"}
            color={isSelectMode ? "secondary" : "inherit"}
            startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => {
              setIsSelectMode((prev) => !prev);
              if (isSelectMode) setSelectedFormIds([]);
            }}
            sx={{
              fontWeight: 600,
              fontSize: "0.85rem",
              px: 2,
              py: 0.9,
              borderRadius: 2,
              borderColor: "divider",
            }}
          >
            {isSelectMode ? "Done Selecting" : "Select Forms to Delete"}
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => setOpenCreate(true)}
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
          2. SEARCH, FILTER & SORT CONTROLS BAR
         ───────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <TextField
          placeholder="Search forms by title or description..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ flexGrow: 1, width: { xs: "100%", sm: "auto" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "flex-end" }}>
          {/* Filter Dropdown */}
          <TextField
            select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ width: 140 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListRoundedIcon sx={{ color: "#64748B", fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="draft">Drafts</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>

          {/* Sort Dropdown */}
          <TextField
            select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="small"
            sx={{ width: 165 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SortRoundedIcon sx={{ color: "#64748B", fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="most_responses">Most Responses</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {/* ─────────────────────────────────────────────────────────────
          BULK ACTIONS BAR (SELECT ALL & BATCH DELETE)
         ───────────────────────────────────────────────────────────── */}
      {!loading && isSelectMode && sortedForms.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2.5,
            mb: 3,
            borderRadius: 2.5,
            border: selectedFormIds.length > 0 ? "1px solid #C7D2FE" : "1px solid",
            borderColor: selectedFormIds.length > 0 ? "#C7D2FE" : "divider",
            bgcolor: selectedFormIds.length > 0 ? (theme) => (theme.palette.mode === "dark" ? "#1E1B4B" : "#EEF2FF") : "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            transition: "all 0.2s ease",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Checkbox
              size="small"
              checked={sortedForms.length > 0 && selectedFormIds.length === sortedForms.length}
              indeterminate={selectedFormIds.length > 0 && selectedFormIds.length < sortedForms.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedFormIds(sortedForms.map((f) => f.id));
                } else {
                  setSelectedFormIds([]);
                }
              }}
              sx={{ color: "#6366F1", "&.Mui-checked": { color: "#6366F1" } }}
            />
            <Typography variant="body2" fontWeight={700} sx={{ color: "text.primary", fontSize: "0.875rem" }}>
              {selectedFormIds.length > 0
                ? `${selectedFormIds.length} of ${sortedForms.length} forms selected`
                : "Select All Forms"}
            </Typography>
          </Box>

          {selectedFormIds.length > 0 && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedFormIds([])}
                sx={{ fontWeight: 600, textTransform: "none", borderRadius: 1.8, fontSize: "0.8rem" }}
              >
                Cancel Selection
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setOpenBulkDelete(true)}
                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.8, px: 2, fontSize: "0.8rem" }}
              >
                Delete Selected ({selectedFormIds.length})
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. FORMS CARDS GRID (PAGINATED WITH METADATA & 7 ACTIONS)
         ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
        </Box>
      ) : paginatedForms.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 10,
            px: 2,
            borderRadius: 3,
            border: "1px dashed #CBD5E1",
            bgcolor: "background.paper",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <InsertDriveFileRoundedIcon sx={{ fontSize: 44, color: "#94A3B8" }} />
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: "text.primary" }}>
              No forms matching filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {search || statusFilter !== "all"
                ? "Try clearing your search query or status filter."
                : "Create your first form to get started."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenCreate(true)}
            sx={{ fontWeight: 600 }}
          >
            Create Form
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {paginatedForms.map((form) => {
            const isPublished = form.status === "published";
            const isArchived = form.status === "archived";
            const isSelected = selectedFormIds.includes(form.id);

            return (
              <Grid item xs={12} sm={6} lg={4} key={form.id}>
                <Paper
                  component={motion.div}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  elevation={0}
                  sx={{
                    border: isSelected ? "2px solid #6366F1" : "1px solid",
                    borderColor: isSelected ? "#6366F1" : "divider",
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isSelected
                      ? "0 8px 25px -4px rgba(99, 102, 241, 0.25)"
                      : "0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
                    "&:hover": {
                      borderColor: "#6366F1",
                      boxShadow: "0 14px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(79, 70, 229, 0.06)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, pb: 1.5 }}>
                    {/* Top Checkbox, Status Pill & Context Action Menu */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {isSelectMode && (
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                setSelectedFormIds(selectedFormIds.filter((id) => id !== form.id));
                              } else {
                                setSelectedFormIds([...selectedFormIds, form.id]);
                              }
                            }}
                            sx={{ p: 0.2, color: "text.secondary", "&.Mui-checked": { color: "#6366F1" } }}
                          />
                        )}
                        <Chip
                          label={form.status}
                          size="small"
                          sx={{
                            fontSize: "0.675rem",
                            fontWeight: 700,
                            height: 22,
                            textTransform: "capitalize",
                            bgcolor: isPublished ? "#ECFDF5" : isArchived ? "#F1F5F9" : "#FFF7ED",
                            color: isPublished ? "#059669" : isArchived ? "#64748B" : "#D97706",
                            border: `1px solid ${isPublished ? "#A7F3D0" : isArchived ? "#E2E8F0" : "#FDE68A"}`,
                          }}
                        />
                        {form.is_scheduling_enabled && (
                          <Chip
                            label="Scheduled"
                            size="small"
                            sx={{
                              fontSize: "0.675rem",
                              fontWeight: 700,
                              height: 22,
                              bgcolor: "#EEF2FF",
                              color: "#4F46E5",
                              border: "1px solid #C7D2FE",
                            }}
                          />
                        )}
                        {form.is_response_limit_enabled && form.max_response_limit && (
                          <Chip
                            label={`${form.submissions_count ?? 0}/${form.max_response_limit}`}
                            size="small"
                            sx={{
                              fontSize: "0.675rem",
                              fontWeight: 700,
                              height: 22,
                              bgcolor: (form.submissions_count ?? 0) >= form.max_response_limit ? "#FEF2F2" : "#FFF7ED",
                              color: (form.submissions_count ?? 0) >= form.max_response_limit ? "#EF4444" : "#D97706",
                              border: `1px solid ${(form.submissions_count ?? 0) >= form.max_response_limit ? "#FECACA" : "#FDE68A"}`,
                            }}
                          />
                        )}
                      </Box>

                      <IconButton size="small" onClick={(e) => openMenu(e, form)} sx={{ color: "#64748B" }}>
                        <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>

                    {/* Title & Description */}
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.8, letterSpacing: "-0.01em", color: "#0F172A", fontSize: "1.05rem" }}>
                      {form.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        height: 38,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.4,
                        fontSize: "0.825rem",
                        color: "#64748B",
                      }}
                    >
                      {form.description || "No description provided"}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: "#F1F5F9" }} />

                    {/* Response Count & Completion Rate */}
                    <Grid container spacing={2} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.675rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#94A3B8" }}>
                          Responses
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.1rem" }}>
                          {form.submissionsCount}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.675rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "#94A3B8" }}>
                          Completion Rate
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ color: "#10B981", fontSize: "1.1rem" }}>
                          {form.completionRate}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Created & Updated Dates */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: "1px dashed #F1F5F9" }}>
                      <Typography variant="caption" sx={{ fontSize: "0.725rem", color: "#94A3B8", display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                        <CalendarTodayRoundedIcon sx={{ fontSize: 11 }} />
                        Created: {new Date(form.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </Typography>
                      {form.updated_at && (
                        <Typography variant="caption" sx={{ fontSize: "0.725rem", color: "#94A3B8", display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                          <UpdateRoundedIcon sx={{ fontSize: 11 }} />
                          Updated: {new Date(form.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  {/* Card Quick Buttons Footer */}
                  <CardActions sx={{ px: 3, pb: 2.5, pt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Preview Form">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPreviewTarget(form);
                            setOpenPreview(true);
                          }}
                          sx={{ color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 1.5 }}
                        >
                          <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      {form.publicLink && (
                        <Tooltip title="Share Public Link">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setShareTarget(form);
                              setOpenShare(true);
                            }}
                            sx={{ color: "#4F46E5", border: "1px solid #C7D2FE", borderRadius: 1.5, bgcolor: "#EEF2FF" }}
                          >
                            <LinkRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>

                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<DesignServicesRoundedIcon sx={{ fontSize: 14 }} />}
                      onClick={() => navigate(`/create-form?id=${form.id}`)}
                      sx={{ fontWeight: 600, fontSize: "0.775rem", textTransform: "none", py: 0.7, px: 2, borderRadius: 1.8 }}
                    >
                      Edit Form
                    </Button>
                  </CardActions>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Pagination Footer Controls */}
      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" pt={2}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(e, p) => setPage(p)}
            color="primary"
            size="medium"
          />
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          POPOVER ACTIONS MENU (7 ACTIONS)
         ───────────────────────────────────────────────────────────── */}
      <Popover
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 0,
          sx: { border: "1px solid #E2E8F0", width: 185, p: 0.5, borderRadius: 2, boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)" },
        }}
      >
        <List dense disablePadding>
          {/* Action 1: Edit */}
          <ListItemButton
            onClick={() => {
              navigate(`/create-form?id=${menuTarget?.id}`);
              closeMenu();
            }}
          >
            <ListItemIcon sx={{ minWidth: 26, color: "#4F46E5" }}>
              <DesignServicesRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Edit Form" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
          </ListItemButton>

          {/* Action 2: Preview */}
          <ListItemButton
            onClick={() => {
              const target = menuTarget;
              closeMenu();
              setPreviewTarget(target);
              setOpenPreview(true);
            }}
          >
            <ListItemIcon sx={{ minWidth: 26, color: "#06B6D4" }}>
              <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Preview Schema" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
          </ListItemButton>

          {/* Action 3: Analytics */}
          <ListItemButton
            onClick={() => {
              navigate(`/analytics?formId=${menuTarget?.id}`);
              closeMenu();
            }}
          >
            <ListItemIcon sx={{ minWidth: 26, color: "#3B82F6" }}>
              <AssessmentRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Analytics" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
          </ListItemButton>

          {/* Action 4: Share */}
          {menuTarget?.publicLink && (
            <ListItemButton
              onClick={() => {
                const target = menuTarget;
                closeMenu();
                setShareTarget(target);
                setOpenShare(true);
              }}
            >
              <ListItemIcon sx={{ minWidth: 26, color: "#10B981" }}>
                <LinkRoundedIcon sx={{ fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText primary="Share Public Link" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
            </ListItemButton>
          )}

          {/* Action 5: Duplicate */}
          <ListItemButton
            onClick={() => {
              handleDuplicateForm(menuTarget);
              closeMenu();
            }}
          >
            <ListItemIcon sx={{ minWidth: 26, color: "#8B5CF6" }}>
              <FileCopyRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Duplicate" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
          </ListItemButton>

          {/* Action 6: Archive */}
          {menuTarget?.status !== "archived" && (
            <ListItemButton
              onClick={() => {
                handleArchiveForm(menuTarget);
                closeMenu();
              }}
            >
              <ListItemIcon sx={{ minWidth: 26, color: "#F59E0B" }}>
                <ArchiveRoundedIcon sx={{ fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText primary="Archive Form" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
            </ListItemButton>
          )}

          <Divider sx={{ my: 0.5 }} />

          {/* Action 7: Delete */}
          <ListItemButton
            onClick={() => {
              setDeleteTarget(menuTarget);
              setOpenDelete(true);
              closeMenu();
            }}
            sx={{ color: "#EF4444" }}
          >
            <ListItemIcon sx={{ minWidth: 26, color: "#EF4444" }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Delete Form" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }} />
          </ListItemButton>
        </List>
      </Popover>

      {/* ─────────────────────────────────────────────────────────────
          SHARE PUBLIC LINK DIALOG MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openShare} onClose={() => setOpenShare(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Share Public Form Link
        </DialogTitle>
        <DialogContent display="flex" flexDirection="column" gap={2}>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mb: 2 }}>
            Anyone with this link can view and submit responses to <strong>"{shareTarget?.title}"</strong>.
          </Typography>

          <TextField
            fullWidth
            size="small"
            readOnly
            value={`${window.location.origin}/public/forms/${shareTarget?.publicLink}`}
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/public/forms/${shareTarget?.publicLink}`);
                    toast.success("Public link copied to clipboard!");
                  }}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", borderRadius: 1.5 }}
                >
                  Copy URL
                </Button>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenShare(false)} sx={{ borderColor: "#E2E8F0" }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => window.open(`/public/forms/${shareTarget?.publicLink}`, "_blank")}
          >
            Open Live Form
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          DELETE CONFIRMATION DIALOG MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#EF4444" }}>
          Confirm Form Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete <strong>"{deleteTarget?.title}"</strong>? All associated versions and submitted responses will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outlined" onClick={() => setOpenDelete(false)} disabled={deleting} sx={{ borderColor: "#E2E8F0" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteForm}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          >
            {deleting ? "Deleting..." : "Delete Form"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          BULK DELETE CONFIRMATION DIALOG MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openBulkDelete} onClose={() => setOpenBulkDelete(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#EF4444" }}>
          Delete {selectedFormIds.length} Selected Forms?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete these <strong>{selectedFormIds.length}</strong> selected forms? All associated versions, fields, and response entries will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outlined" onClick={() => setOpenBulkDelete(false)} disabled={bulkDeleting} sx={{ borderColor: "#E2E8F0" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmBulkDelete}
            disabled={bulkDeleting}
            startIcon={bulkDeleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
          >
            {bulkDeleting ? "Deleting..." : `Delete ${selectedFormIds.length} Forms`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          PREVIEW SCHEMA DIALOG MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Form Schema Preview: {previewTarget?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {previewTarget?.description || "No description provided"}
          </Typography>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700} color="#4F46E5" display="block" mb={1}>
              METADATA SUMMARY
            </Typography>
            <Typography variant="body2" display="block">Status: <strong>{previewTarget?.status}</strong></Typography>
            <Typography variant="body2" display="block">Recorded Submissions: <strong>{previewTarget?.submissionsCount}</strong></Typography>
            <Typography variant="body2" display="block">Completion Rate: <strong>{previewTarget?.completionRate}</strong></Typography>
            <Typography variant="body2" display="block">Created At: <strong>{new Date(previewTarget?.created_at || Date.now()).toLocaleString()}</strong></Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenPreview(false)}>
            Close Preview
          </Button>
          <Button variant="contained" color="primary" onClick={() => { setOpenPreview(false); navigate(`/create-form?id=${previewTarget?.id}`); }}>
            Edit in Form Builder
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          CREATE NEW FORM DIALOG MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Create New Form Schema
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Form Title"
              fullWidth
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. User Feedback Survey 2026"
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Briefly describe the purpose of this form..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outlined" onClick={() => setOpenCreate(false)} disabled={creating} sx={{ borderColor: "#E2E8F0" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateForm}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon sx={{ fontSize: 16 }} />}
          >
            {creating ? "Creating..." : "Create & Edit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}