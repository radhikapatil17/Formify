import { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import UnarchiveRoundedIcon from "@mui/icons-material/UnarchiveRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

// Curated aesthetic category color palettes & icons
const CATEGORY_THEMES = {
  Feedback: {
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    lightBg: "#ECFDF5",
    color: "#059669",
    border: "#A7F3D0",
    icon: <RateReviewRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
  Survey: {
    gradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
    lightBg: "#EEF2FF",
    color: "#4F46E5",
    border: "#C7D2FE",
    icon: <PollRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
  Quiz: {
    gradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    lightBg: "#FFFBEB",
    color: "#D97706",
    border: "#FDE68A",
    icon: <SchoolRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
  Registration: {
    gradient: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
    lightBg: "#F5F3FF",
    color: "#7C3AED",
    border: "#DDD6FE",
    icon: <HowToRegRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
  "Job Application": {
    gradient: "linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)",
    lightBg: "#F0F9FF",
    color: "#0284C7",
    border: "#BAE6FD",
    icon: <WorkRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
  "Contact Form": {
    gradient: "linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)",
    lightBg: "#FFF1F2",
    color: "#E11D48",
    border: "#FECDD3",
    icon: <EmailRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
  "Event Registration": {
    gradient: "linear-gradient(135deg, #9333EA 0%, #A855F7 100%)",
    lightBg: "#FAF5FF",
    color: "#9333EA",
    border: "#E9D5FF",
    icon: <EventAvailableRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
  },
};

function getCategoryTheme(cat) {
  if (!cat) return CATEGORY_THEMES.Feedback;
  const matchKey = Object.keys(CATEGORY_THEMES).find((k) => cat.toLowerCase().includes(k.toLowerCase()));
  return (
    matchKey
      ? CATEGORY_THEMES[matchKey]
      : {
          gradient: "linear-gradient(135deg, #334155 0%, #475569 100%)",
          lightBg: "#F8FAFC",
          color: "#475569",
          border: "#E2E8F0",
          icon: <DescriptionRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />,
        }
  );
}

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
  } = template;

  const [menuAnchor, setMenuAnchor] = useState(null);
  const isMenuOpen = Boolean(menuAnchor);

  const handleOpenMenu = (e) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = (e) => {
    e?.stopPropagation?.();
    setMenuAnchor(null);
  };

  const theme = getCategoryTheme(category);
  const fieldCount = questions.length;
  const isOfficial = !is_custom || created_by === "Formify Team";

  // LIST VIEW LAYOUT
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
          transition: "background-color 0.15s ease",
          "&:hover": { bgcolor: "#F8FAFC" },
        }}
      >
        <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 0 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e, id);
            }}
          >
            {isFavorite ? (
              <StarRoundedIcon sx={{ fontSize: 20, color: "#F59E0B" }} />
            ) : (
              <StarBorderRoundedIcon sx={{ fontSize: 20, color: "#94A3B8" }} />
            )}
          </IconButton>

          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              background: theme.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {theme.icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="body2" fontWeight={800} sx={{ color: "#0F172A" }}>
                {title}
              </Typography>
              {isOfficial ? (
                <Chip
                  icon={<VerifiedRoundedIcon sx={{ fontSize: "12px !important", color: "#4F46E5 !important" }} />}
                  label="Official"
                  size="small"
                  sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700, fontSize: "0.625rem", height: 18 }}
                />
              ) : (
                <Chip
                  label="Custom"
                  size="small"
                  sx={{ bgcolor: "#F1F5F9", color: "#475569", fontWeight: 700, fontSize: "0.625rem", height: 18 }}
                />
              )}
              <Chip
                label={category}
                size="small"
                sx={{
                  bgcolor: theme.lightBg,
                  color: theme.color,
                  fontWeight: 700,
                  fontSize: "0.625rem",
                  height: 18,
                  border: `1px solid ${theme.border}`,
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ color: "#64748B", display: "block", mt: 0.3 }}>
              {description || "Standard form template ready to deploy."} • {fieldCount} questions • {est_time} • {usage_count} uses
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            startIcon={<VisibilityRoundedIcon sx={{ fontSize: 14 }} />}
            sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, borderRadius: 2, borderColor: "#E2E8F0" }}
          >
            Preview
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate();
            }}
            startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
            sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, bgcolor: "#4F46E5", borderRadius: 2, "&:hover": { bgcolor: "#4338CA" } }}
          >
            Use Template
          </Button>

          <IconButton size="small" onClick={handleOpenMenu}>
            <MoreVertRoundedIcon sx={{ fontSize: 18, color: "#64748B" }} />
          </IconButton>
        </Box>

        {/* Action Dropdown Menu */}
        <Menu anchorEl={menuAnchor} open={isMenuOpen} onClose={handleCloseMenu} PaperProps={{ sx: { borderRadius: 2, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" } }}>
          <MenuItem onClick={(e) => { handleCloseMenu(e); onShare(); }}>
            <ListItemIcon><ShareRoundedIcon fontSize="small" sx={{ color: "#4F46E5" }} /></ListItemIcon>
            <ListItemText primary="Share Link" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
          </MenuItem>
          <MenuItem onClick={(e) => { handleCloseMenu(e); onDuplicate(); }}>
            <ListItemIcon><ContentCopyRoundedIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Duplicate" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
          </MenuItem>
          {is_custom && (
            <>
              <MenuItem onClick={(e) => { handleCloseMenu(e); onEdit(); }}>
                <ListItemIcon><EditRoundedIcon fontSize="small" sx={{ color: "#3B82F6" }} /></ListItemIcon>
                <ListItemText primary="Edit Template" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
              </MenuItem>
              <MenuItem onClick={(e) => { handleCloseMenu(e); onTogglePublish(); }}>
                <ListItemIcon>{is_public ? <LockOutlinedIcon fontSize="small" /> : <PublicRoundedIcon fontSize="small" sx={{ color: "#059669" }} />}</ListItemIcon>
                <ListItemText primary={is_public ? "Make Private" : "Make Public"} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
              </MenuItem>
              <MenuItem onClick={(e) => { handleCloseMenu(e); onToggleArchive(); }}>
                <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: "#F59E0B" }} /></ListItemIcon>
                <ListItemText primary={is_archived ? "Restore Template" : "Archive Template"} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
              </MenuItem>
              <MenuItem onClick={(e) => { handleCloseMenu(e); onDelete(); }}>
                <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" sx={{ color: "#EF4444" }} /></ListItemIcon>
                <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }} />
              </MenuItem>
            </>
          )}
        </Menu>
      </Paper>
    );
  }

  // MODERN MARKETPLACE GRID VIEW CARD
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
        borderRadius: 3.5,
        bgcolor: is_archived ? "#FAFAFA" : "#FFFFFF",
        opacity: is_archived ? 0.75 : 1,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: "#C7D2FE",
          boxShadow: "0 12px 28px -6px rgba(79, 70, 229, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.04)",
          transform: "translateY(-3px)",
        },
      }}
    >
      {/* 1. Category Gradient Banner */}
      <Box
        sx={{
          position: "relative",
          height: 108,
          background: theme.gradient,
          p: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        {/* Subtle decorative background blur pattern */}
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 110,
            height: 110,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            pointerEvents: "none",
          }}
        />

        {/* Category Badge with Icon */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(8px)",
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {theme.icon}
          <Typography variant="caption" fontWeight={800} sx={{ color: "#FFFFFF", fontSize: "0.75rem", letterSpacing: "0.01em" }}>
            {category}
          </Typography>
        </Box>

        {/* Top Right: Badges & Favorite Toggle */}
        <Box display="flex" alignItems="center" gap={0.8}>
          {isOfficial ? (
            <Chip
              icon={<VerifiedRoundedIcon sx={{ fontSize: "12px !important", color: "#FFFFFF !important" }} />}
              label="Official"
              size="small"
              sx={{
                bgcolor: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.625rem",
                height: 22,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            />
          ) : (
            <Chip
              label={created_by || "Custom"}
              size="small"
              sx={{
                bgcolor: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "0.625rem",
                height: 22,
                maxWidth: 90,
              }}
            />
          )}

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e, id);
            }}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(4px)",
              width: 28,
              height: 28,
              "&:hover": { bgcolor: "#FFFFFF" },
            }}
          >
            {isFavorite ? (
              <StarRoundedIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
            ) : (
              <StarBorderRoundedIcon sx={{ fontSize: 18, color: "#64748B" }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* 2. Main Card Content */}
      <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={0.8}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{
                fontSize: "0.975rem",
                color: "#0F172A",
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </Typography>

            <IconButton
              size="small"
              onClick={handleOpenMenu}
              sx={{ color: "#94A3B8", p: 0.5, "&:hover": { color: "#0F172A" } }}
            >
              <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: "0.8rem",
              color: "#64748B",
              lineHeight: 1.45,
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.35em",
            }}
          >
            {description || "Streamline data collection with this structured, responsive form schema."}
          </Typography>

          {/* Tags */}
          {tags.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.6} mb={2}>
              {tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  sx={{
                    fontSize: "0.625rem",
                    height: 20,
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    color: "#64748B",
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          )}

          {/* Quick Metrics (Questions Count, Time, Usage) */}
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            py={1.2}
            borderTop="1px solid #F1F5F9"
            borderBottom="1px solid #F1F5F9"
            mb={2.5}
          >
            <Box display="flex" alignItems="center" gap={0.6}>
              <FormatListNumberedRoundedIcon sx={{ fontSize: 15, color: "#4F46E5" }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.725rem" }}>
                {fieldCount} Questions
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.6}>
              <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "#10B981" }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.725rem" }}>
                {est_time}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ color: "#94A3B8", fontSize: "0.7rem", ml: "auto" }}>
              {usage_count.toLocaleString()} uses
            </Typography>
          </Box>
        </Box>

        {/* 3. Primary Actions: Preview & Use Template */}
        <Box display="flex" gap={1.2}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            startIcon={<VisibilityRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{
              textTransform: "none",
              fontSize: "0.775rem",
              fontWeight: 700,
              borderRadius: 2,
              borderColor: "#E2E8F0",
              color: "#475569",
              px: 1.8,
              py: 0.8,
              "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
            }}
          >
            Preview
          </Button>

          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate();
            }}
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: "0.775rem",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: "#4F46E5",
              py: 0.8,
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Use Template
          </Button>
        </Box>
      </Box>

      {/* Overflow Menu for Secondary Actions */}
      <Menu
        anchorEl={menuAnchor}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            minWidth: 160,
            boxShadow: "0 10px 25px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.02)",
            border: "1px solid #E2E8F0",
          },
        }}
      >
        <MenuItem onClick={(e) => { handleCloseMenu(e); onShare(); }}>
          <ListItemIcon><ShareRoundedIcon fontSize="small" sx={{ color: "#4F46E5" }} /></ListItemIcon>
          <ListItemText primary="Share Public Link" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={(e) => { handleCloseMenu(e); onDuplicate(); }}>
          <ListItemIcon><ContentCopyRoundedIcon fontSize="small" sx={{ color: "#64748B" }} /></ListItemIcon>
          <ListItemText primary="Duplicate" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
        </MenuItem>
        {is_custom && (
          <>
            <MenuItem onClick={(e) => { handleCloseMenu(e); onEdit(); }}>
              <ListItemIcon><EditRoundedIcon fontSize="small" sx={{ color: "#3B82F6" }} /></ListItemIcon>
              <ListItemText primary="Edit Template" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
            </MenuItem>
            <MenuItem onClick={(e) => { handleCloseMenu(e); onTogglePublish(); }}>
              <ListItemIcon>
                {is_public ? <LockOutlinedIcon fontSize="small" sx={{ color: "#64748B" }} /> : <PublicRoundedIcon fontSize="small" sx={{ color: "#059669" }} />}
              </ListItemIcon>
              <ListItemText primary={is_public ? "Make Private" : "Make Public"} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
            </MenuItem>
            <MenuItem onClick={(e) => { handleCloseMenu(e); onToggleArchive(); }}>
              <ListItemIcon><ArchiveRoundedIcon fontSize="small" sx={{ color: "#F59E0B" }} /></ListItemIcon>
              <ListItemText primary={is_archived ? "Restore Template" : "Archive Template"} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }} />
            </MenuItem>
            <MenuItem onClick={(e) => { handleCloseMenu(e); onDelete(); }}>
              <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" sx={{ color: "#EF4444" }} /></ListItemIcon>
              <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }} />
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
}
