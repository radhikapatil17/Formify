import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  Stack,
  Chip,
  IconButton,
  Button,
  Select,
  MenuItem,
  Tooltip,
  InputAdornment,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormGroup,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import FileCopyRoundedIcon from "@mui/icons-material/FileCopyRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FormulaBuilderDialog from "./FormulaBuilderDialog";
import LookupConfigDialog from "./LookupConfigDialog";

// ─── Field types that show the Options tab ────────────────────────────────────
const CHOICE_TYPES = ["select", "dropdown", "radio", "checkbox", "yes_no", "matrix"];
// ─── Field types that show the Upload tab ────────────────────────────────────
const UPLOAD_TYPES = ["file_upload", "image_upload"];

// ─── Panel Tab Header ─────────────────────────────────────────────────────────
function PanelTab({ label, icon, value, current, onChange }) {
  const active = value === current;
  return (
    <Box
      onClick={() => onChange(value)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        px: 1.2,
        py: 0.7,
        borderRadius: 1.8,
        cursor: "pointer",
        bgcolor: active ? "#4F46E5" : "transparent",
        color: active ? "#FFFFFF" : "#64748B",
        fontWeight: active ? 700 : 600,
        fontSize: "0.73rem",
        transition: "all 0.14s",
        "&:hover": { bgcolor: active ? "#4338CA" : "#F1F5F9" },
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      <span>{label}</span>
    </Box>
  );
}

// ─── Section Header inside panel ─────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: "#94A3B8",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontSize: "0.63rem",
        display: "block",
        mb: 1,
        mt: 0.5,
      }}
    >
      {label}
    </Typography>
  );
}

