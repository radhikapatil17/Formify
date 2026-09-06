import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
  Avatar,
  CircularProgress,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  Badge,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// MUI Icons
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import MinimizeRoundedIcon from "@mui/icons-material/MinimizeRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

import { sendAssistantChat } from "../../api/assistant";

// 4 Working Languages Supported
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸", speechLang: "en-IN" },
  { code: "hi", name: "हिंदी (Hindi)", flag: "🇮🇳", speechLang: "hi-IN" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳", speechLang: "kn-IN" },
  { code: "mr", name: "मराठी (Marathi)", flag: "🇮🇳", speechLang: "mr-IN" },
];

const SUGGESTED_PROMPTS = {
  en: [
    "How do I create a multi-page form?",
    "How do I set up conditional logic?",
    "How to share a form via QR code or email?",
    "How do I limit responses or set a schedule?",
    "How does the AI Form Generator work?",
  ],
  hi: [
    "मल्टी-पेज फॉर्म कैसे बनाएं?",
    "कंडीशनल लॉजिक (Conditional Logic) कैसे सेट करें?",
    "QR कोड या ईमेल से फॉर्म कैसे शेयर करें?",
    "रिस्पॉन्स लिमिट या शेड्यूल कैसे सेट करें?",
    "AI फॉर्म जनरेटर कैसे काम करता है?",
  ],
  kn: [
    "ಮಲ್ಟಿ-ಪೇಜ್ ಫಾರ್ಮ್ ಹೇಗೆ ಮಾಡುವುದು?",
    "ಕಂಡೀಷನಲ್ ಲಾಜಿಕ್ (Conditional Logic) ಹೇಗೆ ಸೆಟ್ ಮಾಡುವುದು?",
    "QR ಕೋಡ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ ಫಾರ್ಮ್ ಹಂಚಿಕೊಳ್ಳುವುದು ಹೇಗೆ?",
    "ಪ್ರತಿಕ್ರಿಯೆ ಮಿತಿ ಅಥವಾ ವೇಳಾಪಟ್ಟಿ ಸೆಟ್ ಮಾಡುವುದು ಹೇಗೆ?",
    "AI ಫಾರ್ಮ್ ಜನರೇಟರ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?",
  ],
  mr: [
    "मल्टी-पेज फॉर्म कसा तयार करायचा?",
    "कंडीशनल लॉजिक (Conditional Logic) कसे सेट करायचे?",
    "QR कोड किंवा ईमेलद्वारे फॉर्म कसा शेअर करायचा?",
    "प्रतिसाद मर्यादा किंवा वेळापत्रक कसे सेट करायचे?",
    "AI फॉर्म जनरेटर कसा कार्य करतो?",
  ],
};

/**
 * Clean Markdown message parser with copy feature
 */
function FormattedMessage({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied answer!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) return null;
  const lines = text.split("\n");

  return (
    <Box sx={{ position: "relative", pr: 3 }}>
      <Tooltip title="Copy Answer">
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            position: "absolute",
            top: -4,
            right: -8,
            opacity: 0.7,
            "&:hover": { opacity: 1, bgcolor: "action.hover" },
          }}
        >
          {copied ? (
            <CheckRoundedIcon sx={{ fontSize: 14, color: "#10B981" }} />
          ) : (
            <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
          )}
        </IconButton>
      </Tooltip>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <Box key={idx} sx={{ height: 4 }} />;

          // Headings
          if (trimmed.startsWith("### ")) {
            return (
              <Typography
                key={idx}
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: "primary.main", mt: 0.5, mb: 0.25 }}
              >
                {trimmed.replace("### ", "")}
              </Typography>
            );
          }

          // Bullet or numbered lists
          const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
          const isNumbered = /^\d+\.\s/.test(trimmed);

          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          const renderedContent = parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} style={{ fontWeight: 700 }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet || isNumbered) {
            return (
              <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1, pl: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: isBullet ? "#6366F1" : "primary.main",
                    minWidth: 14,
                    fontSize: "0.825rem",
                  }}
                >
                  {isBullet ? "•" : trimmed.match(/^\d+\./)[0]}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.825rem", lineHeight: 1.5, flex: 1 }}>
                  {renderedContent}
                </Typography>
              </Box>
            );
          }

          return (
            <Typography key={idx} variant="body2" sx={{ fontSize: "0.825rem", lineHeight: 1.5 }}>
              {renderedContent}
            </Typography>
          );
        })}
      </Box>
    </Box>
  );
}

