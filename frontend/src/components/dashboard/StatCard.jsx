import { Paper, Box, Typography, Chip, useTheme } from "@mui/material";
import { motion } from "framer-motion";

export default function StatCard({
  title,
  value,
  icon,
  color = "#4F46E5",
  iconBg,
  iconColor,
  subtitle,
  sub,
  trend,
  trendType = "neutral",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const displaySubtitle = subtitle || sub;

  // Trend pill color mapping
  const getTrendColors = () => {
    switch (trendType) {
      case "success":
        return {
          bg: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
          text: isDark ? "#34D399" : "#059669",
          border: isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0",
        };
      case "warning":
        return {
          bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
          text: isDark ? "#FBBF24" : "#D97706",
          border: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
        };
      case "error":
        return {
          bg: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
          text: isDark ? "#F87171" : "#DC2626",
          border: isDark ? "rgba(239, 68, 68, 0.3)" : "#FCA5A5",
        };
      case "info":
        return {
          bg: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
          text: isDark ? "#60A5FA" : "#2563EB",
          border: isDark ? "rgba(59, 130, 246, 0.3)" : "#BFDBFE",
        };
      default:
        return {
          bg: isDark ? "rgba(148, 163, 184, 0.12)" : "#F8FAFC",
          text: isDark ? "#94A3B8" : "#64748B",
          border: isDark ? "rgba(148, 163, 184, 0.25)" : "#E2E8F0",
        };
    }
  };

  const trendColors = getTrendColors();
  const effectiveIconBg = iconBg || `${color}14`;
  const effectiveIconColor = iconColor || color;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 380, damping: 25 }}
      style={{ height: "100%", width: "100%" }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.75,
          width: "100%",
          height: "100%",
          minHeight: 136,
          borderRadius: 3.5,
          border: "1px solid",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
          bgcolor: isDark ? "#1E293B" : "#FFFFFF",
          color: "text.primary",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: isDark
            ? "0 4px 16px -2px rgba(0, 0, 0, 0.3)"
            : "0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)",
          "&:hover": {
            borderColor: `${color}60`,
            boxShadow: isDark
              ? `0 12px 28px -4px rgba(0,0,0,0.45), 0 4px 12px -2px ${color}20`
              : `0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 2px 8px -2px ${color}15`,
            "& .stat-icon-wrapper": {
              transform: "scale(1.08)",
            },
          },
        }}
      >
        {/* Header row: Title & Icon Badge */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color: isDark ? "#94A3B8" : "#64748B",
              fontSize: "0.825rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>

          <Box
            className="stat-icon-wrapper"
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              bgcolor: effectiveIconBg,
              color: effectiveIconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `1px solid ${color}22`,
              transition: "transform 0.2s ease",
            }}
          >
            {icon}
          </Box>
        </Box>

        {/* Value Display */}
        <Box mt={1.2}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              letterSpacing: "-0.035em",
              fontSize: "1.95rem",
              color: isDark ? "#F8FAFC" : "#0F172A",
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          {/* Subtitle & Trend Chip */}
          <Box display="flex" alignItems="center" gap={1} mt={1.1} flexWrap="wrap">
            {trend && (
              <Chip
                label={trend}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  bgcolor: trendColors.bg,
                  color: trendColors.text,
                  border: `1px solid ${trendColors.border}`,
                  "& .MuiChip-label": { px: 0.8 },
                }}
              />
            )}
            {displaySubtitle && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.75rem",
                  color: isDark ? "#64748B" : "#64748B",
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {displaySubtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}