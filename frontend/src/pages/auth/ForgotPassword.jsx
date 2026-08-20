import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import {
  Box,
  Typography,
  TextField,
  Button,
  InputLabel,
  CircularProgress,
  Paper,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";

import AuthBackground from "../../components/auth/AuthBackground";
import AuthLayout from "../../components/auth/AuthLayout";
import api from "../../api/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetData, setResetData] = useState(null); // { message, reset_link }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", {
        email: data.email,
      });

      setResetData(res.data);
      toast.success("Verification request processed!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <AuthLayout>
        <Box width="100%">
          {/* Header */}
          <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 3.5, textAlign: "center" }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: "#F4F4F5",
                color: "#4F46E5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <LockResetRoundedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 0.8, letterSpacing: "-0.03em", fontSize: "1.35rem" }}>
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              No worries, enter your email and we&apos;ll send you instructions to reset your password.
            </Typography>
          </Box>

          {resetData ? (
            /* Success State */
            <Box display="flex" flexDirection="column" alignItems="center">
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  width: "100%",
                  bgcolor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 1.5,
                  mb: 3,
                  textAlign: "center",
                }}
              >
                <MarkEmailReadRoundedIcon sx={{ color: "#16A34A", fontSize: 32, mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: "#15803D", mb: 1 }}>
                  {resetData.message}
                </Typography>

                {resetData.reset_link && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                      Demo Environment: Reset link generated directly below:
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      onClick={() => {
                        const url = new URL(resetData.reset_link);
                        navigate(`${url.pathname}${url.search}`);
                      }}
                      sx={{ py: 1, fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      Click to Reset Password
                    </Button>
                  </Box>
                )}
              </Paper>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setResetData(null)}
                sx={{ mb: 2, py: 1, fontSize: "0.8rem" }}
              >
                Resend another email
              </Button>
            </Box>
          ) : (
            /* Request Form */
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box sx={{ mb: 3 }}>
                <InputLabel
                  htmlFor="email"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    mb: 0.8,
                    fontSize: "0.725rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Email Address
                </InputLabel>
                <TextField
                  id="email"
                  fullWidth
                  placeholder="name@company.com"
                  autoComplete="email"
                  autoFocus
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ py: 1.1, fontSize: "0.8125rem", fontWeight: 600, mb: 3 }}
              >
                {loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Reset Password"}
              </Button>
            </form>
          )}

          {/* Back to Sign in link */}
          <Box display="flex" justifyContent="center">
            <Typography
              component={Link}
              to="/login"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.8,
                color: "text.secondary",
                fontSize: "0.8rem",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { color: "text.primary" },
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 16 }} /> Back to Sign In
            </Typography>
          </Box>
        </Box>
      </AuthLayout>
    </AuthBackground>
  );
}
