import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";

// Icons
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";

function formatDate(dateStr) {
  if (!dateStr) return "Aug 2026";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Aug 2026";
  }
}

export default function TemplateCard({
  template,
  isFavorite = false,
  viewMode = "grid",
  onPreview,
  onUseTemplate,
  onToggleFavorite,
  onDuplicate,
  onEdit,
  onDelete,
  onToggleArchive,
  onTogglePublish,
  onShare,
}) {
  const {
    id,
    title,
    description,
    category,
    image,
    est_time = "2 mins",
    created_by = "Formify Team",
    usage_count = 0,
    is_public = true,
    is_archived = false,
    is_custom = false,
    questions = [],
    tags = [],
    version = "v1.0",
    created_at,
    updated_at,
  } = template;

  const fieldCount = questions.length;
  const createdDateStr = formatDate(created_at);
  const updatedDateStr = formatDate(updated_at || created_at);

  if (viewMode === "list") {
    return (
      <Paper
        elevation={0}
        onClick={onPreview}
        sx={{
          p: 2,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #F1F5F9",
          bgcolor: is_archived ? "#FAFAFA" : "#FFFFFF",
          opacity: is_archived ? 0.75 : 1,
          cursor: "pointer",
          transition: "all 0.15s ease",
          "&:hover": { bgcolor: "#F8FAFC" },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, id); }}>
            {isFavorite ? (
              <StarRoundedIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
            ) : (
              <StarBorderRoundedIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
            )}
          </IconButton>
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>
                {title}
              </Typography>
              <Chip label={version} size="small" sx={{ bgcolor: "#F1F5F9", color: "#475569", fontWeight: 800, fontSize: "0.6rem", height: 16 }} />
              <Chip label={category} size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700, fontSize: "0.625rem", height: 16 }} />
              {is_public ? (
                <Chip icon={<PublicRoundedIcon sx={{ fontSize: 10 }} />} label="PUBLIC" size="small" sx={{ bgcolor: "#ECFDF5", color: "#059669", fontWeight: 800, fontSize: "0.6rem", height: 16 }} />
              ) : (
                <Chip icon={<LockOutlinedIcon sx={{ fontSize: 10 }} />} label="PRIVATE" size="small" sx={{ bgcolor: "#F1F5F9", color: "#64748B", fontWeight: 800, fontSize: "0.6rem", height: 16 }} />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
              {description} • Created {createdDateStr} • Updated {updatedDateStr} • {usage_count} uses
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={0.8}>
          <Tooltip title="Share Link">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onShare(); }}>
              <ShareRoundedIcon sx={{ fontSize: 16, color: "#4F46E5" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
              <ContentCopyRoundedIcon sx={{ fontSize: 16, color: "#64748B" }} />
            </IconButton>
          </Tooltip>
          {is_custom && (
            <>
              <Tooltip title={is_public ? "Make Private" : "Make Public"}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onTogglePublish(); }}>
                  {is_public ? <PublicRoundedIcon sx={{ fontSize: 16, color: "#059669" }} /> : <LockOutlinedIcon sx={{ fontSize: 16, color: "#64748B" }} />}
                </IconButton>
              </Tooltip>
              <Tooltip title={is_archived ? "Restore Template" : "Archive Template"}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}>
                  {is_archived ? <UnarchiveRoundedIcon sx={{ fontSize: 16, color: "#F59E0B" }} /> : <ArchiveRoundedIcon sx={{ fontSize: 16, color: "#64748B" }} />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Schema">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <EditRoundedIcon sx={{ fontSize: 16, color: "#3B82F6" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Template">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={(e) => { e.stopPropagation(); onUseTemplate(); }}
            sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, bgcolor: "#4F46E5", borderRadius: 1.5 }}
          >
            Use Schema
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      onClick={onPreview}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid #E2E8F0",
        borderRadius: 3,
        bgcolor: is_archived ? "#FAFAFA" : "#FFFFFF",
        opacity: is_archived ? 0.75 : 1,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: "#C7D2FE",
          boxShadow: "0 12px 30px -6px rgba(79, 70, 229, 0.14)",
          transform: "translateY(-3px)",
        },
      }}
    >
      {/* 1. Header Banner Image & Top Badges */}
      <Box sx={{ position: "relative", height: 130, bgcolor: "#EEF2FF", overflow: "hidden" }}>
        {image ? (
          <Box component="img" src={image} alt={title} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Box sx={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="h5" fontWeight={900} sx={{ color: "#FFFFFF", opacity: 0.3 }}>
              {category}
            </Typography>
          </Box>
        )}

        {/* Favorite Button & Version Badge */}
        <Box sx={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 0.8, alignItems: "center" }}>
          <Chip label={version} size="small" sx={{ bgcolor: "rgba(15, 23, 42, 0.75)", color: "#FFFFFF", fontWeight: 800, fontSize: "0.6rem", height: 20 }} />
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleFavorite(e, id); }} sx={{ bgcolor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(4px)" }}>
            {isFavorite ? <StarRoundedIcon sx={{ fontSize: 18, color: "#F59E0B" }} /> : <StarBorderRoundedIcon sx={{ fontSize: 18, color: "#64748B" }} />}
          </IconButton>
        </Box>

        {/* Category & Public/Private Badges */}
        <Box sx={{ position: "absolute", bottom: 10, left: 10, display: "flex", gap: 0.8 }}>
          <Chip label={category} size="small" sx={{ bgcolor: "rgba(255, 255, 255, 0.95)", color: "#4F46E5", fontWeight: 800, fontSize: "0.65rem", height: 20 }} />
          {is_public ? (
            <Chip icon={<PublicRoundedIcon sx={{ fontSize: 10 }} />} label="PUBLIC" size="small" sx={{ bgcolor: "#ECFDF5", color: "#059669", fontWeight: 800, fontSize: "0.6rem", height: 20 }} />
          ) : (
            <Chip icon={<LockOutlinedIcon sx={{ fontSize: 10 }} />} label="PRIVATE" size="small" sx={{ bgcolor: "#F1F5F9", color: "#64748B", fontWeight: 800, fontSize: "0.6rem", height: 20 }} />
          )}
        </Box>
      </Box>

      {/* 2. Main Content Body */}
      <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.025rem", color: "#0F172A", mb: 0.6, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", color: "#64748B", mb: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {description}
          </Typography>

          {/* Tags */}
          {tags.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
              {tags.slice(0, 3).map((tag) => (
                <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" sx={{ fontSize: "0.625rem", height: 18, borderColor: "#E2E8F0", color: "#64748B" }} />
              ))}
            </Box>
          )}

          {/* Detailed Metadata Metrics Row (Created Date, Updated Date, Fields, Est Time, Usage Count) */}
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} py={1} borderTop="1px solid #F1F5F9" borderBottom="1px solid #F1F5F9" mb={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <FormatListNumberedRoundedIcon sx={{ fontSize: 14, color: "#4F46E5" }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.725rem" }}>
                {fieldCount} Fields
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "#10B981" }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.725rem" }}>
                {est_time}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUpRoundedIcon sx={{ fontSize: 14, color: "#F59E0B" }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.725rem" }}>
                {usage_count.toLocaleString()} uses
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              <PersonOutlineRoundedIcon sx={{ fontSize: 14, color: "#8B5CF6" }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem" }}>
                {created_by} • {createdDateStr}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 3. Card Action Buttons (Preview, Use Template, Favorite, Duplicate, Edit, Archive/Restore, Publish/Private, Share, Delete) */}
        <Box>
          <Box display="flex" gap={1} mb={1}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              startIcon={<VisibilityRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, borderRadius: 1.8, borderColor: "#E2E8F0" }}
            >
              Preview
            </Button>
            <Button
              fullWidth
              size="small"
              variant="contained"
              onClick={(e) => { e.stopPropagation(); onUseTemplate(); }}
              sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, borderRadius: 1.8, bgcolor: "#4F46E5", "&:hover": { bgcolor: "#4338CA" } }}
            >
              Use Schema
            </Button>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" gap={0.5}>
              <Tooltip title="Share Public Link">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onShare(); }}>
                  <ShareRoundedIcon sx={{ fontSize: 14, color: "#4F46E5" }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Duplicate Template">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                  <ContentCopyRoundedIcon sx={{ fontSize: 14, color: "#64748B" }} />
                </IconButton>
              </Tooltip>
              {is_custom && (
                <>
                  <Tooltip title={is_public ? "Make Private" : "Make Public"}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onTogglePublish(); }}>
                      {is_public ? <PublicRoundedIcon sx={{ fontSize: 14, color: "#059669" }} /> : <LockOutlinedIcon sx={{ fontSize: 14, color: "#64748B" }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={is_archived ? "Restore Template" : "Archive Template"}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}>
                      {is_archived ? <UnarchiveRoundedIcon sx={{ fontSize: 14, color: "#F59E0B" }} /> : <ArchiveRoundedIcon sx={{ fontSize: 14, color: "#64748B" }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Schema">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                      <EditRoundedIcon sx={{ fontSize: 14, color: "#3B82F6" }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Template">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 14, color: "#EF4444" }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
