import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  InputLabel,
  CircularProgress,
  Divider,
} from "@mui/material";

import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import GoogleIcon from "@mui/icons-material/Google";

import api from "../../api/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const IS_REAL_GOOGLE_CONFIGURED =
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE" &&
  !GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID");

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch("password");

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.success("Account created successfully! Please sign in.");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Registration failed. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setGoogleLoading(true);
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", response.data.access_token);
      toast.success("Signed in with Google!");
      setTimeout(() => navigate("/dashboard"), 400);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const response = await api.post("/auth/google", {
        credential: "demo_google_token",
      });
      localStorage.setItem("token", response.data.access_token);
      toast.success("Signed in with Google!");
      setTimeout(() => navigate("/dashboard"), 400);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Google authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box width="100%">
      {/* Header */}
      <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 3, textAlign: "center" }}>
        <Box
          component="img"
          src="/formify-logo.jpg"
          alt="Formify Logo"
          sx={{
            height: 44,
            width: "auto",
            borderRadius: 1.2,
            mb: 1.8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{ mb: 0.8, letterSpacing: "-0.03em", fontSize: "1.35rem" }}
        >
          Create your Formify account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
          Start building intelligent forms in minutes.
        </Typography>
      </Box>

      {/* Google OAuth Button */}
      <Box sx={{ mb: 2.5 }}>
        {googleLoading ? (
          <Box
            sx={{
              width: "100%",
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E4E4E7",
              borderRadius: 1,
            }}
          >
            <CircularProgress size={16} />
          </Box>
        ) : IS_REAL_GOOGLE_CONFIGURED ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              "& > div": { width: "100% !important" },
              "& iframe": { width: "100% !important" },
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google Authentication Failed")}
              width="100%"
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </Box>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon sx={{ fontSize: 16 }} />}
            onClick={handleDemoGoogleAuth}
            sx={{
              py: 1,
              borderColor: "#E4E4E7",
              color: "#27272A",
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#FAFAFA",
                borderColor: "#D4D4D8",
              },
            }}
          >
            Sign up with Google
          </Button>
        )}
      </Box>

      <Box display="flex" alignItems="center" sx={{ mb: 2.5 }}>
        <Divider sx={{ flexGrow: 1, bgcolor: "#F4F4F5" }} />
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            color: "text.disabled",
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          or register with email
        </Typography>
        <Divider sx={{ flexGrow: 1, bgcolor: "#F4F4F5" }} />
      </Box>

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Full Name */}
        <Box sx={{ mb: 2 }}>
          <InputLabel
            htmlFor="name"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.8,
              fontSize: "0.725rem",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Full Name
          </InputLabel>
          <TextField
            id="name"
            fullWidth
            placeholder="John Doe"
            autoComplete="name"
            autoFocus
            {...register("name", {
              required: "Full name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Box>

        {/* Email Address */}
        <Box sx={{ mb: 2 }}>
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

        {/* Password */}
        <Box sx={{ mb: 2 }}>
          <InputLabel
            htmlFor="password"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.8,
              fontSize: "0.725rem",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Password
          </InputLabel>
          <TextField
            id="password"
            fullWidth
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
              validate: (val) => {
                if (!/[A-Z]/.test(val)) return "Must contain at least one uppercase letter";
                if (!/[a-z]/.test(val)) return "Must contain at least one lowercase letter";
                if (!/[0-9]/.test(val)) return "Must contain at least one number";
                if (!/[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|~]/.test(val))
                  return "Must contain at least one special character";
                return true;
              },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
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
        <Box sx={{ mb: 2.5 }}>
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
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === passwordValue || "Passwords do not match",
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ py: 1.1, fontSize: "0.8125rem", fontWeight: 600, mb: 2.5 }}
        >
          {loading ? (
            <CircularProgress size={16} sx={{ color: "primary.contrastText" }} />
          ) : (
            "Create Account"
          )}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ fontSize: "0.775rem" }}>
          Already have an account?{" "}
          <Typography
            component={Link}
            to="/login"
            sx={{
              color: "secondary.main",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Sign in
          </Typography>
        </Typography>
      </form>
    </Box>
  );
}
