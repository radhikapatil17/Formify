import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Tooltip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TitleRoundedIcon from "@mui/icons-material/TitleRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import ArrowDropDownCircleOutlinedIcon from "@mui/icons-material/ArrowDropDownCircleOutlined";
import RadioButtonCheckedOutlinedIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import LinearScaleRoundedIcon from "@mui/icons-material/LinearScaleRounded";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import PhotoCameraBackRoundedIcon from "@mui/icons-material/PhotoCameraBackRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import HMobiledataRoundedIcon from "@mui/icons-material/HMobiledataRounded";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import TabRoundedIcon from "@mui/icons-material/TabRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

// ─── Categories Definition (Basic, Choice, Rating, Advanced) ─────────────────────
const CATEGORIES = [
  {
    key: "basic",
    label: "Basic",
    color: "#4F46E5",
    bgColor: "#EEF2FF",
    fields: [
      { type: "text",     label: "Short Text", icon: TitleRoundedIcon, common: true },
      { type: "textarea", label: "Long Text",  icon: NotesRoundedIcon, common: true },
      { type: "email",    label: "Email",      icon: EmailOutlinedIcon, common: true },
      { type: "phone",    label: "Phone",      icon: PhoneAndroidOutlinedIcon },
      { type: "number",   label: "Number",     icon: NumbersRoundedIcon },
      { type: "date",     label: "Date",       icon: CalendarTodayOutlinedIcon },
      { type: "time",     label: "Time",       icon: AccessTimeRoundedIcon },
      { type: "url",      label: "URL",        icon: LinkRoundedIcon },
      { type: "password", label: "Password",   icon: VpnKeyRoundedIcon },
    ],
  },
  {
    key: "choice",
    label: "Choice",
    color: "#0EA5E9",
    bgColor: "#F0F9FF",
    fields: [
      { type: "select",   label: "Dropdown",     icon: ArrowDropDownCircleOutlinedIcon, common: true },
      { type: "radio",    label: "Radio Button", icon: RadioButtonCheckedOutlinedIcon, common: true },
      { type: "checkbox", label: "Checkbox",     icon: CheckBoxOutlinedIcon, common: true },
      { type: "yes_no",   label: "Yes / No",     icon: ToggleOnRoundedIcon },
      { type: "matrix",   label: "Matrix / Grid",icon: GridViewRoundedIcon },
    ],
  },
  {
    key: "rating",
    label: "Rating",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    fields: [
      { type: "rating",       label: "Star Rating",  icon: StarOutlineRoundedIcon, common: true },
      { type: "linear_scale", label: "Linear Scale", icon: LinearScaleRoundedIcon },
    ],
  },
  {
    key: "advanced",
    label: "Advanced",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    fields: [
      { type: "file_upload",     label: "File Upload",     icon: AttachFileOutlinedIcon, common: true },
      { type: "image_upload",    label: "Image Upload",    icon: PhotoCameraBackRoundedIcon },
      { type: "signature",       label: "Signature",       icon: DrawRoundedIcon },
      { type: "heading",         label: "Heading",         icon: HMobiledataRoundedIcon },
      { type: "description",     label: "Description",     icon: SubjectRoundedIcon },
      { type: "image",           label: "Image Block",     icon: ImageOutlinedIcon },
      { type: "video",           label: "Video Block",     icon: PlayCircleOutlineRoundedIcon },
      { type: "section_divider", label: "Section Divider", icon: HorizontalRuleRoundedIcon },
      { type: "page_break",      label: "Page Break",      icon: TabRoundedIcon },
    ],
  },
];

// Flat list of all 25 field types
const ALL_FIELDS = CATEGORIES.flatMap((cat) =>
  cat.fields.map((f) => ({
    ...f,
    categoryKey: cat.key,
    categoryColor: cat.color,
    categoryBg: cat.bgColor,
    categoryLabel: cat.label,
  }))
);

// Most Commonly Used Fields
const COMMON_FIELDS = ALL_FIELDS.filter((f) => f.common);

