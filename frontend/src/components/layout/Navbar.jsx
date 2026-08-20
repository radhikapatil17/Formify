import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Avatar,
  Badge,
  InputBase,
  Paper,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Chip,
  Tooltip,
  Button,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import api from "../../api/api";

function decodeToken(token) {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function Navbar({ onMobileMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname.split("/")[1] || "";
  const pageName =
    path === "create-form"
      ? "Form Builder"
      : path.charAt(0).toUpperCase() + path.slice(1);

  const [search, setSearch] = useState("");
  const searchPaperRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchAnchor, setSearchAnchor] = useState(null);

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Real Database Data for Global Search
  const [systemForms, setSystemForms] = useState([]);
  const [systemTemplates, setSystemTemplates] = useState([]);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = localStorage.getItem("token");
  const payload = decodeToken(token);
  const initialName = localStorage.getItem("user_name") || payload?.name || payload?.sub?.split("@")[0] || "User";
  const [displayName, setDisplayName] = useState(initialName);
  const userEmail = payload?.sub || "";
  const userInitials = getInitials(displayName);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const updated = localStorage.getItem("user_name");
      if (updated) setDisplayName(updated);
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  // Fetch Forms and Templates for Global Live Search
  const fetchGlobalSearchData = useCallback(async () => {
    if (!token) return;
    try {
      const [formsRes, tempRes] = await Promise.all([
        api.get("/forms/"),
        api.get("/templates/"),
      ]);
      setSystemForms(formsRes.data || []);
      setSystemTemplates(tempRes.data || []);
    } catch {
      // Ignore fetch errors
    }
  }, [token]);

  useEffect(() => {
    fetchGlobalSearchData();
  }, [fetchGlobalSearchData]);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notifications/"),
        api.get("/notifications/unread-count"),
      ]);
      setNotifications(listRes.data || []);
      setUnreadCount(countRes.data?.unread_count || 0);
    } catch {
      // Ignore polling errors
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Compute Global Live Search Results
  const query = search.trim().toLowerCase();

  const matchingForms = useMemo(() => {
    if (!query) return [];
    return systemForms
      .filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          (f.description && f.description.toLowerCase().includes(query)) ||
          (f.category && f.category.toLowerCase().includes(query))
      )
      .slice(0, 4);
  }, [query, systemForms]);

  const matchingTemplates = useMemo(() => {
    if (!query) return [];
    return systemTemplates
      .filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)) ||
          (t.category && t.category.toLowerCase().includes(query))
      )
      .slice(0, 3);
  }, [query, systemTemplates]);

  const systemPages = useMemo(
    () => [
      { title: "Dashboard Overview", path: "/dashboard", desc: "Key workspace metrics & stats", icon: <DashboardRoundedIcon sx={{ fontSize: 16, color: "#6366F1" }} /> },
      { title: "Forms Portfolio", path: "/forms", desc: "Manage all form schemas & versions", icon: <DescriptionRoundedIcon sx={{ fontSize: 16, color: "#10B981" }} /> },
      { title: "Create Form Builder", path: "/create-form", desc: "Design & build custom forms", icon: <AddCircleRoundedIcon sx={{ fontSize: 16, color: "#F59E0B" }} /> },
      { title: "Templates Gallery", path: "/templates", desc: "Pre-built form blueprints", icon: <LayersRoundedIcon sx={{ fontSize: 16, color: "#8B5CF6" }} /> },
      { title: "Responses & Submissions", path: "/responses", desc: "View submitted response data", icon: <AssignmentRoundedIcon sx={{ fontSize: 16, color: "#3B82F6" }} /> },
      { title: "Analytics Engine", path: "/analytics", desc: "Completion rates & trends", icon: <BarChartRoundedIcon sx={{ fontSize: 16, color: "#EC4899" }} /> },
      { title: "Account & Workspace Settings", path: "/settings", desc: "Themes, preferences & API keys", icon: <SettingsRoundedIcon sx={{ fontSize: 16, color: "#64748B" }} /> },
    ],
    []
  );

  const matchingPages = useMemo(() => {
    if (!query) return [];
    return systemPages
      .filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.desc.toLowerCase().includes(query)
      )
      .slice(0, 3);
  }, [query, systemPages]);

  const isNotifOpen = Boolean(notifAnchor);
  const isMenuOpen = Boolean(menuAnchor);
  const isSearchOpen = Boolean(searchAnchor) && query.length > 0;
  const hasResults = matchingForms.length > 0 || matchingTemplates.length > 0 || matchingPages.length > 0;

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMenu = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleNavigate = (pathStr) => {
    handleCloseMenu();
    setSearchAnchor(null);
    setSearch("");
    navigate(pathStr);
  };

  const handleLogout = () => {
    handleCloseMenu();
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getNotifIcon = (type) => {
    if (type === "response") return <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#10B981" }} />;
    if (type === "published") return <PublicRoundedIcon sx={{ fontSize: 16, color: "#4F46E5" }} />;
    if (type === "export") return <DescriptionRoundedIcon sx={{ fontSize: 16, color: "#3B82F6" }} />;
    if (type === "invite") return <PersonAddRoundedIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />;
    return <NotificationsNoneRoundedIcon sx={{ fontSize: 16, color: "#06B6D4" }} />;
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: 64,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: { xs: 2, md: 4 },
        position: "sticky",
        top: 0,
        zIndex: 1100,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          LEFT: MOBILE TOGGLE & BREADCRUMBS
         ───────────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={onMobileMenuToggle}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            color: "text.primary",
            p: 0.8,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <MenuRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
            Formify
          </Typography>
          <Typography variant="caption" color="text.disabled">
            /
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "-0.01em" }}>
            {pageName || "Dashboard"}
          </Typography>
        </Box>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT: GLOBAL SEARCH OMNIBOX, NOTIFICATIONS & PROFILE
         ───────────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Paper
          ref={searchPaperRef}
          elevation={0}
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            width: { sm: 220, md: 320 },
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: isSearchOpen ? "#6366F1" : "divider",
            borderRadius: 1.8,
            px: 1.5,
            py: 0.5,
            transition: "all 0.2s ease",
            boxShadow: isSearchOpen ? "0 0 0 3px rgba(99, 102, 241, 0.18)" : "none",
          }}
        >
          <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 18, mr: 1 }} />
          <InputBase
            inputRef={searchInputRef}
            placeholder="Search forms, templates, pages... (⌘K)"
            value={search}
            onFocus={(e) => {
              fetchGlobalSearchData();
              if (e.target.value.trim()) setSearchAnchor(searchPaperRef.current);
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) {
                setSearchAnchor(searchPaperRef.current);
              } else {
                setSearchAnchor(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                setSearchAnchor(null);
                navigate(`/forms?search=${encodeURIComponent(search.trim())}`);
              }
            }}
            sx={{
              fontSize: "0.8rem",
              flex: 1,
              color: "text.primary",
              "& input::placeholder": { color: "text.secondary", opacity: 1 },
            }}
          />
        </Paper>

        {/* Global Omnibox Results Popover */}
        <Popover
          open={isSearchOpen}
          anchorEl={searchAnchor}
          onClose={() => setSearchAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{
            elevation: 0,
            sx: {
              width: { sm: 380, md: 440 },
              mt: 1,
              maxHeight: 480,
              overflowY: "auto",
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "0 16px 40px -10px rgba(15, 23, 42, 0.18)",
              p: 1,
            },
          }}
        >
          {!hasResults ? (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No global results found for "<strong>{search}</strong>"
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Press Enter to search in Forms Portfolio
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {/* Section 1: Forms Results */}
              {matchingForms.length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight={700} sx={{ px: 1.5, py: 0.5, color: "#6366F1", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em", display: "block" }}>
                    Forms Portfolio ({matchingForms.length})
                  </Typography>
                  <List dense disablePadding>
                    {matchingForms.map((f) => (
                      <ListItemButton
                        key={f.id}
                        onClick={() => handleNavigate(`/create-form?id=${f.id}`)}
                        sx={{ borderRadius: 1.8, py: 0.8, px: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: "#10B981" }}>
                          <DescriptionRoundedIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={f.title}
                          secondary={f.description || "Form Schema"}
                          primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: 700, color: "text.primary" }}
                          secondaryTypographyProps={{ fontSize: "0.725rem", color: "text.secondary", noWrap: true }}
                        />
                        <Chip label={f.status || "draft"} size="small" sx={{ fontSize: "0.65rem", height: 18, textTransform: "capitalize", fontWeight: 700 }} />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}

              {/* Section 2: Templates Results */}
              {matchingTemplates.length > 0 && (
                <Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ px: 1.5, py: 0.5, color: "#8B5CF6", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em", display: "block" }}>
                    Templates Gallery ({matchingTemplates.length})
                  </Typography>
                  <List dense disablePadding>
                    {matchingTemplates.map((t) => (
                      <ListItemButton
                        key={t.id}
                        onClick={() => handleNavigate(`/templates?search=${encodeURIComponent(t.title)}`)}
                        sx={{ borderRadius: 1.8, py: 0.8, px: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: "#8B5CF6" }}>
                          <LayersRoundedIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t.title}
                          secondary={t.category || "Template Blueprint"}
                          primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: 700, color: "text.primary" }}
                          secondaryTypographyProps={{ fontSize: "0.725rem", color: "text.secondary", noWrap: true }}
                        />
                        <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}

              {/* Section 3: Pages & Navigation Results */}
              {matchingPages.length > 0 && (
                <Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ px: 1.5, py: 0.5, color: "#F59E0B", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em", display: "block" }}>
                    System Pages ({matchingPages.length})
                  </Typography>
                  <List dense disablePadding>
                    {matchingPages.map((p) => (
                      <ListItemButton
                        key={p.path}
                        onClick={() => handleNavigate(p.path)}
                        sx={{ borderRadius: 1.8, py: 0.8, px: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {p.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={p.title}
                          secondary={p.desc}
                          primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: 700, color: "text.primary" }}
                          secondaryTypographyProps={{ fontSize: "0.725rem", color: "text.secondary" }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}

              {/* Quick Jump Options Footer */}
              <Divider sx={{ my: 0.5 }} />
              <Box display="flex" flexDirection="column" gap={0.5} px={1} py={0.5}>
                <Button
                  size="small"
                  fullWidth
                  startIcon={<AssignmentRoundedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleNavigate(`/responses?search=${encodeURIComponent(query)}`)}
                  sx={{ justifyContent: "flex-start", fontSize: "0.75rem", textTransform: "none", fontWeight: 600 }}
                >
                  Search Submissions for "{search}"
                </Button>
                <Button
                  size="small"
                  fullWidth
                  startIcon={<DescriptionRoundedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleNavigate(`/forms?search=${encodeURIComponent(query)}`)}
                  sx={{ justifyContent: "flex-start", fontSize: "0.75rem", textTransform: "none", fontWeight: 600 }}
                >
                  Filter Forms Portfolio for "{search}"
                </Button>
              </Box>
            </Box>
          )}
        </Popover>

        {/* Notifications Trigger Button */}
        <Tooltip title="Notifications">
          <IconButton
            size="small"
            onClick={(e) => {
              setNotifAnchor(e.currentTarget);
              fetchNotifications();
            }}
            sx={{
              color: "text.primary",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.2,
              width: 36,
              height: 36,
              bgcolor: "background.paper",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="primary"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: 9,
                  height: 14,
                  minWidth: 14,
                  bgcolor: "#4F46E5",
                  fontWeight: 700,
                },
              }}
            >
              <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <Tooltip title="Account menu">
          <Avatar
            onClick={handleOpenMenu}
            sx={{
              bgcolor: "#4F46E5",
              color: "#FFFFFF",
              width: 36,
              height: 36,
              fontSize: "0.85rem",
              fontWeight: 700,
              borderRadius: 1.2,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "scale(1.04)" },
            }}
          >
            {userInitials}
          </Avatar>
        </Tooltip>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          REAL DATABASE NOTIFICATIONS POPOVER
         ───────────────────────────────────────────────────────────── */}
      <Popover
        open={isNotifOpen}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 340,
            mt: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: "0 12px 30px -10px rgba(15,23,42,0.12)",
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" pb={1} borderBottom="1px solid" borderColor="divider">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.875rem", color: "text.primary" }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} unread`} size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 800, fontSize: "0.65rem", height: 18 }} />
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={handleMarkAllRead}
              sx={{ fontSize: "0.675rem", fontWeight: 700, textTransform: "none", p: 0 }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <List dense sx={{ pt: 1, pb: 0, maxHeight: 320, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <Box py={3} textAlign="center">
              <Typography variant="caption" color="text.secondary">
                No notifications right now
              </Typography>
            </Box>
          ) : (
            notifications.map((notif) => (
              <ListItem
                key={notif.id}
                secondaryAction={
                  <IconButton size="small" onClick={(e) => handleDeleteNotif(e, notif.id)}>
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                  </IconButton>
                }
                sx={{
                  px: 1,
                  py: 1,
                  borderRadius: 1.5,
                  mb: 0.5,
                  bgcolor: notif.is_read ? "transparent" : (theme) => (theme.palette.mode === "dark" ? "rgba(99, 102, 241, 0.12)" : "#EEF2FF30"),
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {getNotifIcon(notif.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notif.title}
                  secondary={`${notif.message} • ${getRelativeTime(notif.created_at)}`}
                  primaryTypographyProps={{ fontSize: "0.775rem", fontWeight: notif.is_read ? 600 : 800, color: "text.primary" }}
                  secondaryTypographyProps={{ fontSize: "0.7rem", color: "text.secondary" }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Popover>

      {/* ─────────────────────────────────────────────────────────────
          USER DROPDOWN MENU
         ───────────────────────────────────────────────────────────── */}
      <Menu
        anchorEl={menuAnchor}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 250,
            mt: 1.5,
            p: 1,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1.2, mb: 1, bgcolor: "background.default", borderRadius: 1.8, border: "1px solid", borderColor: "divider" }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: "#4F46E5", color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700, borderRadius: 1.2 }}>
              {userInitials}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: "0.85rem", color: "text.primary" }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: "0.725rem", display: "block" }}>
                {userEmail}
              </Typography>
            </Box>
          </Box>
        </Box>

        <MenuItem onClick={() => handleNavigate("/settings")}>
          <ListItemIcon sx={{ minWidth: 30, color: "text.secondary" }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          My Profile
        </MenuItem>

        <Divider sx={{ my: 1, borderColor: "divider" }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: "#EF4444 !important",
            fontWeight: 600,
            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08) !important" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 30, color: "#EF4444" }}>
            <LogoutRoundedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}