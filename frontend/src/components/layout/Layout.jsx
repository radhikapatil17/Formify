import { useState } from "react";
import { Box, Drawer } from "@mui/material";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIAssistantWidget from "../common/AIAssistantWidget";

const EXPANDED_SIDEBAR_WIDTH = 250;
const COLLAPSED_SIDEBAR_WIDTH = 76;

export default function Layout({ children }) {
  const location = useLocation();

  // Desktop collapsible sidebar state
  const [collapsed, setCollapsed] = useState(false);

  // Mobile drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const handleMobileMenuToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  const sidebarWidth = collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP COLLAPSIBLE SIDEBAR
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          display: { xs: "none", md: "block" },
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE DRAWER SIDEBAR
         ───────────────────────────────────────────────────────────── */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: EXPANDED_SIDEBAR_WIDTH,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderColor: "divider",
          },
        }}
      >
        <Sidebar collapsed={false} onItemClick={handleMobileClose} />
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN VIEWPORT & NAVBAR PANEL
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: `${sidebarWidth}px` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          width: { xs: "100%", md: `calc(100% - ${sidebarWidth}px)` },
        }}
      >
        {/* Top Navbar */}
        <Navbar onMobileMenuToggle={handleMobileMenuToggle} />

        {/* Viewport Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 2.5, sm: 3.5, md: 4.5 },
            py: { xs: 2.5, md: 3.5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 1600,
              mx: "auto",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                width: "100%",
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
      <AIAssistantWidget />
    </Box>
  );
}