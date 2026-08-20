import { Box } from "@mui/material";

export default function AuthBackground({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#FAFAFA", // Zinc-50 background
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.03) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.03) 0px, transparent 50%),
          radial-gradient(#E4E4E7 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 20px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 6,
        px: 2,
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}