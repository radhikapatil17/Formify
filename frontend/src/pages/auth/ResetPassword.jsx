import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import AuthBackground from "../../components/auth/AuthBackground";
import AuthLayout from "../../components/auth/AuthLayout";
import api from "../../api/api";

const PASSWORD_RULES = {
  minLength: { test: (v) => v.length >= 8, msg: "Minimum 8 characters required" },
  uppercase: { test: (v) => /[A-Z]/.test(v), msg: "One uppercase letter required" },
  lowercase: { test: (v) => /[a-z]/.test(v), msg: "One lowercase letter required" },
  number: { test: (v) => /[0-9]/.test(v), msg: "One number required" },
  special: {
    test: (v) => /[!@#$%^&*()_+\-=\[\]{};':",.<>?/\\|~]/.test(v),
    msg: "One special character required",
  },
};

function validatePassword(v) {
  for (const rule of Object.values(PASSWORD_RULES)) {
    if (!rule.test(v)) return rule.msg;
  }
  return true;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  const password = watch("newPassword") || "";
  const confirmPassword = watch("confirmPassword") || "";

  const isPasswordValid = Object.values(PASSWORD_RULES).every((r) => r.test(password));
  const isSubmitDisabled =
    loading || !isPasswordValid || !confirmPassword || password !== confirmPassword;

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Missing password reset token");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/reset-password", {
        token: token,
        new_password: data.newPassword,
      });

      toast.success(res.data.message || "Password updated successfully!");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthBackground>
        <AuthLayout>
          <Box width="100%" textAlign="center">
            <Typography variant="h3" fontWeight={700} sx={{ mb: 1.5, fontSize: "1.25rem", color: "error.main" }}>
              Invalid Reset Link
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This password reset link is invalid or expired. Please request a new link.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/forgot-password"
              fullWidth
              sx={{ py: 1 }}
            >
              Request New Link
            </Button>
          </Box>
        </AuthLayout>
      </AuthBackground>
    );
  }

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
              <KeyRoundedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 0.8, letterSpacing: "-0.03em", fontSize: "1.35rem" }}>
              Set New Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              Your new password must be different from previously used passwords.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* New Password */}
            <Box sx={{ mb: 2 }}>
              <InputLabel
                htmlFor="newPassword"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 0.8,
                  fontSize: "0.725rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                New Password
              </InputLabel>
              <TextField
                id="newPassword"
                fullWidth
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoFocus
                {...register("newPassword", {
                  required: "New password is required",
                  validate: validatePassword,
                })}
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Confirm Password */}
            <Box sx={{ mb: 3.5 }}>
              <InputLabel
                htmlFor="confirmPassword"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 0.8,
                  fontSize: "0.725rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Confirm Password
              </InputLabel>
              <TextField
                id="confirmPassword"
                fullWidth
                placeholder="••••••••"
                type={showConfirm ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) => val === password || "Passwords do not match",
                })}
                error={!!errors.confirmPassword || (!!confirmPassword && password !== confirmPassword)}
                helperText={
                  confirmPassword ? (
                    <Typography
                      variant="caption"
                      component="span"
                      sx={{
                        color: confirmPassword === password ? "success.main" : "error.main",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {confirmPassword === password ? "Passwords match" : "Passwords do not match"}
                    </Typography>
                  ) : (
                    errors.confirmPassword?.message
                  )
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                        {showConfirm ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitDisabled}
              sx={{
                py: 1.1,
                fontSize: "0.8125rem",
                fontWeight: 600,
                mb: 3,
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                },
              }}
            >
              {loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Reset Password"}
            </Button>
          </form>

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
