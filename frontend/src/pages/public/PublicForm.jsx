import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Stack,
  Rating,
  Slider,
  Chip,
  Divider,
  FormHelperText,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import toast from "react-hot-toast";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import BookmarkAddedRoundedIcon from "@mui/icons-material/BookmarkAddedRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import DocumentScannerRoundedIcon from "@mui/icons-material/DocumentScannerRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import api from "../../api/api";
import { parseFormTheme } from "../../utils/themePresets";
import SaveAndContinueModal from "../../components/forms/SaveAndContinueModal";
import ScanToFillModal from "../../components/forms/ScanToFillModal";
import PublicVerificationModal from "../../components/forms/PublicVerificationModal";
import { evaluateAllFormulas, formatFormulaValue } from "../../utils/formulaEngine";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s-()]{7,20}$/;
const URL_REGEX = /^https?:\/\/.+\..+/;

const getNormalizedOptions = (field) => {
  if (!field) return [];
  const type = field.field_type || field.type;

  if (field.options && Array.isArray(field.options) && field.options.length > 0) {
    return field.options
      .map((o, idx) => {
        if (typeof o === "object" && o !== null) {
          return { id: o.id || idx, text: o.option_text || o.label || o.value || "" };
        }
        return { id: idx, text: String(o) };
      })
      .filter((o) => Boolean(o.text));
  }

  // Default option fallbacks
  if (type === "yes_no") {
    return [
      { id: "yes", text: "Yes" },
      { id: "no", text: "No" },
    ];
  }
  if (type === "matrix") {
    return [
      { id: "r1", text: "Row 1" },
      { id: "r2", text: "Row 2" },
    ];
  }

  return [];
};

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PublicForm() {
  const { publicLink } = useParams();

  const [form, setForm] = useState(null);
  const themeConfig = useMemo(() => {
    return parseFormTheme(form?.theme_config);
  }, [form?.theme_config]);

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [otherValues, setOtherValues] = useState({});

  // Password gate state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordEntry, setPasswordEntry] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordEntry, setShowPasswordEntry] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Save & Continue Later / Resume Across Devices State
  const [resumeToken, setResumeToken] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("resume") || "";
    }
    return "";
  });
  const [lastSavedTime, setLastSavedTime] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Scan-to-Fill Modal State
  const [scanModalOpen, setScanModalOpen] = useState(false);

  // Respondent Micro-Verification State
  const [verifiedTokens, setVerifiedTokens] = useState({});
  const [verifModalOpen, setVerifModalOpen] = useState(false);
  const [verifModalType, setVerifModalType] = useState("email");
  const [verifInitialDest, setVerifInitialDest] = useState("");
  // Dynamic External API Lookup State & Timers
  const [lookupStatus, setLookupStatus] = useState({}); // { [fieldId]: { loading: bool, success: bool, error: string, count: number } }
  const lookupDebounceTimers = useRef({});

  const executeFieldLookup = async (targetOrLookupFieldId, overrideVal = null) => {
    if (!form?.fields) return;

    let lookupField = form.fields.find((f) => f.id === targetOrLookupFieldId && f.lookup_config);
    if (!lookupField) {
      lookupField = form.fields.find((f) => {
        if (!f.lookup_config) return false;
        try {
          const cfg = typeof f.lookup_config === "string" ? JSON.parse(f.lookup_config) : f.lookup_config;
          return Number(cfg?.trigger_field_id) === Number(targetOrLookupFieldId);
        } catch {
          return false;
        }
      });
    }

    if (!lookupField || !lookupField.lookup_config) return;

    let cfg = null;
    try {
      cfg = typeof lookupField.lookup_config === "string" ? JSON.parse(lookupField.lookup_config) : lookupField.lookup_config;
    } catch {
      return;
    }

    if (!cfg || cfg.is_enabled === false) return;

    const triggerFieldId = cfg.trigger_field_id ? Number(cfg.trigger_field_id) : lookupField.id;
    const rawInput = overrideVal !== null ? overrideVal : (answers[triggerFieldId] || answers[lookupField.id] || "");
    const inputVal = String(rawInput).trim();

    const minChars = Number(cfg.min_chars) || 1;
    if (inputVal.length < minChars) return;

    setLookupStatus((prev) => ({
      ...prev,
      [lookupField.id]: { loading: true, success: false, error: null, count: 0 },
    }));

    try {
      const res = await api.post(`/public/forms/${publicLink}/lookup/${lookupField.id}`, {
        input_value: inputVal,
      });

      if (res.data?.success && res.data.mapped_values && Object.keys(res.data.mapped_values).length > 0) {
        const mapped = res.data.mapped_values;
        const count = Object.keys(mapped).length;

        setAnswers((prev) => {
          let updated = { ...prev, ...mapped };
          if (form?.fields && form.fields.length > 0) {
            updated = evaluateAllFormulas(form.fields, updated);
          }
          return updated;
        });

        setLookupStatus((prev) => ({
          ...prev,
          [lookupField.id]: { loading: false, success: true, count, error: null },
        }));

        toast.success(`Auto-filled ${count} field${count > 1 ? "s" : ""}`, {
          id: `lookup-success-${lookupField.id}`,
          duration: 3000,
        });
      } else {
        const errMsg = res.data?.error || "No matching data found";
        setLookupStatus((prev) => ({
          ...prev,
          [lookupField.id]: { loading: false, success: false, error: errMsg, count: 0 },
        }));
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Lookup service temporarily unavailable";
      setLookupStatus((prev) => ({
        ...prev,
        [lookupField.id]: { loading: false, success: false, error: errMsg, count: 0 },
      }));
    }
  };

  const handleStartVerification = (targetType, fieldId) => {
    const rawVal = answers[fieldId] || "";
    const val = String(rawVal).trim();
    if (!val) {
      toast.error(`Please enter your ${targetType === "email" ? "email address" : "phone number"} first.`, { id: "enter-dest-err" });
      return;
    }
    if (targetType === "email" && !EMAIL_REGEX.test(val)) {
      toast.error("Please enter a valid email address first.", { id: "email-format-err" });
      return;
    }
    if (targetType === "phone" && !PHONE_REGEX.test(val)) {
      toast.error("Please enter a valid phone number first.", { id: "phone-format-err" });
      return;
    }

    setVerifModalType(targetType);
    setVerifInitialDest(val);
    setVerifCurrentFieldId(fieldId);
    setVerifModalOpen(true);
  };

  const handleVerificationSuccess = ({ destination, token }) => {
    if (destination && token) {
      const normalized = destination.toLowerCase().trim();
      setVerifiedTokens((prev) => ({ ...prev, [normalized]: token }));
      if (verifCurrentFieldId) {
        handleInputChange(verifCurrentFieldId, destination);
      }
    }
  };

  const handleScanApply = (populatedDict) => {
    let updated = { ...answers, ...populatedDict };
    if (form?.fields && form.fields.length > 0) {
      updated = evaluateAllFormulas(form.fields, updated);
    }
    setAnswers(updated);
    if (errors) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(populatedDict)) {
          delete next[k];
        }
        return next;
      });
    }
  };

  // Save Progress to Backend Database
  const handleSaveProgress = async (emailOverride = null) => {
    if (!publicLink) return;
    try {
      setSavingProgress(true);

      const payload = {
        resume_token: resumeToken || null,
        answers: answers,
        current_page: 0,
        respondent_email: emailOverride || null,
      };

      const res = await api.post(`/public/forms/${publicLink}/draft`, payload);

      if (res.data.resume_token) {
        setResumeToken(res.data.resume_token);
        setResumeUrl(res.data.resume_url);
        setLastSavedTime(res.data.saved_at);
      }

      return res.data;
    } catch (err) {
      console.error("Save progress error:", err);
      toast.error(err.response?.data?.detail || "Failed to save progress to server.", { id: "save-progress-err" });
      throw err;
    } finally {
      setSavingProgress(false);
    }
  };

  // Open Save & Continue Modal
  const handleOpenSaveModal = async () => {
    try {
      const data = await handleSaveProgress();
      setSaveModalOpen(true);
      toast.success("Progress saved! You can resume from any device.", { id: "manual-save-toast" });
    } catch {
      // Handled in handleSaveProgress
    }
  };

  // Send Resume Link to Email
  const handleSendResumeEmail = async (targetEmail) => {
    try {
      setSendingEmail(true);
      await handleSaveProgress(targetEmail);
      const url = resumeUrl || `${window.location.origin}/public/forms/${publicLink}?resume=${resumeToken}`;
      const res = await api.post(`/public/forms/${publicLink}/draft-send-email`, {
        email: targetEmail,
        resume_url: url,
      });
      return res.data;
    } finally {
      setSendingEmail(false);
    }
  };

  // Offline Mode & Sync State
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online");
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Sync Pending Submissions Queue with Backend
  const syncPendingSubmissions = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return;
    }

    const queueStr = localStorage.getItem("formify_offline_submissions");
    if (!queueStr) {
      setPendingSyncCount(0);
      return;
    }

    let queue = [];
    try {
      queue = JSON.parse(queueStr);
    } catch {
      queue = [];
    }

    if (!Array.isArray(queue) || queue.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setSyncStatus("syncing");
    setPendingSyncCount(queue.length);
    toast.loading(`Syncing ${queue.length} pending response(s)...`, { id: "sync-toast" });

    const remainingQueue = [];
    let syncedCount = 0;
    let syncError = false;

    for (const item of queue) {
      try {
        await api.post(`/public/forms/${item.publicLink}/submit`, {
          client_id: item.id,
          responses: item.responses,
        });
        syncedCount++;
      } catch (err) {
        console.error("Failed to sync offline response:", item, err);
        if (err.response?.data?.message?.includes("already synced")) {
          syncedCount++;
        } else {
          syncError = true;
          remainingQueue.push(item);
        }
      }
    }

    try {
      localStorage.setItem("formify_offline_submissions", JSON.stringify(remainingQueue));
    } catch {
      // Storage write error silently ignored
    }

    setPendingSyncCount(remainingQueue.length);

    if (syncError && remainingQueue.length > 0) {
      setSyncStatus("error");
      toast.error(`Sync failed for ${remainingQueue.length} response(s). Will retry automatically.`, { id: "sync-toast" });
    } else {
      setSyncStatus("synced");
      toast.success(`Successfully synchronized ${syncedCount} response(s)!`, { id: "sync-toast" });
      setTimeout(() => {
        setSyncStatus(navigator.onLine ? "online" : "offline");
      }, 4000);
    }
  };

  // Online / Offline Status Detection & Auto-Sync Handler
  useEffect(() => {
    const updatePendingCount = () => {
      try {
        const stored = localStorage.getItem("formify_offline_submissions");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setPendingSyncCount(parsed.length);
        } else {
          setPendingSyncCount(0);
        }
      } catch {
        setPendingSyncCount(0);
      }
    };

    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("online");
      toast.success("Back online! Network connection restored.", { id: "net-status" });
      syncPendingSubmissions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
      toast.error("You are offline. Form responses will be saved locally.", { id: "net-status" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && navigator.onLine) {
      const stored = localStorage.getItem("formify_offline_submissions");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            syncPendingSubmissions();
          }
        } catch {}
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // File Upload Handling State & Refs
  const [uploadingMap, setUploadingMap] = useState({});
  const [uploadedFileMap, setUploadedFileMap] = useState({});
  const fileInputRefs = useRef({});

  const handleFileUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = field.max_file_size_mb || 10;
    const maxBytes = maxMb * 1024 * 1024;

    if (file.size > maxBytes) {
      toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxMb}MB`);
      if (fileInputRefs.current[field.id]) fileInputRefs.current[field.id].value = "";
      return;
    }

    if (field.allowed_file_types && field.allowed_file_types.trim() !== "") {
      const allowedList = field.allowed_file_types
        .toLowerCase()
        .split(",")
        .map((s) => s.trim().replace(/^\./, ""));

      const fileExt = file.name.split(".").pop().toLowerCase();
      const mimeType = file.type.toLowerCase();

      const isMatch = allowedList.some((item) => {
        if (item === "image/*" && mimeType.startsWith("image/")) return true;
        if (item === "video/*" && mimeType.startsWith("video/")) return true;
        if (item === "audio/*" && mimeType.startsWith("audio/")) return true;
        return item === fileExt || mimeType.includes(item);
      });

      if (!isMatch && !(field.field_type === "image_upload" && mimeType.startsWith("image/"))) {
        toast.error(`Invalid file type. Allowed formats: ${field.allowed_file_types}`);
        if (fileInputRefs.current[field.id]) fileInputRefs.current[field.id].value = "";
        return;
      }
    } else if (field.field_type === "image_upload" && !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, GIF, WebP)");
      if (fileInputRefs.current[field.id]) fileInputRefs.current[field.id].value = "";
      return;
    }

    try {
      setUploadingMap((prev) => ({ ...prev, [field.id]: true }));
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/", formData);

      const fileInfo = {
        url: res.data.url,
        filename: res.data.filename,
        size_bytes: res.data.size_bytes,
      };

      setUploadedFileMap((prev) => ({ ...prev, [field.id]: fileInfo }));
      handleInputChange(field.id, res.data.url);
      toast.success(`Uploaded "${res.data.filename}" successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to upload file");
    } finally {
      setUploadingMap((prev) => ({ ...prev, [field.id]: false }));
    }
  };

  const handleRemoveFile = (fieldId) => {
    setUploadedFileMap((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    handleInputChange(fieldId, "");
    if (fileInputRefs.current[fieldId]) {
      fileInputRefs.current[fieldId].value = "";
    }
  };

  // Check for existing submission on mount
  useEffect(() => {
    const previousSubmission = localStorage.getItem(`submitted_${publicLink}`);
    if (previousSubmission) {
      setAlreadySubmitted(true);
    }
  }, [publicLink]);

  // Load published form schema from backend database (with offline local storage fallback)
  useEffect(() => {
    async function fetchForm() {
      try {
        setLoading(true);
        let formData = null;

        if (typeof navigator !== "undefined" && navigator.onLine) {
          try {
            const res = await api.get(`/public/forms/${publicLink}`);
            formData = res.data;
            // Cache form schema locally for offline availability
            try {
              localStorage.setItem(`form_cache_${publicLink}`, JSON.stringify(formData));
            } catch {
              // Silently handle storage errors
            }
          } catch (networkErr) {
            console.warn("Network request failed, attempting local cache fallback:", networkErr);
          }
        }

        // Fallback to offline local cache if offline or network request failed
        if (!formData) {
          const cached = localStorage.getItem(`form_cache_${publicLink}`);
          if (cached) {
            try {
              formData = JSON.parse(cached);
              toast("Offline Mode: Form loaded from local cache", { icon: "⚡", id: "offline-cache-load" });
              setSyncStatus("offline");
            } catch {
              formData = null;
            }
          }
        }

        if (!formData) {
          toast.error("Failed to load form. Ensure you have an active internet connection or previously loaded this form.", { id: "pub-form-err" });
          setLoading(false);
          return;
        }

        // Check if this protected form was already unlocked in this session
        if (formData.is_password_protected) {
          const sessionKey = `unlocked_form_${publicLink}`;
          const sessionData = sessionStorage.getItem(sessionKey);
          if (sessionData) {
            try {
              const restoredForm = JSON.parse(sessionData);
              // Shuffle options for fields that have shuffle_options enabled
              if (restoredForm.fields) {
                restoredForm.fields = restoredForm.fields.map((f) => {
                  if (f.shuffle_options && f.options && f.options.length > 0) {
                    return { ...f, options: shuffleArray(f.options) };
                  }
                  return f;
                });
              }
              setForm(restoredForm);
              setIsUnlocked(true);
              // Restore defaults / draft
              const defaults = {};
              if (restoredForm.fields) {
                for (const f of restoredForm.fields) {
                  if (f.default_value && f.default_value.trim() !== "") {
                    defaults[f.id] = f.default_value;
                  }
                }
              }
              const savedDraft = localStorage.getItem(`draft_${publicLink}`);
              if (savedDraft) {
                try {
                  setAnswers({ ...defaults, ...JSON.parse(savedDraft) });
                } catch {
                  setAnswers(defaults);
                }
              } else {
                setAnswers(defaults);
              }
              return;
            } catch {
              // Corrupted session data — fall through to show password gate
              sessionStorage.removeItem(sessionKey);
            }
          }
          // No session unlock — show the locked shell (no fields)
          setForm(formData);
          return;
        }

        // Shuffle options for fields that have shuffle_options enabled
        if (formData.fields) {
          formData.fields = formData.fields.map((f) => {
            if (f.shuffle_options && f.options && f.options.length > 0) {
              return { ...f, options: shuffleArray(f.options) };
            }
            return f;
          });
        }

        setForm(formData);

        // Initialize answers from default_value settings
        const defaults = {};
        if (formData.fields) {
          for (const f of formData.fields) {
            if (f.default_value && f.default_value.trim() !== "") {
              defaults[f.id] = f.default_value;
            }
          }
        }

        // Check for resume token in URL search parameters to restore backend draft across devices
        const resumeParam = new URLSearchParams(window.location.search).get("resume");
        if (resumeParam && typeof navigator !== "undefined" && navigator.onLine) {
          try {
            const draftRes = await api.get(`/public/forms/${publicLink}/draft/${resumeParam}`);
            if (draftRes.data && draftRes.data.answers) {
              setAnswers({ ...defaults, ...draftRes.data.answers });
              setResumeToken(resumeParam);
              if (draftRes.data.updated_at) setLastSavedTime(draftRes.data.updated_at);
              toast.success("Resumed your saved progress across devices!", { id: "resume-success" });
              return;
            }
          } catch (resumeErr) {
            console.warn("Resume token error:", resumeErr);
            toast.error("Saved draft link not found, expired, or already submitted.", { id: "resume-err" });
          }
        }

        // Load autosaved draft from localStorage if present (overrides defaults)
        const savedDraft = localStorage.getItem(`draft_${publicLink}`);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setAnswers({ ...defaults, ...parsed });
            toast.success("Restored your saved draft responses", { id: "draft-restored" });
          } catch {
            setAnswers(defaults);
          }
        } else {
          setAnswers(defaults);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load form. Ensure the form link is published and active.", { id: "pub-form-err" });
      } finally {
        setLoading(false);
      }
    }
    if (publicLink) {
      fetchForm();
    }
  }, [publicLink]);

  // Handle password verification for protected forms
  const handlePasswordVerify = async (e) => {
    e?.preventDefault();
    if (!passwordEntry.trim()) {
      setPasswordError("Please enter the password.");
      return;
    }
    try {
      setVerifyingPassword(true);
      setPasswordError("");
      const res = await api.post(`/public/forms/${publicLink}/verify-password`, {
        password: passwordEntry,
      });
      const unlockedFormData = res.data;

      // Shuffle options for fields that have shuffle_options enabled
      if (unlockedFormData.fields) {
        unlockedFormData.fields = unlockedFormData.fields.map((f) => {
          if (f.shuffle_options && f.options && f.options.length > 0) {
            return { ...f, options: shuffleArray(f.options) };
          }
          return f;
        });
      }

      // Persist the unlocked form for this session (so refresh doesn't re-prompt)
      try {
        sessionStorage.setItem(`unlocked_form_${publicLink}`, JSON.stringify(unlockedFormData));
      } catch {
        // sessionStorage might be unavailable in some browsers — silently ignore
      }

      setForm(unlockedFormData);
      setIsUnlocked(true);

      // Initialize answers from default_value settings
      const defaults = {};
      if (unlockedFormData.fields) {
        for (const f of unlockedFormData.fields) {
          if (f.default_value && f.default_value.trim() !== "") {
            defaults[f.id] = f.default_value;
          }
        }
      }
      setAnswers(defaults);
    } catch (err) {
      if (err.response?.status === 401) {
        setPasswordError("Incorrect password. Please try again.");
      } else {
        setPasswordError(err.response?.data?.detail || "Failed to verify password. Please try again.");
      }
    } finally {
      setVerifyingPassword(false);
    }
  };



  // Evaluate single condition in published respondent form
  const evaluateSingleCondition = (cond, answersMap) => {
    const triggerVal = answersMap[cond.trigger_field_id];
    const op = cond.operator || "==";
    const compVal = cond.comparison_value;

    if (op === "is_empty") {
      if (Array.isArray(triggerVal)) return triggerVal.length === 0;
      if (typeof triggerVal === "object" && triggerVal !== null) return Object.keys(triggerVal).length === 0;
      return triggerVal === undefined || triggerVal === null || String(triggerVal).trim() === "";
    }
    if (op === "is_not_empty") {
      if (Array.isArray(triggerVal)) return triggerVal.length > 0;
      if (typeof triggerVal === "object" && triggerVal !== null) return Object.keys(triggerVal).length > 0;
      return triggerVal !== undefined && triggerVal !== null && String(triggerVal).trim() !== "";
    }
    if (op === "is_yes") return String(triggerVal).toLowerCase().trim() === "yes";
    if (op === "is_no") return String(triggerVal).toLowerCase().trim() === "no";

    if (triggerVal === undefined || triggerVal === null || triggerVal === "") return false;

    if (Array.isArray(triggerVal)) {
      const arr = triggerVal.map((v) => String(v).toLowerCase().trim());
      const targetStr = String(compVal).toLowerCase().trim();
      if (op === "contains" || op === "==") return arr.includes(targetStr);
      if (op === "not_contains" || op === "!=") return !arr.includes(targetStr);
    }

    if (typeof triggerVal === "object" && triggerVal !== null && !Array.isArray(triggerVal)) {
      const matrixValues = Object.values(triggerVal).map((v) => String(v).toLowerCase().trim());
      const targetStr = String(compVal).toLowerCase().trim();
      if (op === "contains" || op === "==") return matrixValues.includes(targetStr);
      if (op === "not_contains" || op === "!=") return !matrixValues.includes(targetStr);
    }

    const numTrig = Number(triggerVal);
    const numComp = Number(compVal);
    const isNumComparison = !isNaN(numTrig) && !isNaN(numComp) && compVal !== "";

    if (op === ">") return isNumComparison ? numTrig > numComp : String(triggerVal) > String(compVal);
    if (op === ">=") return isNumComparison ? numTrig >= numComp : String(triggerVal) >= String(compVal);
    if (op === "<") return isNumComparison ? numTrig < numComp : String(triggerVal) < String(compVal);
    if (op === "<=") return isNumComparison ? numTrig <= numComp : String(triggerVal) <= String(compVal);

    const strTrig = String(triggerVal ?? "").toLowerCase().trim();
    const strComp = String(compVal ?? "").toLowerCase().trim();

    if (op === "==") return strTrig === strComp;
    if (op === "!=") return strTrig !== strComp;
    if (op === "contains") return strTrig.includes(strComp);
    if (op === "not_contains") return !strTrig.includes(strComp);
    if (op === "starts_with") return strTrig.startsWith(strComp);
    if (op === "ends_with") return strTrig.endsWith(strComp);

    return false;
  };

  const evaluateRule = (r, answersMap) => {
    let treeData = null;
    if (r.conditions_json) {
      try {
        const parsed = JSON.parse(r.conditions_json);
        if (parsed && Array.isArray(parsed.groups)) treeData = parsed;
        else if (Array.isArray(parsed)) {
          treeData = { group_combinator: r.logic_operator || "AND", groups: [{ id: "g1", combinator: r.logic_operator || "AND", conditions: parsed }] };
        }
      } catch {
        treeData = null;
      }
    }
    if (!treeData) {
      treeData = {
        group_combinator: "AND",
        groups: [{ id: "g1", combinator: "AND", conditions: [{ trigger_field_id: r.trigger_field_id, operator: r.operator, comparison_value: r.comparison_value }] }],
      };
    }

    if (!treeData.groups || treeData.groups.length === 0) return true;

    const evaluateGroup = (grp) => {
      if (!grp.conditions || grp.conditions.length === 0) return true;
      const comb = (grp.combinator || "AND").toUpperCase();
      if (comb === "OR") return grp.conditions.some((cond) => evaluateSingleCondition(cond, answersMap));
      return grp.conditions.every((cond) => evaluateSingleCondition(cond, answersMap));
    };

    const grpComb = (treeData.group_combinator || "OR").toUpperCase();
    if (grpComb === "OR") return treeData.groups.some((grp) => evaluateGroup(grp));
    return treeData.groups.every((grp) => evaluateGroup(grp));
  };

  const isFieldSkippedByBranching = (fieldId) => {
    if (!form || !form.fields || !form.conditional_rules) return false;
    const targetField = form.fields.find((f) => Number(f.id) === Number(fieldId));
    if (!targetField) return false;

    const precedingFields = form.fields.filter((f) => f.field_order < targetField.field_order);

    for (const pField of precedingFields) {
      for (const r of form.conditional_rules) {
        let targetActions = [];
        if (r.conditions_json) {
          try {
            const parsed = JSON.parse(r.conditions_json);
            if (parsed && Array.isArray(parsed.target_actions)) targetActions = parsed.target_actions;
          } catch {
            targetActions = [];
          }
        }
        if (!targetActions || targetActions.length === 0) {
          if (r.target_field_id) targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
        }

        for (const tAct of targetActions) {
          const act = tAct.action;
          if (["skip_to_question", "skip_to_section", "skip_to_page", "end_form"].includes(act)) {
            if (evaluateRule(r, answers)) {
              if (act === "end_form") return true;
              const destField = form.fields.find((f) => Number(f.id) === Number(tAct.target_field_id));
              if (destField && targetField.field_order > pField.field_order && targetField.field_order < destField.field_order) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  };

  // Evaluate conditional display logic rules in published respondent form
  const shouldShowField = (fieldId) => {
    if (!form || !form.conditional_rules) return true;
    if (isFieldSkippedByBranching(fieldId)) return false;

    for (const r of form.conditional_rules) {
      let targetActions = [];
      if (r.conditions_json) {
        try {
          const parsed = JSON.parse(r.conditions_json);
          if (parsed && Array.isArray(parsed.target_actions)) targetActions = parsed.target_actions;
        } catch {
          targetActions = [];
        }
      }
      if (!targetActions || targetActions.length === 0) {
        if (r.target_field_id) targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
      }

      const matchingTarget = targetActions.find((t) => Number(t.target_field_id) === Number(fieldId));
      if (matchingTarget) {
        const matches = evaluateRule(r, answers);
        if (matchingTarget.action === "show") return matches;
        if (matchingTarget.action === "hide") return !matches;
      }
    }
    return true;
  };

  // Evaluate dynamic field requirement state in published respondent form
  const isFieldRequired = (field) => {
    let required = field.is_required || false;
    if (!form || !form.conditional_rules) return required;

    for (const r of form.conditional_rules) {
      let targetActions = [];
      if (r.conditions_json) {
        try {
          const parsed = JSON.parse(r.conditions_json);
          if (parsed && Array.isArray(parsed.target_actions)) targetActions = parsed.target_actions;
        } catch {
          targetActions = [];
        }
      }
      if (!targetActions || targetActions.length === 0) {
        if (r.target_field_id) targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
      }

      const matchingTarget = targetActions.find((t) => Number(t.target_field_id) === Number(field.id));
      if (matchingTarget) {
        const act = matchingTarget.action;
        if (["make_required", "require"].includes(act)) {
          if (evaluateRule(r, answers)) required = true;
        } else if (["make_optional", "optional"].includes(act)) {
          if (evaluateRule(r, answers)) required = false;
        }
      }
    }
    return required;
  };

  // Visible questions list — also filter out is_hidden fields
  const visibleFields = useMemo(() => {
    if (!form || !form.fields) return [];
    return form.fields.filter((f) => !f.is_hidden && shouldShowField(f.id));
  }, [form, answers]);

  // Calculate live progress percentage
  const progressPercentage = useMemo(() => {
    if (visibleFields.length === 0) return 0;
    const answeredCount = visibleFields.filter((f) => {
      const val = answers[f.id];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && String(val).trim() !== "";
    }).length;
    return Math.round((answeredCount / visibleFields.length) * 100);
  }, [visibleFields, answers]);

  // Recalculate formula fields whenever form structure is loaded
  useEffect(() => {
    if (form?.fields && form.fields.length > 0) {
      setAnswers((prev) => evaluateAllFormulas(form.fields, prev));
    }
  }, [form?.fields]);

  // Handle input change + autosave to localStorage
  const handleInputChange = (fieldId, value) => {
    let updated = { ...answers, [fieldId]: value };
    if (form?.fields && form.fields.length > 0) {
      updated = evaluateAllFormulas(form.fields, updated);
    }
    setAnswers(updated);

    // Clear field validation error
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: null }));
    }

    // Autosave draft to browser storage
    try {
      localStorage.setItem(`draft_${publicLink}`, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    // Dynamic external API lookup auto-trigger (debounced)
    if (form?.fields) {
      const matchingLookupFields = form.fields.filter((f) => {
        if (!f.lookup_config) return false;
        try {
          const cfg = typeof f.lookup_config === "string" ? JSON.parse(f.lookup_config) : f.lookup_config;
          if (cfg?.is_enabled === false) return false;
          if (cfg?.trigger_behavior === "on_button") return false;
          const trigId = cfg?.trigger_field_id ? Number(cfg.trigger_field_id) : f.id;
          return trigId === Number(fieldId);
        } catch {
          return false;
        }
      });

      for (const lf of matchingLookupFields) {
        if (lookupDebounceTimers.current[lf.id]) {
          clearTimeout(lookupDebounceTimers.current[lf.id]);
        }
        lookupDebounceTimers.current[lf.id] = setTimeout(() => {
          executeFieldLookup(lf.id, value);
        }, 550);
      }
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    for (const field of visibleFields) {
      if (field.is_read_only) continue; // Skip read-only fields
      if (["heading", "description", "section_divider", "page_break", "image", "video"].includes(field.field_type)) continue;

      const val = answers[field.id];
      const isValEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0);

      // Required field validation (Static + Dynamic Required/Optional Logic)
      if (isFieldRequired(field) && isValEmpty) {
        newErrors[field.id] = field.validation_message || `"${field.label}" is required.`;
        isValid = false;
        continue;
      }

      // Format validations for non-empty scalar values
      const strVal = val !== undefined && val !== null ? String(val).trim() : "";
      if (strVal !== "" && !Array.isArray(val) && typeof val !== "object") {
        if (field.field_type === "email" && !EMAIL_REGEX.test(strVal)) {
          newErrors[field.id] = field.validation_message || "Please enter a valid email address.";
          isValid = false;
        } else if (field.field_type === "phone" && !PHONE_REGEX.test(strVal)) {
          newErrors[field.id] = field.validation_message || "Please enter a valid phone number.";
          isValid = false;
        } else if (field.field_type === "url" && !URL_REGEX.test(strVal)) {
          newErrors[field.id] = field.validation_message || "Please enter a valid URL (e.g. https://example.com).";
          isValid = false;
        }

        if (field.min_length && strVal.length < field.min_length) {
          newErrors[field.id] = field.validation_message || `Minimum ${field.min_length} characters required.`;
          isValid = false;
        }

        if (field.max_length && strVal.length > field.max_length) {
          newErrors[field.id] = field.validation_message || `Maximum ${field.max_length} characters allowed.`;
          isValid = false;
        }

        if (field.field_type === "number" && strVal !== "") {
          const numVal = Number(strVal);
          if (field.min_length !== null && field.min_length !== undefined && numVal < field.min_length) {
            newErrors[field.id] = field.validation_message || `Minimum value is ${field.min_length}.`;
            isValid = false;
          }
          if (field.max_length !== null && field.max_length !== undefined && numVal > field.max_length) {
            newErrors[field.id] = field.validation_message || `Maximum value is ${field.max_length}.`;
            isValid = false;
          }
        }

        if (field.regex_pattern && !newErrors[field.id]) {
          try {
            const regex = new RegExp(field.regex_pattern);
            if (!regex.test(strVal)) {
              newErrors[field.id] = field.validation_message || "Value does not match the required format.";
              isValid = false;
            }
          } catch {
            // Invalid regex pattern — skip
          }
        }
      }

      if (Array.isArray(val) && field.max_selections && val.length > field.max_selections) {
        newErrors[field.id] = field.validation_message || `You can select at most ${field.max_selections} options.`;
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (!isValid) {
      const firstErrId = Object.keys(newErrors)[0];
      const errField = visibleFields.find((f) => String(f.id) === String(firstErrId));
      const errLabel = errField ? `"${errField.label}"` : "required fields";

      toast.error(`Please complete ${errLabel} before submitting.`, { id: "val-err" });

      // Auto-scroll directly to the first question with a validation error
      setTimeout(() => {
        const targetEl = document.getElementById(`field-container-${firstErrId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          const inp = targetEl.querySelector("input, textarea, select");
          if (inp) inp.focus();
        }
      }, 50);
    }

    return isValid;
  };

  // Submit response to database
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form || !form.fields) return;

    if (!validateForm()) {
      return;
    }

    // Micro-Verification Gate Enforcement
    if (form.require_verification_to_submit || form.is_email_otp_enabled || form.is_phone_otp_enabled) {
      if (form.is_email_otp_enabled) {
        const emailFields = visibleFields.filter((f) => (f.field_type || f.type) === "email");
        for (const ef of emailFields) {
          const emailVal = (answers[ef.id] || "").toString().trim().toLowerCase();
          if (emailVal && !verifiedTokens[emailVal]) {
            if (form.require_verification_to_submit) {
              toast.error("Please verify your email address before submitting.", { id: "verif-req-err" });
              const targetEl = document.getElementById(`field-container-${ef.id}`);
              if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
          }
        }
      }

      if (form.is_phone_otp_enabled) {
        const phoneFields = visibleFields.filter((f) => (f.field_type || f.type) === "phone");
        for (const pf of phoneFields) {
          const phoneVal = (answers[pf.id] || "").toString().trim().toLowerCase();
          if (phoneVal && !verifiedTokens[phoneVal]) {
            if (form.require_verification_to_submit) {
              toast.error("Please verify your phone number before submitting.", { id: "verif-req-err" });
              const targetEl = document.getElementById(`field-container-${pf.id}`);
              if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              return;
            }
          }
        }
      }
    }

    try {
      setSubmitting(true);

      const responsesList = visibleFields
        .filter((field) => !["heading", "description", "section_divider", "page_break", "image", "video"].includes(field.field_type))
        .map((field) => {
          const val = answers[field.id];
          let valStr = "";

          if (Array.isArray(val)) {
            valStr = val.join(", ");
          } else if (typeof val === "object" && val !== null) {
            valStr = Object.entries(val)
              .map(([row, col]) => `${row}: ${col}`)
              .join(" | ");
          } else if (val !== undefined && val !== null) {
            valStr = String(val);
            if (valStr === "Other" && otherValues[field.id]) {
              valStr = `Other: ${otherValues[field.id]}`;
            }
          }

          return {
            field_id: field.id,
            value: valStr || "",
          };
        });

      const clientId = `client_${publicLink}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Check if offline or network submission attempt
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const offlineItem = {
          id: clientId,
          publicLink: publicLink,
          responses: responsesList,
          timestamp: new Date().toISOString(),
          formTitle: form?.title || "Published Form",
        };

        const existingQueue = JSON.parse(localStorage.getItem("formify_offline_submissions") || "[]");
        existingQueue.push(offlineItem);
        localStorage.setItem("formify_offline_submissions", JSON.stringify(existingQueue));

        const assignedSubId = `SUB-OFFLINE-${clientId.slice(-6).toUpperCase()}`;
        setSubmissionId(assignedSubId);
        setSubmitted(true);
        setPendingSyncCount(existingQueue.length);
        setSyncStatus("offline");

        try {
          localStorage.setItem(`submitted_${publicLink}`, JSON.stringify({ subId: assignedSubId, date: new Date().toISOString(), isOffline: true }));
          localStorage.removeItem(`draft_${publicLink}`);
        } catch {}

        toast.success("Saved offline! Your response will automatically sync when internet returns.", { id: "sub-offline" });
        return;
      }

      // Attempt online submission
      try {
        const tokenList = Object.values(verifiedTokens).filter(Boolean);
        const res = await api.post(`/public/forms/${publicLink}/submit`, {
          client_id: clientId,
          resume_token: resumeToken || null,
          verification_tokens: tokenList,
          responses: responsesList,
        });

        const assignedSubId = res.data?.submission_id ? `SUB-${res.data.submission_id}` : `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
        setSubmissionId(assignedSubId);
        setSubmitted(true);

        // Safely record completion & clear draft in localStorage without throwing
        try {
          localStorage.setItem(`submitted_${publicLink}`, JSON.stringify({ subId: assignedSubId, date: new Date().toISOString() }));
          localStorage.removeItem(`draft_${publicLink}`);
        } catch (storageErr) {
          console.warn("Could not save submission state to localStorage:", storageErr);
        }

        toast.success("Response recorded successfully!", { id: "sub-success" });
      } catch (onlineErr) {
        // Network error fallback during online attempt: queue offline safely
        if (!onlineErr.response || onlineErr.code === "ERR_NETWORK" || onlineErr.message?.includes("Network Error")) {
          const offlineItem = {
            id: clientId,
            publicLink: publicLink,
            responses: responsesList,
            timestamp: new Date().toISOString(),
            formTitle: form?.title || "Published Form",
          };

          const existingQueue = JSON.parse(localStorage.getItem("formify_offline_submissions") || "[]");
          existingQueue.push(offlineItem);
          localStorage.setItem("formify_offline_submissions", JSON.stringify(existingQueue));

          const assignedSubId = `SUB-OFFLINE-${clientId.slice(-6).toUpperCase()}`;
          setSubmissionId(assignedSubId);
          setSubmitted(true);
          setPendingSyncCount(existingQueue.length);
          setSyncStatus("offline");

          try {
            localStorage.setItem(`submitted_${publicLink}`, JSON.stringify({ subId: assignedSubId, date: new Date().toISOString(), isOffline: true }));
            localStorage.removeItem(`draft_${publicLink}`);
          } catch {}

          toast.success("Network unreachable: Saved response offline! Will sync automatically when connection returns.", { id: "sub-offline" });
          return;
        }
        throw onlineErr;
      }
    } catch (err) {
      console.error("Submission error:", err);
      let errMsg = "Failed to submit response. Please try again.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errMsg = detail;
        } else if (Array.isArray(detail)) {
          errMsg = detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
        } else if (typeof detail === "object") {
          errMsg = JSON.stringify(detail);
        }
      } else if (err.message && !err.response) {
        errMsg = err.message;
      }
      toast.error(errMsg, { id: "sub-err" });
    } finally {
      setSubmitting(false);
    }
  };

  // Clear submission guard and allow new response
  const handleResetForNewSubmission = () => {
    localStorage.removeItem(`submitted_${publicLink}`);
    localStorage.removeItem(`draft_${publicLink}`);
    setAlreadySubmitted(false);
    setSubmitted(false);
    setAnswers({});
    setErrors({});
  };

  // Render Status Indicator Chip/Banner Component
  const renderStatusIndicator = () => {
    let chipBg = "#F0FDF4";
    let chipBorder = "#DCFCE7";
    let chipColor = "#15803D";
    let chipLabel = "Online";
    let chipIcon = <WifiRoundedIcon sx={{ fontSize: "14px !important" }} />;

    if (!isOnline || syncStatus === "offline") {
      chipBg = "#FFFBEB";
      chipBorder = "#FDE68A";
      chipColor = "#B45309";
      chipLabel = pendingSyncCount > 0 ? `Offline (${pendingSyncCount} pending sync)` : "Offline Mode";
      chipIcon = <WifiOffRoundedIcon sx={{ fontSize: "14px !important" }} />;
    } else if (syncStatus === "syncing") {
      chipBg = "#EFF6FF";
      chipBorder = "#BFDBFE";
      chipColor = "#1D4ED8";
      chipLabel = `Syncing (${pendingSyncCount} pending)...`;
      chipIcon = <SyncRoundedIcon sx={{ fontSize: "14px !important" }} />;
    } else if (syncStatus === "synced") {
      chipBg = "#F0FDF4";
      chipBorder = "#BBF7D0";
      chipColor = "#16A34A";
      chipLabel = pendingSyncCount > 0 ? `Synced (${pendingSyncCount} remaining)` : "Synced ✓";
      chipIcon = <CloudDoneRoundedIcon sx={{ fontSize: "14px !important" }} />;
    } else if (syncStatus === "error") {
      chipBg = "#FEF2F2";
      chipBorder = "#FECACA";
      chipColor = "#DC2626";
      chipLabel = `Sync Failed (${pendingSyncCount} pending)`;
      chipIcon = <CloudOffRoundedIcon sx={{ fontSize: "14px !important" }} />;
    }

    return (
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Chip
          icon={chipIcon}
          label={chipLabel}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
            bgcolor: chipBg,
            color: chipColor,
            border: `1px solid ${chipBorder}`,
            "& .MuiChip-icon": { color: chipColor },
          }}
        />
        {pendingSyncCount > 0 && isOnline && syncStatus !== "syncing" && (
          <Button
            size="small"
            variant="text"
            startIcon={<SyncRoundedIcon sx={{ fontSize: 14 }} />}
            onClick={syncPendingSubmissions}
            sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#4F46E5",
              py: 0.2,
              px: 1,
              minWidth: "auto",
              textTransform: "none",
            }}
          >
            Sync Now
          </Button>
        )}
      </Box>
    );
  };

  // 1. LOADING STATE
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#FAFAFA">
        <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
      </Box>
    );
  }

  // 2. UNAVAILABLE FORM STATE
  if (!form) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#FAFAFA" px={2}>
        <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 3, border: "1px solid #E2E8F0", maxWidth: 460, bgcolor: "#FFFFFF" }}>
          <Typography variant="h6" fontWeight={800} color="error.main" mb={1}>
            Form Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B" }}>
            This public form link is inactive or has not been published yet.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // 2.5 PASSWORD GATE — show lock screen if form is protected and not yet unlocked this session
  if (form?.is_password_protected && !isUnlocked) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#FAFAFA"
        px={2}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 4,
              border: "1px solid #E2E8F0",
              width: "100%",
              bgcolor: "#FFFFFF",
              boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.10)",
            }}
          >
            {/* Lock icon */}
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.30)",
              }}
            >
              <LockOutlinedIcon sx={{ color: "#FFFFFF", fontSize: 34 }} />
            </Box>

            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: "#0F172A", mb: 0.5 }}
            >
              {form.title}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "#64748B", mb: 3.5, fontWeight: 500 }}
            >
              This form is password protected. Enter the password to access it.
            </Typography>

            {/* Password input */}
            <Box
              component="form"
              onSubmit={handlePasswordVerify}
              sx={{ textAlign: "left" }}
            >
              <TextField
                id="form-password-input"
                type={showPasswordEntry ? "text" : "password"}
                fullWidth
                size="medium"
                value={passwordEntry}
                onChange={(e) => {
                  setPasswordEntry(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                placeholder="Enter password"
                error={Boolean(passwordError)}
                helperText={passwordError}
                autoFocus
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPasswordEntry((v) => !v)}
                        edge="end"
                        tabIndex={-1}
                        sx={{ color: "#94A3B8" }}
                      >
                        {showPasswordEntry ? (
                          <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityRoundedIcon sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2.5,
                    bgcolor: "#F8FAFC",
                    fontSize: "1rem",
                  },
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "#4F46E5" },
                    "&.Mui-focused fieldset": { borderColor: "#4F46E5" },
                  },
                }}
              />

              <Button
                id="form-unlock-btn"
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={verifyingPassword || !passwordEntry.trim()}
                onClick={handlePasswordVerify}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2.5,
                  py: 1.5,
                  fontSize: "1rem",
                  background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35)",
                  textTransform: "none",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)",
                    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.40)",
                  },
                  "&:disabled": {
                    background: "#E2E8F0",
                    boxShadow: "none",
                  },
                }}
              >
                {verifyingPassword ? (
                  <CircularProgress size={22} sx={{ color: "#FFFFFF" }} />
                ) : (
                  "Unlock Form"
                )}
              </Button>
            </Box>

            <Box mt={3}>
              <Chip
                label="Password Protected"
                icon={<LockOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  bgcolor: "#EEF2FF",
                  color: "#4338CA",
                  border: "1px solid #C7D2FE",
                }}
              />
            </Box>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // 2.6 SCHEDULE STATUS GUARD (NOT STARTED YET OR CLOSED)

  if (form?.schedule_status && !form.schedule_status.is_active) {
    const isNotStarted = form.schedule_status.status === "not_started";
    const statusMsg = form.schedule_status.message || (isNotStarted ? "This form is not yet available." : "This form is closed.");
    const dateStr = isNotStarted
      ? form.schedule_status.start_time
        ? `Scheduled to open on ${new Date(form.schedule_status.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
        : ""
      : form.schedule_status.end_time
        ? `Submissions closed on ${new Date(form.schedule_status.end_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
        : "";

    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#FAFAFA" px={2}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3.5,
            border: "1px solid #E2E8F0",
            maxWidth: 520,
            width: "100%",
            bgcolor: "#FFFFFF",
            boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              bgcolor: isNotStarted ? "#EEF2FF" : "#FEF2F2",
              color: isNotStarted ? "#4F46E5" : "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
            }}
          >
            {isNotStarted ? <EventNoteRoundedIcon sx={{ fontSize: 32 }} /> : <EventBusyRoundedIcon sx={{ fontSize: 32 }} />}
          </Box>

          <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A", mb: 1 }}>
            {statusMsg}
          </Typography>

          {dateStr && (
            <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 600, mb: 3 }}>
              {dateStr}
            </Typography>
          )}

          <Chip
            label={isNotStarted ? "Scheduled Form" : "Form Closed"}
            color={isNotStarted ? "primary" : "error"}
            size="small"
            sx={{ fontWeight: 800 }}
          />
        </Paper>
      </Box>
    );
  }

  // 2.6 RESPONSE LIMIT GUARD (MAX RESPONSES REACHED)
  if (form?.response_limit_status && form.response_limit_status.is_limit_reached) {
    const limitMsg = form.response_limit_status.message || "This form has reached its maximum response limit and is no longer accepting responses.";

    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#FAFAFA" px={2}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3.5,
            border: "1px solid #E2E8F0",
            maxWidth: 520,
            width: "100%",
            bgcolor: "#FFFFFF",
            boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              bgcolor: "#FEF2F2",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 32 }} />
          </Box>

          <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A", mb: 1 }}>
            {limitMsg}
          </Typography>

          <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 600, mb: 3 }}>
            The form creator has set a maximum limit of {form.response_limit_status.max_limit} responses.
          </Typography>

          <Chip
            label="Response Limit Reached"
            color="error"
            size="small"
            sx={{ fontWeight: 800 }}
          />
        </Paper>
      </Box>
    );
  }

  // 3. DUPLICATE SUBMISSION GUARD SCREEN
  if (alreadySubmitted && !submitted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#FAFAFA" p={2}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            maxWidth: 520,
            width: "100%",
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            textAlign: "center",
            boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.05)",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#EEF2FF",
              color: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A", mb: 1 }}>
            Response Already Recorded
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mb: 3 }}>
            You have already submitted a response to <strong>"{form.title}"</strong> on this device.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleResetForNewSubmission}
            sx={{ fontWeight: 600 }}
          >
            Submit Another Response
          </Button>
        </Paper>
      </Box>
    );
  }

  // 4. SUCCESS SUBMISSION CONFIRMATION SCREEN
  if (submitted) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#F8FAFC"
        p={2.5}
      >
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 15, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          elevation={0}
          sx={{
            p: { xs: 4, sm: 5 },
            maxWidth: 520,
            width: "100%",
            mx: "auto",
            borderRadius: 4,
            border: "1px solid #E2E8F0",
            bgcolor: "#FFFFFF",
            textAlign: "center",
            boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.07)",
          }}
        >
          {/* Success Check Icon Badge */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.35)",
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 42 }} />
          </Box>

          {/* Primary Success Heading */}
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              color: "#0F172A",
              mb: 1.5,
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              letterSpacing: "-0.025em",
            }}
          >
            {submissionId.startsWith("SUB-OFFLINE") ? "Response Saved Offline!" : "Response Submitted Successfully!"}
          </Typography>

          {/* Friendly Respondent Message */}
          <Typography
            variant="body1"
            sx={{
              color: "#64748B",
              mb: 3,
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            {submissionId.startsWith("SUB-OFFLINE")
              ? "Your response has been saved locally on this device. Formify will automatically synchronize it with the server as soon as internet connection is restored."
              : "Thank you for completing this form. Your response has been successfully submitted."}
          </Typography>

          {pendingSyncCount > 0 && (
            <Box mb={3}>
              <Chip
                icon={<CloudUploadRoundedIcon sx={{ fontSize: "14px !important" }} />}
                label={`${pendingSyncCount} response(s) in Pending Sync Queue`}
                size="small"
                color="warning"
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
              />
            </Box>
          )}

          {/* Form Title Subcard */}
          {form?.title && (
            <Box
              sx={{
                py: 1.5,
                px: 2.5,
                bgcolor: "#F1F5F9",
                borderRadius: 2.5,
                border: "1px solid #E2E8F0",
                display: "inline-block",
                maxWidth: "100%",
                mb: 4,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {form.title}
              </Typography>
            </Box>
          )}

          {/* Action Button */}
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={handleResetForNewSubmission}
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: "#4F46E5",
                "&:hover": { bgcolor: "#4338CA" },
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.9rem",
                px: 3.5,
                py: 1.2,
                borderRadius: 2.5,
                textTransform: "none",
                boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.35)",
              }}
            >
              Submit Another Response
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // 5. ACTIVE FORM FILLING CANVAS
  return (
    <Box minHeight="100vh" bgcolor={themeConfig.backgroundColor || "#FAFAFA"} py={6} px={2} style={{ transition: "all 0.3s ease" }}>
      <Box maxWidth={680} mx="auto" display="flex" flexDirection="column" gap={3}>
        {/* Top Sticky Progress Indicator */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            bgcolor: themeConfig.cardColor || "#FFFFFF",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
            <Typography variant="caption" fontWeight={700} sx={{ color: themeConfig.textColor || "#64748B", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Form Progress ({progressPercentage}%)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {renderStatusIndicator()}
              <Button
                size="small"
                variant="outlined"
                startIcon={<BookmarkBorderRoundedIcon sx={{ fontSize: 12 }} />}
                onClick={handleOpenSaveModal}
                disabled={savingProgress}
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  height: 22,
                  borderRadius: 1.5,
                  textTransform: "none",
                  py: 0,
                  px: 1,
                  borderColor: "#CBD5E1",
                  color: "#475569",
                  "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
                }}
              >
                {savingProgress ? "Saving..." : "Save & Continue"}
              </Button>
              <Chip
                label="Autosaving Draft"
                size="small"
                sx={{ fontSize: "0.65rem", fontWeight: 700, height: 18, bgcolor: "rgba(0,0,0,0.06)", color: themeConfig.textColor || "#64748B" }}
              />
            </Stack>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "rgba(0,0,0,0.06)",
              "& .MuiLinearProgress-bar": { bgcolor: themeConfig.accentColor || "#4F46E5", borderRadius: 3 },
            }}
          />
        </Paper>

        {/* Offline Banner & Pending Sync Alerts */}
        {!isOnline && (
          <Alert
            severity="warning"
            icon={<WifiOffRoundedIcon fontSize="inherit" />}
            sx={{ borderRadius: 3, fontWeight: 600, fontSize: "0.85rem", border: "1px solid #FDE68A" }}
          >
            You are currently <strong>Offline</strong>. You can fill out and submit this form normally — your response will be saved locally and automatically synchronized with the server when connection returns.
          </Alert>
        )}
        {isOnline && pendingSyncCount > 0 && syncStatus !== "syncing" && (
          <Alert
            severity="info"
            icon={<CloudUploadRoundedIcon fontSize="inherit" />}
            action={
              <Button color="inherit" size="small" onClick={syncPendingSubmissions} sx={{ fontWeight: 800 }}>
                Sync Now
              </Button>
            }
            sx={{ borderRadius: 3, fontWeight: 600, fontSize: "0.85rem" }}
          >
            You have <strong>{pendingSyncCount} response(s)</strong> waiting to sync with the server.
          </Alert>
        )}

        {/* Form Title Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            bgcolor: themeConfig.cardColor || "#FFFFFF",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            borderTop: `6px solid ${themeConfig.accentColor || "#4F46E5"}`,
          }}
        >
          <Typography variant="h4" fontWeight={800} sx={{ color: themeConfig.primaryColor || "#0F172A", mb: 1, letterSpacing: "-0.03em" }}>
            {form.title}
          </Typography>
          {form.description && (
            <Typography variant="body1" color="text.secondary" sx={{ color: themeConfig.textColor || "#64748B", opacity: 0.85, lineHeight: 1.6 }}>
              {form.description}
            </Typography>
          )}

          {/* Scan-to-Fill Banner Action */}
          <Box
            mt={2.5}
            pt={2}
            borderTop="1px dashed #E2E8F0"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1.5}
          >
            <Typography variant="body2" fontWeight={600} sx={{ color: themeConfig.textColor || "#64748B", opacity: 0.85 }}>
              Have a receipt, invoice, business card, or document?
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DocumentScannerRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={() => setScanModalOpen(true)}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                borderColor: themeConfig.accentColor || themeConfig.primaryColor || "#4F46E5",
                color: themeConfig.accentColor || themeConfig.primaryColor || "#4F46E5",
                bgcolor: "transparent",
                textTransform: "none",
                px: 2.5,
                py: 0.75,
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  borderColor: themeConfig.accentColor || themeConfig.primaryColor || "#4F46E5",
                },
              }}
            >
              Scan Document to Auto-Fill
            </Button>
          </Box>
        </Paper>

        {/* Dynamic Questions Form Engine */}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          {(() => {
            let qNumCounter = 0;
            return visibleFields.map((field) => {
              const fType = field.field_type || field.type;
              const isLayoutBlock = ["heading", "description", "image", "video", "section_divider", "page_break"].includes(fType);

              if (!isLayoutBlock) {
                qNumCounter += 1;
              }
              const qNumDisplay = isLayoutBlock ? "" : `${qNumCounter}. `;

              const hasError = Boolean(errors[field.id]);
              const errorMsg = errors[field.id];
              const isReadOnly = field.is_read_only || false;
              const showPh = field.show_placeholder !== false;
              const fieldWidth = field.width === "half" ? "49%" : "100%";
              const isLabelLeft = field.label_position === "left";
              const isLabelRight = field.label_position === "right";
              const isLabelSide = isLabelLeft || isLabelRight;
              const normOptions = getNormalizedOptions(field);

              if (fType === "heading") {
                return (
                  <Paper key={field.id} elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A" }}>
                      {field.label}
                    </Typography>
                    {field.description && (
                      <Typography variant="body2" sx={{ color: "#64748B", mt: 1, lineHeight: 1.6 }}>
                        {field.description}
                      </Typography>
                    )}
                  </Paper>
                );
              }

              if (fType === "description") {
                return (
                  <Paper key={field.id} elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                    <Typography variant="body1" sx={{ color: "#334155", lineHeight: 1.7 }}>
                      {field.placeholder || field.description || field.label}
                    </Typography>
                  </Paper>
                );
              }

              if (fType === "section_divider") {
                return (
                  <Box key={field.id} sx={{ my: 1 }}>
                    <Divider sx={{ borderBottomWidth: 2, borderColor: "#CBD5E1" }}>
                      {field.label && <Chip label={field.label} size="small" sx={{ fontWeight: 700, bgcolor: "#EEF2FF", color: "#4F46E5" }} />}
                    </Divider>
                  </Box>
                );
              }

              if (fType === "page_break") {
                return (
                  <Paper key={field.id} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: "1px dashed #6366F1", bgcolor: "#EEF2FF", textAlign: "center" }}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: "#4F46E5", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      📄 Page Break Indicator — {field.label || "Next Page Section"}
                    </Typography>
                  </Paper>
                );
              }

              if (fType === "image") {
                return (
                  <Paper key={field.id} elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", textAlign: "center" }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                      {field.label}
                    </Typography>
                    {field.placeholder ? (
                      <img src={field.placeholder} alt={field.label} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }} />
                    ) : (
                      <Box p={3} bgcolor="#F8FAFC" borderRadius={2} color="#94A3B8">🖼️ Image Banner Block</Box>
                    )}
                  </Paper>
                );
              }

              if (fType === "video") {
                return (
                  <Paper key={field.id} elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", textAlign: "center" }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">
                      {field.label}
                    </Typography>
                    <Box p={3} bgcolor="#F8FAFC" borderRadius={2} color="#94A3B8">🎥 Video Banner Block ({field.placeholder || "No URL"})</Box>
                  </Paper>
                );
              }

              // Standard Input Question Card
              return (
                <Paper
                  key={field.id}
                  id={`field-container-${field.id}`}
                  elevation={0}
                  sx={{
                    p: 3.5,
                    borderRadius: 3,
                    border: hasError ? "1.5px solid #EF4444" : "1px solid #E2E8F0",
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
                    width: fieldWidth,
                    display: "inline-block",
                    verticalAlign: "top",
                  }}
                >
                  {/* Description above the field */}
                  {field.description && (
                    <Typography variant="body2" sx={{ color: "#64748B", mb: 1.5, lineHeight: 1.6, fontSize: "0.85rem" }}>
                      {field.description}
                    </Typography>
                  )}

                  {/* Label + Input wrapper — supports label_position: top | left | right */}
                  <Box
                    sx={{
                      display: isLabelSide ? "flex" : "block",
                      flexDirection: isLabelRight ? "row-reverse" : "row",
                      alignItems: isLabelSide ? "flex-start" : "unset",
                      gap: isLabelSide ? 2 : 0,
                    }}
                  >
                    {/* Question Header Label */}
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      sx={{
                        color: "#0F172A",
                        mb: isLabelSide ? 0 : 1.5,
                        mt: isLabelSide ? 0.7 : 0,
                        fontSize: "0.975rem",
                        minWidth: isLabelSide ? 140 : "unset",
                        flexShrink: 0,
                      }}
                    >
                      {qNumDisplay}{field.label} {isFieldRequired(field) && <span style={{ color: "#EF4444" }}>*</span>}
                    </Typography>

                    {/* Question Input Renderers */}
                    <Box sx={{ mt: isLabelSide ? 0 : 1, flex: 1 }}>
                      {["text", "email", "phone", "url", "password", "lookup"].includes(fType) && (() => {
                        const isEmailType = fType === "email";
                        const isPhoneType = fType === "phone";
                        const isEmailOtp = isEmailType && form?.is_email_otp_enabled;
                        const isPhoneOtp = isPhoneType && form?.is_phone_otp_enabled;
                        const hasOtpEnabled = isEmailOtp || isPhoneOtp;

                        // Check if this field has lookup config
                        let lookupCfg = null;
                        try {
                          if (field.lookup_config) {
                            lookupCfg = typeof field.lookup_config === "string" ? JSON.parse(field.lookup_config) : field.lookup_config;
                          }
                        } catch {
                          lookupCfg = null;
                        }
                        const isLookupField = fType === "lookup" || Boolean(lookupCfg?.is_enabled);
                        const isLookingUp = Boolean(lookupStatus[field.id]?.loading);
                        const lookupSuccess = Boolean(lookupStatus[field.id]?.success);
                        const lookupErrMsg = lookupStatus[field.id]?.error;

                        const currentVal = (answers[field.id] || "").toString().trim().toLowerCase();
                        const isVerified = Boolean(currentVal && verifiedTokens[currentVal]);

                        return (
                          <Box>
                            <TextField
                              fullWidth
                              size="small"
                              type={fType === "password" ? "password" : "text"}
                              placeholder={showPh ? (field.placeholder || (fType === "lookup" ? "Enter value to lookup..." : "Type your answer...")) : ""}
                              value={answers[field.id] || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              error={hasError}
                              disabled={isReadOnly}
                              inputProps={{
                                ...(field.min_length ? { minLength: field.min_length } : {}),
                                ...(field.max_length ? { maxLength: field.max_length } : {}),
                              }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    {hasOtpEnabled && (
                                      isVerified ? (
                                        <Chip
                                          icon={<CheckCircleRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                          label="Verified"
                                          size="small"
                                          color="success"
                                          sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                                        />
                                      ) : (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() => handleStartVerification(isEmailOtp ? "email" : "phone", field.id)}
                                          sx={{
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            py: 0.3,
                                            px: 1.5,
                                            borderRadius: 1.5,
                                            textTransform: "none",
                                            bgcolor: "#4F46E5",
                                            whiteSpace: "nowrap",
                                            "&:hover": { bgcolor: "#4338CA" },
                                          }}
                                        >
                                          Verify {isEmailOtp ? "Email" : "Phone"}
                                        </Button>
                                      )
                                    )}

                                    {isLookupField && (
                                      <Box display="flex" alignItems="center" gap={0.8}>
                                        {isLookingUp && (
                                          <CircularProgress size={16} sx={{ color: "#7C3AED", mr: 0.5 }} />
                                        )}
                                        {lookupSuccess && (
                                          <Chip
                                            icon={<CheckCircleRoundedIcon sx={{ fontSize: "13px !important" }} />}
                                            label="Populated"
                                            size="small"
                                            color="success"
                                            sx={{ fontWeight: 700, fontSize: "0.68rem", height: 22 }}
                                          />
                                        )}
                                        <Button
                                          size="small"
                                          variant="contained"
                                          onClick={() => executeFieldLookup(field.id)}
                                          disabled={isLookingUp}
                                          startIcon={<SearchRoundedIcon sx={{ fontSize: "13px !important" }} />}
                                          sx={{
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            py: 0.3,
                                            px: 1.2,
                                            borderRadius: 1.5,
                                            textTransform: "none",
                                            bgcolor: "#7C3AED",
                                            whiteSpace: "nowrap",
                                            boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)",
                                            "&:hover": { bgcolor: "#6D28D9" },
                                          }}
                                        >
                                          {lookupCfg?.button_label || "Lookup"}
                                        </Button>
                                      </Box>
                                    )}
                                  </InputAdornment>
                                ),
                              }}
                            />

                            {/* Lookup feedback notices */}
                            {lookupErrMsg && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#D97706",
                                  display: "block",
                                  mt: 0.6,
                                  fontSize: "0.72rem",
                                  fontWeight: 500,
                                }}
                              >
                                {lookupErrMsg}. You can still enter details manually.
                              </Typography>
                            )}
                            {lookupSuccess && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#059669",
                                  display: "block",
                                  mt: 0.6,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                }}
                              >
                                ✓ Automatically populated form fields. You may edit them anytime.
                              </Typography>
                            )}
                          </Box>
                        );
                      })()}

                      {fType === "textarea" && (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                          placeholder={showPh ? (field.placeholder || "Type your detailed response...") : ""}
                          value={answers[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          error={hasError}
                          disabled={isReadOnly}
                          inputProps={{
                            ...(field.max_length ? { maxLength: field.max_length } : {}),
                          }}
                        />
                      )}

                      {fType === "number" && (
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          placeholder={showPh ? (field.placeholder || "0") : ""}
                          value={answers[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          error={hasError}
                          disabled={isReadOnly}
                        />
                      )}

                      {fType === "formula" && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: "#F8FAFC",
                            border: answers[field.id]?.toString().startsWith("ERR:") ? "1.5px solid #FCA5A5" : "1.5px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
                              <FunctionsRoundedIcon sx={{ fontSize: 18, color: "#6366F1" }} />
                              Calculated Result
                            </Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ color: answers[field.id]?.toString().startsWith("ERR:") ? "#EF4444" : "#0F172A" }}>
                              {formatFormulaValue(answers[field.id], field.decimal_places, field.number_prefix, field.number_suffix)}
                            </Typography>
                            {answers[field.id]?.toString().startsWith("ERR:") && (
                              <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 600, display: "block", mt: 0.5 }}>
                                {answers[field.id]}
                              </Typography>
                            )}
                          </Box>
                          <Chip label="Auto-Calculated" size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700, fontSize: "0.75rem" }} />
                        </Paper>
                      )}

                      {fType === "date" && (
                        <TextField
                          fullWidth
                          type="date"
                          size="small"
                          value={answers[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          error={hasError}
                          disabled={isReadOnly}
                        />
                      )}

                      {fType === "time" && (
                        <TextField
                          fullWidth
                          type="time"
                          size="small"
                          value={answers[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          error={hasError}
                          disabled={isReadOnly}
                        />
                      )}

                      {fType === "rating" && (
                        <Rating
                          value={Number(answers[field.id]) || 0}
                          onChange={(e, val) => handleInputChange(field.id, val)}
                          readOnly={isReadOnly}
                        />
                      )}

                      {fType === "linear_scale" && (
                        <Box px={1} pt={1}>
                          <Slider
                            value={Number(answers[field.id]) || 5}
                            onChange={(e, val) => handleInputChange(field.id, val)}
                            step={1}
                            min={1}
                            max={10}
                            valueLabelDisplay="auto"
                            disabled={isReadOnly}
                          />
                        </Box>
                      )}

                      {["file_upload", "image_upload"].includes(fType) && (
                        <Box>
                          <input
                            type="file"
                            ref={(el) => (fileInputRefs.current[field.id] = el)}
                            style={{ display: "none" }}
                            accept={fType === "image_upload" ? "image/*" : (field.allowed_file_types || "*/*")}
                            onChange={(e) => handleFileUpload(field, e)}
                            disabled={isReadOnly}
                          />

                          {uploadingMap[field.id] ? (
                            <Paper elevation={0} sx={{ p: 3, border: "1px dashed #4F46E5", borderRadius: 2, textAlign: "center", bgcolor: "#EEF2FF" }}>
                              <CircularProgress size={24} sx={{ color: "#4F46E5", mb: 1 }} />
                              <Typography variant="body2" fontWeight={700} color="#4F46E5">
                                Uploading file... Please wait
                              </Typography>
                            </Paper>
                          ) : (answers[field.id] || uploadedFileMap[field.id]) ? (
                            <Paper
                              elevation={0}
                              sx={{ p: 2, border: "1px solid #C7D2FE", borderRadius: 2, bgcolor: "#EEF2FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            >
                              <Box display="flex" alignItems="center" gap={1.5}>
                                {fType === "image_upload" ? (
                                  <Box
                                    component="img"
                                    src={uploadedFileMap[field.id]?.url || answers[field.id]}
                                    alt="Uploaded preview"
                                    sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: "cover", border: "1px solid #C7D2FE" }}
                                  />
                                ) : (
                                  <InsertDriveFileRoundedIcon sx={{ color: "#4F46E5", fontSize: 32 }} />
                                )}
                                <Box>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A", wordBreak: "break-all" }}>
                                    {uploadedFileMap[field.id]?.filename || answers[field.id].split("/").pop()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ color: "#64748B" }}>
                                    {uploadedFileMap[field.id]?.size_bytes
                                      ? `${(uploadedFileMap[field.id].size_bytes / 1024).toFixed(1)} KB`
                                      : "File attached"} • <Chip label="Uploaded" size="small" sx={{ fontSize: "0.6rem", height: 16, bgcolor: "#ECFDF5", color: "#059669", fontWeight: 700 }} />
                                  </Typography>
                                </Box>
                              </Box>

                              {!isReadOnly && (
                                <IconButton size="small" onClick={() => handleRemoveFile(field.id)} sx={{ color: "#EF4444" }}>
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Paper>
                          ) : (
                            <Paper
                              elevation={0}
                              onClick={() => !isReadOnly && fileInputRefs.current[field.id]?.click()}
                              sx={{
                                p: 3,
                                border: hasError ? "1px dashed #EF4444" : "1px dashed #CBD5E1",
                                borderRadius: 2,
                                textAlign: "center",
                                cursor: isReadOnly ? "not-allowed" : "pointer",
                                bgcolor: hasError ? "#FEF2F2" : "#F8FAFC",
                                transition: "all 0.15s ease",
                                "&:hover": { borderColor: "#4F46E5", bgcolor: "#EEF2FF" },
                              }}
                            >
                              <AttachFileOutlinedIcon sx={{ color: "#4F46E5", fontSize: 26 }} />
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A", mt: 0.5 }}>
                                {fType === "image_upload" ? "Click to select an image" : "Click to select document or file"}
                              </Typography>
                              <Stack direction="row" spacing={1} justifyContent="center" mt={0.5} flexWrap="wrap" useFlexGap>
                                {field.allowed_file_types && (
                                  <Chip label={`Allowed: ${field.allowed_file_types}`} size="small" sx={{ fontSize: "0.63rem", fontWeight: 600, height: 18 }} />
                                )}
                                <Chip
                                  label={`Max size: ${field.max_file_size_mb || 10}MB`}
                                  size="small"
                                  sx={{ fontSize: "0.63rem", fontWeight: 600, height: 18 }}
                                />
                              </Stack>
                            </Paper>
                          )}
                        </Box>
                      )}

                      {fType === "signature" && (
                        <Paper
                          elevation={0}
                          sx={{ p: 3, border: "1px dashed #CBD5E1", borderRadius: 2, textAlign: "center", bgcolor: "#FFFFFF" }}
                        >
                          <DrawRoundedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            Sign below using touchpad or mouse
                          </Typography>
                        </Paper>
                      )}

                      {["select", "dropdown"].includes(fType) && (
                        <Select
                          fullWidth
                          size="small"
                          displayEmpty
                          value={answers[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          error={hasError}
                          disabled={isReadOnly}
                        >
                          <MenuItem value="" disabled>
                            {showPh ? (field.placeholder || "Select option...") : "Select..."}
                          </MenuItem>
                          {normOptions.map((o) => (
                            <MenuItem key={o.id} value={o.text}>
                              {o.text}
                            </MenuItem>
                          ))}
                          {field.allow_other && (
                            <MenuItem value="__other__">Other</MenuItem>
                          )}
                        </Select>
                      )}

                      {/* "Other" free-text input for select/dropdown */}
                      {["select", "dropdown"].includes(fType) && field.allow_other && answers[field.id] === "__other__" && (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Please specify..."
                          value={otherValues[field.id] || ""}
                          onChange={(e) => setOtherValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          sx={{ mt: 1 }}
                        />
                      )}

                      {fType === "radio" && (
                        <RadioGroup
                          value={answers[field.id] || ""}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        >
                          {normOptions.map((o) => (
                            <FormControlLabel key={o.id} value={o.text} control={<Radio size="small" disabled={isReadOnly} />} label={o.text} />
                          ))}
                          {field.allow_other && (
                            <FormControlLabel value="__other__" control={<Radio size="small" disabled={isReadOnly} />} label="Other" />
                          )}
                        </RadioGroup>
                      )}

                      {/* "Other" free-text input for radio */}
                      {fType === "radio" && field.allow_other && answers[field.id] === "__other__" && (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Please specify..."
                          value={otherValues[field.id] || ""}
                          onChange={(e) => setOtherValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          sx={{ mt: 1 }}
                        />
                      )}

                      {fType === "yes_no" && (
                        <Stack direction="row" spacing={1.5} mt={0.5}>
                          {normOptions.map((o) => {
                            const isSelected = answers[field.id] === o.text;
                            return (
                              <Button
                                key={o.id}
                                variant={isSelected ? "contained" : "outlined"}
                                size="medium"
                                disabled={isReadOnly}
                                onClick={() => handleInputChange(field.id, o.text)}
                                sx={{
                                  minWidth: 110,
                                  borderRadius: 2,
                                  fontWeight: 700,
                                  py: 1,
                                  px: 2.5,
                                  bgcolor: isSelected ? "#4F46E5" : "#FFFFFF",
                                  color: isSelected ? "#FFFFFF" : "#475569",
                                  borderColor: isSelected ? "#4F46E5" : "#CBD5E1",
                                  "&:hover": {
                                    bgcolor: isSelected ? "#4338CA" : "#F8FAFC",
                                    borderColor: isSelected ? "#4338CA" : "#94A3B8",
                                  },
                                }}
                              >
                                {o.text === "Yes" ? "👍 Yes" : o.text === "No" ? "👎 No" : o.text}
                              </Button>
                            );
                          })}
                        </Stack>
                      )}

                      {fType === "matrix" && (
                        <Box sx={{ overflowX: "auto", mt: 0.5 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                            <thead>
                              <tr>
                                <th style={{ padding: "10px", textAlign: "left", color: "#64748B", fontWeight: 700, borderBottom: "2px solid #E2E8F0" }}>Rows \ Columns</th>
                                {["Col 1", "Col 2", "Col 3"].map((col) => (
                                  <th key={col} style={{ padding: "10px", textAlign: "center", color: "#64748B", fontWeight: 700, borderBottom: "2px solid #E2E8F0" }}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {normOptions.map((rowOpt) => {
                                const matrixAns = typeof answers[field.id] === "object" && answers[field.id] !== null ? answers[field.id] : {};
                                return (
                                  <tr key={rowOpt.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                    <td style={{ padding: "10px", fontWeight: 600, color: "#1E293B" }}>{rowOpt.text}</td>
                                    {["Col 1", "Col 2", "Col 3"].map((col) => (
                                      <td key={col} style={{ padding: "10px", textAlign: "center" }}>
                                        <Radio
                                          size="small"
                                          checked={matrixAns[rowOpt.text] === col}
                                          disabled={isReadOnly}
                                          onChange={() => {
                                            const updatedMatrix = { ...matrixAns, [rowOpt.text]: col };
                                            handleInputChange(field.id, updatedMatrix);
                                          }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </Box>
                      )}

                      {fType === "checkbox" && (
                        <Stack spacing={0.5}>
                          {normOptions.map((o) => {
                            const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                            const checked = currentArr.includes(o.text);
                            const atLimit = field.max_selections && currentArr.length >= field.max_selections && !checked;

                            return (
                              <FormControlLabel
                                key={o.id}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={checked}
                                    disabled={isReadOnly || atLimit}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleInputChange(field.id, [...currentArr, o.text]);
                                      } else {
                                        handleInputChange(field.id, currentArr.filter((val) => val !== o.text));
                                      }
                                    }}
                                  />
                                }
                                label={o.text}
                              />
                            );
                          })}
                          {field.allow_other && (
                            <>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={Array.isArray(answers[field.id]) && answers[field.id].includes("__other__")}
                                    disabled={isReadOnly}
                                    onChange={(e) => {
                                      const currentArr = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                                      if (e.target.checked) {
                                        handleInputChange(field.id, [...currentArr, "__other__"]);
                                      } else {
                                        handleInputChange(field.id, currentArr.filter((v) => v !== "__other__"));
                                        setOtherValues((prev) => ({ ...prev, [field.id]: "" }));
                                      }
                                    }}
                                  />
                                }
                                label="Other"
                              />
                              {Array.isArray(answers[field.id]) && answers[field.id].includes("__other__") && (
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Please specify..."
                                  value={otherValues[field.id] || ""}
                                  onChange={(e) => setOtherValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                  sx={{ ml: 4 }}
                                />
                              )}
                            </>
                          )}
                          {field.max_selections && (
                            <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.7rem", mt: 0.5 }}>
                              Select up to {field.max_selections} option{field.max_selections > 1 ? "s" : ""}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Box>

                  {/* Help text below the input */}
                  {field.help_text && (
                    <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 1, fontSize: "0.75rem" }}>
                      {field.help_text}
                    </Typography>
                  )}

                  {/* Validation Error Message */}
                  {hasError && (
                    <FormHelperText error sx={{ mt: 1, fontWeight: 600 }}>
                      {errorMsg}
                    </FormHelperText>
                  )}
                </Paper>
              );
            });
          })()}

          {/* Submit Action Controls */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: themeConfig.cardColor || "#FFFFFF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ color: themeConfig.textColor || "#64748B", opacity: 0.75, maxWidth: 300 }}>
              Never submit passwords or sensitive credentials through public forms.
            </Typography>

            <Box display="flex" alignItems="center" gap={1.5}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<BookmarkBorderRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenSaveModal}
                disabled={savingProgress}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  borderColor: "#CBD5E1",
                  color: "#475569",
                  "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
                }}
              >
                {savingProgress ? "Saving..." : "Save & Resume Later"}
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: themeConfig.buttonColor || "#0F172A",
                  "&:hover": { bgcolor: themeConfig.buttonColor || "#0F172A", opacity: 0.9 },
                  color: themeConfig.preset === "dark" ? "#0F172A" : "#FFFFFF",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
                }}
              >
                {submitting ? "Submitting..." : "Submit Response"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Save & Continue Later Modal */}
      <SaveAndContinueModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        resumeUrl={resumeUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/public/forms/${publicLink}?resume=${resumeToken}`}
        savedAt={lastSavedTime}
        onSendEmail={handleSendResumeEmail}
        sendingEmail={sendingEmail}
        formTitle={form?.title}
      />

      {/* Instant Multi-Field Scan-to-Fill Modal */}
      <ScanToFillModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        publicLink={publicLink}
        onConfirmApply={handleScanApply}
      />

      {/* Respondent OTP Verification Modal */}
      <PublicVerificationModal
        open={verifModalOpen}
        onClose={() => setVerifModalOpen(false)}
        publicLink={publicLink}
        targetType={verifModalType}
        initialDestination={verifInitialDest}
        cooldownSeconds={form?.otp_cooldown_seconds || 60}
        maxAttempts={form?.max_otp_attempts || 5}
        onVerified={handleVerificationSuccess}
      />
    </Box>
  );
}
