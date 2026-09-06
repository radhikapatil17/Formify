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
  Stack,
  InputAdornment,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
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
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";

import StatCard from "../../components/dashboard/StatCard";
import TemplateCard from "../../components/templates/TemplateCard";
import AiGeneratorDialog from "../../components/templates/AiGeneratorDialog";
import ImportTemplateModal from "../../components/templates/ImportTemplateModal";
import PageHeader from "../../components/common/PageHeader";
import api from "../../api/api";

const CATEGORIES = [
  "All",
  "Official Library",
  "My Templates",
  "Feedback",
  "Registration",
  "Survey",
  "Quiz",
  "Job Application",
  "Contact Form",
  "Event Registration",
];

const ITEMS_PER_PAGE = 9;

export default function Templates() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
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

  // Fetch templates from backend database
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

    if (selectedCategory === "Official Library") {
      result = result.filter((t) => !t.is_custom);
    } else if (selectedCategory === "My Templates") {
      result = result.filter((t) => t.is_custom);
    } else if (selectedCategory !== "All") {
      result = result.filter((t) => (t.category || "").toLowerCase().includes(selectedCategory.toLowerCase()));
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

    if (sortBy === "popular") {
      result.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
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
  const officialCount = templates.filter((t) => !t.is_custom).length;
  const myTemplatesCount = templates.filter((t) => t.is_custom).length;
  const recentlyUsedCount = recentlyUsed.length;

  // 1-Click Instantiate Form from Template (Backend POST /templates/use)
  const handleUseTemplate = async (template) => {
    try {
      setActionLoading(true);
      const res = await api.post("/templates/use", { template_id: template.id });

      setRecentlyUsed((prev) => Array.from(new Set([template.id, ...prev])));
      localStorage.setItem("formify_recent_templates", JSON.stringify(Array.from(new Set([template.id, ...recentlyUsed]))));

      toast.success(`Form created from "${template.title}"!`);
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
          1. PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Template Marketplace"
        subtitle="Explore curated templates or start from your own custom blueprints"
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<FileUploadRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setOpenImportModal(true)}
              sx={{ fontWeight: 700, fontSize: "0.825rem", borderRadius: 2.5, borderColor: "#E2E8F0" }}
            >
              Import JSON
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setOpenCreateModal(true)}
              sx={{ fontWeight: 700, fontSize: "0.825rem", borderRadius: 2.5, borderColor: "#CBD5E1", color: "#0F172A" }}
            >
              New Custom
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: "#FFFFFF" }} />}
              onClick={() => setOpenAiModal(true)}
              sx={{
                fontWeight: 700,
                fontSize: "0.825rem",
                borderRadius: 2.5,
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                "&:hover": { background: "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)" },
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
              }}
            >
              Build with AI
            </Button>
          </Stack>
        }
      />

      {/* ─────────────────────────────────────────────────────────────
          2. METRICS OVERVIEW (SINGLE ROW)
         ───────────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Templates"
            value={totalCount}
            subtitle="Library & custom schemas"
            icon={<LayersRoundedIcon sx={{ fontSize: 20 }} />}
            color="#4F46E5"
            bg="#EEF2FF"
            trend="Live"
            trendType="neutral"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Official Curated"
            value={officialCount}
            subtitle="Ready-to-deploy templates"
            icon={<PublicRoundedIcon sx={{ fontSize: 20 }} />}
            color="#10B981"
            bg="#ECFDF5"
            trend="Verified"
            trendType="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Templates"
            value={myTemplatesCount}
            subtitle="Saved custom blueprints"
            icon={<PersonRoundedIcon sx={{ fontSize: 20 }} />}
            color="#3B82F6"
            bg="#EFF6FF"
            trend="Custom"
            trendType="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recently Used"
            value={recentlyUsedCount}
            subtitle="Instantiated in projects"
            icon={<HistoryRoundedIcon sx={{ fontSize: 20 }} />}
            color="#F59E0B"
            bg="#FFFBEB"
            trend="Active"
            trendType="warning"
          />
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & CONTROLS TOOLBAR
         ───────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: "1px solid #E2E8F0",
          borderRadius: 3.5,
          bgcolor: "#FFFFFF",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Top Controls: Search Input + Sort + View Mode */}
        <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={2}>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 360px" }, maxWidth: { md: 480 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")} edge="end">
                      <ClearRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { borderRadius: 2.5, bgcolor: "#F8FAFC", fontSize: "0.85rem" },
              }}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1.5}>
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 150, "& .MuiInputBase-root": { fontSize: "0.825rem", borderRadius: 2.5 } }}
            >
              <MenuItem value="popular" sx={{ fontSize: "0.825rem" }}>Most Popular</MenuItem>
              <MenuItem value="newest" sx={{ fontSize: "0.825rem" }}>Newest Added</MenuItem>
              <MenuItem value="title" sx={{ fontSize: "0.825rem" }}>Title (A-Z)</MenuItem>
            </TextField>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
              sx={{ bgcolor: "#F8FAFC", borderRadius: 2.5 }}
            >
              <ToggleButton value="grid" sx={{ px: 1.5, py: 0.6 }}>
                <Tooltip title="Grid View">
                  <GridViewRoundedIcon sx={{ fontSize: 18, color: viewMode === "grid" ? "#4F46E5" : "#64748B" }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list" sx={{ px: 1.5, py: 0.6 }}>
                <Tooltip title="List View">
                  <FormatListBulletedRoundedIcon sx={{ fontSize: 18, color: viewMode === "list" ? "#4F46E5" : "#64748B" }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Category Filter Chips Bar */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#E2E8F0", borderRadius: 2 },
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: "0.775rem",
                  px: 1,
                  py: 0.4,
                  borderRadius: 2,
                  bgcolor: isSelected ? "#4F46E5" : "#F8FAFC",
                  color: isSelected ? "#FFFFFF" : "#475569",
                  border: isSelected ? "1px solid #4F46E5" : "1px solid #E2E8F0",
                  "&:hover": {
                    bgcolor: isSelected ? "#4338CA" : "#F1F5F9",
                  },
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* Showing count indicator */}
      <Box display="flex" justifyContent="space-between" alignItems="center" px={0.5}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.825rem", color: "#64748B", fontWeight: 600 }}>
          Showing <strong>{filteredTemplates.length}</strong> {filteredTemplates.length === 1 ? "template" : "templates"}
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
        </Typography>

        {(search || selectedCategory !== "All") && (
          <Button
            size="small"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, color: "#4F46E5" }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          4. TEMPLATES GALLERY (GRID / LIST)
         ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: "1px solid #E2E8F0" }}>
                <Skeleton variant="rectangular" height={108} sx={{ borderRadius: 2, mb: 2 }} />
                <Skeleton variant="text" width="80%" height={28} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                <Box display="flex" gap={1}>
                  <Skeleton variant="rectangular" width="40%" height={36} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="rectangular" width="60%" height={36} sx={{ borderRadius: 2 }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : filteredTemplates.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: "center",
            border: "1px dashed #CBD5E1",
            borderRadius: 3.5,
            bgcolor: "#FFFFFF",
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
              mx: "auto",
              mb: 2,
            }}
          >
            <InboxRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", mb: 0.5 }}>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mb: 2.5, maxWidth: 360, mx: "auto" }}>
            No templates match your search or selected category filter. Try clearing filters or create a new template with AI.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, borderColor: "#CBD5E1", color: "#4F46E5" }}
          >
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
        <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3.5, overflow: "hidden", bgcolor: "#FFFFFF" }}>
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
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. INTERACTIVE TEMPLATE PREVIEW MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, overflow: "hidden" } }}
      >
        {previewTemplate && (
          <>
            <Box
              sx={{
                p: 3,
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                color: "#FFFFFF",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={previewTemplate.category}
                  size="small"
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF", fontWeight: 800, fontSize: "0.7rem" }}
                />
                {!previewTemplate.is_custom && (
                  <Chip
                    icon={<VerifiedRoundedIcon sx={{ fontSize: "12px !important", color: "#FFFFFF !important" }} />}
                    label="Official Template"
                    size="small"
                    sx={{ bgcolor: "rgba(15, 23, 42, 0.35)", color: "#FFFFFF", fontWeight: 700, fontSize: "0.65rem" }}
                  />
                )}
              </Box>

              <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.2rem", mb: 0.5 }}>
                {previewTemplate.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.825rem" }}>
                {previewTemplate.description || "Streamline your response intake with this ready-to-use template schema."}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mt={2} pt={1.5} borderTop="1px solid rgba(255,255,255,0.2)">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <FormatListNumberedRoundedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={700}>
                    {previewTemplate.questions?.length || 0} Questions
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={700}>
                    {previewTemplate.est_time || "2 mins"}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.85, ml: "auto" }}>
                  By {previewTemplate.created_by || "Formify Team"}
                </Typography>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3, maxHeight: 380, overflowY: "auto" }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5 }}>
                Included Fields &amp; Input Controls:
              </Typography>

              <List disablePadding>
                {(previewTemplate.questions || []).map((q, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      px: 2,
                      py: 1.2,
                      bgcolor: "#F8FAFC",
                      borderRadius: 2.5,
                      border: "1px solid #F1F5F9",
                      mb: 1.2,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: "#4F46E5" }}>
                      <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A" }}>
                            {q.field_label}
                          </Typography>
                          {q.is_required && (
                            <Chip label="Required" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#FEE2E2", color: "#DC2626" }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box mt={0.5}>
                          <Chip
                            label={`Type: ${q.field_type}`}
                            size="small"
                            sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5", mr: 1 }}
                          />
                          {q.options && q.options.length > 0 && (
                            <Typography component="span" variant="caption" color="text.secondary">
                              Options: {q.options.slice(0, 3).join(", ")}{q.options.length > 3 ? "..." : ""}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, bgcolor: "#FAFAFA", borderTop: "1px solid #F1F5F9" }}>
              <Button
                variant="outlined"
                onClick={() => setPreviewTemplate(null)}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, borderColor: "#CBD5E1", color: "#64748B" }}
              >
                Close Preview
              </Button>
              <Button
                variant="contained"
                disabled={actionLoading}
                onClick={() => handleUseTemplate(previewTemplate)}
                startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#4F46E5",
                  "&:hover": { bgcolor: "#4338CA" },
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                }}
              >
                {actionLoading ? "Instantiating..." : "Use This Template"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          7. EDIT TEMPLATE SCHEMA DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={Boolean(editTemplate)} onClose={() => setEditTemplate(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Edit Template Schema
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Template Title" fullWidth size="small" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            <TextField select label="Category" fullWidth size="small" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c !== "All" && c !== "Official Library" && c !== "My Templates").map((c) => (
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
          8. DELETE CONFIRMATION MODAL
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
          9. SHARE LINK MODAL
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
          10. CREATE CUSTOM TEMPLATE MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Create Custom Template
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Template Title" fullWidth size="small" value={newTemplateTitle} onChange={(e) => setNewTemplateTitle(e.target.value)} required />
            <TextField select label="Category" fullWidth size="small" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c !== "All" && c !== "Official Library" && c !== "My Templates").map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField label="Description" fullWidth multiline rows={3} size="small" value={newTemplateDesc} onChange={(e) => setNewTemplateDesc(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenCreateModal(false)}>Cancel</Button>
          <Button variant="contained" disabled={actionLoading} onClick={handleCreateTemplateSubmit} sx={{ bgcolor: "#4F46E5", fontWeight: 700 }}>
            {actionLoading ? "Saving..." : "Create Template"}
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