// ─── Single Field Tile ────────────────────────────────────────────────────────
function FieldTile({ field, color, bgColor, onAdd, onDragStart, isCompact = false }) {
  const Icon = field.icon;
  const [dragging, setDragging] = useState(false);

  return (
    <Tooltip title={`Click or drag to add "${field.label}"`} placement="right" arrow>
      <Box
        draggable
        onDragStart={(e) => {
          setDragging(true);
          onDragStart(e, field.type);
        }}
        onDragEnd={() => setDragging(false)}
        onClick={() => onAdd(field.type)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: isCompact ? 1 : 1.2,
          px: isCompact ? 1.2 : 1.4,
          py: isCompact ? 0.7 : 0.85,
          borderRadius: 2,
          cursor: "grab",
          border: "1px solid",
          borderColor: dragging ? color : "#F1F5F9",
          bgcolor: dragging ? bgColor : "#FFFFFF",
          userSelect: "none",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
          "&:hover": {
            bgcolor: bgColor,
            borderColor: `${color}66`,
            transform: "translateY(-1px)",
            boxShadow: `0 3px 10px -2px ${color}20`,
            "& .fi-icon-wrap": { bgcolor: color, transform: "scale(1.04)" },
            "& .fi-icon": { color: "#FFFFFF" },
            "& .fi-label": { color: "#0F172A", fontWeight: 700 },
            "& .fi-drag": { opacity: 1, color: color },
          },
          "&:active": {
            cursor: "grabbing",
            transform: "scale(0.97)",
          },
        }}
      >
        <DragIndicatorRoundedIcon
          className="fi-drag"
          sx={{ fontSize: 12, color: "#CBD5E1", opacity: 0.3, transition: "all 0.15s", flexShrink: 0 }}
        />

        <Box
          className="fi-icon-wrap"
          sx={{
            width: isCompact ? 26 : 28,
            height: isCompact ? 26 : 28,
            borderRadius: 1.8,
            bgcolor: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
        >
          <Icon className="fi-icon" sx={{ fontSize: isCompact ? 14 : 15, color: color, transition: "color 0.15s" }} />
        </Box>

        <Typography
          className="fi-label"
          variant="body2"
          sx={{ fontSize: isCompact ? "0.76rem" : "0.8rem", fontWeight: 600, color: "#334155", flex: 1, transition: "all 0.15s" }}
        >
          {field.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuestionToolbox({ onAddField, fields = [] }) {
  const [query, setQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [openViewAllModal, setOpenViewAllModal] = useState(false);
  const [modalQuery, setModalQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return ALL_FIELDS.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.categoryLabel.toLowerCase().includes(q)
    );
  }, [query]);

  const modalFiltered = useMemo(() => {
    let list = ALL_FIELDS;
    if (activeCategoryTab !== "all") {
      list = list.filter((f) => f.categoryKey === activeCategoryTab);
    }
    if (modalQuery.trim()) {
      const q = modalQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.type.toLowerCase().includes(q) ||
          f.categoryLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategoryTab, modalQuery]);

  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData("fieldType", fieldType);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          width: 270,
          flexShrink: 0,
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 2px 12px -2px rgba(15, 23, 42, 0.04)",
          display: "flex",
          flexDirection: "column",
          maxHeight: 700,
          overflow: "hidden",
        }}
      >
        {/* ── Search Header ── */}
        <Box sx={{ p: 1.8, pb: 1.5, borderBottom: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.85rem", mb: 1.2 }}>
            Question Toolbox
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Search question types..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontSize: "0.78rem",
                bgcolor: "#FFFFFF",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
              },
            }}
          />
        </Box>

        {/* ── Toolbox Body ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 1.2,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#CBD5E1", borderRadius: 2 },
          }}
        >
          {filtered ? (
            /* ── Search Mode ── */
            filtered.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                  No field types match "{query}"
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 800, px: 0.5, mb: 0.5, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Search Results ({filtered.length})
                </Typography>
                {filtered.map((f) => (
                  <FieldTile key={f.type} field={f} color={f.categoryColor} bgColor={f.categoryBg} onAdd={onAddField} onDragStart={handleDragStart} isCompact />
                ))}
              </Stack>
            )
          ) : (
            /* ── Default Categorized Layout ── */
            <Stack spacing={2}>
              {/* Commonly Used Section */}
              <Box>
                <Box display="flex" alignItems="center" gap={0.6} px={0.5} mb={0.8}>
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 13, color: "#4F46E5" }} />
                  <Typography variant="caption" sx={{ color: "#4F46E5", fontWeight: 800, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Commonly Used
                  </Typography>
                </Box>
                <Stack spacing={0.4}>
                  {COMMON_FIELDS.map((f) => (
                    <FieldTile key={f.type} field={f} color={f.categoryColor} bgColor={f.categoryBg} onAdd={onAddField} onDragStart={handleDragStart} isCompact />
                  ))}
                </Stack>
              </Box>

              {/* Four Categories: Basic, Choice, Rating, Advanced */}
              {CATEGORIES.map((cat) => (
                <Box key={cat.key}>
                  <Box display="flex" alignItems="center" justifyOption="space-between" px={0.5} mb={0.6}>
                    <Typography variant="caption" sx={{ color: cat.color, fontWeight: 800, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {cat.label} ({cat.fields.length})
                    </Typography>
                  </Box>
                  <Stack spacing={0.4}>
                    {cat.fields.map((f) => (
                      <FieldTile key={f.type} field={f} color={cat.color} bgColor={cat.bgColor} onAdd={onAddField} onDragStart={handleDragStart} isCompact />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* ── Footer with "View All (25 Types)" ── */}
        <Box sx={{ p: 1.2, borderTop: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
          <Button
            fullWidth
            size="small"
            variant="outlined"
            onClick={() => setOpenViewAllModal(true)}
            startIcon={<GridViewOutlinedIcon sx={{ fontSize: 15 }} />}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#E2E8F0",
              color: "#475569",
              py: 0.6,
              bgcolor: "#FFFFFF",
              "&:hover": { bgcolor: "#EEF2FF", borderColor: "#4F46E5", color: "#4F46E5" },
            }}
          >
            View All 25 Question Types
          </Button>
        </Box>
      </Paper>

      {/* ── View All 25 Question Types Modal Panel ── */}
      <Dialog
        open={openViewAllModal}
        onClose={() => setOpenViewAllModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0, overflow: "hidden" } }}
      >
        <Box sx={{ p: 2.5, px: 3, bgcolor: "#FAFAFA", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <GridViewOutlinedIcon sx={{ color: "#4F46E5", fontSize: 22 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
                All 25 Question Types
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select any question type to add directly to your form canvas.
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setOpenViewAllModal(false)} sx={{ border: "1px solid #E2E8F0" }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Modal Search & Filter Bar */}
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search 25 question types..."
              value={modalQuery}
              onChange={(e) => setModalQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <Tabs
              value={activeCategoryTab}
              onChange={(e, val) => setActiveCategoryTab(val)}
              sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0, px: 1.5, fontSize: "0.78rem", fontWeight: 700, textTransform: "none" } }}
            >
              <Tab label="All (25)" value="all" />
              <Tab label="Basic (9)" value="basic" />
              <Tab label="Choice (5)" value="choice" />
              <Tab label="Rating (2)" value="rating" />
              <Tab label="Advanced (9)" value="advanced" />
            </Tabs>
          </Box>

          {/* Modal Grid of 25 Field Types */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 1.5,
              maxHeight: 440,
              overflowY: "auto",
              pr: 0.5,
            }}
          >
            {modalFiltered.map((f) => (
              <Paper
                key={f.type}
                elevation={0}
                onClick={() => {
                  onAddField(f.type);
                  setOpenViewAllModal(false);
                }}
                sx={{
                  p: 1.8,
                  borderRadius: 2.5,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: f.categoryColor,
                    bgcolor: f.categoryBg,
                    transform: "translateY(-2px)",
                    boxShadow: `0 4px 14px -2px ${f.categoryColor}25`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: f.categoryBg,
                    color: f.categoryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <f.icon sx={{ fontSize: 18 }} />
                </Box>
                <Box minWidth={0}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A", fontSize: "0.85rem" }}>
                    {f.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: f.categoryColor, fontWeight: 700, fontSize: "0.68rem" }}>
                    {f.categoryLabel}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, bgcolor: "#FAFAFA", borderTop: "1px solid #E2E8F0" }}>
          <Button variant="outlined" onClick={() => setOpenViewAllModal(false)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
