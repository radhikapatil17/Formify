import { useState, useEffect, useRef } from "react";
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
  Alert,
  CircularProgress,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import PhonelinkRingRoundedIcon from "@mui/icons-material/PhonelinkRingRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import toast from "react-hot-toast";

import api from "../../api/api";

export default function PublicVerificationModal({
  open,
  onClose,
  formId,
  verificationType = "email", // "email" or "phone"
  initialDestination = "",
  onVerifiedSuccess,
}) {
  const [step, setStep] = useState(1); // 1 = Confirm Destination, 2 = Enter & Verify OTP
  const [destination, setDestination] = useState(initialDestination);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Timer & Cooldown State
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (open) {
      setDestination(initialDestination || "");
      setStep(1);
      setOtpDigits(["", "", "", "", "", ""]);
      setErrorMessage(null);
      setSending(false);
      setVerifying(false);
    }
  }, [open, initialDestination]);

  // Cooldown countdown timer effect
  useEffect(() => {
    let timer = null;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Send OTP Handler
  const handleSendOtp = async () => {
    const destClean = destination.trim();
    if (!destClean) {
      setErrorMessage(
        verificationType === "email"
          ? "Please enter your email address to receive the verification code."
          : "Please enter your phone number to receive the verification code."
      );
      return;
    }

    try {
      setSending(true);
      setErrorMessage(null);

      const res = await api.post("/public/verification/send-otp", {
        form_id: Number(formId),
        verification_type: verificationType,
        destination: destClean,
      });

      const data = res.data;
      setCooldownRemaining(data.cooldown_seconds || 60);
      setExpiryMinutes(data.expiry_minutes || 10);
      setRemainingAttempts(data.max_attempts || 3);
      setStep(2);
      toast.success(data.message || `Verification code sent to ${destClean}!`);

      // Auto-focus first digit input
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 200);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to send verification code. Please check details.";
      setErrorMessage(detail);
    } finally {
      setSending(false);
    }
  };

  // Handle Digit Box Input
  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const nextDigits = [...otpDigits];
    nextDigits[index] = value.slice(-1);
    setOtpDigits(nextDigits);
    setErrorMessage(null);

    // Auto-advance focus to next digit
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const nextDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        nextDigits[i] = pastedData[i];
      }
      setOtpDigits(nextDigits);
      if (inputRefs.current[Math.min(pastedData.length, 5)]) {
        inputRefs.current[Math.min(pastedData.length, 5)].focus();
      }
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join("");
    if (fullCode.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setVerifying(true);
      setErrorMessage(null);

      const res = await api.post("/public/verification/verify-otp", {
        form_id: Number(formId),
        verification_type: verificationType,
        destination: destination.trim(),
        otp_code: fullCode,
      });

      const data = res.data;
      if (data.verified && data.session_token) {
        toast.success("Verification successful!", { id: "verif-success-toast" });
        if (onVerifiedSuccess) {
          onVerifiedSuccess({
            verificationType,
            destination: destination.trim(),
            sessionToken: data.session_token,
          });
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Invalid verification code. Please try again.";
      setErrorMessage(detail);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 0.5,
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2.5,
          pb: 1.5,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: verificationType === "email" ? "#EEF2FF" : "#ECFDF5",
              color: verificationType === "email" ? "#4F46E5" : "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {verificationType === "email" ? (
              <MarkEmailReadRoundedIcon sx={{ fontSize: 20 }} />
            ) : (
              <PhonelinkRingRoundedIcon sx={{ fontSize: 20 }} />
            )}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              {verificationType === "email" ? "Verify Email Address" : "Verify Phone Number"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Micro-Verification for Formify
            </Typography>
          </Box>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#94A3B8" }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* Body Content */}
      <DialogContent sx={{ p: 2.5, pt: 1 }}>
        <Stack spacing={2.5}>
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {/* STEP 1: CONFIRM DESTINATION */}
          {step === 1 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", fontSize: "0.85rem" }}>
                Enter your {verificationType === "email" ? "email address" : "phone number"} to receive a 6-digit one-time security code (OTP).
              </Typography>

              <TextField
                fullWidth
                size="small"
                label={verificationType === "email" ? "Email Address" : "Phone Number"}
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={
                  verificationType === "email"
                    ? "sarah@example.com"
                    : "+1 (555) 000-0000"
                }
                autoFocus
              />

              <Button
                fullWidth
                variant="contained"
                disabled={sending || !destination.trim()}
                onClick={handleSendOtp}
                startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <VerifiedUserRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.1,
                  bgcolor: verificationType === "email" ? "#4F46E5" : "#059669",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { bgcolor: verificationType === "email" ? "#4338CA" : "#047857" },
                }}
              >
                {sending ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </Box>
          )}

          {/* STEP 2: ENTER & VERIFY 6-DIGIT OTP */}
          {step === 2 && (
            <Box display="flex" flexDirection="column" gap={2.5}>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B" }}>
                  We sent a 6-digit code to <strong>{destination}</strong>
                </Typography>
                <Button
                  size="small"
                  onClick={() => setStep(1)}
                  sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 700, color: "#4F46E5", p: 0, mt: 0.3 }}
                >
                  Change {verificationType === "email" ? "Email" : "Phone Number"}
                </Button>
              </Box>

              {/* 6-Digit Box Inputs */}
              <Box display="flex" justifyContent="center" gap={1} onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <TextField
                    key={idx}
                    inputRef={(el) => (inputRefs.current[idx] = el)}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: "center",
                        fontSize: "1.25rem",
                        fontWeight: "800",
                        padding: "10px 0",
                        width: "36px",
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "#F8FAFC",
                        borderColor: digit ? "#4F46E5" : "#E2E8F0",
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Resend Cooldown & Expiry Indicators */}
              <Box display="flex" justifyContent="space-between" alignItems="center" px={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.725rem" }}>
                  Valid for <strong>{expiryMinutes} mins</strong>
                </Typography>

                {cooldownRemaining > 0 ? (
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.725rem" }}>
                    Resend in <strong>{cooldownRemaining}s</strong>
                  </Typography>
                ) : (
                  <Button
                    size="small"
                    disabled={sending}
                    startIcon={<ReplayRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={handleSendOtp}
                    sx={{ textTransform: "none", fontSize: "0.725rem", fontWeight: 700, p: 0, color: "#4F46E5" }}
                  >
                    Resend Code
                  </Button>
                )}
              </Box>

              {/* Verify Button */}
              <Button
                fullWidth
                variant="contained"
                disabled={verifying || otpDigits.join("").length < 6}
                onClick={handleVerifyOtp}
                startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.1,
                  bgcolor: "#4F46E5",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#4338CA" },
                }}
              >
                {verifying ? "Verifying..." : "Verify & Confirm"}
              </Button>
            </Box>
          )}

          {/* Anti-Spam Security Footer */}
          <Box display="flex" alignItems="center" justify="center" gap={0.8} sx={{ opacity: 0.8, justifyContent: "center" }}>
            <ShieldRoundedIcon sx={{ fontSize: 14, color: "#64748B" }} />
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#64748B" }}>
              Protected by Formify SHA-256 Micro-Verification
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
