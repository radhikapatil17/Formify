import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Stack,
  TextField,
  Chip,
  Alert,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { PRESET_THEMES, DEFAULT_FORM_THEME } from "../../utils/themePresets";

export default function ThemeCustomizer({ themeConfig, onChangeTheme, onOpenPreview }) {
  const currentTheme = themeConfig || DEFAULT_FORM_THEME;

  const handleSelectPreset = (preset) => {
    onChangeTheme({
      preset: preset.id,
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
      buttonColor: preset.buttonColor,
      accentColor: preset.accentColor,
      cardColor: preset.cardColor,
    });
  };

  const handleCustomColorChange = (key, hexValue) => {
    onChangeTheme({
      ...currentTheme,
      preset: "custom",
      [key]: hexValue,
    });
  };

  const handleResetDefault = () => {
    handleSelectPreset(DEFAULT_FORM_THEME);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", py: 2 }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION & PREVIEW PROMPT
         ───────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "text.primary", letterSpacing: "-0.02em" }}>
            Theme & Appearance Customizer
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
            Select a preset theme or customize brand colors. Your theme persists and applies automatically to Preview and Public Forms.
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={handleResetDefault}
          sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
        >
          Reset to Default
        </Button>
      </Box>

      <Stack spacing={3.5}>
        {/* ─────────────────────────────────────────────────────────────
            2. PRESET THEMES SECTION
           ───────────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Box display="flex" alignItems="center" gap={1} mb={2.5}>
            <PaletteRoundedIcon sx={{ color: "#6366F1", fontSize: 22 }} />
            <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.1rem", color: "text.primary" }}>
              Preset Themes
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {PRESET_THEMES.map((preset) => {
              const isSelected = currentTheme.preset === preset.id;

              return (
                <Grid item xs={12} sm={6} md={4} key={preset.id}>
                  <Paper
                    elevation={0}
                    onClick={() => handleSelectPreset(preset)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      border: isSelected ? "2px solid #6366F1" : "1px solid",
                      borderColor: isSelected ? "#6366F1" : "divider",
                      bgcolor: isSelected
                        ? (theme) => (theme.palette.mode === "dark" ? "#1E1B4B" : "#EEF2FF")
                        : "background.paper",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      "&:hover": {
                        borderColor: "#6366F1",
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 25px -4px rgba(99, 102, 241, 0.18)",
                      },
                    }}
                  >
                    {isSelected && (
                      <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                        <CheckCircleRoundedIcon sx={{ color: "#6366F1", fontSize: 20 }} />
                      </Box>
                    )}

                    {/* Color Swatch Gradient Bar */}
                    <Box
                      sx={{
                        height: 42,
                        borderRadius: 1.8,
                        background: preset.previewGradient,
                        mb: 1.8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
                      }}
                    />

                    <Typography variant="body1" fontWeight={800} sx={{ color: "text.primary", mb: 0.3 }}>
                      {preset.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.775rem", display: "block", lineHeight: 1.3 }}>
                      {preset.description}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            3. CUSTOM BRAND COLORS SECTION
           ───────────────────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <ColorLensRoundedIcon sx={{ color: "#F59E0B", fontSize: 22 }} />
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.1rem", color: "text.primary" }}>
                Custom Brand Colors
              </Typography>
            </Box>
            {currentTheme.preset === "custom" && (
              <Chip label="Custom Colors Active" size="small" sx={{ bgcolor: "#FEF3C7", color: "#D97706", fontWeight: 700, fontSize: "0.725rem" }} />
            )}
          </Box>

          <Grid container spacing={2.5}>
            {[
              { key: "primaryColor", label: "Primary Color", desc: "Form title & main headings" },
              { key: "backgroundColor", label: "Background Color", desc: "Page layout backdrop" },
              { key: "textColor", label: "Text Color", desc: "Questions & body copy text" },
              { key: "buttonColor", label: "Button Color", desc: "Submit button & primary action" },
              { key: "accentColor", label: "Accent Color", desc: "Radio, checkbox & focus rings" },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.key}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Typography variant="body2" fontWeight={800} sx={{ color: "text.primary", mb: 0.2 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem", display: "block", mb: 1.5 }}>
                    {item.desc}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      component="input"
                      type="color"
                      value={currentTheme[item.key] || "#0F172A"}
                      onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                      sx={{
                        width: 40,
                        height: 40,
                        padding: 0,
                        border: "none",
                        borderRadius: 1.8,
                        cursor: "pointer",
                        bgcolor: "transparent",
                        "&::-webkit-color-swatch-wrapper": { padding: 0 },
                        "&::-webkit-color-swatch": { border: "1px solid rgba(0,0,0,0.15)", borderRadius: "8px" },
                      }}
                    />

                    <TextField
                      size="small"
                      value={currentTheme[item.key] || "#0F172A"}
                      onChange={(e) => handleCustomColorChange(item.key, e.target.value)}
                      sx={{
                        flex: 1,
                        "& input": { fontSize: "0.85rem", fontFamily: "monospace", fontWeight: 700 },
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Stack>
    </Box>
  );
}