// ─── Labeled field wrapper ────────────────────────────────────────────────────
function FieldRow({ label, children, hint }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 0.6, fontSize: "0.72rem" }}>
        {label}
      </Typography>
      {children}
      {hint && (
        <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.67rem", display: "block", mt: 0.4 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

// ─── Option Item (draggable row) ──────────────────────────────────────────────
function OptionItem({ option, index, totalCount, onChange, onDelete, onMoveUp, onMoveDown, onDragStart, onDragOver, onDrop, isDragging }) {
  return (
    <Box
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.8,
        p: 0.8,
        borderRadius: 2,
        border: isDragging ? "2px dashed #A5B4FC" : "1px solid #E2E8F0",
        bgcolor: isDragging ? "#EEF2FF" : "#FAFAFA",
        "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
        transition: "all 0.12s",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <DragIndicatorRoundedIcon sx={{ fontSize: 14, color: "#CBD5E1", flexShrink: 0, cursor: "grab", "&:hover": { color: "#4F46E5" } }} />
      <TextField
        size="small"
        value={option.option_text}
        onChange={(e) => onChange(option.id, e.target.value)}
        variant="standard"
        fullWidth
        InputProps={{ disableUnderline: true, sx: { fontSize: "0.8rem", color: "#0F172A", fontWeight: 600 } }}
      />
      <Stack direction="row" spacing={0.2}>
        <IconButton size="small" onClick={() => onMoveUp(index)} disabled={index === 0} sx={{ p: 0.3 }}>
          <Typography sx={{ fontSize: 10, color: "#94A3B8" }}>▲</Typography>
        </IconButton>
        <IconButton size="small" onClick={() => onMoveDown(index)} disabled={index === totalCount - 1} sx={{ p: 0.3 }}>
          <Typography sx={{ fontSize: 10, color: "#94A3B8" }}>▼</Typography>
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(option.id)} sx={{ p: 0.3 }}>
          <DeleteOutlineRoundedIcon sx={{ fontSize: 13, color: "#EF4444" }} />
        </IconButton>
      </Stack>
    </Box>
  );
}

// ─── Main QuestionProperties Component ───────────────────────────────────────
export default function QuestionProperties({
  field,
  onClose,
  onFieldChange,
  onAddOption,
  onDeleteOption,
  onEditOption,
  onMoveOption,
  onDragOption,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  newOptionText,
  setNewOptionText,
  isFirst,
  isLast,
  allFields = [],
}) {
  const [tab, setTab] = useState("general");
  const [dragOptionIdx, setDragOptionIdx] = useState(null);
  const [openFormulaBuilder, setOpenFormulaBuilder] = useState(false);
  const [openLookupBuilder, setOpenLookupBuilder] = useState(false);
  const type = field?.field_type || "text";
  const isChoice = CHOICE_TYPES.includes(type);
  const isUpload = UPLOAD_TYPES.includes(type);
  const isLayout = ["heading", "description", "image", "video", "section_divider", "page_break"].includes(type);
  const hasPlaceholder = ["text", "textarea", "email", "phone", "number", "url", "password", "lookup", "select", "dropdown", "image", "video", "description"].includes(type);
  const hasDefaultValue = ["text", "textarea", "email", "phone", "number", "url", "password", "lookup", "date", "time", "yes_no"].includes(type);
  const isTextInput = ["text", "textarea", "email", "phone", "url", "password", "lookup"].includes(type);
  const isNumberInput = type === "number";
  const isDateTimeInput = ["date", "time"].includes(type);
  const isRatingOrScale = ["rating", "linear_scale"].includes(type);

  // Determine available tabs
  const tabs = [
    { value: "general", label: "General", icon: <SettingsRoundedIcon sx={{ fontSize: 13 }} /> },
    { value: "validation", label: "Validation", icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 13 }} /> },
    ...(isChoice ? [{ value: "options", label: "Options", icon: <ListAltRoundedIcon sx={{ fontSize: 13 }} /> }] : []),
    ...(isUpload ? [{ value: "upload", label: "Upload", icon: <FileUploadRoundedIcon sx={{ fontSize: 13 }} /> }] : []),
  ];

  // If currently on an unavailable tab (e.g. field type changed), fallback
  const activeTab = tabs.find((t) => t.value === tab) ? tab : "general";

  const change = (key, val) => onFieldChange(key, val);

  return (
    <Paper
      elevation={0}
      sx={{
        width: 320,
        flexShrink: 0,
        borderRadius: 3,
        border: "1px solid #E2E8F0",
        bgcolor: "#FFFFFF",
        boxShadow: "0 4px 20px -2px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Panel header ── */}
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={0.8}>
            <TuneRoundedIcon sx={{ fontSize: 15, color: "#C7D2FE" }} />
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#FFFFFF", fontSize: "0.82rem" }}>
              Question Properties
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move Up">
              <span>
                <IconButton size="small" disabled={isFirst} onClick={onMoveUp} sx={{ color: "#E0E7FF", "&:disabled": { color: "#818CF8", opacity: 0.4 }, p: 0.4 }}>
                  <ArrowUpwardRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move Down">
              <span>
                <IconButton size="small" disabled={isLast} onClick={onMoveDown} sx={{ color: "#E0E7FF", "&:disabled": { color: "#818CF8", opacity: 0.4 }, p: 0.4 }}>
                  <ArrowDownwardRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Duplicate">
              <IconButton size="small" onClick={onDuplicate} sx={{ color: "#E0E7FF", p: 0.4 }}>
                <FileCopyRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete question">
              <IconButton size="small" onClick={onDelete} sx={{ color: "#FCA5A5", p: 0.4, "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" } }}>
                <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            {onClose && (
              <Tooltip title="Close Panel">
                <IconButton size="small" onClick={onClose} sx={{ color: "#E0E7FF", p: 0.4, ml: 0.5, "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" } }}>
                  <CloseRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Field type badge */}
        <Chip
          label={field.field_type.replace(/_/g, " ").toUpperCase()}
          size="small"
          sx={{ fontSize: "0.6rem", fontWeight: 700, height: 18, bgcolor: "rgba(255,255,255,0.15)", color: "#E0E7FF", border: "1px solid rgba(255,255,255,0.2)" }}
        />
      </Box>

      {/* ── Tab bar ── */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          px: 1.5,
          py: 1,
          borderBottom: "1px solid #F1F5F9",
          bgcolor: "#FAFAFA",
          overflowX: "auto",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {tabs.map((t) => (
          <PanelTab key={t.value} value={t.value} current={activeTab} label={t.label} icon={t.icon} onChange={setTab} />
        ))}
      </Box>

      {/* ── Scrollable content ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 1.5,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#E2E8F0", borderRadius: 2 },
        }}
      >
        {/* ═══════════════════ GENERAL TAB ═══════════════════ */}
        {activeTab === "general" && (
          <Stack spacing={2}>
            <SectionHeader label="Question Information" />

            {/* Label / Title */}
            <FieldRow
              label={
                type === "heading"
                  ? "Heading Text *"
                  : type === "description"
                  ? "Block Title / Header *"
                  : type === "section_divider"
                  ? "Divider Title (Optional)"
                  : type === "page_break"
                  ? "Page Break Title (Optional)"
                  : type === "image"
                  ? "Image Title / Caption *"
                  : type === "video"
                  ? "Video Title / Caption *"
                  : "Question Label *"
              }
            >
              <TextField
                fullWidth
                size="small"
                value={field.label || ""}
                onChange={(e) => change("label", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" } }}
              />
            </FieldRow>

            {/* Placeholder Text */}
            {hasPlaceholder && (
              <FieldRow
                label={
                  ["image", "video"].includes(type)
                    ? "Media URL / Link"
                    : type === "description"
                    ? "Text Block Body Content"
                    : "Placeholder Text"
                }
                hint={["image", "video"].includes(type) ? "Direct image or video URL link" : "Shown inside input when empty"}
              >
                <TextField
                  fullWidth
                  size="small"
                  multiline={type === "description"}
                  rows={type === "description" ? 3 : 1}
                  value={field.placeholder || ""}
                  onChange={(e) => change("placeholder", e.target.value)}
                  placeholder={
                    type === "image"
                      ? "https://example.com/image.jpg"
                      : type === "video"
                      ? "https://example.com/video.mp4"
                      : "Type placeholder..."
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" } }}
                />
              </FieldRow>
            )}

            {/* Help Text */}
            {!isLayout && (
              <FieldRow label="Help Text" hint="Small hint text displayed below input">
                <TextField
                  fullWidth
                  size="small"
                  value={field.help_text || ""}
                  onChange={(e) => change("help_text", e.target.value)}
                  placeholder="e.g. Include area code..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" } }}
                />
              </FieldRow>
            )}

            {/* Formula Field Settings */}
            {type === "formula" && (
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CalculateRoundedIcon sx={{ color: "#4F46E5", fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#3730A3", fontSize: "0.82rem" }}>
                    Mathematical Formula
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: "#4338CA", fontSize: "0.76rem", mb: 1.5, fontFamily: "monospace", wordBreak: "break-all" }}>
                  {field.formula_expression || "No formula defined yet"}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  startIcon={<FunctionsRoundedIcon />}
                  onClick={() => setOpenFormulaBuilder(true)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    textTransform: "none",
                    background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.30)",
                  }}
                >
                  Configure Formula
                </Button>
              </Paper>
            )}

            {/* Dynamic API Lookup Settings */}
            {(type === "lookup" || ["text", "number", "email", "phone"].includes(type)) && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: type === "lookup" ? "#F5F3FF" : "#F8FAFC",
                  border: type === "lookup" ? "1.5px solid #C4B5FD" : "1px solid #E2E8F0",
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SearchRoundedIcon sx={{ color: "#7C3AED", fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#5B21B6", fontSize: "0.82rem" }}>
                      Dynamic API Lookup
                    </Typography>
                  </Box>
                  {field.lookup_config && (
                    <Chip
                      label="Configured"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        bgcolor: "#EDE9FE",
                        color: "#6D28D9",
                        border: "1px solid #DDD6FE",
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#6D28D9",
                    fontSize: "0.75rem",
                    mb: 1.5,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {(() => {
                    try {
                      if (!field.lookup_config) return "Configure external REST API to auto-fill fields";
                      const parsed = typeof field.lookup_config === "string" ? JSON.parse(field.lookup_config) : field.lookup_config;
                      return parsed?.endpoint ? `API: ${parsed.endpoint}` : "Configure external REST API to auto-fill fields";
                    } catch {
                      return "Configure external REST API to auto-fill fields";
                    }
                  })()}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  startIcon={<TuneRoundedIcon />}
                  onClick={() => setOpenLookupBuilder(true)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    textTransform: "none",
                    background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.30)",
                    "&:hover": { background: "linear-gradient(135deg, #6D28D9 0%, #4338CA 100%)" },
                  }}
                >
                  Configure API Lookup
                </Button>
              </Paper>
            )}

            {/* Description */}
            {!["section_divider", "page_break"].includes(type) && (
              <FieldRow label="Description" hint="Detailed instructions shown above input">
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={field.description || ""}
                  onChange={(e) => change("description", e.target.value)}
                  placeholder="Add guidance or notes for respondents..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" } }}
                />
              </FieldRow>
            )}

            {/* Default Value */}
            {hasDefaultValue && (
              <FieldRow label="Default Value" hint="Pre-filled value when form loads">
                <TextField
                  fullWidth
                  size="small"
                  value={field.default_value || ""}
                  onChange={(e) => change("default_value", e.target.value)}
                  placeholder="e.g. Default answer..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" } }}
                />
              </FieldRow>
            )}

            {/* Behavior Section */}
            {!isLayout && (
              <>
                <Divider />
                <SectionHeader label="Behavior & Access" />

                <Stack spacing={0.5}>
                  <FormControlLabel
                    control={<Switch size="small" checked={!!field.is_required} onChange={(e) => change("is_required", e.target.checked)} color="error" />}
                    label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>Required Question</Typography>}
                    sx={{ m: 0 }}
                  />
                  <FormControlLabel
                    control={<Switch size="small" checked={!!field.is_read_only} onChange={(e) => change("is_read_only", e.target.checked)} />}
                    label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>Read Only (Disabled)</Typography>}
                    sx={{ m: 0 }}
                  />
                  <FormControlLabel
                    control={<Switch size="small" checked={!!field.is_hidden} onChange={(e) => change("is_hidden", e.target.checked)} />}
                    label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>Hidden Field</Typography>}
                    sx={{ m: 0 }}
                  />
                </Stack>
              </>
            )}

            <Divider />
            <SectionHeader label="Layout & Display" />

            <FieldRow label="Field Width">
              <ToggleButtonGroup
                value={field.width || "full"}
                exclusive
                onChange={(_, val) => { if (val) change("width", val); }}
                size="small"
                sx={{ "& .MuiToggleButton-root": { fontSize: "0.72rem", fontWeight: 700, textTransform: "none", borderRadius: 1.5 } }}
              >
                <ToggleButton value="full">Full Width (100%)</ToggleButton>
                <ToggleButton value="half">Half Width (50%)</ToggleButton>
              </ToggleButtonGroup>
            </FieldRow>

            {!isLayout && (
              <FieldRow label="Label Position">
                <Select
                  fullWidth
                  size="small"
                  value={field.label_position || "top"}
                  onChange={(e) => change("label_position", e.target.value)}
                  sx={{ borderRadius: 2, fontSize: "0.83rem" }}
                >
                  <MenuItem value="top">Top (Standard)</MenuItem>
                  <MenuItem value="left">Left Aligned</MenuItem>
                  <MenuItem value="right">Right Aligned</MenuItem>
                </Select>
              </FieldRow>
            )}

            {hasPlaceholder && (
              <FormControlLabel
                control={<Switch size="small" checked={field.show_placeholder !== false} onChange={(e) => change("show_placeholder", e.target.checked)} />}
                label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>Show Placeholder</Typography>}
                sx={{ m: 0 }}
              />
            )}
          </Stack>
        )}

        {/* ═══════════════════ VALIDATION TAB ═══════════════════ */}
        {activeTab === "validation" && !isLayout && (
          <Stack spacing={2}>
            <SectionHeader
              label={
                isNumberInput
                  ? "Numeric Range Limits"
                  : isDateTimeInput
                  ? "Date / Time Constraints"
                  : isRatingOrScale
                  ? "Scale Bounds"
                  : "Character Limits"
              }
            />

            <Stack direction="row" spacing={1}>
              <FieldRow label={isNumberInput || isRatingOrScale ? "Minimum Value" : "Min Length (Chars)"}>
                <TextField
                  size="small"
                  type="number"
                  value={field.min_length ?? ""}
                  onChange={(e) => change("min_length", e.target.value === "" ? null : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                  placeholder="Min"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" }, width: 100 }}
                />
              </FieldRow>

              <FieldRow label={isNumberInput || isRatingOrScale ? "Maximum Value" : "Max Length (Chars)"}>
                <TextField
                  size="small"
                  type="number"
                  value={field.max_length ?? ""}
                  onChange={(e) => change("max_length", e.target.value === "" ? null : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                  placeholder="Max"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" }, width: 100 }}
                />
              </FieldRow>
            </Stack>

            {(isTextInput || isNumberInput) && (
              <>
                <Divider />
                <SectionHeader label="Regex Pattern Validation" />

                <FieldRow label="Regex Pattern" hint="E.g. ^[A-Z0-9]+$ for uppercase alphanumeric">
                  <TextField
                    fullWidth
                    size="small"
                    value={field.regex_pattern || ""}
                    onChange={(e) => change("regex_pattern", e.target.value)}
                    placeholder="^[a-zA-Z0-9]+$"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem", fontFamily: "monospace" } }}
                  />
                </FieldRow>

                <FieldRow label="Custom Error Message" hint="Displayed when respondent input breaks rule">
                  <TextField
                    fullWidth
                    size="small"
                    value={field.validation_message || ""}
                    onChange={(e) => change("validation_message", e.target.value)}
                    placeholder="Please enter a valid format..."
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" } }}
                  />
                </FieldRow>
              </>
            )}

            <Divider />
            <SectionHeader label="System Format Validator" />

            <Stack spacing={1}>
              {field.field_type === "email" && (
                <Box sx={{ p: 1.5, bgcolor: "#EEF2FF", borderRadius: 2, border: "1px solid #C7D2FE" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#4F46E5", fontSize: "0.75rem" }}>
                    ✅ Email format validation is active
                  </Typography>
                </Box>
              )}
              {field.field_type === "phone" && (
                <Box sx={{ p: 1.5, bgcolor: "#ECFDF5", borderRadius: 2, border: "1px solid #A7F3D0" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#059669", fontSize: "0.75rem" }}>
                    ✅ Phone number format validation is active
                  </Typography>
                </Box>
              )}
              {field.field_type === "url" && (
                <Box sx={{ p: 1.5, bgcolor: "#FFFBEB", borderRadius: 2, border: "1px solid #FDE68A" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#D97706", fontSize: "0.75rem" }}>
                    ✅ URL format validation is active
                  </Typography>
                </Box>
              )}
              {field.field_type === "number" && (
                <Box sx={{ p: 1.5, bgcolor: "#F0F9FF", borderRadius: 2, border: "1px solid #BAE6FD" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#0284C7", fontSize: "0.75rem" }}>
                    ✅ Numeric input validation is active
                  </Typography>
                </Box>
              )}
              {field.field_type === "date" && (
                <Box sx={{ p: 1.5, bgcolor: "#FDF4FF", borderRadius: 2, border: "1px solid #E9D5FF" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#7C3AED", fontSize: "0.75rem" }}>
                    ✅ Date format validation is active
                  </Typography>
                </Box>
              )}
              {field.field_type === "time" && (
                <Box sx={{ p: 1.5, bgcolor: "#FDF4FF", borderRadius: 2, border: "1px solid #E9D5FF" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#7C3AED", fontSize: "0.75rem" }}>
                    ✅ Time format validation is active
                  </Typography>
                </Box>
              )}
              {!["email", "phone", "url", "number", "date", "time"].includes(field.field_type) && (
                <Box sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.73rem" }}>
                    Custom regex pattern and character limits will be evaluated on submit.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        )}

        {/* ═══════════════════ OPTIONS TAB ═══════════════════ */}
        {activeTab === "options" && isChoice && (
          <Stack spacing={2}>
            <SectionHeader label="Choice Options" />

            {/* Option list */}
            <Stack spacing={0.6}>
              {(field.options || []).map((opt, idx) => (
                <OptionItem
                  key={opt.id}
                  option={opt}
                  index={idx}
                  totalCount={(field.options || []).length}
                  onChange={onEditOption}
                  onDelete={onDeleteOption}
                  onMoveUp={(i) => onMoveOption(field.options[i].id, "up")}
                  onMoveDown={(i) => onMoveOption(field.options[i].id, "down")}
                  isDragging={dragOptionIdx === idx}
                  onDragStart={(e, i) => {
                    setDragOptionIdx(i);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e, i) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e, targetIdx) => {
                    e.preventDefault();
                    const sourceIdx = dragOptionIdx;
                    setDragOptionIdx(null);
                    if (sourceIdx === null || sourceIdx === targetIdx) return;
                    if (onDragOption) {
                      onDragOption(sourceIdx, targetIdx);
                    }
                  }}
                />
              ))}

              {/* Add option row */}
              <Box display="flex" gap={1} mt={0.5}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="New option..."
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onAddOption(); }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.8rem" } }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={onAddOption}
                  sx={{ px: 1.5, minWidth: 0, borderRadius: 2, fontWeight: 700 }}
                >
                  <AddRoundedIcon sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            </Stack>

            <Divider />
            <SectionHeader label="Choice Settings" />

            <Stack spacing={0.5}>
              <FormControlLabel
                control={<Switch size="small" checked={!!field.shuffle_options} onChange={(e) => change("shuffle_options", e.target.checked)} />}
                label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>Shuffle Options</Typography>}
                sx={{ m: 0 }}
              />
              <FormControlLabel
                control={<Switch size="small" checked={!!field.allow_other} onChange={(e) => change("allow_other", e.target.checked)} />}
                label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>Allow "Other" Option</Typography>}
                sx={{ m: 0 }}
              />
              {["checkbox", "matrix"].includes(field.field_type) && (
                <FormControlLabel
                  control={<Switch size="small" checked={!!field.allow_multiple} onChange={(e) => change("allow_multiple", e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>Allow Multiple Selection</Typography>}
                  sx={{ m: 0 }}
                />
              )}
            </Stack>

            {(field.allow_multiple || ["checkbox"].includes(field.field_type)) && (
              <FieldRow label="Max Selections" hint="Leave empty for unlimited">
                <TextField
                  size="small"
                  type="number"
                  value={field.max_selections ?? ""}
                  onChange={(e) => change("max_selections", e.target.value === "" ? null : Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" }, width: 100 }}
                />
              </FieldRow>
            )}
          </Stack>
        )}

        {/* ═══════════════════ UPLOAD TAB ═══════════════════ */}
        {activeTab === "upload" && isUpload && (
          <Stack spacing={2}>
            <SectionHeader label="File Restrictions" />

            <FieldRow label="Allowed File Types" hint="Comma-separated extensions. Leave empty to allow all.">
              <TextField
                fullWidth
                size="small"
                value={field.allowed_file_types || ""}
                onChange={(e) => change("allowed_file_types", e.target.value)}
                placeholder=".pdf, .docx, .png, .jpg"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem", fontFamily: "monospace" } }}
              />
              {/* Quick presets */}
              <Stack direction="row" spacing={0.5} mt={0.8} flexWrap="wrap" useFlexGap>
                {[
                  { label: "Images", value: ".jpg,.jpeg,.png,.gif,.webp" },
                  { label: "Documents", value: ".pdf,.docx,.doc,.txt" },
                  { label: "Spreadsheets", value: ".xlsx,.xls,.csv" },
                  { label: "All", value: "" },
                ].map((preset) => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    size="small"
                    variant="outlined"
                    onClick={() => change("allowed_file_types", preset.value)}
                    sx={{
                      fontSize: "0.63rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      borderColor: field.allowed_file_types === preset.value ? "#4F46E5" : "#E2E8F0",
                      color: field.allowed_file_types === preset.value ? "#4F46E5" : "#64748B",
                      bgcolor: field.allowed_file_types === preset.value ? "#EEF2FF" : "transparent",
                    }}
                  />
                ))}
              </Stack>
            </FieldRow>

            <Divider />
            <SectionHeader label="Size & Count" />

            <Stack direction="row" spacing={2}>
              <FieldRow label="Max File Size (MB)">
                <TextField
                  size="small"
                  type="number"
                  value={field.max_file_size_mb ?? ""}
                  onChange={(e) => change("max_file_size_mb", e.target.value === "" ? null : Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  placeholder="10"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" }, width: 100 }}
                />
              </FieldRow>

              <FieldRow label="Max Files">
                <TextField
                  size="small"
                  type="number"
                  value={field.max_files ?? 1}
                  onChange={(e) => change("max_files", Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.83rem" }, width: 80 }}
                />
              </FieldRow>
            </Stack>

            {field.field_type === "image_upload" && (
              <>
                <Divider />
                <Box sx={{ p: 1.5, bgcolor: "#ECFDF5", borderRadius: 2, border: "1px solid #A7F3D0" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#059669", fontSize: "0.75rem" }}>
                    ✅ Image preview is automatically shown after upload
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        )}
      </Box>

      {/* ── Panel footer ── */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid #F1F5F9",
          bgcolor: "#FAFAFA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.67rem" }}>
          ID #{field.id} · {field.field_type}
        </Typography>
        <Chip
          label={field.is_required ? "Required" : "Optional"}
          size="small"
          sx={{
            fontSize: "0.6rem",
            fontWeight: 700,
            height: 18,
            bgcolor: field.is_required ? "#FEF2F2" : "#F8FAFC",
            color: field.is_required ? "#DC2626" : "#64748B",
            border: `1px solid ${field.is_required ? "#FECACA" : "#E2E8F0"}`,
          }}
        />
      </Box>

      {/* Formula Builder Dialog */}
      <FormulaBuilderDialog
        open={openFormulaBuilder}
        onClose={() => setOpenFormulaBuilder(false)}
        field={field}
        allFields={allFields}
        onSave={(res) => {
          change("formula_expression", res.formula_expression);
          change("decimal_places", res.decimal_places);
          change("number_prefix", res.number_prefix);
          change("number_suffix", res.number_suffix);
        }}
      />

      {/* Dynamic API Lookup Config Dialog */}
      <LookupConfigDialog
        open={openLookupBuilder}
        onClose={() => setOpenLookupBuilder(false)}
        field={field}
        allFields={allFields}
        onSave={(lookupConfigStr) => {
          change("lookup_config", lookupConfigStr);
        }}
      />
    </Paper>
  );
}
