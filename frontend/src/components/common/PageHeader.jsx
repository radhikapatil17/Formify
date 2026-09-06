import { Box, Typography, Stack } from "@mui/material";

/**
 * Shared PageHeader component used across all main pages.
 * Provides a consistent title + subtitle + optional actions layout.
 *
 * Props:
 *   title       - Main heading text
 *   subtitle    - Optional subtitle / description
 *   actions     - Optional React node (buttons, chips, etc.) shown on the right
 *   badge       - Optional badge element shown next to title
 */
export default function PageHeader({ title, subtitle, actions, badge }) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      flexDirection={{ xs: "column", sm: "row" }}
      gap={2}
      sx={{ mb: 0, width: "100%" }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              letterSpacing: "-0.03em",
              color: "text.primary",
              fontSize: { xs: "1.35rem", md: "1.5rem" },
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {badge && badge}
        </Box>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, maxWidth: 640, lineHeight: 1.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions && (
        <Stack
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="flex-end"
          flexShrink={0}
        >
          {actions}
        </Stack>
      )}
    </Box>
  );
}
