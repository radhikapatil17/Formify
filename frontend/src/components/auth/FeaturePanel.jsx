import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";

const features = [
  { text: "Build", desc: "Construct multi-step logic forms with an interactive inspector canvas.", icon: <LayersRoundedIcon sx={{ fontSize: 16 }} /> },
  { text: "Publish", desc: "Share secure links instantly to collect responses from anywhere.", icon: <PublicRoundedIcon sx={{ fontSize: 16 }} /> },
  { text: "Collect", desc: "Store structured response values securely inside clear workspace matrices.", icon: <InboxRoundedIcon sx={{ fontSize: 16 }} /> },
  { text: "Analyze", desc: "Inspect traffic reports, conversion ratios, and developer keys.", icon: <BarChartRoundedIcon sx={{ fontSize: 16 }} /> },
];

export default function FeaturePanel() {
  return (
    <Box
      sx={{
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        minHeight: 520,
        p: 6,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#09090B",
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%)
        `,
      }}
    >
      {/* Top Section */}
      <Box>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 6 }}>
          <Box
            component="img"
            src="/formify-logo.jpg"
            alt="Formify Logo"
            sx={{
              height: 38,
              width: "auto",
              borderRadius: 1,
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
            }}
          />
          <Typography 
            variant="h5" 
            fontWeight={700} 
            sx={{ letterSpacing: "-0.02em", color: "#FFFFFF" }}
          >
            Formify
          </Typography>
        </Box>

        <Typography 
          variant="h2" 
          fontWeight={700} 
          sx={{ mb: 2, letterSpacing: "-0.03em", lineHeight: 1.25, color: "#FFFFFF" }}
        >
          Create dynamic forms in seconds.
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 5, fontSize: "0.9rem", lineHeight: 1.6 }}
        >
          A unified design workspace to build, distribute, and track clean form submissions with real-time analytics.
        </Typography>
      </Box>

      {/* List Section */}
      <Box display="flex" flexDirection="column" gap={3}>
        {features.map((item, idx) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <Box display="flex" gap={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  bgcolor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 0.8,
                  color: "#818CF8",
                  flexShrink: 0,
                  mt: 0.3,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography 
                  variant="body1" 
                  fontWeight={600} 
                  sx={{ fontSize: "0.875rem", color: "#F4F4F5" }}
                >
                  {item.text}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ color: "rgba(255, 255, 255, 0.55)", mt: 0.3, fontSize: "0.8rem", lineHeight: 1.5 }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}