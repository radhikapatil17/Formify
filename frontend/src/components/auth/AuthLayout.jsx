import { Paper } from "@mui/material";
import { motion } from "framer-motion";

export default function AuthLayout({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 400,
          maxWidth: "92vw",
          borderRadius: 1.5, // 6px from theme
          border: "1px solid #E4E4E7",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
          bgcolor: "#FFFFFF",
          p: 4.5,
        }}
      >
        {children}
      </Paper>
    </motion.div>
  );
}