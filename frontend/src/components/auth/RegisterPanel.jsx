import { Box } from "@mui/material";

export default function RegisterPanel() {
  return (
    <Box
      sx={{
        height: "100%",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        px: 8,
        position: "relative",
      }}
    >
      {/* Top Circle */}

      <Box
        sx={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 280,
          height: 280,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,.06)",
        }}
      />

      {/* Bottom Dots */}

      <Box
        sx={{
          position: "absolute",
          bottom: 35,
          left: 35,
          opacity: .15,
          fontSize: 10,
          lineHeight: 1.4,
          letterSpacing: 6,
        }}
      >
    
      </Box>

      <Box
        sx={{
          width: 90,
          height: 90,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,.12)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: 5,
        }}
      >
        
      </Box>
    </Box>
  );
}