export default function AIAssistantWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Window states: "closed" | "minimized" | "open"
  const [windowState, setWindowState] = useState("closed");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Voice Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const messagesEndRef = useRef(null);

  const currentPrompts = SUGGESTED_PROMPTS[selectedLanguage] || SUGGESTED_PROMPTS.en;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (windowState === "open") {
      scrollToBottom();
    }
  }, [messages, windowState, isLoading]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // WINDOW CONTROLS
  // ---------------------------------------------------------------------------
  const handleOpen = () => setWindowState("open");
  const handleClose = () => {
    setWindowState("closed");
    stopVoiceRecognition();
  };
  const handleMinimize = () => {
    setWindowState("minimized");
    stopVoiceRecognition();
  };
  const handleRestore = () => setWindowState("open");

  // ---------------------------------------------------------------------------
  // VOICE SPEECH RECOGNITION 🎙️ (Uses Selected Language: English, Hindi, Kannada, Marathi)
  // ---------------------------------------------------------------------------
  const startVoiceRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported by your browser.");
      return;
    }

    const currentLangObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentLangObj.speechLang;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let transcriptStr = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcriptStr += event.results[i][0].transcript;
        }
        if (transcriptStr) {
          setInput(transcriptStr);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopVoiceRecognition();
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied.");
        }
      };

      recognition.onend = () => {
        stopVoiceRecognition();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Mic error:", err);
      toast.error("Could not start microphone.");
    }
  };

  const stopVoiceRecognition = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  // ---------------------------------------------------------------------------
  // CHAT SEND & API
  // ---------------------------------------------------------------------------
  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    if (isRecording) stopVoiceRecognition();

    setError(null);
    setInput("");

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMessages = [
      ...messages,
      { role: "user", content: query, time: timestamp },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await sendAssistantChat(newMessages, query, selectedLanguage);
      if (response && response.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.reply,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } else {
        throw new Error("No response received from AI Assistant");
      }
    } catch (err) {
      console.error("AI Assistant chat error:", err);
      setError("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    toast.success("Chat history cleared");
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. FLOATING ROBOT BUTTON (CLOSED STATE)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {windowState === "closed" && (
          <Tooltip title="Ask Formify AI Robot Assistant" placement="left">
            <Box
              component={motion.div}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleOpen}
              sx={{
                position: "fixed",
                bottom: { xs: 20, sm: 24 },
                right: { xs: 20, sm: 24 },
                zIndex: 1400,
                width: 58,
                height: 58,
                borderRadius: "50%",
                overflow: "hidden",
                cursor: "pointer",
                bgcolor: "#1E2230",
                boxShadow: "0 8px 24px -2px rgba(99, 102, 241, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0,
                transition: "box-shadow 0.25s ease, transform 0.2s ease",
                "&:hover": {
                  boxShadow: "0 12px 32px 0 rgba(99, 102, 241, 0.65), 0 6px 16px rgba(0, 0, 0, 0.4)",
                },
              }}
            >
              <Box
                component="img"
                src="/robot-avatar.png"
                alt="AI Assistant"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  display: "block",
                  pointerEvents: "none",
                }}
              />
            </Box>
          </Tooltip>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. MINIMIZED STATUS BAR (MINIMIZED STATE)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {windowState === "minimized" && (
          <Paper
            component={motion.div}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            elevation={8}
            onClick={handleRestore}
            sx={{
              position: "fixed",
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: 1400,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderRadius: 5,
              cursor: "pointer",
              bgcolor: theme.palette.mode === "dark" ? "#0F172A" : "#FFFFFF",
              border: "1px solid",
              borderColor: "primary.main",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.25)",
              "&:hover": {
                bgcolor: theme.palette.mode === "dark" ? "#1E293B" : "#F8FAFC",
              },
            }}
          >
            <Avatar src="/robot-avatar.png" sx={{ width: 32, height: 32 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.825rem", lineHeight: 1.2 }}>
              Formify AI Assistant
            </Typography>
            <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={handleRestore} sx={{ color: "primary.main" }}>
                <OpenInFullRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleClose} sx={{ color: "text.secondary" }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          3. PROFESSIONAL CHATBOT WINDOW (OPEN STATE)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {windowState === "open" && (
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            elevation={16}
            sx={{
              position: "fixed",
              bottom: isMobile ? 0 : 24,
              right: isMobile ? 0 : 24,
              width: isMobile ? "100%" : 410,
              height: isMobile ? "100vh" : 620,
              maxHeight: isMobile ? "100vh" : "calc(100vh - 48px)",
              borderRadius: isMobile ? 0 : 4,
              zIndex: 1400,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid #334155"
                  : "1px solid #E2E8F0",
              bgcolor: "background.paper",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                bgcolor:
                  theme.palette.mode === "dark" ? "#0F172A" : "#F8FAFC",
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: "#10B981",
                      color: "#10B981",
                      boxShadow: "0 0 0 2px #FFFFFF",
                    },
                  }}
                >
                  <Avatar
                    src="/robot-avatar.png"
                    alt="Formify Robot Avatar"
                    sx={{ width: 42, height: 42, border: "2px solid #6366F1" }}
                  />
                </Badge>

                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ color: "text.primary", lineHeight: 1.2, fontSize: "0.95rem" }}
                >
                  Formify AI Assistant
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} alignItems="center">
                {messages.length > 0 && (
                  <Tooltip title="Clear Chat">
                    <IconButton size="small" onClick={handleClearChat} sx={{ color: "text.secondary" }}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton size="small" onClick={handleMinimize} sx={{ color: "text.secondary" }}>
                  <MinimizeRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleClose} sx={{ color: "text.secondary" }}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            {/* Chat Body */}
            <Box
              sx={{
                flexGrow: 1,
                p: 2.5,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(15, 23, 42, 0.4)"
                    : "#FAFAFA",
              }}
            >
              {/* Empty state */}
              {messages.length === 0 && (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Avatar
                    src="/robot-avatar.png"
                    sx={{ width: 64, height: 64, boxShadow: "0 8px 20px rgba(99, 102, 241, 0.25)" }}
                  />

                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.05rem", mb: 0.5 }}>
                      How can I help you today?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", px: 2 }}>
                      Ask me in English, हिंदी, ಕನ್ನಡ, or मराठी about creating forms, conditional logic, multi-page steps, or sharing!
                    </Typography>
                  </Box>

                  <Divider sx={{ width: "100%", my: 0.5 }} />

                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      color: "primary.main",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      alignSelf: "flex-start",
                      fontSize: "0.7rem",
                    }}
                  >
                    Suggested Questions
                  </Typography>

                  <Stack spacing={1} sx={{ width: "100%" }}>
                    {currentPrompts.map((q, idx) => (
                      <Paper
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        sx={{
                          p: 1.25,
                          px: 1.5,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.paper",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: "#6366F1",
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "#1E293B"
                                : "#F1F5F9",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        >
                          {q}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Conversation Messages */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      gap: 1.25,
                    }}
                  >
                    {!isUser && (
                      <Avatar
                        src="/robot-avatar.png"
                        sx={{ width: 32, height: 32, mt: 0.5, border: "1px solid #6366F1" }}
                      />
                    )}

                    <Box sx={{ maxWidth: "82%" }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.75,
                          px: 2,
                          borderRadius: 3,
                          borderTopRightRadius: isUser ? 4 : 3,
                          borderTopLeftRadius: isUser ? 3 : 4,
                          bgcolor: isUser
                            ? theme.palette.mode === "dark"
                              ? "#4F46E5"
                              : "#0F172A"
                            : "background.paper",
                          color: isUser ? "#FFFFFF" : "text.primary",
                          border: isUser
                            ? "none"
                            : "1px solid " + theme.palette.divider,
                          boxShadow: isUser
                            ? "0 4px 14px rgba(15, 23, 42, 0.15)"
                            : "0 2px 6px rgba(15, 23, 42, 0.04)",
                        }}
                      >
                        {isUser ? (
                          <Typography variant="body2" sx={{ fontSize: "0.825rem", lineHeight: 1.5 }}>
                            {msg.content}
                          </Typography>
                        ) : (
                          <FormattedMessage text={msg.content} />
                        )}
                      </Paper>

                      {msg.time && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.65rem",
                            color: "text.secondary",
                            mt: 0.5,
                            display: "block",
                            textAlign: isUser ? "right" : "left",
                            px: 0.5,
                          }}
                        >
                          {msg.time}
                        </Typography>
                      )}
                    </Box>

                    {isUser && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "secondary.main",
                          mt: 0.5,
                        }}
                      >
                        <PersonRoundedIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    )}
                  </Box>
                );
              })}

              {/* Typing Indicator */}
              {isLoading && (
                <Box display="flex" justifyContent="flex-start" gap={1.25}>
                  <Avatar
                    src="/robot-avatar.png"
                    sx={{ width: 32, height: 32, mt: 0.5, border: "1px solid #6366F1" }}
                  />
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      px: 2,
                      borderRadius: 3,
                      borderTopLeftRadius: 4,
                      bgcolor: "background.paper",
                      border: "1px solid " + theme.palette.divider,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mr: 0.5 }}>
                      Formify AI is thinking
                    </Typography>
                    <Box display="flex" gap={0.5} alignItems="center">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <Box
                          key={i}
                          component={motion.span}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay }}
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "#6366F1",
                          }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  action={
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => handleSendMessage()}
                      startIcon={<RefreshRoundedIcon fontSize="small" />}
                    >
                      Retry
                    </Button>
                  }
                  sx={{ borderRadius: 2, fontSize: "0.775rem" }}
                >
                  {error}
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Recording Active Bar */}
            <AnimatePresence>
              {isRecording && (
                <Box
                  component={motion.div}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: "rgba(99, 102, 241, 0.08)",
                    borderTop: "1px solid rgba(99, 102, 241, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      component={motion.div}
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: "#6366F1",
                      }}
                    />
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#6366F1" }}>
                      Listening ({recordingSeconds}s)...
                    </Typography>
                  </Stack>

                  <Button
                    size="small"
                    variant="contained"
                    onClick={stopVoiceRecognition}
                    startIcon={<StopRoundedIcon />}
                    sx={{
                      fontSize: "0.7rem",
                      py: 0.3,
                      px: 1.5,
                      bgcolor: "#6366F1",
                      color: "#FFFFFF",
                      "&:hover": { bgcolor: "#4F46E5" },
                    }}
                  >
                    Done
                  </Button>
                </Box>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <Box
              sx={{
                p: 1.75,
                bgcolor: "background.paper",
                borderTop: "1px solid",
                borderColor: "divider",
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Ask how to use Formify..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    fontSize: "0.825rem",
                  },
                }}
              />

              {/* Voice Mic Button 🎙️ */}
              <Tooltip title={isRecording ? "Stop Recording" : "Voice Input"}>
                <IconButton
                  onClick={toggleVoiceRecording}
                  sx={{
                    bgcolor: isRecording ? "#6366F1" : "action.hover",
                    color: isRecording ? "#FFFFFF" : "text.primary",
                    borderRadius: 2,
                    width: 38,
                    height: 38,
                    "&:hover": {
                      bgcolor: isRecording ? "#4F46E5" : "action.selected",
                    },
                  }}
                >
                  {isRecording ? (
                    <MicOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <MicRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Send Button */}
              <IconButton
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                sx={{
                  bgcolor: "primary.main",
                  color: "#FFFFFF",
                  borderRadius: 2,
                  width: 38,
                  height: 38,
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "action.disabledBackground",
                    color: "action.disabled",
                  },
                }}
              >
                <SendRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Paper>
        )}
      </AnimatePresence>
    </>
  );
}
