import { Paper, Box, Typography, Chip } from "@mui/material";
import { motion } from "framer-motion";

export default function StatCard({
  title,
  value,
  icon,
  color = "#4F46E5",
  iconBg,
  iconColor,
  subtitle,
  sub, // Alias for subtitle
  trend,
  trendType = "neutral", // "success" | "warning" | "error" | "info" | "neutral"
}) {
  const displaySubtitle = subtitle || sub;

  // Determine trend colors based on trendType or auto-detect
  const getTrendColors = () => {
    switch (trendType) {
      case "success":
        return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
      case "warning":
        return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" };
      case "error":
        return { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" };
      case "info":
        return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
      default:
        return { bg: "#F4F4F5", text: "#52525B", border: "#E4E4E7" };
    }
  };

  const trendColors = getTrendColors();
  const effectiveIconBg = iconBg || `${color}15`;
  const effectiveIconColor = iconColor || color;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{ height: "100%" }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.75,
          height: "100%",
          minHeight: 160,
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
          "&:hover": {
            borderColor: `${color}40`,
            boxShadow: `0 14px 30px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px ${color}15`,
            "& .stat-icon-badge": {
              transform: "scale(1.08) rotate(2deg)",
              boxShadow: `0 6px 16px ${color}25`,
            },
            "& .stat-accent-bar": {
              opacity: 1,
              transform: "scaleX(1)",
            },
          },
        }}
      >
        {/* Subtle Top Accent Glow Bar */}
        <Box
          className="stat-accent-bar"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: color,
            opacity: 0.7,
            transform: "scaleX(0.95)",
            transition: "all 0.25s ease",
            borderRadius: "3px 3px 0 0",
          }}
        />

        {/* ─────────────────────────────────────────────────────────────
            HEADER ROW: TITLE & COLORED ICON BADGE
           ───────────────────────────────────────────────────────────── */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: "#64748B",
                fontSize: "0.8125rem",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Colored Icon Container */}
          <Box
            className="stat-icon-badge"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: effectiveIconBg,
              color: effectiveIconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `1px solid ${color}20`,
              boxShadow: `0 2px 8px ${color}10`,
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {icon}
          </Box>
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            VALUE & METRIC SUBTEXT / TREND
           ───────────────────────────────────────────────────────────── */}
        <Box mt={1.5}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              letterSpacing: "-0.04em",
              fontSize: "2.1rem",
              color: "#0F172A",
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          <Box display="flex" alignItems="center" gap={1} mt={1.2} flexWrap="wrap">
            {trend && (
              <Chip
                label={trend}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  bgcolor: trendColors.bg,
                  color: trendColors.text,
                  border: `1px solid ${trendColors.border}`,
                  px: 0.2,
                  "& .MuiChip-label": { px: 0.8 },
                }}
              />
            )}
            {displaySubtitle && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.75rem",
                  color: "#64748B",
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