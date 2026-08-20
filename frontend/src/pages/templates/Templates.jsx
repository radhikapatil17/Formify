import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  Skeleton,
  Tooltip,
  IconButton,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";

import StatCard from "../../components/dashboard/StatCard";
import TemplateCard from "../../components/templates/TemplateCard";
import AiGeneratorDialog from "../../components/templates/AiGeneratorDialog";
import ImportTemplateModal from "../../components/templates/ImportTemplateModal";
import api from "../../api/api";

const CATEGORIES = [
  "All",
  "My Templates",
  "Feedback",
  "Survey",
  "Quiz",
  "Registration",
  "Job Application",
  "Contact Form",
  "Event Registration",
];

const ITEMS_PER_PAGE = 6;

export default function Templates() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [page, setPage] = useState(1);

  // Favorites & Recently Used state
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("formify_fav_templates") || "[]");
    } catch {
      return [];
    }
  });

  const [recentlyUsed, setRecentlyUsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("formify_recent_templates") || "[]");
    } catch {
      return [];
    }
  });

  // Modal dialog states
  const [openAiModal, setOpenAiModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Feedback");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Template Modal state
  const [editTemplate, setEditTemplate] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Feedback");
  const [editDesc, setEditDesc] = useState("");

  // Delete Confirmation Modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Share Modal state
  const [shareUrl, setShareUrl] = useState(null);

  // Fetch templates from backend database using 13 REST API endpoints
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/templates/");
      const fetched = (res.data || []).map((t) => ({
        ...t,
        questions: Array.isArray(t.template_schema) ? t.template_schema : (t.template_schema?.questions || []),
        is_custom: Boolean(t.owner_id),
      }));
      setTemplates(fetched);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load templates", { id: "tmpl-load-err" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Save favorites to localStorage & backend
  const toggleFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post("/templates/favorite", { template_id: id });
    } catch {}

    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem("formify_fav_templates", JSON.stringify(next));
      return next;
    });
  };

  // Filter & Sort Logic
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (selectedCategory === "My Templates") {
      result = result.filter((t) => t.is_custom);
    } else if (selectedCategory !== "All") {
      result = result.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (sortBy === "newest") {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [templates, selectedCategory, search, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE) || 1;
  const paginatedTemplates = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTemplates, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, search, sortBy]);

  // Statistics Calculations from Backend
  const totalCount = templates.length;
  const myTemplatesCount = templates.filter((t) => t.is_custom).length;
  const publicTemplatesCount = templates.filter((t) => !t.is_custom || t.is_public).length;
  const recentlyUsedCount = recentlyUsed.length;

  // 1-Click Instantiate Form from Template (Backend POST /templates/use)
  const handleUseTemplate = async (template) => {
    try {
      setActionLoading(true);
      const res = await api.post("/templates/use", { template_id: template.id });

      setRecentlyUsed((prev) => Array.from(new Set([template.id, ...prev])));
      localStorage.setItem("formify_recent_templates", JSON.stringify(Array.from(new Set([template.id, ...recentlyUsed]))));

      toast.success(`Form created from ${template.title}!`);
      setPreviewTemplate(null);
      navigate(`/create-form?id=${res.data.form_id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to instantiate form from template");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Custom Template Handler (Backend POST /templates/)
  const handleCreateTemplateSubmit = async () => {
    if (!newTemplateTitle.trim()) {
      toast.error("Template title is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.post("/templates/", {
        title: newTemplateTitle.trim(),
        category: newTemplateCategory,
        description: newTemplateDesc,
        template_schema: [
          { field_label: "Full Name", field_type: "text", is_required: true },
          { field_label: "Email Address", field_type: "email", is_required: true },
        ],
        is_public: false,
      });

      toast.success("Custom template created successfully!");
      setOpenCreateModal(false);
      setNewTemplateTitle("");
      setNewTemplateDesc("");
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save custom template");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Template Submit Handler (Backend PUT /templates/:id)
  const handleEditTemplateSubmit = async () => {
    if (!editTitle.trim()) {
      toast.error("Template title is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/templates/${editTemplate.id}`, {
        title: editTitle.trim(),
        category: editCategory,
        description: editDesc,
      });

      toast.success("Template updated successfully!");
      setEditTemplate(null);
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update template");
    } finally {
      setActionLoading(false);
    }
  };

  // Duplicate Template (Backend POST /templates/duplicate)
  const handleDuplicateTemplate = async (template) => {
    try {
      await api.post("/templates/duplicate", { template_id: template.id });
      toast.success(`Duplicated "${template.title}" successfully!`);
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate template");
    }
  };

  // Delete Template Confirm Handler (Backend DELETE /templates/:id)
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setActionLoading(true);
      await api.delete(`/templates/${deleteTargetId}`);
      toast.success("Template deleted successfully");
      setDeleteTargetId(null);
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to delete template");
    } finally {
      setActionLoading(false);
    }
  };

  // Archive / Restore Toggle (Backend POST /templates/archive)
  const handleToggleArchive = async (template) => {
    try {
      const res = await api.post("/templates/archive", { template_id: template.id });
      toast.success(res.data.message);
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to toggle archive state");
    }
  };

  // Publish / Private Toggle (Backend PUT /templates/:id)
  const handleTogglePublish = async (template) => {
    try {
      await api.put(`/templates/${template.id}`, {
        is_public: !template.is_public,
      });
      toast.success(`Template is now ${!template.is_public ? "public" : "private"}`);
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to toggle visibility");
    }
  };

  // Share Link Handler
  const handleShareTemplate = (template) => {
    const url = `${window.location.origin}/templates?id=${template.id}`;
    setShareUrl(url);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. BREADCRUMBS & PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <Box display="flex" flexDirection="column" gap={0.5}>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: "-0.03em", color: "#0F172A" }}>
          Templates
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B" }}>
          Browse, create, edit, and share custom form templates across your workspace
        </Typography>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. CONTROL BAR (SEARCH, DROPDOWNS, TOGGLE & ACTION BUTTONS)
         ───────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: "1px solid #E2E8F0",
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* Left Side: Search & Filter Dropdowns */}
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} sx={{ width: { xs: "100%", lg: "auto" } }}>
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              width: { xs: "100%", sm: 260 },
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
            }}
          >
            <SearchRoundedIcon sx={{ color: "#94A3B8", fontSize: 18, mr: 1 }} />
            <TextField
              variant="standard"
              placeholder="Search name, tags, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ disableUnderline: true, sx: { fontSize: "0.825rem", color: "#0F172A" } }}
            />
          </Paper>

          <TextField
            select
            size="small"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{ minWidth: 160, "& .MuiInputBase-root": { fontSize: "0.825rem", borderRadius: 2 } }}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat} sx={{ fontSize: "0.825rem" }}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 140, "& .MuiInputBase-root": { fontSize: "0.825rem", borderRadius: 2 } }}
          >
            <MenuItem value="newest" sx={{ fontSize: "0.825rem" }}>Newest</MenuItem>
            <MenuItem value="popular" sx={{ fontSize: "0.825rem" }}>Most Uses</MenuItem>
            <MenuItem value="title" sx={{ fontSize: "0.825rem" }}>Title A-Z</MenuItem>
          </TextField>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: "#F8FAFC", borderRadius: 2 }}
          >
            <ToggleButton value="grid" sx={{ px: 1.2, py: 0.5 }}>
              <Tooltip title="Grid View">
                <GridViewRoundedIcon sx={{ fontSize: 18, color: viewMode === "grid" ? "#4F46E5" : "#64748B" }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list" sx={{ px: 1.2, py: 0.5 }}>
              <Tooltip title="List View">
                <FormatListBulletedRoundedIcon sx={{ fontSize: 18, color: viewMode === "list" ? "#4F46E5" : "#64748B" }} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Right Side: Action Buttons */}
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.2} sx={{ width: { xs: "100%", lg: "auto" } }}>
          <Button
            variant="outlined"
            onClick={() => setOpenAiModal(true)}
            startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />}
            sx={{
              borderColor: "#DDD6FE",
              color: "#6D28D9",
              bgcolor: "#F5F3FF",
              fontWeight: 700,
              fontSize: "0.8rem",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "#EDE9FE", borderColor: "#C4B5FD" },
            }}
          >
            AI Generate Template
          </Button>

          <Button
            variant="contained"
            onClick={() => setOpenCreateModal(true)}
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: "#4F46E5",
              fontWeight: 700,
              fontSize: "0.8rem",
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Create Template
          </Button>

          <Button
            variant="outlined"
            onClick={() => setOpenImportModal(true)}
            startIcon={<FileUploadRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: "#E2E8F0",
              color: "#0F172A",
              fontWeight: 700,
              fontSize: "0.8rem",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            Import Template
          </Button>
        </Box>
      </Paper>

      {/* ─────────────────────────────────────────────────────────────
          3. REAL BACKEND STATISTICS CARDS
         ───────────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Templates" value={totalCount} subtitle="Available form schemas" icon={<LayersRoundedIcon sx={{ fontSize: 20 }} />} color="#4F46E5" bg="#EEF2FF" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="My Templates" value={myTemplatesCount} subtitle="Custom user templates" icon={<PersonRoundedIcon sx={{ fontSize: 20 }} />} color="#10B981" bg="#ECFDF5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Public Templates" value={publicTemplatesCount} subtitle="Shared gallery templates" icon={<PublicRoundedIcon sx={{ fontSize: 20 }} />} color="#3B82F6" bg="#EFF6FF" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Recently Used" value={recentlyUsedCount} subtitle="Instantiated in project" icon={<HistoryRoundedIcon sx={{ fontSize: 20 }} />} color="#F59E0B" bg="#FFFBEB" />
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          4. RESPONSIVE TEMPLATES GALLERY (SKELETON, EMPTY STATE, GRID/LIST)
         ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0" }}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
                <Skeleton variant="text" width="80%" height={28} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                <Box display="flex" gap={1}>
                  <Skeleton variant="rectangular" width="50%" height={32} sx={{ borderRadius: 1.5 }} />
                  <Skeleton variant="rectangular" width="50%" height={32} sx={{ borderRadius: 1.5 }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : filteredTemplates.length === 0 ? (
        <Paper elevation={0} sx={{ py: 8, px: 3, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: 3, bgcolor: "#FAFAFA" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
            <InboxRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", mb: 0.5 }}>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mb: 2 }}>
            No templates match your filters. Try searching for another term or create a new custom template.
          </Typography>
          <Button variant="outlined" size="small" onClick={() => { setSearch(""); setSelectedCategory("All"); }} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            Reset Filters
          </Button>
        </Paper>
      ) : viewMode === "grid" ? (
        <Grid container spacing={3}>
          {paginatedTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <TemplateCard
                template={template}
                isFavorite={favorites.includes(template.id)}
                viewMode="grid"
                onPreview={() => setPreviewTemplate(template)}
                onUseTemplate={() => handleUseTemplate(template)}
                onToggleFavorite={toggleFavorite}
                onDuplicate={() => handleDuplicateTemplate(template)}
                onEdit={() => {
                  setEditTemplate(template);
                  setEditTitle(template.title);
                  setEditCategory(template.category);
                  setEditDesc(template.description || "");
                }}
                onDelete={() => setDeleteTargetId(template.id)}
                onToggleArchive={() => handleToggleArchive(template)}
                onTogglePublish={() => handleTogglePublish(template)}
                onShare={() => handleShareTemplate(template)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        /* LIST VIEW */
        <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, overflow: "hidden", bgcolor: "#FFFFFF" }}>
          {paginatedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isFavorite={favorites.includes(template.id)}
              viewMode="list"
              onPreview={() => setPreviewTemplate(template)}
              onUseTemplate={() => handleUseTemplate(template)}
              onToggleFavorite={toggleFavorite}
              onDuplicate={() => handleDuplicateTemplate(template)}
              onEdit={() => {
                setEditTemplate(template);
                setEditTitle(template.title);
                setEditCategory(template.category);
                setEditDesc(template.description || "");
              }}
              onDelete={() => setDeleteTargetId(template.id)}
              onToggleArchive={() => handleToggleArchive(template)}
              onTogglePublish={() => handleTogglePublish(template)}
              onShare={() => handleShareTemplate(template)}
            />
          ))}
        </Paper>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. PAGINATION CONTROLS
         ───────────────────────────────────────────────────────────── */}
      {!loading && filteredTemplates.length > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} color="primary" shape="rounded" />
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. EDIT TEMPLATE SCHEMA DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(editTemplate)} onClose={() => setEditTemplate(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Edit Template Schema
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Template Title" fullWidth size="small" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            <TextField select label="Category" fullWidth size="small" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c !== "All" && c !== "My Templates").map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField label="Description" fullWidth multiline rows={3} size="small" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setEditTemplate(null)}>Cancel</Button>
          <Button variant="contained" disabled={actionLoading} onClick={handleEditTemplateSubmit} sx={{ bgcolor: "#4F46E5", fontWeight: 700 }}>
            {actionLoading ? "Updating..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          7. DELETE CONFIRMATION MODAL DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(deleteTargetId)} onClose={() => setDeleteTargetId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#EF4444", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningRoundedIcon sx={{ fontSize: 22 }} /> Delete Template
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this custom template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={actionLoading} onClick={handleConfirmDelete} sx={{ fontWeight: 700 }}>
            {actionLoading ? "Deleting..." : "Delete Template"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          8. SHARE LINK MODAL DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(shareUrl)} onClose={() => setShareUrl(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Share Template Public Link
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Copy this link to share this template with team members:
          </Typography>
          <Box display="flex" gap={1}>
            <TextField fullWidth size="small" value={shareUrl || ""} readOnly />
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success("Copied template link to clipboard!");
              }}
              sx={{ bgcolor: "#EEF2FF", color: "#4F46E5" }}
            >
              <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setShareUrl(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          9. PREVIEW SCHEMA MODAL DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(previewTemplate)} onClose={() => setPreviewTemplate(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {previewTemplate && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
              {previewTemplate.title} Schema Preview
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" paragraph>
                {previewTemplate.description}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <Chip label={previewTemplate.category} size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700 }} />
                <Chip label={previewTemplate.version || "v1.0"} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Box>

              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: "block", textTransform: "uppercase", mb: 1 }}>
                Included Fields &amp; Input Types:
              </Typography>
              <List dense>
                {(previewTemplate.questions || []).map((q, idx) => (
                  <ListItem key={idx} sx={{ px: 1, py: 0.8, bgcolor: "#F8FAFC", borderRadius: 1.5, mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 28, color: "#4F46E5" }}>
                      <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={q.field_label}
                      secondary={`Type: ${q.field_type}${q.is_required ? " • Required" : ""}`}
                      primaryTypographyProps={{ fontSize: "0.825rem", fontWeight: 700, color: "#0F172A" }}
                      secondaryTypographyProps={{ fontSize: "0.725rem" }}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button variant="contained" disabled={actionLoading} onClick={() => handleUseTemplate(previewTemplate)} sx={{ bgcolor: "#4F46E5", fontWeight: 700 }}>
                {actionLoading ? "Instantiating..." : "Use This Template"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          10. CREATE TEMPLATE MODAL DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Create Custom Template
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Template Title" fullWidth size="small" value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)} required />
            <TextField select label="Category" fullWidth size="small" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c !== "All" && c !== "My Templates").map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField label="Description" fullWidth multiline rows={3} size="small" value={newTemplateDesc} onChange={(e) => setNewTemplateDesc(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenCreateModal(false)}>Cancel</Button>
          <Button variant="contained" disabled={actionLoading} onClick={handleCreateTemplateSubmit} sx={{ bgcolor: "#4F46E5", fontWeight: 700 }}>
            {actionLoading ? "Saving..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Template Modal Dialog */}
      <ImportTemplateModal
        open={openImportModal}
        onClose={() => setOpenImportModal(false)}
        onTemplateImported={loadTemplates}
      />

      {/* Gemini AI Generator Dialog */}
      <AiGeneratorDialog
        open={openAiModal}
        onClose={() => setOpenAiModal(false)}
        onTemplateSaved={loadTemplates}
      />
    </Box>
  );
}
