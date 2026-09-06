import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  Stack,
  Divider,
} from "@mui/material";

// MUI Icons
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import AIAssistantWidget from "../../components/common/AIAssistantWidget";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("builder");

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Box sx={{ bgcolor: "#FFFFFF", color: "#09090B", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER / NAVBAR
         ───────────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #E4E4E7",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 68,
            }}
          >
            {/* Brand Logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
              }}
            >
              <Box
                component="img"
                src="/formify-logo.jpg"
                alt="Formify Logo"
                sx={{
                  height: 40,
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: 1.2,
                }}
              />
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{
                  letterSpacing: "-0.03em",
                  color: "#09090B",
                  fontSize: "1.3rem",
                }}
              >
                Formify
              </Typography>
            </Box>

            {/* Nav Links */}
            <Stack
              direction="row"
              spacing={4}
              sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
            >
              <Typography
                onClick={() => scrollToSection("features")}
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#52525B",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  "&:hover": { color: "#4F46E5" },
                }}
              >
                Features
              </Typography>
              <Typography
                onClick={() => scrollToSection("how-it-works")}
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#52525B",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  "&:hover": { color: "#4F46E5" },
                }}
              >
                How It Works
              </Typography>
              <Typography
                onClick={() => scrollToSection("preview")}
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#52525B",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  "&:hover": { color: "#4F46E5" },
                }}
              >
                Platform
              </Typography>
            </Stack>

            {/* Actions: Sign In + Get Started */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="text"
                onClick={handleSignIn}
                sx={{
                  color: "#27272A",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  px: 2,
                  "&:hover": { bgcolor: "#F4F4F5" },
                }}
              >
                Sign In
              </Button>

              <Button
                variant="contained"
                onClick={handleRegister}
                sx={{
                  bgcolor: "#0a0735ff",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  px: 2.5,
                  py: 0.9,
                  borderRadius: 1.2,
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                  "&:hover": {
                    bgcolor: "#4338CA",
                    boxShadow: "0 6px 20px rgba(79, 70, 229, 0.4)",
                  },
                }}
              >
                Login
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
         ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 8 },
          position: "relative",
          backgroundImage: `
            radial-gradient(at 50% 0%, rgba(79, 70, 229, 0.08) 0px, transparent 60%),
            radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.05) 0px, transparent 50%),
            radial-gradient(#E4E4E7 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 24px 24px",
        }}
      >
        <Container maxWidth="lg">
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ textAlign: "center", maxWidth: 840, mx: "auto" }}
          >
            {/* Top Pill Badge */}
            <Chip
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: "#4F46E5 !important" }} />}
              label="Smart Form Builder & Response Engine"
              sx={{
                bgcolor: "rgba(79, 70, 229, 0.08)",
                color: "#4F46E5",
                fontWeight: 600,
                fontSize: "0.8rem",
                px: 1,
                py: 0.5,
                borderRadius: 10,
                border: "1px solid rgba(79, 70, 229, 0.2)",
                mb: 3.5,
              }}
            />

            {/* Main Headline */}
            <Typography
              variant="h1"
              fontWeight={800}
              sx={{
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.25rem" },
                letterSpacing: "-0.04em",
                lineHeight: 1.12,
                color: "#09090B",
                mb: 3,
              }}
            >
              Build Intelligent Forms.{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Collect Responses at Scale.
              </Box>
            </Typography>

            {/* Subtitle Description */}
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "1.05rem", sm: "1.2rem" },
                color: "#52525B",
                lineHeight: 1.6,
                mb: 4.5,
                maxWidth: 720,
                mx: "auto",
              }}
            >
              Formify is an all-in-one form creation and response management platform.
              Build dynamic multi-step forms with real-time conditional logic, publish instant public links,
              and analyze responses with automated visualization.
            </Typography>

            {/* Single Centered Hero Get Started Button */}
            <Box display="flex" justifyContent="center" sx={{ mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleRegister}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  bgcolor: "#4F46E5",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  px: 4.5,
                  py: 1.4,
                  borderRadius: 1.5,
                  boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
                  "&:hover": {
                    bgcolor: "#4338CA",
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.45)",
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>

          {/* ─────────────────────────────────────────────────────────────
              CREATIVE INTERACTIVE SHOWCASE FRAME
             ───────────────────────────────────────────────────────────── */}
          <Box id="preview" sx={{ pt: 6 }}>
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid rgba(79, 70, 229, 0.25)",
                boxShadow: "0 20px 60px -15px rgba(79, 70, 229, 0.2)",
                overflow: "hidden",
                bgcolor: "#09090B",
                position: "relative",
              }}
            >
              {/* Header Control Bar */}
              <Box
                sx={{
                  bgcolor: "#121215",
                  px: { xs: 2, sm: 3 },
                  py: 1.8,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                {/* Brand Indicator */}
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#10B981",
                      boxShadow: "0 0 8px #10B981",
                    }}
                  />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#E4E4E7", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                    FORMIFY STUDIO INTERACTIVE PREVIEW
                  </Typography>
                </Box>

                {/* Creative Tab Pills */}
                <Stack direction="row" spacing={1} sx={{ bgcolor: "#18181B", p: 0.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
                  {[
                    { id: "builder", label: "Form Builder" },
                    { id: "logic", label: "Conditional Rules" },
                    { id: "analytics", label: "Analytics & Export" },
                  ].map((tab) => (
                    <Box
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      sx={{
                        px: 2,
                        py: 0.6,
                        borderRadius: 1.5,
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        bgcolor: activeTab === tab.id ? "#4F46E5" : "transparent",
                        color: activeTab === tab.id ? "#FFFFFF" : "#A1A1AA",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: "#FFFFFF",
                        },
                      }}
                    >
                      {tab.label}
                    </Box>
                  ))}
                </Stack>

                <Chip label="LIVE DEMO" size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, bgcolor: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.3)" }} />
              </Box>

              {/* Showcase Body Window */}
              <Box sx={{ p: { xs: 3, md: 5 }, color: "#FFFFFF", minHeight: 360, position: "relative", zIndex: 1 }}>
                {activeTab === "builder" && (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "7fr 5fr" }, gap: 3, alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#818CF8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Visual Canvas Editor
                      </Typography>
                      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, mb: 2, color: "#FFFFFF" }}>
                        Customer Feedback & NPS Survey
                      </Typography>
                      <Stack spacing={2}>
                        <Paper sx={{ p: 2, bgcolor: "#18181B", border: "1px solid #27272A", color: "#F4F4F5" }}>
                          <Typography variant="body2" fontWeight={600}>1. How would you rate your experience?</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {["⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5"].map((rating) => (
                              <Box key={rating} sx={{ px: 1.5, py: 0.5, bgcolor: "#27272A", borderRadius: 1, fontSize: "0.75rem" }}>
                                {rating}
                              </Box>
                            ))}
                          </Stack>
                        </Paper>
                        <Paper sx={{ p: 2, bgcolor: "#18181B", border: "1px solid #4F46E5", color: "#F4F4F5" }}>
                          <Typography variant="body2" fontWeight={600}>2. What feature would you like to see next?</Typography>
                          <Box sx={{ mt: 1, p: 1, bgcolor: "#27272A", borderRadius: 1, fontSize: "0.75rem", color: "#A1A1AA" }}>
                            Type placeholder here...
                          </Box>
                        </Paper>
                      </Stack>
                    </Box>
                    <Box>
                      <Paper sx={{ p: 3, bgcolor: "#18181B", border: "1px solid #27272A", color: "#FFFFFF" }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#818CF8" }}>
                          Inspector Settings
                        </Typography>
                        <Typography variant="caption" display="block" color="#A1A1AA">Field Type</Typography>
                        <Box sx={{ p: 1, bgcolor: "#27272A", borderRadius: 1, fontSize: "0.8rem", mt: 0.5, mb: 2 }}>Text Area</Box>
                        <Typography variant="caption" display="block" color="#A1A1AA">Required Status</Typography>
                        <Box sx={{ p: 1, bgcolor: "#27272A", borderRadius: 1, fontSize: "0.8rem", mt: 0.5, color: "#10B981" }}>✓ Required Field</Box>
                      </Paper>
                    </Box>
                  </Box>
                )}

                {activeTab === "logic" && (
                  <Box sx={{ py: 2 }}>
                    <Typography variant="caption" sx={{ color: "#818CF8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Conditional Rule Engine
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, mb: 3, color: "#FFFFFF" }}>
                      Smart Branching Rules
                    </Typography>
                    <Paper sx={{ p: 3, bgcolor: "#18181B", border: "1px solid #27272A", color: "#FFFFFF" }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                        <Chip label="IF" color="primary" size="small" />
                        <Typography variant="body2" color="#F4F4F5">Question #1 (Rating)</Typography>
                        <Chip label="==" size="small" sx={{ bgcolor: "#27272A", color: "#FFFFFF" }} />
                        <Typography variant="body2" color="#F4F4F5">&quot;⭐ 5&quot;</Typography>
                        <Chip label="THEN SHOW" color="success" size="small" />
                        <Typography variant="body2" color="#F4F4F5">Question #3 (Testimonial)</Typography>
                      </Stack>
                    </Paper>
                  </Box>
                )}

                {activeTab === "analytics" && (
                  <Box sx={{ py: 2 }}>
                    <Typography variant="caption" sx={{ color: "#818CF8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Real-Time Analytics Matrix
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, mb: 3, color: "#FFFFFF" }}>
                      Response Metrics & Export
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                      <Paper sx={{ p: 2, bgcolor: "#18181B", border: "1px solid #27272A", color: "#FFFFFF" }}>
                        <Typography variant="caption" color="#A1A1AA">Total Responses</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, color: "#818CF8" }}>1,420</Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: "#18181B", border: "1px solid #27272A", color: "#FFFFFF" }}>
                        <Typography variant="caption" color="#A1A1AA">Completion Rate</Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, color: "#10B981" }}>94.2%</Typography>
                      </Paper>
                      <Paper sx={{ p: 2, bgcolor: "#18181B", border: "1px solid #27272A", color: "#FFFFFF", gridColumn: { md: "span 2" }, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>Submissions CSV Dataset</Typography>
                          <Typography variant="caption" color="#A1A1AA">Export all response rows to clean CSV file</Typography>
                        </Box>
                        <Button startIcon={<FileDownloadRoundedIcon />} variant="contained" size="small" sx={{ bgcolor: "#4F46E5" }}>
                          Export CSV
                        </Button>
                      </Paper>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          3. KEY FEATURES SECTION
         ───────────────────────────────────────────────────────────── */}
      <Box id="features" sx={{ py: { xs: 6, md: 8 }, bgcolor: "#FAFAFA" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: 6 }}>
            <Chip
              label="POWERFUL CAPABILITIES"
              sx={{
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                fontWeight: 700,
                fontSize: "0.75rem",
                mb: 2,
              }}
            />
            <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, letterSpacing: "-0.03em", mb: 2 }}>
              Everything you need to collect and analyze responses.
            </Typography>
            <Typography variant="body1" color="#52525B" sx={{ fontSize: "1.05rem" }}>
              Formify combines visual form building with real-time logic execution and deep submission analytics in one clean workspace.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {[
              {
                icon: <LayersRoundedIcon sx={{ fontSize: 24 }} />,
                title: "Drag & Drop Builder",
                desc: "Create clean multi-question forms with text, textarea, ratings, dropdown choices, checkboxes, and radio buttons.",
              },
              {
                icon: <AltRouteRoundedIcon sx={{ fontSize: 24 }} />,
                title: "Conditional Logic Rules",
                desc: "Show or hide fields dynamically based on respondent answers using our visual conditional rule engine.",
              },
              {
                icon: <BarChartRoundedIcon sx={{ fontSize: 24 }} />,
                title: "Real-Time Analytics",
                desc: "Visualize response metrics, total submission counts, completion rates, and breakdown graphs instantly.",
              },
              {
                icon: <InboxRoundedIcon sx={{ fontSize: 24 }} />,
                title: "Response Management",
                desc: "Inspect all structured response values inside clear workspace data tables and export directly to CSV.",
              },
              {
                icon: <PublicRoundedIcon sx={{ fontSize: 24 }} />,
                title: "Instant Public Publishing",
                desc: "Publish form versions with one click to generate secure shareable public links for any respondent.",
              },
              {
                icon: <SecurityRoundedIcon sx={{ fontSize: 24 }} />,
                title: "Secure Authentication",
                desc: "Protected by JWT tokens, bcrypt hashed credentials, Google OAuth integration, and complete password recovery.",
              },
            ].map((feature, idx) => (
              <Paper
                key={feature.title}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 2,
                  border: "1px solid #E4E4E7",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    borderColor: "#C7D2FE",
                    boxShadow: "0 12px 24px -6px rgba(79, 70, 229, 0.1)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: "#EEF2FF",
                    color: "#4F46E5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.5,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", mb: 1, color: "#09090B" }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="#52525B" sx={{ lineHeight: 1.6, fontSize: "0.875rem" }}>
                  {feature.desc}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          4. HOW IT WORKS SECTION (REDUCED BOTTOM PADDING)
         ───────────────────────────────────────────────────────────── */}
      <Box id="how-it-works" sx={{ pt: { xs: 6, md: 8 }, pb: { xs: 4, md: 5 }, bgcolor: "#FFFFFF" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", maxWidth: 700, mx: "auto", mb: 6 }}>
            <Chip
              label="SIMPLE WORKFLOW"
              sx={{
                bgcolor: "#F4F4F5",
                color: "#27272A",
                fontWeight: 700,
                fontSize: "0.75rem",
                mb: 2,
              }}
            />
            <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: "2rem", md: "2.5rem" }, letterSpacing: "-0.03em", mb: 2 }}>
              How Formify Works
            </Typography>
            <Typography variant="body1" color="#52525B" sx={{ fontSize: "1.05rem" }}>
              Build, publish, and gather insights in three streamlined steps.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3.5,
            }}
          >
            {[
              {
                step: "01",
                title: "Create & Design",
                desc: "Add question cards, choose input field types, set placeholders, and configure conditional logic rules using our visual inspector.",
              },
              {
                step: "02",
                title: "Publish & Share",
                desc: "Click publish to deploy a unique public form link. Share it with your respondents—no account required for fillers.",
              },
              {
                step: "03",
                title: "Collect & Export",
                desc: "Submissions flow directly into your workspace matrix. Track completion stats in real time and download CSV reports instantly.",
              },
            ].map((step, idx) => (
              <Paper
                key={step.step}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 2,
                  border: "1px solid #E4E4E7",
                  bgcolor: "#FAFAFA",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    color: "#4F46E5",
                    opacity: 0.25,
                    fontSize: "2.5rem",
                    mb: 1,
                  }}
                >
                  {step.step}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: "#09090B" }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="#52525B" sx={{ lineHeight: 1.6, fontSize: "0.875rem" }}>
                  {step.desc}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER (COMPACT & BEAUTIFULLY ALIGNED)
         ───────────────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          bgcolor: "#FAFAFA",
          borderTop: "1px solid #E4E4E7",
          py: 3.5,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Left Brand & Copyright */}
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box
                component="img"
                src="/formify-logo.jpg"
                alt="Formify Logo"
                sx={{
                  height: 32,
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: 0.6,
                }}
              />
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ letterSpacing: "-0.02em", color: "#09090B", fontSize: "0.95rem" }}
              >
                Formify
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5, borderColor: "#D4D4D8" }} />
              <Typography variant="caption" color="#71717A" sx={{ fontSize: "0.8rem" }}>
                © {new Date().getFullYear()} Formify Inc. All rights reserved.
              </Typography>
            </Box>

            {/* Right Tagline */}
            <Typography variant="caption" color="#71717A" sx={{ fontSize: "0.8rem" }}>
              Design, publish &amp; analyze responses dynamically.
            </Typography>
          </Box>
        </Container>
      </Box>
      <AIAssistantWidget />
    </Box>
  );
}
