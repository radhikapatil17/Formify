import { useState, useRef, useEffect } from "react";
import { IconButton, Tooltip, Box, Typography } from "@mui/material";
import toast from "react-hot-toast";

import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

export default function VoiceMicButton({
  onTranscript,
  language = "en-IN",
  disabled = false,
  size = "small",
  fieldLabel = "",
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Check SpeechRecognition browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Try Chrome, Edge, or Safari.", {
        id: "speech-not-supported",
      });
      return;
    }

    if (isListening) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error(err);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language || "en-IN";

      let finalSpeechText = "";

      recognition.onstart = () => {
        setIsListening(true);
        toast.success(`Listening... Speak your ${fieldLabel ? `"${fieldLabel}"` : "answer"} now.`, {
          id: "voice-listening-start",
          duration: 3000,
          icon: "🎙️",
        });
      };

      recognition.onresult = (event) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalSpeechText += transcriptChunk;
          } else {
            interimText += transcriptChunk;
          }
        }

        const textToFill = (finalSpeechText || interimText).trim();
        if (textToFill && onTranscript) {
          onTranscript(textToFill);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed" || event.error === "permission-denied") {
          toast.error("Microphone access denied. Please grant microphone permissions in browser settings.", {
            id: "mic-denied-err",
          });
        } else if (event.error === "no-speech") {
          toast.error("No speech detected. Click the microphone to try again.", {
            id: "no-speech-err",
          });
        } else if (event.error !== "aborted") {
          toast.error(`Voice error: ${event.error}`, { id: "voice-general-err" });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      toast.error("Could not start microphone.", { id: "mic-start-err" });
    }
  };

  return (
    <Tooltip title={isListening ? "Listening... Click to stop recording" : "Click to fill using voice"} arrow placement="top">
      <Box sx={{ display: "inline-flex", alignItems: "center", position: "relative" }}>
        <IconButton
          size={size}
          onClick={toggleListening}
          disabled={disabled}
          sx={{
            color: isListening ? "#FFFFFF" : "#64748B",
            bgcolor: isListening ? "#6366F1" : "transparent",
            transition: "all 0.2s ease-in-out",
            p: size === "small" ? 0.75 : 1,
            position: "relative",
            boxShadow: isListening ? "0 0 0 4px rgba(99, 102, 241, 0.35)" : "none",
            "&:hover": {
              bgcolor: isListening ? "#4F46E5" : "rgba(99, 102, 241, 0.08)",
              color: isListening ? "#FFFFFF" : "#4F46E5",
            },
          }}
        >
          {isListening ? (
            <GraphicEqRoundedIcon sx={{ fontSize: size === "small" ? 18 : 22, animation: "spinPulse 1.5s infinite ease-in-out" }} />
          ) : (
            <MicRoundedIcon sx={{ fontSize: size === "small" ? 18 : 22 }} />
          )}
        </IconButton>

        {/* Pulse keyframe inline injection */}
        {isListening && (
          <Box
            sx={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#10B981",
              boxShadow: "0 0 8px #10B981",
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}
