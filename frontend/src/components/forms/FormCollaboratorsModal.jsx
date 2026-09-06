import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  Chip,
  Stack,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import toast from "react-hot-toast";
import api from "../../api/api";

export default function FormCollaboratorsModal({ open, onClose, form }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  const fetchCollaborators = async () => {
    if (!form) return;
    try {
      setLoading(true);
      const res = await api.get(`/forms/${form.id}/collaborators`);
      setCollaborators(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && form) {
      fetchCollaborators();
    }
  }, [form, open]);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      setInviting(true);
      const res = await api.post(`/forms/${form.id}/collaborators`, {
        email: email.trim(),
        role: role,
      });
      toast.success("Invitation sent successfully!");
      setEmail("");
      setCollaborators((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (collaboratorId, newRole) => {
    try {
      const res = await api.put(`/forms/${form.id}/collaborators/${collaboratorId}`, {
        role: newRole,
      });
      toast.success("Collaborator role updated successfully!");
      setCollaborators((prev) =>
        prev.map((c) => (c.id === collaboratorId ? { ...c, role: res.data.role } : c))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role.");
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await api.delete(`/forms/${form.id}/collaborators/${collaboratorId}`);
      toast.success("Collaborator removed successfully.");
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove collaborator.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 0.5,
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.18)",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, pt: 2.5, px: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GroupAddRoundedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", fontSize: "1.15rem" }}>
              Form Collaborators
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Invite editors and viewers to collaborate on this form
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Stack spacing={3}>
          {/* Invite Form */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#F8FAFC",
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1E293B", mb: 2 }}>
              Invite a Collaborator
            </Typography>
            <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
              <TextField
                type="email"
                placeholder="User's email address..."
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  flex: 2,
                  minWidth: 200,
                  "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#FFFFFF" },
                }}
              />
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                size="small"
                sx={{
                  flex: 0.8,
                  minWidth: 110,
                  borderRadius: 2,
                  bgcolor: "#FFFFFF",
                }}
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
              </Select>
              <Button
                variant="contained"
                onClick={handleInvite}
                disabled={inviting}
                startIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  bgcolor: "#4F46E5",
                  "&:hover": { bgcolor: "#4338CA" },
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
                }}
              >
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </Box>
          </Paper>

          {/* Collaborator List */}
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#475569", mb: 1.5 }}>
              Collaborators &amp; Access Roles
            </Typography>

            <Paper
              elevation={0}
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: 2.5,
                overflow: "hidden",
              }}
            >
              <List disablePadding>
                {/* Always include Owner */}
                <ListItem
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: "#4F46E5", width: 36, height: 36 }}>
                      <PersonRoundedIcon sx={{ fontSize: 20, color: "#FFFFFF" }} />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0F172A" }}>
                          {form?.owner_name || "Owner"}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {form?.owner_email}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Chip
                    label="Owner"
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      bgcolor: "#EEF2FF",
                      color: "#4F46E5",
                      border: "1px solid #C7D2FE",
                    }}
                  />
                </ListItem>

                {collaborators.length > 0 && <Divider />}

                {collaborators.map((collaborator, index) => (
                  <Box key={collaborator.id}>
                    <ListItem
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        bgcolor: "#FFFFFF",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#E2E8F0", width: 36, height: 36, color: "#64748B" }}>
                          {collaborator.name ? collaborator.name[0].toUpperCase() : "U"}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#0F172A" }}>
                                {collaborator.name || "Formify User"}
                              </Typography>
                              {collaborator.status === "pending" && (
                                <Chip
                                  label="Pending"
                                  size="small"
                                  color="warning"
                                  sx={{ fontWeight: 800, fontSize: "0.625rem", height: 16 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {collaborator.email}
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <Select
                          value={collaborator.role}
                          onChange={(e) => handleUpdateRole(collaborator.id, e.target.value)}
                          size="small"
                          sx={{
                            borderRadius: 1.5,
                            fontSize: "0.8rem",
                            height: 32,
                            "& .MuiSelect-select": { py: 0.5 },
                          }}
                        >
                          <MenuItem value="viewer">Viewer</MenuItem>
                          <MenuItem value="editor">Editor</MenuItem>
                        </Select>

                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          sx={{
                            bgcolor: "#FEF2F2",
                            "&:hover": { bgcolor: "#FEE2E2" },
                            borderRadius: 1.5,
                          }}
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < collaborators.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ fontWeight: 600, borderRadius: 2, textTransform: "none", borderColor: "#CBD5E1", ml: "auto" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
