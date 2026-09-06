import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  IconButton,
  CircularProgress,
  Divider,
  Alert,
  Select,
  Radio,
  RadioGroup,
  Checkbox as MuiCheckbox,
  Chip,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Slider,
  Grid,
  Menu,
  AlertTitle,
} from "@mui/material";
import toast from "react-hot-toast";

// Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import EmailShareModal from "../../components/forms/EmailShareModal";
import QrCodeModal from "../../components/forms/QrCodeModal";
import FormScheduleModal from "../../components/forms/FormScheduleModal";
import ResponseLimitModal from "../../components/forms/ResponseLimitModal";
import FormCollaboratorsModal from "../../components/forms/FormCollaboratorsModal";
import FormPasswordModal from "../../components/forms/FormPasswordModal";
import FormVerificationModal from "../../components/forms/FormVerificationModal";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import FileCopyRoundedIcon from "@mui/icons-material/FileCopyRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { evaluateAllFormulas, formatFormulaValue } from "../../utils/formulaEngine";

// Canvas-specific icons
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import TabRoundedIcon from "@mui/icons-material/TabRounded";
import PhotoCameraBackRoundedIcon from "@mui/icons-material/PhotoCameraBackRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";

import QuestionToolbox from "../../components/formBuilder/QuestionToolbox";
import QuestionProperties from "../../components/formBuilder/QuestionProperties";
import ThemeCustomizer from "../../components/formBuilder/ThemeCustomizer";
import AIFormDoctorDrawer from "../../components/formBuilder/AIFormDoctorDrawer";
import AIFormSimulatorModal from "../../components/formBuilder/AIFormSimulatorModal";
import { parseFormTheme, DEFAULT_FORM_THEME } from "../../utils/themePresets";
import api from "../../api/api";

const FORM_CATEGORIES = [
  "General",
  "Customer Feedback",
  "Survey",
  "Registration",
  "Contact Form",
  "Order / Purchase",
  "Job Application",
  "HR / Internal",
  "Event RSVP",
];

const getParsedOptions = (f) => {
  if (!f || !f.options) return [];
  if (Array.isArray(f.options)) {
    return f.options
      .map((o, idx) => {
        if (typeof o === "object" && o !== null) {
          return { id: o.id || idx, text: o.option_text || o.label || o.value || "" };
        }
        return { id: idx, text: String(o) };
      })
      .filter((o) => Boolean(o.text));
  }
  if (typeof f.options === "string") {
    return f.options
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean)
      .map((text, idx) => ({ id: idx, text }));
  }
  return [];
};

const HUMAN_OPERATOR_MAP = {
  "==": "equals",
  "!=": "does not equal",
  ">": "is greater than",
  ">=": "is greater than or equal to",
  "<": "is less than",
  "<=": "is less than or equal to",
  "contains": "contains",
  "not_contains": "does not contain",
  "starts_with": "starts with",
  "ends_with": "ends with",
  "is_empty": "is empty",
  "is_not_empty": "is not empty",
  "is_yes": "is Yes",
  "is_no": "is No",
  "includes": "includes",
  "not_includes": "does not include",
  "before": "is before",
  "after": "is after",
  "on_or_before": "is on or before",
  "on_or_after": "is on or after",
};

const HUMAN_ACTION_MAP = {
  "show": "Show",
  "hide": "Hide",
  "make_required": "Make Required",
  "make_optional": "Make Optional",
  "require": "Make Required",
  "optional": "Make Optional",
  "skip_to_question": "Skip to Question",
  "skip_to_section": "Skip to Section",
  "skip_to_page": "Skip to Page",
  "end_form": "End Form & Submit Early",
  "continue": "Continue Normally",
};

export default function CreateForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const formId = searchParams.get("id");

  const [activeTab, setActiveTab] = useState(0); // 0 = Canvas Builder, 1 = Logic Rules, 2 = Share
  const [loading, setLoading] = useState(true);

  // Data states
  const [form, setForm] = useState(null);
  const isViewer = form?.user_role === "viewer";
  const [version, setVersion] = useState(null);
  const [fields, setFields] = useState([]);
  const [rules, setRules] = useState([]);
  const [themeConfig, setThemeConfig] = useState(DEFAULT_FORM_THEME);

  // Editor states
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [newOptionText, setNewOptionText] = useState("");
  const [dragFieldId, setDragFieldId] = useState(null);

  // Nested condition rule tree & multi-target actions states
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [groupCombinator, setGroupCombinator] = useState("OR");
  const [targetActionsList, setTargetActionsList] = useState([
    { target_field_id: "", action: "show" },
  ]);
  const [savingRule, setSavingRule] = useState(false);

  const [groupsList, setGroupsList] = useState([
    {
      id: "g_1",
      combinator: "AND",
      conditions: [{ trigger_field_id: "", operator: "==", comparison_value: "" }],
    },
  ]);

  // Create Form Dialog State
  const [openCreate, setOpenCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Preview Modal State
  const [openPreview, setOpenPreview] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState("Saved to Cloud");
  const [titleError, setTitleError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Live Logic Simulator State
  const [openTestLogic, setOpenTestLogic] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});

  // Form Actions Menu & Dialog States
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openResetConfirm, setOpenResetConfirm] = useState(false);
  const [openVerificationModal, setOpenVerificationModal] = useState(false);
  const [openEmailShare, setOpenEmailShare] = useState(false);
  const [openQrCode, setOpenQrCode] = useState(false);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openResponseLimit, setOpenResponseLimit] = useState(false);
  const [openCollaborators, setOpenCollaborators] = useState(false);
  const [openPasswordProtect, setOpenPasswordProtect] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [openDoctorDrawer, setOpenDoctorDrawer] = useState(false);
  const [openSimulatorModal, setOpenSimulatorModal] = useState(false);
  const [deletingForm, setDeletingForm] = useState(false);
  const [duplicatingForm, setDuplicatingForm] = useState(false);

  // AI Form Doctor Fix Action Handler
  const handleApplyDoctorFix = async (fixAction) => {
    if (!fixAction) return;

    if (fixAction.type === "update_field" && fixAction.field_id && fixAction.updates) {
      const targetFieldId = fixAction.field_id;
      const updates = fixAction.updates;

      setFields((prevFields) =>
        prevFields.map((f) => {
          if (Number(f.id) === Number(targetFieldId)) {
            return { ...f, ...updates };
          }
          return f;
        })
      );

      // Sync field update with backend if persistent field ID
      try {
        await api.put(`/fields/${targetFieldId}`, updates);
      } catch (err) {
        console.warn("Local fix applied, backend sync warning:", err);
      }
    }
  };

  const handleFormMetaChange = async (key, val) => {
    if (!form) return;

    if (key === "title") {
      if (!val || !val.trim()) {
        setTitleError("Form title is required");
      } else {
        setTitleError("");
      }
    }

    const updatedForm = { ...form, [key]: val };
    setForm(updatedForm);

    if (key === "title" && (!val || !val.trim())) {
      return;
    }

    setAutoSaveStatus("Saving...");
    try {
      const res = await api.put(`/forms/${form.id}`, {
        title: updatedForm.title,
        description: updatedForm.description || "",
        category: updatedForm.category || "General",
        status: updatedForm.status || "draft",
      });
      if (res.data) {
        setForm(res.data);
      }
      setAutoSaveStatus("Saved to Cloud");
    } catch (err) {
      console.error(err);
      setAutoSaveStatus("Error Saving");
    }
  };

  const creatingDraftRef = useRef(false);

  // Load Form Metadata
  const loadFormData = useCallback(async () => {
    if (!formId) {
      if (creatingDraftRef.current) return;
      creatingDraftRef.current = true;

      try {
        setLoading(true);
        // Check if an empty unedited "Untitled Form" draft already exists to avoid duplicate empty drafts
        const existingFormsRes = await api.get("/forms/");
        const existingDraft = (existingFormsRes.data || []).find(
          (f) =>
            f.title === "Untitled Form" &&
            f.status === "draft" &&
            (f.fields_count || 0) === 0
        );

        if (existingDraft) {
          creatingDraftRef.current = false;
          navigate(`/create-form?id=${existingDraft.id}`, { replace: true });
          return;
        }

        const formRes = await api.post("/forms/", {
          title: "Untitled Form",
          description: "",
        });
        const newForm = formRes.data;

        creatingDraftRef.current = false;
        navigate(`/create-form?id=${newForm.id}`, { replace: true });
      } catch (err) {
        creatingDraftRef.current = false;
        console.error("Failed to auto-create form:", err);
        toast.error("Failed to initialize form");
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);

      const formRes = await api.get(`/forms/${formId}`);
      setForm(formRes.data);
      if (formRes.data?.theme_config) {
        setThemeConfig(parseFormTheme(formRes.data.theme_config));
      }

      let versionsRes = await api.get(`/form-versions/form/${formId}`);
      let versions = versionsRes.data || [];
      if (versions.length === 0) {
        const newVerRes = await api.post("/form-versions/", {
          form_id: Number(formId),
          version_number: 1,
        });
        versions = [newVerRes.data];
      }
      const latestVersion = versions.sort((a, b) => b.version_number - a.version_number)[0];
      setVersion(latestVersion);

      const fieldsRes = await api.get(`/fields/form-version/${latestVersion.id}`);
      const fetchedFields = fieldsRes.data || [];

      // Load field choice options
      const fieldsWithOptions = await Promise.all(
        fetchedFields.map(async (f) => {
          try {
            const optionsRes = await api.get(`/field-options/field/${f.id}`);
            return { ...f, options: optionsRes.data || [] };
          } catch {
            return { ...f, options: [] };
          }
        })
      );

      const sortedFields = fieldsWithOptions.sort((a, b) => a.field_order - b.field_order);
      setFields(sortedFields);

      // Select first field if none selected
      if (sortedFields.length > 0 && !selectedFieldId) {
        setSelectedFieldId(sortedFields[0].id);
      }

      const rulesRes = await api.get(`/conditional-rules/form-version/${latestVersion.id}`);
      setRules(rulesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load builder data");
    } finally {
      setLoading(false);
    }
  }, [formId, navigate, selectedFieldId]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  // Selected Field reference helper
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Inline label map — keeps handleAddField self-contained (no FIELD_TYPES import needed)
  const FIELD_LABEL_MAP = {
    text: "Short Text", textarea: "Long Text", email: "Email", phone: "Phone",
    number: "Number", date: "Date", time: "Time", url: "URL", password: "Password",
    select: "Dropdown", radio: "Radio Button", checkbox: "Checkbox", yes_no: "Yes / No",
    matrix: "Matrix / Grid", rating: "Rating", linear_scale: "Linear Scale",
    file_upload: "File Upload", image_upload: "Image Upload", signature: "Signature",
    heading: "Heading", description: "Description", section_divider: "Section Divider",
    image: "Image Block", video: "Video Block", page_break: "Page Break",
    lookup: "API Lookup", formula: "Formula / Math",
  };

  // Add field helper
  const handleAddField = async (type = "text") => {
    try {
      const label = FIELD_LABEL_MAP[type] || "Question";
      const res = await api.post("/fields/", {
        form_version_id: version.id,
        label: `New ${label} Question`,
        field_type: type,
        placeholder: "",
        is_required: false,
        field_order: fields.length + 1,
      });

      // If choice field, create 2 default options with option_order
      if (["select", "dropdown", "checkbox", "radio", "matrix", "yes_no"].includes(type)) {
        const defaultOpts = type === "yes_no"
          ? ["Yes", "No"]
          : ["Option 1", "Option 2"];
        for (let i = 0; i < defaultOpts.length; i++) {
          await api.post("/field-options/", {
            field_id: res.data.id,
            option_text: defaultOpts[i],
            option_order: i,
          });
        }
      }

      toast.success(`${label} added`);
      setSelectedFieldId(res.data.id);
      loadFormData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add question");
    }
  };

  // Persist field order for an array of fields
  const persistFieldOrder = async (orderedFields) => {
    for (let i = 0; i < orderedFields.length; i++) {
      try {
        await api.put(`/fields/${orderedFields[i].id}`, {
          label: orderedFields[i].label,
          field_type: orderedFields[i].field_type,
          placeholder: orderedFields[i].placeholder || "",
          is_required: orderedFields[i].is_required,
          field_order: i + 1,
          help_text: orderedFields[i].help_text || null,
          description: orderedFields[i].description || null,
          is_read_only: orderedFields[i].is_read_only || false,
          is_hidden: orderedFields[i].is_hidden || false,
          default_value: orderedFields[i].default_value || null,
          width: orderedFields[i].width || "full",
          label_position: orderedFields[i].label_position || "top",
          show_placeholder: orderedFields[i].show_placeholder !== false,
          min_length: orderedFields[i].min_length ?? null,
          max_length: orderedFields[i].max_length ?? null,
          regex_pattern: orderedFields[i].regex_pattern || null,
          validation_message: orderedFields[i].validation_message || null,
          shuffle_options: orderedFields[i].shuffle_options || false,
          allow_other: orderedFields[i].allow_other || false,
          allow_multiple: orderedFields[i].allow_multiple || false,
          max_selections: orderedFields[i].max_selections ?? null,
          allowed_file_types: orderedFields[i].allowed_file_types || null,
          max_file_size_mb: orderedFields[i].max_file_size_mb ?? null,
          max_files: orderedFields[i].max_files ?? 1,
          formula_expression: orderedFields[i].formula_expression || null,
          decimal_places: orderedFields[i].decimal_places ?? 2,
          number_prefix: orderedFields[i].number_prefix || null,
          number_suffix: orderedFields[i].number_suffix || null,
          lookup_config: orderedFields[i].lookup_config || null,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Reorder question helper (Up/Down)
  const handleReorderField = async (fieldId, direction) => {
    const idx = fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    const newFields = [...fields];
    const temp = newFields[idx];
    newFields[idx] = newFields[targetIdx];
    newFields[targetIdx] = temp;

    setFields(newFields);
    await persistFieldOrder(newFields);
    toast.success("Question order updated");
  };

  // Drag & Drop question reorder handlers
  const handleDragFieldStart = (e, fieldId) => {
    setDragFieldId(fieldId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragFieldId", String(fieldId));
  };

  const handleDragFieldOver = (e, targetFieldId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropField = async (e, targetFieldId) => {
    e.preventDefault();
    const sourceId = dragFieldId;
    setDragFieldId(null);
    if (!sourceId || sourceId === targetFieldId) return;

    const sourceIdx = fields.findIndex((f) => f.id === sourceId);
    const targetIdx = fields.findIndex((f) => f.id === targetFieldId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newFields = [...fields];
    const [moved] = newFields.splice(sourceIdx, 1);
    newFields.splice(targetIdx, 0, moved);

    setFields(newFields);
    await persistFieldOrder(newFields);
    toast.success("Question order updated");
  };

  // Duplicate question helper — copies all config fields
  const handleDuplicateField = async (targetField) => {
    try {
      const res = await api.post("/fields/", {
        form_version_id: version.id,
        label: `${targetField.label} (Copy)`,
        field_type: targetField.field_type,
        placeholder: targetField.placeholder || "",
        is_required: targetField.is_required,
        field_order: fields.length + 1,
        // Copy all config fields
        help_text: targetField.help_text || null,
        description: targetField.description || null,
        is_read_only: targetField.is_read_only || false,
        is_hidden: targetField.is_hidden || false,
        default_value: targetField.default_value || null,
        width: targetField.width || "full",
        label_position: targetField.label_position || "top",
        show_placeholder: targetField.show_placeholder !== false,
        min_length: targetField.min_length ?? null,
        max_length: targetField.max_length ?? null,
        regex_pattern: targetField.regex_pattern || null,
        validation_message: targetField.validation_message || null,
        shuffle_options: targetField.shuffle_options || false,
        allow_other: targetField.allow_other || false,
        allow_multiple: targetField.allow_multiple || false,
        max_selections: targetField.max_selections ?? null,
        allowed_file_types: targetField.allowed_file_types || null,
        max_file_size_mb: targetField.max_file_size_mb ?? null,
        max_files: targetField.max_files ?? 1,
      });

      if (targetField.options && targetField.options.length > 0) {
        for (let i = 0; i < targetField.options.length; i++) {
          await api.post("/field-options/", {
            field_id: res.data.id,
            option_text: targetField.options[i].option_text,
            option_order: i,
          });
        }
      }

      toast.success("Question duplicated");
      loadFormData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate question");
    }
  };

  // Update Field helper — persists every config column
  const handleFieldChange = async (key, val) => {
    if (!selectedField) return;

    // Optimistic update in UI
    const updated = { ...selectedField, [key]: val };
    setFields((prev) =>
      prev.map((f) => (f.id === selectedField.id ? updated : f))
    );

    try {
      await api.put(`/fields/${selectedField.id}`, {
        label: updated.label,
        field_type: updated.field_type,
        placeholder: updated.placeholder || "",
        is_required: updated.is_required,
        field_order: updated.field_order,
        // General
        help_text: updated.help_text || null,
        description: updated.description || null,
        is_read_only: updated.is_read_only || false,
        is_hidden: updated.is_hidden || false,
        default_value: updated.default_value || null,
        // Display
        width: updated.width || "full",
        label_position: updated.label_position || "top",
        show_placeholder: updated.show_placeholder !== false,
        // Validation
        min_length: updated.min_length ?? null,
        max_length: updated.max_length ?? null,
        regex_pattern: updated.regex_pattern || null,
        validation_message: updated.validation_message || null,
        // Choice
        shuffle_options: updated.shuffle_options || false,
        allow_other: updated.allow_other || false,
        allow_multiple: updated.allow_multiple || false,
        max_selections: updated.max_selections ?? null,
        // File upload
        allowed_file_types: updated.allowed_file_types || null,
        max_file_size_mb: updated.max_file_size_mb ?? null,
        max_files: updated.max_files ?? 1,
        formula_expression: updated.formula_expression || null,
        decimal_places: updated.decimal_places ?? 2,
        number_prefix: updated.number_prefix || null,
        number_suffix: updated.number_suffix || null,
        lookup_config: updated.lookup_config || null,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update field");
    }
  };

  // Delete Field helper
  const handleDeleteField = async (fieldId) => {
    try {
      await api.delete(`/fields/${fieldId}`);
      toast.success("Field deleted");
      if (selectedFieldId === fieldId) setSelectedFieldId(null);
      loadFormData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete field");
    }
  };

  // Add Option to Field Choice list
  const handleAddOption = async () => {
    if (!selectedField || !newOptionText.trim()) return;

    const textToAdd = newOptionText.trim();
    setNewOptionText("");

    try {
      const currentOptions = selectedField.options || [];
      const res = await api.post("/field-options/", {
        field_id: selectedField.id,
        option_text: textToAdd,
        option_order: currentOptions.length,
      });

      const newOpt = res.data || {
        id: Date.now(),
        field_id: selectedField.id,
        option_text: textToAdd,
        option_order: currentOptions.length,
      };

      setFields((prev) =>
        prev.map((f) =>
          f.id === selectedField.id
            ? { ...f, options: [...(f.options || []), newOpt] }
            : f
        )
      );
      toast.success("Option added", { id: "opt-add-succ" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add option");
    }
  };

  // Edit option text inline
  const handleEditOption = (optionId, newText) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedField?.id
          ? {
              ...f,
              options: (f.options || []).map((o) =>
                o.id === optionId ? { ...o, option_text: newText } : o
              ),
            }
          : f
      )
    );

    api.put(`/field-options/${optionId}`, { option_text: newText }).catch((err) => {
      console.error("Failed to update option on server:", err);
    });
  };

  // Reorder option up/down
  const handleMoveOption = async (optionId, direction) => {
    if (!selectedField) return;
    const opts = [...(selectedField.options || [])];
    const idx = opts.findIndex((o) => o.id === optionId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= opts.length) return;

    // Swap
    [opts[idx], opts[targetIdx]] = [opts[targetIdx], opts[idx]];

    // Optimistic update
    setFields((prev) =>
      prev.map((f) => (f.id === selectedField.id ? { ...f, options: opts } : f))
    );

    // Persist new order
    try {
      await Promise.all(
        opts.map((o, i) =>
          api.put(`/field-options/${o.id}`, {
            option_text: o.option_text,
            option_order: i,
          })
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop option reorder
  const handleDragOption = async (sourceIdx, targetIdx) => {
    if (!selectedField) return;
    const opts = [...(selectedField.options || [])];
    if (sourceIdx < 0 || sourceIdx >= opts.length || targetIdx < 0 || targetIdx >= opts.length) return;

    const [moved] = opts.splice(sourceIdx, 1);
    opts.splice(targetIdx, 0, moved);

    // Optimistic update
    setFields((prev) =>
      prev.map((f) => (f.id === selectedField.id ? { ...f, options: opts } : f))
    );

    // Persist new order
    try {
      await Promise.all(
        opts.map((o, i) =>
          api.put(`/field-options/${o.id}`, {
            option_text: o.option_text,
            option_order: i,
          })
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Option from Field Choice list
  const handleDeleteOption = async (optionId) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === selectedField?.id
          ? {
              ...f,
              options: (f.options || []).filter((o) => o.id !== optionId),
            }
          : f
      )
    );

    try {
      await api.delete(`/field-options/${optionId}`);
      toast.success("Option removed", { id: "opt-del-succ" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove option");
    }
  };

  // Helper functions for Multi-Target Question Actions
  const handleAddTargetAction = () => {
    setTargetActionsList((prev) => [
      ...prev,
      { target_field_id: "", action: "show" },
    ]);
  };

  const handleRemoveTargetAction = (index) => {
    if (targetActionsList.length <= 1) {
      toast.error("Rule must contain at least one target question");
      return;
    }
    setTargetActionsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateTargetAction = (index, key, val) => {
    setTargetActionsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  // Helper functions for nested Condition Groups Tree
  const handleAddGroup = () => {
    setGroupsList((prev) => [
      ...prev,
      {
        id: `g_${Date.now()}`,
        combinator: "AND",
        conditions: [{ trigger_field_id: "", operator: "==", comparison_value: "" }],
      },
    ]);
  };

  const handleRemoveGroup = (groupIdx) => {
    if (groupsList.length <= 1) {
      toast.error("Rule must contain at least one condition group");
      return;
    }
    setGroupsList((prev) => prev.filter((_, idx) => idx !== groupIdx));
  };

  const handleAddConditionToGroup = (groupIdx) => {
    setGroupsList((prev) => {
      const updated = [...prev];
      updated[groupIdx] = {
        ...updated[groupIdx],
        conditions: [
          ...updated[groupIdx].conditions,
          { trigger_field_id: "", operator: "==", comparison_value: "" },
        ],
      };
      return updated;
    });
  };

  const handleRemoveConditionFromGroup = (groupIdx, condIdx) => {
    if (groupsList[groupIdx].conditions.length <= 1) {
      toast.error("Each group must contain at least one condition");
      return;
    }
    setGroupsList((prev) => {
      const updated = [...prev];
      const newConds = updated[groupIdx].conditions.filter((_, idx) => idx !== condIdx);
      updated[groupIdx] = { ...updated[groupIdx], conditions: newConds };
      return updated;
    });
  };

  const handleUpdateConditionInGroup = (groupIdx, condIdx, key, val) => {
    setGroupsList((prev) => {
      const updated = [...prev];
      const newConds = [...updated[groupIdx].conditions];
      newConds[condIdx] = { ...newConds[condIdx], [key]: val };
      updated[groupIdx] = { ...updated[groupIdx], conditions: newConds };
      return updated;
    });
  };

  const handleToggleGroupCombinator = (groupIdx, newComb) => {
    setGroupsList((prev) => {
      const updated = [...prev];
      updated[groupIdx] = { ...updated[groupIdx], combinator: newComb };
      return updated;
    });
  };

  // Edit existing rule
  const handleEditRule = (r) => {
    setEditingRuleId(r.id);
    setGroupCombinator(r.logic_operator || "OR");

    let treeData = null;
    if (r.conditions_json) {
      try {
        const parsed = JSON.parse(r.conditions_json);
        if (parsed && Array.isArray(parsed.groups)) {
          treeData = parsed;
        } else if (Array.isArray(parsed)) {
          treeData = {
            group_combinator: r.logic_operator || "AND",
            groups: [
              {
                id: "g_1",
                combinator: r.logic_operator || "AND",
                conditions: parsed,
              },
            ],
          };
        }
      } catch {
        treeData = null;
      }
    }

    if (!treeData) {
      treeData = {
        target_actions: [{ target_field_id: String(r.target_field_id || ""), action: r.action || "show" }],
        group_combinator: r.logic_operator || "OR",
        groups: [
          {
            id: "g_1",
            combinator: "AND",
            conditions: [
              {
                trigger_field_id: String(r.trigger_field_id || ""),
                operator: r.operator || "==",
                comparison_value: r.comparison_value || "",
              },
            ],
          },
        ],
      };
    }

    const loadedTargets =
      treeData.target_actions && treeData.target_actions.length > 0
        ? treeData.target_actions.map((t) => ({ target_field_id: String(t.target_field_id), action: t.action || "show" }))
        : [{ target_field_id: String(r.target_field_id || ""), action: r.action || "show" }];

    setTargetActionsList(loadedTargets);
    setGroupCombinator(treeData.group_combinator || "OR");
    setGroupsList(
      treeData.groups && treeData.groups.length > 0
        ? treeData.groups
        : [{ id: "g_1", combinator: "AND", conditions: [{ trigger_field_id: "", operator: "==", comparison_value: "" }] }]
    );
  };

  const handleCancelEditRule = () => {
    setEditingRuleId(null);
    setGroupCombinator("OR");
    setTargetActionsList([{ target_field_id: "", action: "show" }]);
    setGroupsList([
      { id: "g_1", combinator: "AND", conditions: [{ trigger_field_id: "", operator: "==", comparison_value: "" }] },
    ]);
  };

  // Rule Conflict Detector
  const detectRuleConflicts = (rulesList, fieldsList) => {
    const targetMap = new Map();
    for (const r of rulesList) {
      let targetActions = [];
      if (r.conditions_json) {
        try {
          const parsed = JSON.parse(r.conditions_json);
          if (parsed && Array.isArray(parsed.target_actions)) {
            targetActions = parsed.target_actions;
          }
        } catch {
          targetActions = [];
        }
      }
      if (!targetActions || targetActions.length === 0) {
        if (r.target_field_id) {
          targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
        }
      }

      for (const tAct of targetActions) {
        if (tAct.target_field_id) {
          const tid = Number(tAct.target_field_id);
          if (!targetMap.has(tid)) targetMap.set(tid, []);
          targetMap.get(tid).push({ rule: r, action: tAct.action });
        }
      }
    }

    const conflicts = [];
    targetMap.forEach((ruleEntries, tid) => {
      if (ruleEntries.length > 1) {
        const actionsSet = new Set(ruleEntries.map((e) => e.action));
        if (actionsSet.size > 1) {
          const targetField = fieldsList.find((f) => Number(f.id) === tid);
          conflicts.push({
            targetFieldId: tid,
            targetLabel: targetField?.label || `Field #${tid}`,
            entries: ruleEntries,
          });
        }
      }
    });

    return conflicts;
  };

  // Rule Priority Reordering (Up / Down)
  const handleReorderRule = async (ruleId, direction) => {
    const currentIndex = rules.findIndex((r) => r.id === ruleId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const newRules = [...rules];
    const temp = newRules[currentIndex];
    newRules[currentIndex] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    setRules(newRules);

    try {
      await Promise.all(
        newRules.map((r, idx) =>
          api.put(`/conditional-rules/${r.id}`, { rule_order: idx + 1 })
        )
      );
      toast.success("Rule priority reordered!");
      loadFormData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to persist rule reordering");
    }
  };

  // Rule Integrity Validation Helper
  const getRuleValidationIssue = (r, fieldsList) => {
    const fieldIds = new Set(fieldsList.map((f) => Number(f.id)));
    let tree = null;
    if (r.conditions_json) {
      try {
        tree = JSON.parse(r.conditions_json);
      } catch {
        tree = null;
      }
    }

    const targetActions =
      tree && Array.isArray(tree.target_actions) && tree.target_actions.length > 0
        ? tree.target_actions
        : [{ target_field_id: r.target_field_id, action: r.action || "show" }];

    const groups =
      tree && Array.isArray(tree.groups) && tree.groups.length > 0
        ? tree.groups
        : [
            {
              combinator: "AND",
              conditions: [{ trigger_field_id: r.trigger_field_id, operator: r.operator, comparison_value: r.comparison_value }],
            },
          ];

    for (const tAct of targetActions) {
      if (!tAct.target_field_id || !fieldIds.has(Number(tAct.target_field_id))) {
        return "⚠️ This rule references a target question that no longer exists.";
      }
    }

    for (const grp of groups) {
      for (const cond of grp.conditions || []) {
        if (!cond.trigger_field_id || !fieldIds.has(Number(cond.trigger_field_id))) {
          return "⚠️ This rule references a trigger question that no longer exists.";
        }
        for (const tAct of targetActions) {
          if (Number(cond.trigger_field_id) === Number(tAct.target_field_id)) {
            return "🚫 Self-dependency error: A question cannot depend on itself.";
          }
        }
      }
    }

    return null;
  };

  // Create or Update Logic Rule Tree with Multi-Target Actions & Validation Guards
  const handleSaveOrUpdateRule = async () => {
    const validTargets = targetActionsList.filter((t) => t.target_field_id);
    if (validTargets.length === 0) {
      toast.error("Please select at least one target question for the rule");
      return;
    }

    const cleanedGroups = groupsList
      .map((grp) => ({
        ...grp,
        conditions: grp.conditions.filter((c) => c.trigger_field_id),
      }))
      .filter((grp) => grp.conditions.length > 0);

    if (cleanedGroups.length === 0) {
      toast.error("Please select a trigger question for at least one condition");
      return;
    }

    const firstCond = cleanedGroups[0].conditions[0];
    const firstTarget = validTargets[0];
    const trigField = fields.find((f) => Number(f.id) === Number(firstCond.trigger_field_id));

    // 1. Guard against Self-Dependency (Question triggering itself)
    for (const grp of cleanedGroups) {
      for (const cond of grp.conditions) {
        for (const tAct of validTargets) {
          if (Number(cond.trigger_field_id) === Number(tAct.target_field_id)) {
            toast.error("Invalid self-dependency: A question cannot trigger logic on itself!");
            return;
          }
        }
      }
    }

    // 2. Guard against Incompatible Operators
    for (const grp of cleanedGroups) {
      for (const cond of grp.conditions) {
        const trigF = fields.find((f) => Number(f.id) === Number(cond.trigger_field_id));
        const allowedOps = getOperatorsForType(trigF?.field_type).map((o) => o.value);
        if (allowedOps.length > 0 && !allowedOps.includes(cond.operator)) {
          toast.error(`Incompatible operator '${cond.operator}' for question type '${trigF?.field_type || "unknown"}'!`);
          return;
        }
      }
    }

    // 3. Guard against Circular Branching (Q1 -> Q3 -> Q1)
    for (const tAct of validTargets) {
      if (["skip_to_question", "skip_to_section", "skip_to_page"].includes(tAct.action)) {
        const destField = fields.find((f) => Number(f.id) === Number(tAct.target_field_id));
        if (trigField && destField && destField.field_order <= trigField.field_order) {
          toast.error("Invalid branching loop: Destination question must come AFTER the trigger question in sequence!");
          return;
        }
      }
    }

    const structuredTree = {
      target_actions: validTargets,
      group_combinator: groupCombinator,
      groups: cleanedGroups,
    };

    const payload = {
      form_version_id: version.id,
      trigger_field_id: Number(firstCond.trigger_field_id),
      operator: firstCond.operator || "==",
      comparison_value: firstCond.comparison_value || "",
      target_field_id: Number(firstTarget.target_field_id),
      action: firstTarget.action || "show",
      logic_operator: groupCombinator,
      conditions_json: JSON.stringify(structuredTree),
    };

    try {
      setSavingRule(true);
      if (editingRuleId) {
        await api.put(`/conditional-rules/${editingRuleId}`, payload);
        toast.success("Conditional logic rule updated!");
      } else {
        await api.post("/conditional-rules/", payload);
        toast.success("Conditional logic rule saved!");
      }

      handleCancelEditRule();
      loadFormData();
    } catch (err) {
      console.error(err);
      toast.error(editingRuleId ? "Failed to update rule" : "Failed to save rule");
    } finally {
      setSavingRule(false);
    }
  };

  // Delete Conditional Rule
  const handleDeleteRule = async (ruleId) => {
    try {
      await api.delete(`/conditional-rules/${ruleId}`);
      toast.success("Rule deleted");
      loadFormData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete rule");
    }
  };

  // Publish Form Schema Version to Database
  const handlePublishVersion = async () => {
    if (!version || !form || publishing) return;

    // 1. Validate Form Title
    if (!form.title || !form.title.trim()) {
      setTitleError("Form title is required before publishing");
      toast.error("Validation Failed: Form title is required before publishing", { id: "pub-title-err" });
      return;
    }

    // 2. Validate Questions Exist
    if (fields.length === 0) {
      toast.error("Validation Failed: Form must contain at least one question before publishing", { id: "pub-fields-err" });
      return;
    }

    // 3. Validate Question Labels & Configurations
    const choiceTypes = ["select", "dropdown", "radio", "checkbox", "yes_no", "matrix"];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label || !f.label.trim()) {
        toast.error(`Validation Failed: Question ${i + 1} is missing a title/label`, { id: "pub-q-err" });
        return;
      }
      if (choiceTypes.includes(f.field_type) && (!f.options || f.options.length === 0)) {
        toast.error(`Validation Failed: Choice question "${f.label}" must have at least one option before publishing`, { id: "pub-opt-err" });
        return;
      }
    }

    // 4. Validate Conditional Logic Rules
    const validFieldIds = new Set(fields.map((f) => f.id));
    for (const r of rules) {
      if (!validFieldIds.has(r.trigger_field_id) || !validFieldIds.has(r.target_field_id)) {
        toast.error("Validation Failed: A conditional logic rule contains a broken reference to a deleted question. Please update rules in the Logic Rules tab.", { id: "pub-rule-err" });
        return;
      }
    }

    try {
      setPublishing(true);

      // Save latest questions & order before publishing
      if (fields.length > 0) {
        await persistFieldOrder(fields);
      }

      // Execute publish call to backend (sets is_published=True, published_at, public_link)
      await api.post(`/publish/${version.id}`);

      // Update parent form status in DB
      await api.put(`/forms/${form.id}`, {
        title: form.title.trim(),
        description: form.description || "",
        category: form.category || "General",
        status: "published",
      });

      toast.success("Form published live! Public form link is ready.", { id: "publish-success" });
      await loadFormData();
      setActiveTab(3); // Switch to Share tab to show public link
    } catch (err) {
      console.error("Publish error:", err);
      toast.error(err.response?.data?.detail || "Failed to publish form. Please review form settings.", { id: "publish-err" });
    } finally {
      setPublishing(false);
    }
  };

  // Get dynamic operators for a specific field type
  const getOperatorsForType = (fieldType) => {
    const type = fieldType || "text";
    if (["text", "textarea", "email", "phone", "url", "password"].includes(type)) {
      return [
        { label: "Equals (==)", value: "==" },
        { label: "Not Equals (!=)", value: "!=" },
        { label: "Contains", value: "contains" },
        { label: "Does Not Contain", value: "not_contains" },
        { label: "Starts With", value: "starts_with" },
        { label: "Ends With", value: "ends_with" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" },
      ];
    }
    if (type === "number") {
      return [
        { label: "Equals (==)", value: "==" },
        { label: "Not Equals (!=)", value: "!=" },
        { label: "Greater Than (>)", value: ">" },
        { label: "Greater Than or Equal (>=)", value: ">=" },
        { label: "Less Than (<)", value: "<" },
        { label: "Less Than or Equal (<=)", value: "<=" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" },
      ];
    }
    if (["date", "time"].includes(type)) {
      return [
        { label: "Equals (==)", value: "==" },
        { label: "Before (<)", value: "<" },
        { label: "After (>)", value: ">" },
        { label: "On or Before (<=)", value: "<=" },
        { label: "On or After (>=)", value: ">=" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" },
      ];
    }
    if (["select", "dropdown", "radio", "checkbox", "matrix"].includes(type)) {
      return [
        { label: "Is", value: "==" },
        { label: "Is Not", value: "!=" },
        { label: "Includes", value: "contains" },
        { label: "Does Not Include", value: "not_contains" },
        { label: "Is Empty", value: "is_empty" },
        { label: "Is Not Empty", value: "is_not_empty" },
      ];
    }
    if (type === "yes_no") {
      return [
        { label: "Is Yes", value: "is_yes" },
        { label: "Is No", value: "is_no" },
      ];
    }
    return [
      { label: "Equals (==)", value: "==" },
      { label: "Not Equals (!=)", value: "!=" },
      { label: "Greater Than (>)", value: ">" },
      { label: "Less Than (<)", value: "<" },
      { label: "Is Empty", value: "is_empty" },
      { label: "Is Not Empty", value: "is_not_empty" },
    ];
  };

  const OPERATOR_LABEL_MAP = {
    "==": "Equals / Is",
    "!=": "Not Equals / Is Not",
    "contains": "Contains / Includes",
    "not_contains": "Does Not Contain / Include",
    "starts_with": "Starts With",
    "ends_with": "Ends With",
    ">": "Greater Than / After",
    ">=": "Greater Than or Equal / On or After",
    "<": "Less Than / Before",
    "<=": "Less Than or Equal / On or Before",
    "is_empty": "Is Empty",
    "is_not_empty": "Is Not Empty",
    "is_yes": "Is Yes",
    "is_no": "Is No",
  };

  // Evaluate single condition item supporting all 25 question types
  const evaluateSingleCondition = (cond, answers) => {
    const triggerVal = answers[cond.trigger_field_id];
    const compVal = cond.comparison_value ?? "";
    const op = cond.operator ?? "==";

    // 1. Is Empty / Is Not Empty operators
    if (op === "is_empty") {
      if (triggerVal === undefined || triggerVal === null || triggerVal === "") return true;
      if (Array.isArray(triggerVal) && triggerVal.length === 0) return true;
      if (typeof triggerVal === "object" && Object.keys(triggerVal).length === 0) return true;
      return false;
    }
    if (op === "is_not_empty") {
      if (triggerVal === undefined || triggerVal === null || triggerVal === "") return false;
      if (Array.isArray(triggerVal) && triggerVal.length === 0) return false;
      if (typeof triggerVal === "object" && Object.keys(triggerVal).length === 0) return false;
      return true;
    }

    // 2. Yes / No boolean operators
    if (op === "is_yes") {
      if (typeof triggerVal === "boolean") return triggerVal === true;
      const s = String(triggerVal || "").toLowerCase().trim();
      return s === "yes" || s === "true" || s === "👍 yes" || s === "1";
    }
    if (op === "is_no") {
      if (typeof triggerVal === "boolean") return triggerVal === false;
      const s = String(triggerVal || "").toLowerCase().trim();
      return s === "no" || s === "false" || s === "👎 no" || s === "0";
    }

    // 3. Array Answers (Checkbox, Multi-Select)
    if (Array.isArray(triggerVal)) {
      const arr = triggerVal.map((v) => String(v).toLowerCase().trim());
      const targetStr = String(compVal).toLowerCase().trim();

      if (op === "contains" || op === "==") {
        return arr.includes(targetStr);
      }
      if (op === "not_contains" || op === "!=") {
        return !arr.includes(targetStr);
      }
    }

    // 4. Matrix Answers (Object dictionary of row-column choices)
    if (typeof triggerVal === "object" && triggerVal !== null && !Array.isArray(triggerVal)) {
      const matrixValues = Object.values(triggerVal).map((v) => String(v).toLowerCase().trim());
      const targetStr = String(compVal).toLowerCase().trim();

      if (op === "contains" || op === "==") {
        return matrixValues.includes(targetStr);
      }
      if (op === "not_contains" || op === "!=") {
        return !matrixValues.includes(targetStr);
      }
    }

    // 5. Numeric Answers (Rating, Linear Scale, Number, Slider)
    const numTrig = Number(triggerVal);
    const numComp = Number(compVal);
    const isNumComparison = !isNaN(numTrig) && !isNaN(numComp) && compVal !== "";

    if (op === ">") {
      return isNumComparison ? numTrig > numComp : String(triggerVal) > String(compVal);
    }
    if (op === ">=") {
      return isNumComparison ? numTrig >= numComp : String(triggerVal) >= String(compVal);
    }
    if (op === "<") {
      return isNumComparison ? numTrig < numComp : String(triggerVal) < String(compVal);
    }
    if (op === "<=") {
      return isNumComparison ? numTrig <= numComp : String(triggerVal) <= String(compVal);
    }

    // 6. Text Matching Operators (Equals, Not Equals, Contains, Starts With, Ends With)
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

  // Evaluate rule tree structure with nested groups and AND/OR combinator logic
  const evaluateRule = (r, answers) => {
    let treeData = null;
    if (r.conditions_json) {
      try {
        const parsed = JSON.parse(r.conditions_json);
        if (parsed && Array.isArray(parsed.groups)) {
          treeData = parsed;
        } else if (Array.isArray(parsed)) {
          treeData = {
            group_combinator: r.logic_operator || "AND",
            groups: [
              {
                id: "g_legacy",
                combinator: r.logic_operator || "AND",
                conditions: parsed,
              },
            ],
          };
        }
      } catch {
        treeData = null;
      }
    }

    if (!treeData) {
      if (r.trigger_field_id) {
        treeData = {
          group_combinator: "AND",
          groups: [
            {
              id: "g_legacy",
              combinator: "AND",
              conditions: [
                {
                  trigger_field_id: r.trigger_field_id,
                  operator: r.operator,
                  comparison_value: r.comparison_value,
                },
              ],
            },
          ],
        };
      }
    }

    if (!treeData || !treeData.groups || treeData.groups.length === 0) return true;

    const evaluateGroup = (grp) => {
      if (!grp.conditions || grp.conditions.length === 0) return true;
      const comb = (grp.combinator || "AND").toUpperCase();
      if (comb === "OR") {
        return grp.conditions.some((cond) => evaluateSingleCondition(cond, answers));
      } else {
        return grp.conditions.every((cond) => evaluateSingleCondition(cond, answers));
      }
    };

    const grpComb = (treeData.group_combinator || "OR").toUpperCase();
    if (grpComb === "OR") {
      return treeData.groups.some((grp) => evaluateGroup(grp));
    } else {
      return treeData.groups.every((grp) => evaluateGroup(grp));
    }
  };

  // Render readable summary string for nested condition trees
  const renderRuleSummaryText = (r) => {
    let treeData = null;
    if (r.conditions_json) {
      try {
        const parsed = JSON.parse(r.conditions_json);
        if (parsed && Array.isArray(parsed.groups)) {
          treeData = parsed;
        } else if (Array.isArray(parsed)) {
          treeData = {
            group_combinator: r.logic_operator || "AND",
            groups: [{ id: "g_legacy", combinator: r.logic_operator || "AND", conditions: parsed }],
          };
        }
      } catch {
        treeData = null;
      }
    }
    if (!treeData) {
      treeData = {
        group_combinator: "AND",
        groups: [{ id: "g_legacy", combinator: "AND", conditions: [{ trigger_field_id: r.trigger_field_id, operator: r.operator, comparison_value: r.comparison_value }] }],
      };
    }

    const groupStrings = treeData.groups.map((grp) => {
      const condStrings = grp.conditions.map((c) => {
        const trig = fields.find((f) => Number(f.id) === Number(c.trigger_field_id));
        const opLabel = OPERATOR_LABEL_MAP[c.operator] || c.operator || "==";
        const hasVal = !["is_empty", "is_not_empty", "is_yes", "is_no"].includes(c.operator);
        return `"${trig?.label || `Field #${c.trigger_field_id}`}" ${opLabel}${hasVal ? ` "${c.comparison_value || ""}"` : ""}`;
      });
      if (condStrings.length > 1) {
        return `( ${condStrings.join(` ${grp.combinator || "AND"} `)} )`;
      }
      return condStrings[0] || "";
    });

    if (groupStrings.length > 1) {
      return groupStrings.join(` ${treeData.group_combinator || "OR"} `);
    }
    return groupStrings[0] || "";
  };

  // Evaluate Skip / Branching Logic for Respondent Flow
  const isFieldSkippedByBranching = (fieldId, answersMap = previewAnswers) => {
    const targetField = fields.find((f) => Number(f.id) === Number(fieldId));
    if (!targetField) return false;

    // Check all preceding fields in field_order sequence
    const precedingFields = fields.filter((f) => f.field_order < targetField.field_order);

    for (const pField of precedingFields) {
      for (const r of rules) {
        let targetActions = [];
        if (r.conditions_json) {
          try {
            const parsed = JSON.parse(r.conditions_json);
            if (parsed && Array.isArray(parsed.target_actions)) {
              targetActions = parsed.target_actions;
            }
          } catch {
            targetActions = [];
          }
        }
        if (!targetActions || targetActions.length === 0) {
          if (r.target_field_id) {
            targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
          }
        }

        for (const tAct of targetActions) {
          const act = tAct.action;
          if (["skip_to_question", "skip_to_section", "skip_to_page", "end_form"].includes(act)) {
            const matches = evaluateRule(r, answersMap);
            if (matches) {
              if (act === "end_form") {
                return true;
              }
              const destFieldId = Number(tAct.target_field_id);
              const destField = fields.find((f) => Number(f.id) === destFieldId);
              if (destField) {
                if (targetField.field_order > pField.field_order && targetField.field_order < destField.field_order) {
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false;
  };

  // Evaluate Conditional Rules for Live Preview (Supports Display, Multi-Target, and Branching Logic)
  const isFieldVisibleInPreview = (fieldId, answersMap = previewAnswers) => {
    if (isFieldSkippedByBranching(fieldId, answersMap)) return false;

    for (const r of rules) {
      let targetActions = [];
      if (r.conditions_json) {
        try {
          const parsed = JSON.parse(r.conditions_json);
          if (parsed && Array.isArray(parsed.target_actions)) {
            targetActions = parsed.target_actions;
          }
        } catch {
          targetActions = [];
        }
      }

      if (!targetActions || targetActions.length === 0) {
        if (r.target_field_id) {
          targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
        }
      }

      const matchingTarget = targetActions.find((t) => Number(t.target_field_id) === Number(fieldId));
      if (matchingTarget) {
        const matches = evaluateRule(r, answersMap);
        if (matchingTarget.action === "show") return matches;
        if (matchingTarget.action === "hide") return !matches;
      }
    }
    return true;
  };

  // Evaluate Dynamic Field Requirement based on Logic Rules (MAKE REQUIRED / MAKE OPTIONAL)
  const isFieldRequiredInPreview = (field, answersMap = previewAnswers) => {
    let required = field.is_required || false;

    for (const r of rules) {
      let targetActions = [];
      if (r.conditions_json) {
        try {
          const parsed = JSON.parse(r.conditions_json);
          if (parsed && Array.isArray(parsed.target_actions)) {
            targetActions = parsed.target_actions;
          }
        } catch {
          targetActions = [];
        }
      }

      if (!targetActions || targetActions.length === 0) {
        if (r.target_field_id) {
          targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
        }
      }

      const matchingTarget = targetActions.find((t) => Number(t.target_field_id) === Number(field.id));
      if (matchingTarget) {
        const act = matchingTarget.action;
        if (["make_required", "require"].includes(act)) {
          const matches = evaluateRule(r, answersMap);
          if (matches) required = true;
          else required = false;
        } else if (["make_optional", "optional"].includes(act)) {
          const matches = evaluateRule(r, answersMap);
          if (matches) required = false;
        }
      }
    }

    return required;
  };

  // Preview Mode Test Response Submit Handler
  const handlePreviewSubmit = () => {
    const visible = fields.filter((f) => !f.is_hidden && isFieldVisibleInPreview(f.id));
    const newErrors = {};
    let isValid = true;

    for (const f of visible) {
      const isReq = isFieldRequiredInPreview(f);
      if (isReq && !f.is_read_only) {
        const val = previewAnswers[f.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          newErrors[f.id] = true;
          isValid = false;
        }
      }
    }

    setPreviewErrors(newErrors);

    if (!isValid) {
      toast.error("Please resolve required fields before submitting test response", { id: "prev-val-err" });
      return;
    }

    toast.success("Test response validated successfully! (Preview Mode: No database submission created)", { id: "prev-sub-success" });
  };

  // ── 1. DUPLICATE FORM ──────────────────────────────────────────────────────
  const handleDuplicateForm = async () => {
    if (!form || !version || duplicatingForm) return;

    try {
      setDuplicatingForm(true);
      const res = await api.post(`/forms/${form.id}/duplicate`);
      const newForm = res.data;

      toast.success(`Form duplicated successfully! (New Form ID: #${newForm.id})`, { id: "dup-success" });
      navigate(`/create-form?id=${newForm.id}`);
      window.location.reload();
    } catch (err) {
      console.error("Duplicate form error:", err);
      toast.error(err.response?.data?.detail || "Failed to duplicate form");
    } finally {
      setDuplicatingForm(false);
    }
  };

  // ── 2. DELETE FORM ─────────────────────────────────────────────────────────
  const handleConfirmDeleteForm = async () => {
    if (!form || deletingForm) return;

    try {
      setDeletingForm(true);
      await api.delete(`/forms/${form.id}`);
      toast.success(`Form "${form.title}" deleted successfully.`);
      setOpenDeleteConfirm(false);
      navigate("/forms");
    } catch (err) {
      console.error("Delete form error:", err);
      toast.error(err.response?.data?.detail || "Failed to delete form");
    } finally {
      setDeletingForm(false);
    }
  };

  // ── 3. RESET / NEW FORM ────────────────────────────────────────────────────
  const handleConfirmResetForm = async () => {
    setOpenResetConfirm(false);
    try {
      const res = await api.post("/forms/", {
        title: "Untitled Form",
        description: "",
        category: "General",
        status: "draft",
      });
      navigate(`/create-form?id=${res.data.id}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize new form");
    }
  };

  // Handle Theme Customization Changes
  const handleThemeChange = async (newTheme) => {
    setThemeConfig(newTheme);
    if (form?.id) {
      try {
        await api.put(`/forms/${form.id}`, {
          title: form.title,
          description: form.description || "",
          category: form.category || "General",
          status: form.status || "draft",
          theme_config: JSON.stringify(newTheme),
        });
        setAutoSaveStatus("Saved to Cloud");
      } catch (err) {
        console.error("Failed to save theme:", err);
      }
    }
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!form || savingDraft) return;

    // 1. Validate Form Structure
    if (!form.title || !form.title.trim()) {
      setTitleError("Form title is required");
      toast.error("Form title is required to save draft", { id: "draft-val-title" });
      return;
    }

    // Check if any question has an empty label
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label || !fields[i].label.trim()) {
        toast.error(`Question ${i + 1} is missing a title/label`, { id: "draft-val-field" });
        return;
      }
    }

    try {
      setSavingDraft(true);
      setAutoSaveStatus("Saving...");

      // 2. Save complete form settings & metadata to backend database (Status = Draft)
      const res = await api.put(`/forms/${form.id}`, {
        title: form.title.trim(),
        description: form.description || "",
        category: form.category || "General",
        status: "draft",
        theme_config: JSON.stringify(themeConfig),
      });

      if (res.data) {
        setForm(res.data);
      }

      // 3 & 4 & 5. Save all questions, order, and every question configuration
      if (fields.length > 0) {
        await persistFieldOrder(fields);
      }

      setAutoSaveStatus("Saved to Cloud");
      toast.success(`Draft saved successfully! (Form ID: ${form.id})`, { id: "draft-success" });
      await loadFormData();
    } catch (err) {
      console.error("Save draft error:", err);
      setAutoSaveStatus("Error Saving");
      toast.error(err.response?.data?.detail || "Failed to save draft", { id: "draft-err" });
    } finally {
      setSavingDraft(false);
    }
  };

  // Copy Share Link
  const handleShareLink = () => {
    if (!form) return;
    const link = `${window.location.origin}/public/form/${form.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Public link copied to clipboard!");
  };

  const handlePreviewInputChange = (fieldId, value) => {
    setPreviewAnswers((prev) => {
      const updated = { ...prev, [fieldId]: value };
      return evaluateAllFormulas(fields, updated);
    });
  };

  const handleOpenPreview = () => {
    const initialAnswers = evaluateAllFormulas(fields, {});
    setPreviewAnswers(initialAnswers);
    setPreviewErrors({});
    setOpenPreview(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="75vh">
        <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pb: 6, width: "100%" }}>
      {/* ─────────────────────────────────────────────────────────────
          COMPACT FORM BUILDER HEADER TOOLBAR
         ───────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          px: 2.5,
          borderRadius: 2.5,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: 2,
        }}
      >
        {/* Left: Back & Form Name */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flexShrink: 1 }}>
          <Button
            size="small"
            onClick={() => navigate("/forms")}
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              borderRadius: 2,
              px: 1.2,
              py: 0.5,
              border: "1px solid #E2E8F0",
              bgcolor: "#F8FAFC",
              "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            Back
          </Button>

          <Divider orientation="vertical" flexItem sx={{ height: 20, my: "auto" }} />

          <Typography
            variant="subtitle1"
            fontWeight={800}
            noWrap
            sx={{ color: "#0F172A", fontSize: "0.98rem", letterSpacing: "-0.01em", maxWidth: 240 }}
          >
            {form?.title || "Untitled Form"}
          </Typography>
        </Stack>

        {/* Center: Build | Theme | Logic | Share Tabs */}
        <Stack direction="row" spacing={0.5} sx={{ bgcolor: "#F8FAFC", p: 0.5, borderRadius: 2, border: "1px solid #E2E8F0" }}>
          {[
            { label: "Build", icon: <LayersOutlinedIcon sx={{ fontSize: 15 }} /> },
            { label: "Theme", icon: <PaletteOutlinedIcon sx={{ fontSize: 15 }} /> },
            { label: "Logic", icon: <AltRouteRoundedIcon sx={{ fontSize: 15 }} /> },
            { label: "Share", icon: <OpenInNewRoundedIcon sx={{ fontSize: 15 }} /> },
          ].map((tabObj, index) => (
            <Button
              key={tabObj.label}
              size="small"
              startIcon={tabObj.icon}
              onClick={() => setActiveTab(index)}
              sx={{
                fontSize: "0.78rem",
                fontWeight: activeTab === index ? 700 : 600,
                color: activeTab === index ? "#4F46E5" : "#64748B",
                bgcolor: activeTab === index ? "#FFFFFF" : "transparent",
                boxShadow: activeTab === index ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                textTransform: "none",
                transition: "all 0.15s ease",
              }}
            >
              {tabObj.label}
            </Button>
          ))}
        </Stack>

        {/* Right: Test Form with AI | Check My Form | Preview | Save | Publish Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenSimulatorModal(true)}
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#CBD5E1",
              color: "#334155",
              borderRadius: 2,
              px: 1.8,
              py: 0.6,
              "&:hover": { borderColor: "#0EA5E9", bgcolor: "#F0F9FF", color: "#0284C7" },
            }}
          >
            Test Form with AI
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenDoctorDrawer(true)}
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#CBD5E1",
              color: "#334155",
              borderRadius: 2,
              px: 1.8,
              py: 0.6,
              "&:hover": { borderColor: "#6366F1", bgcolor: "#EEF2FF", color: "#4F46E5" },
            }}
          >
            Check My Form
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowRoundedIcon sx={{ fontSize: 15 }} />}
            onClick={handleOpenPreview}
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#CBD5E1",
              color: "#334155",
              borderRadius: 2,
              px: 1.8,
              py: 0.6,
              "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
            }}
          >
            Preview
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            startIcon={savingDraft ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#CBD5E1",
              color: "#334155",
              borderRadius: 2,
              px: 1.8,
              py: 0.6,
              "&:hover": { borderColor: "#94A3B8", bgcolor: "#F8FAFC" },
            }}
          >
            {savingDraft ? "Saving..." : "Save"}
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handlePublishVersion}
            disabled={publishing || version?.is_published}
            startIcon={publishing ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              px: 2.2,
              py: 0.65,
              borderRadius: 2,
              bgcolor: "#4F46E5",
              boxShadow: "0 2px 8px 0 rgba(79, 70, 229, 0.25)",
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            {publishing ? "Publishing..." : version?.is_published ? "Published ✓" : "Publish"}
          </Button>

          <IconButton
            size="small"
            onClick={(e) => setActionsMenuAnchor(e.currentTarget)}
            sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 0.75 }}
          >
            <MoreVertRoundedIcon sx={{ fontSize: 18, color: "#64748B" }} />
          </IconButton>

          <Menu
            anchorEl={actionsMenuAnchor}
            open={Boolean(actionsMenuAnchor)}
            onClose={() => setActionsMenuAnchor(null)}
            PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 160 } }}
          >
            <MenuItem onClick={() => { setActionsMenuAnchor(null); setOpenSettingsModal(true); }}>
              <SettingsRoundedIcon sx={{ fontSize: 16, mr: 1, color: "#64748B" }} />
              Form Settings
            </MenuItem>
            <MenuItem onClick={() => { setActionsMenuAnchor(null); setOpenVerificationModal(true); }}>
              <VerifiedUserRoundedIcon sx={{ fontSize: 16, mr: 1, color: "#4F46E5" }} />
              Security &amp; Micro-Verification
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setActionsMenuAnchor(null); handleDuplicateForm(); }} disabled={duplicatingForm}>
              <FileCopyRoundedIcon sx={{ fontSize: 16, mr: 1, color: "#4F46E5" }} />
              Duplicate Form
            </MenuItem>
            <MenuItem onClick={() => { setActionsMenuAnchor(null); setOpenResetConfirm(true); }}>
              <AddRoundedIcon sx={{ fontSize: 16, mr: 1, color: "#059669" }} />
              New Form
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setActionsMenuAnchor(null); setOpenDeleteConfirm(true); }} sx={{ color: "#EF4444" }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16, mr: 1, color: "#EF4444" }} />
              Delete Form
            </MenuItem>
          </Menu>
        </Stack>
      </Paper>

      {/* ─────────────────────────────────────────────────────────────
          TAB 0: STUDIO CANVAS FORM BUILDER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Box sx={{ display: "flex", gap: 3, minHeight: 620 }}>
          {/* LEFT: QUESTION TOOLBOX */}
          {!isViewer && <QuestionToolbox onAddField={handleAddField} fields={fields} />}

          {/* CENTER: INTERACTIVE FORM CANVAS */}
          <Paper
            elevation={0}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (isViewer) return;
              const fieldType = e.dataTransfer.getData("fieldType");
              if (fieldType) handleAddField(fieldType);
            }}
            sx={{
              flexGrow: 1,
              p: 4,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
              overflowY: "auto",
            }}
          >
            {isViewer && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700 }}>
                You are viewing this form as a collaborator with Read-Only permissions.
              </Alert>
            )}
            {/* Form Title & Description Header Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                mb: 3.5,
                borderRadius: 3,
                border: titleError ? "2px solid #EF4444" : "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                borderTop: "6px solid #4F46E5",
                boxShadow: "0 2px 12px rgba(15, 23, 42, 0.03)",
              }}
            >
              <Stack spacing={1.5}>
                {/* Form Title Field */}
                <Box>
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Untitled Form"
                    value={form?.title || ""}
                    onChange={(e) => handleFormMetaChange("title", e.target.value)}
                    error={Boolean(titleError)}
                    inputProps={{ maxLength: 200 }}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", py: 0.5 },
                    }}
                  />
                  {titleError && (
                    <Typography variant="caption" color="error" sx={{ fontWeight: 600, mt: 0.5, display: "block" }}>
                      {titleError}
                    </Typography>
                  )}
                </Box>

                {/* Form Description Field (Optional) */}
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Add a description..."
                  value={form?.description || ""}
                  onChange={(e) => handleFormMetaChange("description", e.target.value)}
                  multiline
                  rows={2}
                  InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: "0.95rem", color: "#64748B", py: 0.5 },
                  }}
                />
              </Stack>
            </Paper>

            {fields.length === 0 ? (
              <Box
                py={6}
                px={3}
                textAlign="center"
                sx={{
                  borderRadius: 3.5,
                  bgcolor: "#FAFAFA",
                  border: "2px dashed #CBD5E1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 310,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#94A3B8",
                    bgcolor: "#FDFDFD",
                  },
                }}
              >
                {/* Form Creation Illustration */}
                <Box
                  sx={{
                    width: 84,
                    height: 84,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2.5,
                    filter: "drop-shadow(0 10px 22px rgba(79, 70, 229, 0.16))",
                    transition: "transform 0.25s ease",
                    "&:hover": { transform: "translateY(-2px)" },
                  }}
                >
                  <svg
                    width="84"
                    height="84"
                    viewBox="0 0 84 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="emptyFormCardGrad" x1="16" y1="8" x2="68" y2="76" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#F8FAFC" />
                      </linearGradient>
                      <linearGradient id="emptyFormHeaderGrad" x1="20" y1="12" x2="64" y2="12" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <linearGradient id="emptyActionFabGrad" x1="56" y1="56" x2="76" y2="76" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#4F46E5" />
                      </linearGradient>
                      <filter id="emptyFabShadow" x="48" y="50" width="34" height="34" filterUnits="userSpaceOnUse">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4F46E5" floodOpacity="0.32" />
                      </filter>
                    </defs>

                    {/* Angled background document layer for subtle depth */}
                    <rect
                      x="20"
                      y="10"
                      width="48"
                      height="62"
                      rx="10"
                      fill="#EEF2FF"
                      stroke="#E0E7FF"
                      strokeWidth="1.2"
                      transform="rotate(4 44 41)"
                    />

                    {/* Primary Foreground Form Document Sheet */}
                    <rect
                      x="16"
                      y="10"
                      width="50"
                      height="62"
                      rx="10"
                      fill="url(#emptyFormCardGrad)"
                      stroke="#CBD5E1"
                      strokeWidth="1.4"
                    />

                    {/* Form Header / Banner Indicator */}
                    <rect
                      x="21"
                      y="16"
                      width="40"
                      height="6"
                      rx="3"
                      fill="url(#emptyFormHeaderGrad)"
                    />

                    {/* Field 1: Radio Question & Line */}
                    <circle cx="25" cy="30" r="3" fill="#6366F1" />
                    <circle cx="25" cy="30" r="1.2" fill="#FFFFFF" />
                    <rect x="31" y="28" width="28" height="4.5" rx="2.25" fill="#E2E8F0" />

                    {/* Field 1 Input preview container */}
                    <rect
                      x="23"
                      y="36"
                      width="36"
                      height="6.5"
                      rx="3"
                      fill="#F1F5F9"
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />

                    {/* Field 2: Checkbox Question & Line */}
                    <rect x="23.5" y="47.5" width="6" height="6" rx="1.8" fill="#10B981" />
                    <path
                      d="M25 50.5L26.5 52L28.5 49"
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect x="32.5" y="48.5" width="22" height="4.5" rx="2.25" fill="#E2E8F0" />

                    {/* Field 3: Text Input Placeholder Line */}
                    <rect x="23.5" y="58" width="26" height="4.5" rx="2.25" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.8" />

                    {/* Interactive "+ Add Field" floating action badge */}
                    <g filter="url(#emptyFabShadow)">
                      <circle cx="65" cy="64" r="11" fill="url(#emptyActionFabGrad)" stroke="#FFFFFF" strokeWidth="2" />
                      <path
                        d="M65 59.5V68.5M60.5 64H69.5"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>
                </Box>

                <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", letterSpacing: "-0.015em", fontSize: "1.1rem", mb: 0.8 }}>
                  Start building your form by adding a question.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mb: 3, maxWidth: 480, lineHeight: 1.55, fontSize: "0.85rem" }}>
                  Click or drag any of the 25 question types from the left Question Toolbox onto this canvas, or pick a popular starter question below:
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1.2}>
                  {[
                    { label: "+ Short Text", type: "text" },
                    { label: "+ Dropdown", type: "select" },
                    { label: "+ Checkbox", type: "checkbox" },
                    { label: "+ Star Rating", type: "rating" },
                    { label: "+ File Upload", type: "file_upload" },
                  ].map((btn) => (
                    <Button
                      key={btn.type}
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddField(btn.type)}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        borderRadius: 2.5,
                        textTransform: "none",
                        borderColor: "#CBD5E1",
                        color: "#334155",
                        bgcolor: "#FFFFFF",
                        px: 1.6,
                        py: 0.6,
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                        "&:hover": {
                          bgcolor: "#EEF2FF",
                          borderColor: "#4F46E5",
                          color: "#4F46E5",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.15s ease",
                      }}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Stack spacing={3}>
                {fields.map((f, index) => {
                  const isSelected = f.id === selectedFieldId;

                  return (
                    <Paper
                      key={f.id}
                      elevation={0}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handleDragFieldStart(e, f.id); }}
                      onDragOver={(e) => handleDragFieldOver(e, f.id)}
                      onDrop={(e) => handleDropField(e, f.id)}
                      onDragEnd={() => setDragFieldId(null)}
                      onClick={() => setSelectedFieldId(f.id)}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: isSelected ? "2px solid #4F46E5" : dragFieldId === f.id ? "2px dashed #A5B4FC" : "1px solid #E2E8F0",
                        bgcolor: isSelected ? "#FFFFFF" : dragFieldId === f.id ? "#EEF2FF" : "#FAFAFA",
                        boxShadow: isSelected ? "0 8px 25px -4px rgba(79, 70, 229, 0.12)" : "none",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s ease",
                        opacity: dragFieldId === f.id ? 0.5 : 1,
                      }}
                    >
                      {/* Card Action Controls (Reorder, Required toggle, Duplicate, Delete) */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DragIndicatorRoundedIcon
                            sx={{ fontSize: 18, color: "#CBD5E1", cursor: "grab", flexShrink: 0, "&:hover": { color: "#4F46E5" } }}
                          />
                          <Chip
                            label={`Q${index + 1}`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "#EEF2FF", color: "#4F46E5" }}
                          />
                          <Chip
                            label={f.field_type}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: "0.675rem", height: 20, bgcolor: "#F1F5F9", color: "#475569" }}
                          />
                        </Box>

                        {!isViewer && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={f.is_required || false}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleFieldChange("is_required", e.target.checked);
                                  }}
                                />
                              }
                              label={<Typography variant="caption" fontWeight={700} sx={{ color: f.is_required ? "#DC2626" : "#64748B", fontSize: "0.72rem" }}>Required</Typography>}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ m: 0, mr: 1 }}
                            />
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleReorderField(f.id, "up"); }} disabled={index === 0} title="Move Up">
                              <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleReorderField(f.id, "down"); }} disabled={index === fields.length - 1} title="Move Down">
                              <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDuplicateField(f); }} title="Duplicate Question">
                              <FileCopyRoundedIcon sx={{ fontSize: 16, color: "#64748B" }} />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteField(f.id); }} title="Delete Question">
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                            </IconButton>
                          </Stack>
                        )}
                      </Box>

                      {/* Question Label */}
                      <Typography variant="body1" fontWeight={700} sx={{ color: "#0F172A", mb: 1 }}>
                        {f.label} {f.is_required && <span style={{ color: "#EF4444" }}>*</span>}
                      </Typography>

                      {/* Question Input Field Preview Render */}
                      <Box mt={1}>
                        {/* ── Input Fields ── */}
                        {["text", "email", "phone"].includes(f.field_type) && (
                          <TextField fullWidth size="small" placeholder={f.placeholder || "Your answer..."} disabled />
                        )}
                        {f.field_type === "textarea" && (
                          <TextField fullWidth multiline rows={3} size="small" placeholder={f.placeholder || "Long answer..."} disabled />
                        )}
                        {f.field_type === "number" && (
                          <TextField fullWidth type="number" size="small" placeholder={f.placeholder || "0"} disabled />
                        )}
                        {f.field_type === "formula" && (
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "#F8FAFC",
                              border: "1.5px dashed #CBD5E1",
                              display: "flex",
                              alignItems: "center",
                              justify: "space-between",
                              gap: 1.5,
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <FunctionsRoundedIcon sx={{ fontSize: 20, color: "#6366F1" }} />
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {f.formula_expression ? `Formula: ${f.formula_expression}` : "Click properties to build formula"}
                              </Typography>
                            </Box>
                            <Chip label="Read-Only Calculated" size="small" variant="outlined" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#6366F1" }} />
                          </Box>
                        )}
                        {f.field_type === "lookup" && (() => {
                          let cfg = null;
                          try {
                            cfg = typeof f.lookup_config === "string" ? JSON.parse(f.lookup_config) : f.lookup_config;
                          } catch {
                            cfg = null;
                          }
                          const mappingsCount = cfg?.response_mappings?.length || 0;
                          return (
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "#F5F3FF",
                                borderRadius: 2,
                                border: "1.5px dashed #C4B5FD",
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <SearchRoundedIcon sx={{ fontSize: 20, color: "#7C3AED" }} />
                                  <Typography variant="body2" fontWeight={700} sx={{ color: "#5B21B6" }}>
                                    {cfg?.endpoint ? `API: ${cfg.endpoint}` : "API Lookup (Click properties to configure)"}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={cfg?.endpoint ? "Connected" : "Setup Required"}
                                  size="small"
                                  color={cfg?.endpoint ? "success" : "default"}
                                  sx={{ fontSize: "0.68rem", fontWeight: 700, height: 20 }}
                                />
                              </Box>
                              {mappingsCount > 0 && (
                                <Typography variant="caption" sx={{ color: "#6D28D9", fontSize: "0.72rem" }}>
                                  Populates {mappingsCount} field{mappingsCount > 1 ? "s" : ""} on {cfg?.trigger_behavior === "on_button" ? "button click" : "valid input"}
                                </Typography>
                              )}
                              <TextField
                                fullWidth
                                size="small"
                                placeholder={f.placeholder || "Enter value to lookup..."}
                                disabled
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Chip label={cfg?.button_label || "Lookup"} size="small" sx={{ bgcolor: "#EDE9FE", color: "#6D28D9", fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>
                          );
                        })()}
                        {f.field_type === "date" && (
                          <TextField fullWidth type="date" size="small" disabled />
                        )}
                        {f.field_type === "time" && (
                          <TextField fullWidth type="time" size="small" disabled />
                        )}
                        {f.field_type === "url" && (
                          <TextField fullWidth size="small" placeholder={f.placeholder || "https://example.com"} disabled
                            InputProps={{ startAdornment: <LinkRoundedIcon sx={{ fontSize: 16, color: "#94A3B8", mr: 0.5 }} /> }} />
                        )}
                        {f.field_type === "password" && (
                          <TextField fullWidth type="password" size="small" placeholder="••••••••" disabled
                            InputProps={{ startAdornment: <VpnKeyRoundedIcon sx={{ fontSize: 16, color: "#94A3B8", mr: 0.5 }} /> }} />
                        )}

                        {/* ── Choice Fields ── */}
                        {["select", "dropdown"].includes(f.field_type) && (
                          <Select fullWidth size="small" value="" displayEmpty disabled>
                            <MenuItem value="">{f.placeholder || "Select an option..."}</MenuItem>
                            {(f.options || []).map((o) => (
                              <MenuItem key={o.id} value={o.option_text}>{o.option_text}</MenuItem>
                            ))}
                          </Select>
                        )}
                        {f.field_type === "radio" && (
                          <RadioGroup>
                            {(f.options || [{ id: 1, option_text: "Option 1" }, { id: 2, option_text: "Option 2" }]).map((o) => (
                              <FormControlLabel key={o.id} control={<Radio size="small" disabled />} label={<Typography variant="body2">{o.option_text}</Typography>} />
                            ))}
                          </RadioGroup>
                        )}
                        {f.field_type === "checkbox" && (
                          <Stack spacing={0.3}>
                            {(f.options || [{ id: 1, option_text: "Option A" }, { id: 2, option_text: "Option B" }]).map((o) => (
                              <FormControlLabel key={o.id} control={<MuiCheckbox size="small" disabled />} label={<Typography variant="body2">{o.option_text}</Typography>} />
                            ))}
                          </Stack>
                        )}
                        {f.field_type === "yes_no" && (
                          <Stack direction="row" spacing={1.5} mt={0.5}>
                            {["Yes", "No"].map((opt) => (
                              <Button key={opt} variant="outlined" size="small" disabled
                                sx={{ minWidth: 80, fontWeight: 700, borderRadius: 2, borderColor: "#E2E8F0", color: "#64748B" }}>
                                {opt === "Yes" ? "👍 Yes" : "👎 No"}
                              </Button>
                            ))}
                          </Stack>
                        )}
                        {f.field_type === "matrix" && (
                          <Box sx={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: "8px", textAlign: "left", color: "#94A3B8", fontWeight: 600, borderBottom: "1px solid #E2E8F0" }}></th>
                                  {["Col 1", "Col 2", "Col 3"].map((c) => (
                                    <th key={c} style={{ padding: "8px", textAlign: "center", color: "#64748B", fontWeight: 700, borderBottom: "1px solid #E2E8F0" }}>{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {["Row 1", "Row 2"].map((r) => (
                                  <tr key={r}>
                                    <td style={{ padding: "8px", color: "#334155", fontWeight: 600, borderBottom: "1px solid #F1F5F9" }}>{r}</td>
                                    {[1, 2, 3].map((i) => (
                                      <td key={i} style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #F1F5F9" }}>
                                        <Radio size="small" disabled />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        )}

                        {/* ── Scale & Rating ── */}
                        {f.field_type === "rating" && (
                          <Box>
                            <Rating value={3} readOnly size="large" />
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                              Click a star to rate
                            </Typography>
                          </Box>
                        )}
                        {f.field_type === "linear_scale" && (
                          <Box>
                            <Slider defaultValue={5} step={1} min={1} max={10} valueLabelDisplay="auto" disabled />
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">1 – Not at all</Typography>
                              <Typography variant="caption" color="text.secondary">10 – Absolutely</Typography>
                            </Box>
                          </Box>
                        )}

                        {/* ── Uploads & Media ── */}
                        {f.field_type === "file_upload" && (
                          <Paper elevation={0} sx={{ p: 2.5, border: "2px dashed #CBD5E1", borderRadius: 2.5, textAlign: "center", bgcolor: "#F8FAFC", cursor: "not-allowed" }}>
                            <AttachFileOutlinedIcon sx={{ color: "#94A3B8", fontSize: 28 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: "#64748B", mt: 0.5 }}>
                              Drop file here or click to upload
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              Supports PDF, DOCX, XLSX, ZIP
                            </Typography>
                          </Paper>
                        )}
                        {f.field_type === "image_upload" && (
                          <Paper elevation={0} sx={{ p: 2.5, border: "2px dashed #CBD5E1", borderRadius: 2.5, textAlign: "center", bgcolor: "#F8FAFC", cursor: "not-allowed" }}>
                            <PhotoCameraBackRoundedIcon sx={{ color: "#94A3B8", fontSize: 28 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: "#64748B", mt: 0.5 }}>
                              Drop image here or click to upload
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              JPG, PNG, GIF, WebP up to 10 MB
                            </Typography>
                          </Paper>
                        )}
                        {f.field_type === "signature" && (
                          <Paper elevation={0} sx={{ p: 3, border: "2px dashed #CBD5E1", borderRadius: 2.5, textAlign: "center", bgcolor: "#FAFAFA", cursor: "not-allowed", minHeight: 80 }}>
                            <DrawRoundedIcon sx={{ color: "#94A3B8", fontSize: 28 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: "#64748B", mt: 0.5 }}>
                              Draw your signature here
                            </Typography>
                          </Paper>
                        )}

                        {/* ── Layout Elements ── */}
                        {f.field_type === "heading" && (
                          <Typography variant="h5" fontWeight={800} sx={{ color: "#0F172A" }}>
                            {f.label || "Section Heading"}
                          </Typography>
                        )}
                        {f.field_type === "description" && (
                          <Typography variant="body1" sx={{ color: "#475569", lineHeight: 1.7 }}>
                            {f.placeholder || "This is a descriptive text block. Use it to guide respondents through your form."}
                          </Typography>
                        )}
                        {f.field_type === "section_divider" && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1 }}>
                            <Box sx={{ flex: 1, height: 1.5, bgcolor: "#E2E8F0", borderRadius: 1 }} />
                            <HorizontalRuleRoundedIcon sx={{ color: "#CBD5E1", fontSize: 18 }} />
                            <Box sx={{ flex: 1, height: 1.5, bgcolor: "#E2E8F0", borderRadius: 1 }} />
                          </Box>
                        )}
                        {f.field_type === "image" && (
                          <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: "hidden", border: "1px solid #E2E8F0", textAlign: "center", py: 4, bgcolor: "#F8FAFC" }}>
                            <ImageOutlinedIcon sx={{ color: "#CBD5E1", fontSize: 36 }} />
                            <Typography variant="caption" display="block" color="text.disabled" mt={0.5}>
                              Image block – set URL in properties
                            </Typography>
                          </Paper>
                        )}
                        {f.field_type === "video" && (
                          <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: "hidden", border: "1px solid #E2E8F0", textAlign: "center", py: 4, bgcolor: "#F8FAFC" }}>
                            <PlayCircleOutlineRoundedIcon sx={{ color: "#CBD5E1", fontSize: 36 }} />
                            <Typography variant="caption" display="block" color="text.disabled" mt={0.5}>
                              Video block – set URL in properties
                            </Typography>
                          </Paper>
                        )}
                        {f.field_type === "page_break" && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1 }}>
                            <Box sx={{ flex: 1, height: 2, background: "repeating-linear-gradient(90deg, #94A3B8 0, #94A3B8 8px, transparent 8px, transparent 16px)", borderRadius: 1 }} />
                            <Chip label="Page Break" size="small" sx={{ fontSize: "0.65rem", fontWeight: 700, bgcolor: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }} />
                            <Box sx={{ flex: 1, height: 2, background: "repeating-linear-gradient(90deg, #94A3B8 0, #94A3B8 8px, transparent 8px, transparent 16px)", borderRadius: 1 }} />
                          </Box>
                        )}
                      </Box>

                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* RIGHT: QUESTION PROPERTIES PANEL */}
          {selectedField && (
            <Box sx={{ position: "relative" }}>
              <QuestionProperties
                field={selectedField}
                onClose={() => setSelectedFieldId(null)}
                onFieldChange={isViewer ? () => {} : handleFieldChange}
                onAddOption={isViewer ? () => {} : handleAddOption}
                onDeleteOption={isViewer ? () => {} : handleDeleteOption}
                onEditOption={isViewer ? () => {} : handleEditOption}
                onMoveOption={isViewer ? () => {} : handleMoveOption}
                onDragOption={isViewer ? () => {} : handleDragOption}
                onDelete={isViewer ? undefined : () => handleDeleteField(selectedField.id)}
                onDuplicate={isViewer ? undefined : () => handleDuplicateField(selectedField)}
                onMoveUp={isViewer ? undefined : () => handleReorderField(selectedField.id, "up")}
                onMoveDown={isViewer ? undefined : () => handleReorderField(selectedField.id, "down")}
                newOptionText={newOptionText}
                setNewOptionText={setNewOptionText}
                isFirst={fields.findIndex((f) => f.id === selectedField.id) === 0}
                isLast={fields.findIndex((f) => f.id === selectedField.id) === fields.length - 1}
              />
              {isViewer && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 50,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    cursor: "not-allowed",
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: THEME & APPEARANCE CUSTOMIZER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <fieldset disabled={isViewer} style={{ border: "none", margin: 0, padding: 0, width: "100%" }}>
          <ThemeCustomizer themeConfig={themeConfig} onChangeTheme={handleThemeChange} />
        </fieldset>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: LOGIC RULES CREATOR (NESTED CONDITION GROUPS TREE)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <fieldset disabled={isViewer} style={{ border: "none", margin: 0, padding: 0, width: "100%" }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)" }}>
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                {editingRuleId ? "Edit Conditional Display Logic Rule" : "Conditional Display Logic Rules"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                Build complex nested condition groups (e.g. Group 1 AND Group 2) OR (Group 3 AND Group 4) to control field visibility.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="contained"
                startIcon={<PlayCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={() => setOpenTestLogic(true)}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 0.9,
                  bgcolor: "#4F46E5",
                  "&:hover": { bgcolor: "#4338CA" },
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
                  textTransform: "none",
                }}
              >
                Test Logic Studio ⭐
              </Button>

              {editingRuleId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={handleCancelEditRule}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
                >
                  Cancel Editing
                </Button>
              )}
            </Stack>
          </Box>

          {/* 1. IF: CONDITION GROUPS TREE BUILDER */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.88rem", letterSpacing: "0.02em" }}>
                IF — CONDITION GROUPS ({groupsList.length})
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Between-Groups Logic:
                </Typography>
                <Chip
                  label="OR (Match Any Group)"
                  size="small"
                  onClick={() => setGroupCombinator("OR")}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    cursor: "pointer",
                    bgcolor: groupCombinator === "OR" ? "#4F46E5" : "#E2E8F0",
                    color: groupCombinator === "OR" ? "#FFFFFF" : "#475569",
                  }}
                />
                <Chip
                  label="AND (Match All Groups)"
                  size="small"
                  onClick={() => setGroupCombinator("AND")}
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    cursor: "pointer",
                    bgcolor: groupCombinator === "AND" ? "#4F46E5" : "#E2E8F0",
                    color: groupCombinator === "AND" ? "#FFFFFF" : "#475569",
                  }}
                />
              </Stack>
            </Box>

            <Stack spacing={2.5}>
              {groupsList.map((group, grpIdx) => (
                <Paper
                  key={group.id || grpIdx}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: "1.5px solid #CBD5E1",
                    bgcolor: "#F8FAFC",
                    position: "relative",
                  }}
                >
                  {/* Group Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip
                        label={`Group #${grpIdx + 1}`}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: "0.7rem", bgcolor: "#0F172A", color: "#FFFFFF" }}
                      />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        Inside-Group Combinator:
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          label="AND (Match All)"
                          size="small"
                          onClick={() => handleToggleGroupCombinator(grpIdx, "AND")}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            cursor: "pointer",
                            bgcolor: group.combinator === "AND" ? "#4F46E5" : "#E2E8F0",
                            color: group.combinator === "AND" ? "#FFFFFF" : "#475569",
                          }}
                        />
                        <Chip
                          label="OR (Match Any)"
                          size="small"
                          onClick={() => handleToggleGroupCombinator(grpIdx, "OR")}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            cursor: "pointer",
                            bgcolor: group.combinator === "OR" ? "#4F46E5" : "#E2E8F0",
                            color: group.combinator === "OR" ? "#FFFFFF" : "#475569",
                          }}
                        />
                      </Stack>
                    </Stack>

                    {groupsList.length > 1 && (
                      <IconButton size="small" onClick={() => handleRemoveGroup(grpIdx)} title="Remove Group">
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: "#EF4444" }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Conditions inside Group */}
                  <Stack spacing={1.5}>
                    {group.conditions.map((cond, condIdx) => {
                      const selectedTrig = fields.find((f) => Number(f.id) === Number(cond.trigger_field_id));
                      const availableOps = getOperatorsForType(selectedTrig?.field_type);
                      const currentOpVal = availableOps.some((op) => op.value === cond.operator)
                        ? cond.operator
                        : availableOps[0]?.value || "==";

                      return (
                        <Paper
                          key={condIdx}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #E2E8F0",
                            bgcolor: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={`If #${grpIdx + 1}.${condIdx + 1}`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: "0.65rem", bgcolor: "#F1F5F9", color: "#475569", height: 24 }}
                          />

                          {/* Trigger Question Select */}
                          <TextField
                            select
                            size="small"
                            placeholder="Select question..."
                            value={cond.trigger_field_id}
                            onChange={(e) => {
                              const newTrigId = e.target.value;
                              const newTrigField = fields.find((f) => Number(f.id) === Number(newTrigId));
                              const newOps = getOperatorsForType(newTrigField?.field_type);
                              handleUpdateConditionInGroup(grpIdx, condIdx, "trigger_field_id", newTrigId);
                              handleUpdateConditionInGroup(grpIdx, condIdx, "operator", newOps[0]?.value || "==");
                            }}
                            sx={{ flex: 2, minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                          >
                            <MenuItem value="">Select trigger question...</MenuItem>
                            {fields.map((f) => {
                              let typeLabel = f.field_type;
                              let prefix = "";
                              if (f.field_type === "section_divider") {
                                typeLabel = "Section Header";
                                prefix = "📁 ";
                              } else if (f.field_type === "page_break") {
                                typeLabel = "Page Break";
                                prefix = "📄 ";
                              }
                              return (
                                <MenuItem key={f.id} value={String(f.id)}>
                                  {prefix}{f.label} ({typeLabel})
                                </MenuItem>
                              );
                            })}
                          </TextField>

                          {/* Dynamic Operator Select */}
                          <TextField
                            select
                            size="small"
                            value={currentOpVal}
                            onChange={(e) => handleUpdateConditionInGroup(grpIdx, condIdx, "operator", e.target.value)}
                            sx={{ flex: 1.5, minWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                          >
                            {availableOps.map((op) => (
                              <MenuItem key={op.value} value={op.value}>
                                {op.label}
                              </MenuItem>
                            ))}
                          </TextField>

                          {/* Comparison Value Input or Choice Select Dropdown */}
                          {!["is_empty", "is_not_empty", "is_yes", "is_no"].includes(currentOpVal) && (
                            (() => {
                              const trigOpts = getParsedOptions(selectedTrig);
                              if (trigOpts.length > 0) {
                                return (
                                  <TextField
                                    select
                                    size="small"
                                    value={cond.comparison_value || ""}
                                    onChange={(e) => handleUpdateConditionInGroup(grpIdx, condIdx, "comparison_value", e.target.value)}
                                    sx={{ flex: 1.5, minWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                                  >
                                    <MenuItem value="">Select option choice...</MenuItem>
                                    {trigOpts.map((o) => (
                                      <MenuItem key={o.id} value={o.text}>
                                        {o.text}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                );
                              }
                              return (
                                <TextField
                                  size="small"
                                  placeholder="Comparison value..."
                                  value={cond.comparison_value || ""}
                                  onChange={(e) => handleUpdateConditionInGroup(grpIdx, condIdx, "comparison_value", e.target.value)}
                                  sx={{ flex: 1.5, minWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                                />
                              );
                            })()
                          )}

                          {/* Remove Condition Button */}
                          {group.conditions.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveConditionFromGroup(grpIdx, condIdx)}
                              title="Remove condition"
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                            </IconButton>
                          )}
                        </Paper>
                      );
                    })}
                  </Stack>

                  {/* Add Condition to Group Button */}
                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddConditionToGroup(grpIdx)}
                      startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{ fontWeight: 700, fontSize: "0.75rem", borderRadius: 2, textTransform: "none", borderColor: "#CBD5E1", color: "#334155" }}
                    >
                      + Add Condition to Group #{grpIdx + 1}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Stack>

            {/* Add Condition Group Button */}
            <Box mt={2.5}>
              <Button
                variant="outlined"
                color="primary"
                size="medium"
                onClick={handleAddGroup}
                startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{ fontWeight: 800, borderRadius: 2.5, textTransform: "none", px: 3 }}
              >
                + Add Condition Group
              </Button>
            </Box>
          </Box>

          {/* 2. THEN: TARGET QUESTION ACTIONS SECTION */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", letterSpacing: "0.02em" }}>
                THEN — TARGET QUESTION ACTIONS ({targetActionsList.length})
              </Typography>
              <Chip
                label="Multi-Target Actions Enabled"
                size="small"
                sx={{ fontWeight: 800, fontSize: "0.65rem", bgcolor: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}
              />
            </Box>

            <Stack spacing={1.5} mb={2}>
              {targetActionsList.map((tAct, tIdx) => (
                <Paper
                  key={tIdx}
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 2,
                    border: "1px solid #E2E8F0",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={`Target #${tIdx + 1}`}
                    size="small"
                    sx={{ fontWeight: 800, fontSize: "0.65rem", bgcolor: "#EEF2FF", color: "#4F46E5", height: 24 }}
                  />

                  {/* Target Question, Section, or Page Select */}
                  <TextField
                    select
                    size="small"
                    value={tAct.target_field_id}
                    onChange={(e) => handleUpdateTargetAction(tIdx, "target_field_id", e.target.value)}
                    sx={{ flex: 3, minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                  >
                    <MenuItem value="">Select target question, section, or page...</MenuItem>
                    {fields.map((f) => {
                      let typeLabel = "Question";
                      let prefix = "";
                      if (f.field_type === "section_divider") {
                        typeLabel = "Section Header";
                        prefix = "📁 ";
                      } else if (f.field_type === "page_break") {
                        typeLabel = "Page Break";
                        prefix = "📄 ";
                      }
                      return (
                        <MenuItem key={f.id} value={String(f.id)}>
                          {prefix}{f.label} ({typeLabel})
                        </MenuItem>
                      );
                    })}
                  </TextField>

                  {/* Target Action Select */}
                  <TextField
                    select
                    size="small"
                    value={tAct.action || "show"}
                    onChange={(e) => handleUpdateTargetAction(tIdx, "action", e.target.value)}
                    sx={{ flex: 1.8, minWidth: 170, "& .MuiOutlinedInput-root": { borderRadius: 1.8 } }}
                  >
                    <MenuItem value="show">SHOW QUESTION</MenuItem>
                    <MenuItem value="hide">HIDE QUESTION</MenuItem>
                    <MenuItem value="make_required">MAKE REQUIRED</MenuItem>
                    <MenuItem value="make_optional">MAKE OPTIONAL</MenuItem>
                    <MenuItem value="skip_to_question">SKIP TO QUESTION</MenuItem>
                    <MenuItem value="skip_to_section">SKIP TO SECTION</MenuItem>
                    <MenuItem value="skip_to_page">SKIP TO PAGE</MenuItem>
                    <MenuItem value="end_form">END FORM (SUBMIT EARLY)</MenuItem>
                    <MenuItem value="continue">CONTINUE NORMALLY</MenuItem>
                  </TextField>

                  {/* Remove Target Button */}
                  {targetActionsList.length > 1 && (
                    <IconButton size="small" onClick={() => handleRemoveTargetAction(tIdx)} title="Remove Target Question">
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16, color: "#EF4444" }} />
                    </IconButton>
                  )}
                </Paper>
              ))}
            </Stack>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddTargetAction}
                startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{ fontWeight: 700, fontSize: "0.78rem", borderRadius: 2, textTransform: "none", borderColor: "#CBD5E1", color: "#334155" }}
              >
                + Add Target Question
              </Button>
            </Box>
          </Paper>

          {/* 3. SAVE LOGIC RULE BUTTON */}
          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveOrUpdateRule}
              disabled={savingRule}
              sx={{ fontWeight: 700, borderRadius: 2, px: 4, py: 1.2 }}
            >
              {savingRule ? "Saving Rule..." : editingRuleId ? "Update Logic Rule" : "Save Logic Rule"}
            </Button>
            {editingRuleId && (
              <Button
                variant="outlined"
                onClick={handleCancelEditRule}
                sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1.2, textTransform: "none" }}
              >
                Cancel
              </Button>
            )}
          </Stack>

          <Divider sx={{ my: 4 }} />

          {/* Active Rules Section & Conflict Detector */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.95rem" }}>
              Active Logic Rules &amp; Evaluation Priority ({rules.length})
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Rule Evaluation Order: Higher Priority (#1) overrides lower priority rules
            </Typography>
          </Box>

          {/* Rule Conflicts Warning Alert Banner */}
          {(() => {
            const conflicts = detectRuleConflicts(rules, fields);
            if (conflicts.length === 0) return null;
            return (
              <Stack spacing={1} mb={2.5}>
                {conflicts.map((conf, cIdx) => (
                  <Alert severity="warning" key={cIdx} sx={{ borderRadius: 2.5, border: "1px solid #FDE68A", bgcolor: "#FFFBEB" }}>
                    <AlertTitle sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                      ⚠️ Conflicting rules detected for "{conf.targetLabel}"
                    </AlertTitle>
                    Multiple rules specify opposing actions ({conf.entries.map((e) => (e.action || "show").toUpperCase()).join(" vs ")}). Use ↑ ↓ buttons to reorder priority.
                  </Alert>
                ))}
              </Stack>
            );
          })()}

          <Stack spacing={2}>
            {rules.map((r, rIdx) => {
              const summaryText = renderRuleSummaryText(r);
              const issueMsg = getRuleValidationIssue(r, fields);
              let targetActions = [];
              if (r.conditions_json) {
                try {
                  const parsed = JSON.parse(r.conditions_json);
                  if (parsed && Array.isArray(parsed.target_actions)) {
                    targetActions = parsed.target_actions;
                  }
                } catch {
                  targetActions = [];
                }
              }
              if (!targetActions || targetActions.length === 0) {
                targetActions = [{ target_field_id: r.target_field_id, action: r.action || "show" }];
              }

              return (
                <Box
                  key={r.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{
                    p: 2.5,
                    border: issueMsg ? "1.5px solid #EF4444" : editingRuleId === r.id ? "2px solid #4F46E5" : "1px solid #E2E8F0",
                    borderRadius: 2.5,
                    bgcolor: issueMsg ? "#FEF2F2" : editingRuleId === r.id ? "#F5F3FF" : "#FAFAFA",
                  }}
                >
                  <Box flex={1} pr={2}>
                    {issueMsg && (
                      <Alert severity="error" sx={{ mb: 1.5, py: 0.5, px: 2, borderRadius: 2, fontSize: "0.8rem", fontWeight: 700 }}>
                        {issueMsg}
                      </Alert>
                    )}
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={`Priority #${rIdx + 1}`}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: "0.65rem", height: 22, bgcolor: "#0F172A", color: "#FFFFFF" }}
                      />
                      <Chip
                        label={`Between Groups: ${r.logic_operator || "OR"}`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.65rem", height: 22, bgcolor: "#EEF2FF", color: "#4F46E5" }}
                      />
                      <Chip
                        label={`${targetActions.length} Target Actions`}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: "0.65rem", height: 22, bgcolor: "#F1F5F9", color: "#334155" }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, fontFamily: "monospace", fontSize: "0.82rem", mb: 1.5 }}>
                      IF {summaryText}
                    </Typography>

                    {/* Human-Readable Logic Preview Card */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        mb: 1.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={800} sx={{ color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.2, display: "block" }}>
                        📖 Rule Summary
                      </Typography>

                      {/* IF Conditions & THEN Actions List */}
                      {(() => {
                        let parsedGroups = [];
                        if (r.conditions_json) {
                          try {
                            const p = JSON.parse(r.conditions_json);
                            if (p && Array.isArray(p.groups)) parsedGroups = p.groups;
                          } catch {
                            parsedGroups = [];
                          }
                        }
                        if (parsedGroups.length === 0) {
                          parsedGroups = [
                            {
                              combinator: "AND",
                              conditions: [{ trigger_field_id: r.trigger_field_id, operator: r.operator, comparison_value: r.comparison_value }],
                            },
                          ];
                        }

                        return (
                          <Stack spacing={1.5}>
                            <Box>
                              <Chip label="IF" size="small" sx={{ fontWeight: 900, bgcolor: "#0F172A", color: "#FFFFFF", height: 20, fontSize: "0.68rem", mb: 0.8 }} />
                              <Stack spacing={0.5} pl={1}>
                                {parsedGroups.map((grp, gIdx) => (
                                  <Box key={gIdx}>
                                    {gIdx > 0 && (
                                      <Chip
                                        label={r.logic_operator || "OR"}
                                        size="small"
                                        sx={{ fontWeight: 800, bgcolor: "#EEF2FF", color: "#4F46E5", height: 18, fontSize: "0.62rem", my: 0.5, display: "inline-flex" }}
                                      />
                                    )}
                                    {grp.conditions.map((c, cIdx) => {
                                      const trig = fields.find((f) => Number(f.id) === Number(c.trigger_field_id));
                                      const humanOp = HUMAN_OPERATOR_MAP[c.operator] || c.operator;
                                      const noVal = ["is_empty", "is_not_empty", "is_yes", "is_no"].includes(c.operator);

                                      return (
                                        <Box key={cIdx} display="flex" alignItems="center" gap={1} my={0.3}>
                                          {cIdx > 0 && (
                                            <Chip
                                              label={grp.combinator || "AND"}
                                              size="small"
                                              sx={{ fontWeight: 800, bgcolor: "#EEF2FF", color: "#4F46E5", height: 16, fontSize: "0.58rem" }}
                                            />
                                          )}
                                          <Typography variant="body2" sx={{ color: "#1E293B", fontWeight: 600, fontSize: "0.85rem" }}>
                                            <strong>"{trig?.label || `Question #${c.trigger_field_id}`}"</strong> {humanOp} {!noVal && <span style={{ color: "#4F46E5", fontWeight: 700 }}>"{c.comparison_value}"</span>}
                                          </Typography>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                ))}
                              </Stack>
                            </Box>

                            <Box>
                              <Chip label="THEN" size="small" sx={{ fontWeight: 900, bgcolor: "#059669", color: "#FFFFFF", height: 20, fontSize: "0.68rem", mb: 0.8 }} />
                              <Stack spacing={0.5} pl={1}>
                                {targetActions.map((tAct, tIdx) => {
                                  const targetF = fields.find((f) => Number(f.id) === Number(tAct.target_field_id));
                                  const humanAct = HUMAN_ACTION_MAP[tAct.action] || tAct.action;

                                  return (
                                    <Typography key={tIdx} variant="body2" sx={{ color: "#0F172A", fontWeight: 700, fontSize: "0.85rem" }}>
                                      {humanAct} → <strong>"{targetF?.label || `Question #${tAct.target_field_id}`}"</strong>
                                    </Typography>
                                  );
                                })}
                              </Stack>
                            </Box>
                          </Stack>
                        );
                      })()}
                    </Paper>
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="small"
                      disabled={rIdx === 0}
                      onClick={() => handleReorderRule(r.id, "up")}
                      title="Move Priority Up"
                    >
                      <ArrowUpwardRoundedIcon sx={{ fontSize: 18, color: rIdx === 0 ? "#CBD5E1" : "#475569" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={rIdx === rules.length - 1}
                      onClick={() => handleReorderRule(r.id, "down")}
                      title="Move Priority Down"
                    >
                      <ArrowDownwardRoundedIcon sx={{ fontSize: 18, color: rIdx === rules.length - 1 ? "#CBD5E1" : "#475569" }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditRule(r)} title="Edit Rule">
                      <EditRoundedIcon sx={{ fontSize: 18, color: "#4F46E5" }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteRule(r.id)} title="Delete Rule">
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: "#EF4444" }} />
                    </IconButton>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
          </Paper>
        </fieldset>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: SHARE
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 3 && (

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A" }}>
                Share Form Link
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", mt: 0.3 }}>
                Publish form to generate a public link for respondents.
              </Typography>
            </Box>
            <Chip
              label={version?.is_published ? "Published & Live ✓" : "Draft Mode"}
              color={version?.is_published ? "success" : "warning"}
              sx={{ fontWeight: 800, fontSize: "0.75rem" }}
            />
          </Box>

          {version?.is_published ? (
            <Stack spacing={2.5}>
              {/* Direct Link Section */}
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 0.8 }}>
                  PUBLIC FORM URL
                </Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                  <TextField
                    fullWidth
                    size="small"
                    readOnly
                    value={`${window.location.origin}/public/forms/${version.public_link}`}
                    sx={{ flex: 1, minWidth: 260, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.85rem", bgcolor: "#F8FAFC", fontFamily: "monospace" } }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/public/forms/${version.public_link}`);
                      toast.success("Public link copied to clipboard!", { id: "copy-pub-link" });
                    }}
                    sx={{ px: 2.5, fontWeight: 700, borderRadius: 2, flexShrink: 0 }}
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.open(`${window.location.origin}/public/forms/${version.public_link}`, "_blank")}
                    sx={{ px: 2, fontWeight: 700, borderRadius: 2, flexShrink: 0 }}
                  >
                    Open Form
                  </Button>
                </Box>
              </Box>

              <Divider />

              {/* Compact Feature Grid */}
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#475569", display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Form Settings & Sharing Tools
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  {/* Email Invitation */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      border: "1px solid #E2E8F0",
                      bgcolor: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      "&:hover": { bgcolor: "#EEF2FF", borderColor: "#A5B4FC", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" },
                    }}
                    onClick={() => setOpenEmailShare(true)}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <EmailOutlinedIcon sx={{ color: "#4F46E5", fontSize: 18 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", display: "block", lineHeight: 1.3 }}>
                        Email Invitation
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                        Send invite to respondents
                      </Typography>
                    </Box>
                    <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }} />
                  </Paper>

                  {/* QR Code */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      border: "1px solid #E2E8F0",
                      bgcolor: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      "&:hover": { bgcolor: "#EEF2FF", borderColor: "#A5B4FC", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" },
                    }}
                    onClick={() => setOpenQrCode(true)}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <QrCode2RoundedIcon sx={{ color: "#4F46E5", fontSize: 18 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", display: "block", lineHeight: 1.3 }}>
                        QR Code
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                        Download printable QR
                      </Typography>
                    </Box>
                    <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }} />
                  </Paper>

                  {/* Schedule */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      border: form?.is_scheduling_enabled ? "1px solid #BAE6FD" : "1px solid #E2E8F0",
                      bgcolor: form?.is_scheduling_enabled ? "#F0F9FF" : "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: isViewer ? "default" : "pointer",
                      transition: "all 0.18s ease",
                      opacity: isViewer ? 0.6 : 1,
                      "&:hover": isViewer ? {} : { bgcolor: "#EEF2FF", borderColor: "#A5B4FC", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" },
                    }}
                    onClick={() => !isViewer && setOpenSchedule(true)}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: form?.is_scheduling_enabled ? "#0EA5E9" : "#F1F5F9", border: form?.is_scheduling_enabled ? "none" : "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <EventAvailableRoundedIcon sx={{ color: form?.is_scheduling_enabled ? "#fff" : "#4F46E5", fontSize: 18 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={0.8}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", display: "block", lineHeight: 1.3 }}>
                          Availability Schedule
                        </Typography>
                        {form?.is_scheduling_enabled && (
                          <Chip label="On" color="info" size="small" sx={{ fontWeight: 800, fontSize: "0.6rem", height: 16, "& .MuiChip-label": { px: 0.8 } }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                        {form?.is_scheduling_enabled ? "Schedule active" : "Set open/close times"}
                      </Typography>
                    </Box>
                    <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }} />
                  </Paper>

                  {/* Response Limit */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      border: form?.is_response_limit_enabled ? "1px solid #FECACA" : "1px solid #E2E8F0",
                      bgcolor: form?.is_response_limit_enabled ? "#FFF5F5" : "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: isViewer ? "default" : "pointer",
                      transition: "all 0.18s ease",
                      opacity: isViewer ? 0.6 : 1,
                      "&:hover": isViewer ? {} : { bgcolor: "#EEF2FF", borderColor: "#A5B4FC", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" },
                    }}
                    onClick={() => !isViewer && setOpenResponseLimit(true)}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: form?.is_response_limit_enabled ? "#EF4444" : "#F1F5F9", border: form?.is_response_limit_enabled ? "none" : "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BlockRoundedIcon sx={{ color: form?.is_response_limit_enabled ? "#fff" : "#EF4444", fontSize: 18 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={0.8}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", display: "block", lineHeight: 1.3 }}>
                          Response Limit
                        </Typography>
                        {form?.is_response_limit_enabled && form?.max_response_limit && (
                          <Chip
                            label={`${form.submissions_count ?? 0}/${form.max_response_limit}`}
                            color={(form.submissions_count ?? 0) >= form.max_response_limit ? "error" : "info"}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: "0.6rem", height: 16, "& .MuiChip-label": { px: 0.8 } }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                        {form?.is_response_limit_enabled ? `Max ${form.max_response_limit} responses` : "Cap submissions"}
                      </Typography>
                    </Box>
                    <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }} />
                  </Paper>

                  {/* Password Protection */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      border: form?.is_password_protected ? "1px solid #C7D2FE" : "1px solid #E2E8F0",
                      bgcolor: form?.is_password_protected ? "#EEF2FF" : "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: isViewer ? "default" : "pointer",
                      transition: "all 0.18s ease",
                      opacity: isViewer ? 0.6 : 1,
                      "&:hover": isViewer ? {} : { bgcolor: "#EEF2FF", borderColor: "#A5B4FC", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" },
                    }}
                    onClick={() => !isViewer && setOpenPasswordProtect(true)}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: form?.is_password_protected ? "#4F46E5" : "#F1F5F9", border: form?.is_password_protected ? "none" : "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <VpnKeyRoundedIcon sx={{ color: form?.is_password_protected ? "#fff" : "#4F46E5", fontSize: 18 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={0.8}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", display: "block", lineHeight: 1.3 }}>
                          Password Protection
                        </Typography>
                        {form?.is_password_protected && (
                          <Chip label="On" color="primary" size="small" sx={{ fontWeight: 800, fontSize: "0.6rem", height: 16, "& .MuiChip-label": { px: 0.8 } }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                        {form?.is_password_protected ? "Form is password locked" : "Lock with a password"}
                      </Typography>
                    </Box>
                    <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }} />
                  </Paper>

                  {/* Collaborators — owner only */}
                  {form?.user_role === "owner" && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: "1px solid #E2E8F0",
                        bgcolor: "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                        "&:hover": { bgcolor: "#EEF2FF", borderColor: "#A5B4FC", boxShadow: "0 2px 12px rgba(79,70,229,0.08)" },
                      }}
                      onClick={() => setOpenCollaborators(true)}
                    >
                      <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <GroupAddRoundedIcon sx={{ color: "#4F46E5", fontSize: 18 }} />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#0F172A", display: "block", lineHeight: 1.3 }}>
                          Collaborators
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", display: "block", lineHeight: 1.3 }}>
                          Invite editors & viewers
                        </Typography>
                      </Box>
                      <ArrowForwardRoundedIcon sx={{ color: "#94A3B8", fontSize: 16, flexShrink: 0 }} />
                    </Paper>
                  )}
                </Box>
              </Box>

              {/* Render Modals */}
              <EmailShareModal
                open={openEmailShare}
                onClose={() => setOpenEmailShare(false)}
                form={form}
                publicUrl={`${window.location.origin}/public/forms/${version.public_link}`}
              />

              <QrCodeModal
                open={openQrCode}
                onClose={() => setOpenQrCode(false)}
                form={form}
                publicUrl={`${window.location.origin}/public/forms/${version.public_link}`}
              />

              <FormScheduleModal
                open={openSchedule}
                onClose={() => setOpenSchedule(false)}
                form={form}
                onScheduleUpdated={(updatedForm) => setForm(updatedForm)}
              />

              <ResponseLimitModal
                open={openResponseLimit}
                onClose={() => setOpenResponseLimit(false)}
                form={form}
                onLimitUpdated={(updatedForm) => setForm(updatedForm)}
              />

              <FormPasswordModal
                open={openPasswordProtect}
                onClose={() => setOpenPasswordProtect(false)}
                form={form}
                onPasswordUpdated={(updatedForm) => setForm(updatedForm)}
              />

              <FormCollaboratorsModal
                open={openCollaborators}
                onClose={() => setOpenCollaborators(false)}
                form={form}
              />


            </Stack>

          ) : (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "#FFF7ED", border: "1px solid #FDE68A", borderRadius: 3 }}>
              <InfoOutlinedIcon sx={{ color: "#D97706", fontSize: 40 }} />
              <Typography variant="h6" fontWeight={700} sx={{ color: "#92400E", mt: 1 }}>
                Form is Currently in Draft Mode
              </Typography>
              <Typography variant="body2" sx={{ color: "#B45309", mt: 0.5, mb: 2.5 }}>
                Click the <strong>Publish</strong> button in the top action header bar to generate your public link.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePublishVersion}
                disabled={publishing}
                sx={{ fontWeight: 700, px: 3, py: 1, borderRadius: 2 }}
              >
                {publishing ? "Publishing..." : "Publish Form Now"}
              </Button>
            </Paper>
          )}
        </Paper>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIVE PREVIEW INTERACTIVE MODAL
         ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 0,
            bgcolor: "#FAFAFA",
            maxHeight: "90vh",
          },
        }}
      >
        {/* Modal Header Bar */}
        <Box
          sx={{
            p: 2.5,
            px: 3,
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label="LIVE PREVIEW MODE"
              size="small"
              sx={{ fontWeight: 800, fontSize: "0.68rem", bgcolor: "#EEF2FF", color: "#4F46E5" }}
            />
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0F172A" }}>
              Respondent View
            </Typography>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setOpenPreview(false)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Return to Studio
          </Button>
        </Box>

        <DialogContent sx={{ p: 4, bgcolor: themeConfig.backgroundColor || "#FAFAFA", transition: "all 0.3s ease" }}>
          <Box maxWidth={680} mx="auto" display="flex" flexDirection="column" gap={3}>
            {/* Form Header Card */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                bgcolor: themeConfig.cardColor || "#FFFFFF",
                borderTop: `6px solid ${themeConfig.accentColor || "#4F46E5"}`,
                boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Typography variant="h4" fontWeight={800} sx={{ color: themeConfig.primaryColor || "#0F172A", mb: 1, letterSpacing: "-0.03em" }}>
                {form?.title || "Untitled Form"}
              </Typography>
              {form?.description && (
                <Typography variant="body1" color="text.secondary" sx={{ color: themeConfig.textColor || "#64748B", opacity: 0.85, lineHeight: 1.6 }}>
                  {form.description}
                </Typography>
              )}
            </Paper>

            {/* Questions List */}
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handlePreviewSubmit();
              }}
              display="flex"
              flexDirection="column"
              gap={3}
            >
              {fields.filter((f) => isFieldVisibleInPreview(f.id)).map((f, index) => {
                const hasErr = Boolean(previewErrors[f.id]);
                const isHidden = f.is_hidden || false;
                if (isHidden) return null;

                const isHalf = f.width === "half";
                const isLabelLeft = f.label_position === "left";
                const isLabelRight = f.label_position === "right";
                const isLabelSide = isLabelLeft || isLabelRight;

                return (
                  <Paper
                    key={f.id}
                    elevation={0}
                    sx={{
                      p: 3.5,
                      borderRadius: 3,
                      border: hasErr ? "1.5px solid #EF4444" : "1px solid #E2E8F0",
                      bgcolor: themeConfig.cardColor || "#FFFFFF",
                      boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
                      width: isHalf ? "49%" : "100%",
                      display: "inline-block",
                      verticalAlign: "top",
                    }}
                  >
                    {f.description && (
                      <Typography variant="body2" sx={{ color: themeConfig.textColor || "#64748B", opacity: 0.85, mb: 1.5, lineHeight: 1.6, fontSize: "0.85rem" }}>
                        {f.description}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: isLabelSide ? "flex" : "block",
                        flexDirection: isLabelRight ? "row-reverse" : "row",
                        alignItems: isLabelSide ? "flex-start" : "unset",
                        gap: isLabelSide ? 2 : 0,
                      }}
                    >
                      {/* Header Label */}
                      {!["section_divider", "page_break"].includes(f.field_type) && (
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          sx={{
                            color: themeConfig.textColor || "#0F172A",
                            mb: isLabelSide ? 0 : 1.5,
                            mt: isLabelSide ? 0.7 : 0,
                            fontSize: "0.975rem",
                            minWidth: isLabelSide ? 140 : "unset",
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}. {f.label} {isFieldRequiredInPreview(f) && <span style={{ color: "#EF4444" }}>*</span>}
                        </Typography>
                      )}

                      {/* Input Renderers */}
                      <Box sx={{ mt: isLabelSide ? 0 : 1, flex: 1 }}>
                        {["text", "email", "phone", "url", "password"].includes(f.field_type) && (
                          <TextField
                            fullWidth
                            size="small"
                            disabled={f.is_read_only}
                            type={f.field_type === "password" ? "password" : "text"}
                            placeholder={f.show_placeholder !== false ? (f.placeholder || "Type answer...") : ""}
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [f.id]: e.target.value })}
                            error={hasErr}
                          />
                        )}

                        {f.field_type === "textarea" && (
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            disabled={f.is_read_only}
                            placeholder={f.show_placeholder !== false ? (f.placeholder || "Type detailed answer...") : ""}
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [f.id]: e.target.value })}
                            error={hasErr}
                          />
                        )}

                        {f.field_type === "number" && (
                          <TextField
                            fullWidth
                            type="number"
                            size="small"
                            disabled={f.is_read_only}
                            placeholder={f.show_placeholder !== false ? (f.placeholder || "0") : ""}
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => handlePreviewInputChange(f.id, e.target.value)}
                            error={hasErr}
                          />
                        )}

                        {f.field_type === "formula" && (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              bgcolor: "#F8FAFC",
                              border: String(previewAnswers[f.id] || "").startsWith("ERR:") ? "1.5px solid #FCA5A5" : "1.5px solid #E2E8F0",
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
                              <Typography variant="h5" fontWeight={800} sx={{ color: String(previewAnswers[f.id] || "").startsWith("ERR:") ? "#EF4444" : "#0F172A" }}>
                                {formatFormulaValue(previewAnswers[f.id], f.decimal_places, f.number_prefix, f.number_suffix)}
                              </Typography>
                              {String(previewAnswers[f.id] || "").startsWith("ERR:") && (
                                <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 600, display: "block", mt: 0.5 }}>
                                  {previewAnswers[f.id]}
                                </Typography>
                              )}
                            </Box>
                            <Chip label="Auto-Calculated" size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700, fontSize: "0.75rem" }} />
                          </Paper>
                        )}

                        {f.field_type === "date" && (
                          <TextField
                            fullWidth
                            type="date"
                            size="small"
                            disabled={f.is_read_only}
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [f.id]: e.target.value })}
                            error={hasErr}
                          />
                        )}

                        {f.field_type === "time" && (
                          <TextField
                            fullWidth
                            type="time"
                            size="small"
                            disabled={f.is_read_only}
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [f.id]: e.target.value })}
                            error={hasErr}
                          />
                        )}

                        {["select", "dropdown"].includes(f.field_type) && (
                          <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            disabled={f.is_read_only}
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [f.id]: e.target.value })}
                            error={hasErr}
                          >
                            <MenuItem value="" disabled>
                              {f.placeholder || "Select option..."}
                            </MenuItem>
                            {(f.options || []).map((o) => (
                              <MenuItem key={o.id} value={o.option_text}>
                                {o.option_text}
                              </MenuItem>
                            ))}
                          </Select>
                        )}

                        {f.field_type === "radio" && (
                          <RadioGroup
                            value={previewAnswers[f.id] || ""}
                            onChange={(e) => setPreviewAnswers({ ...previewAnswers, [f.id]: e.target.value })}
                          >
                            {(f.options || []).map((o) => (
                              <FormControlLabel key={o.id} value={o.option_text} control={<Radio size="small" disabled={f.is_read_only} sx={{ "&.Mui-checked": { color: themeConfig.accentColor || "#4F46E5" } }} />} label={o.option_text} />
                            ))}
                          </RadioGroup>
                        )}

                        {f.field_type === "checkbox" && (
                          <Stack spacing={0.5}>
                            {(f.options || []).map((o) => {
                              const currentArr = Array.isArray(previewAnswers[f.id]) ? previewAnswers[f.id] : [];
                              const checked = currentArr.includes(o.option_text);
                              return (
                                <FormControlLabel
                                  key={o.id}
                                  control={
                                    <MuiCheckbox
                                      size="small"
                                      checked={checked}
                                      disabled={f.is_read_only}
                                      onChange={(e) => {
                                        let updated;
                                        if (e.target.checked) {
                                          updated = [...currentArr, o.option_text];
                                        } else {
                                          updated = currentArr.filter((val) => val !== o.option_text);
                                        }
                                        setPreviewAnswers({ ...previewAnswers, [f.id]: updated });
                                      }}
                                      sx={{ "&.Mui-checked": { color: themeConfig.accentColor || "#4F46E5" } }}
                                    />
                                  }
                                  label={o.option_text}
                                />
                              );
                            })}
                          </Stack>
                        )}

                        {f.field_type === "yes_no" && (
                          <Stack direction="row" spacing={2} mt={0.5}>
                            {["Yes", "No"].map((opt) => (
                              <Button
                                key={opt}
                                variant={previewAnswers[f.id] === opt ? "contained" : "outlined"}
                                size="small"
                                disabled={f.is_read_only}
                                onClick={() => setPreviewAnswers({ ...previewAnswers, [f.id]: opt })}
                                sx={{
                                  borderRadius: 2,
                                  minWidth: 90,
                                  bgcolor: previewAnswers[f.id] === opt ? (themeConfig.buttonColor || "#0F172A") : "transparent",
                                  borderColor: themeConfig.buttonColor || "#0F172A",
                                  color: previewAnswers[f.id] === opt ? "#FFFFFF" : (themeConfig.textColor || "#0F172A"),
                                }}
                              >
                                {opt}
                              </Button>
                            ))}
                          </Stack>
                        )}

                        {f.field_type === "rating" && (
                          <Rating
                            value={Number(previewAnswers[f.id]) || 0}
                            onChange={(e, val) => setPreviewAnswers({ ...previewAnswers, [f.id]: val })}
                            readOnly={f.is_read_only}
                          />
                        )}

                        {f.field_type === "linear_scale" && (
                          <Box px={1} pt={1}>
                            <Slider
                              value={Number(previewAnswers[f.id]) || 5}
                              onChange={(e, val) => setPreviewAnswers({ ...previewAnswers, [f.id]: val })}
                              step={1}
                              min={1}
                              max={10}
                              valueLabelDisplay="auto"
                              disabled={f.is_read_only}
                              sx={{ color: themeConfig.accentColor || "#4F46E5" }}
                            />
                          </Box>
                        )}

                        {["file_upload", "image_upload"].includes(f.field_type) && (
                          <Paper elevation={0} sx={{ p: 3, border: "1px dashed #CBD5E1", borderRadius: 2, textAlign: "center", bgcolor: "rgba(0,0,0,0.02)" }}>
                            <AttachFileOutlinedIcon sx={{ color: themeConfig.accentColor || "#4F46E5", fontSize: 24 }} />
                            <Typography variant="body2" fontWeight={600} sx={{ color: themeConfig.textColor || "#0F172A", mt: 0.5 }}>
                              Click or drag file to test upload
                            </Typography>
                          </Paper>
                        )}

                        {f.field_type === "signature" && (
                          <Paper elevation={0} sx={{ p: 3, border: "1px dashed #CBD5E1", borderRadius: 2, textAlign: "center", bgcolor: "rgba(0,0,0,0.02)" }}>
                            <DrawRoundedIcon sx={{ color: themeConfig.accentColor || "#4F46E5", fontSize: 24 }} />
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                              Sign below using mouse or touch
                            </Typography>
                          </Paper>
                        )}

                        {f.field_type === "heading" && (
                          <Typography variant="h5" fontWeight={800} sx={{ color: themeConfig.primaryColor || "#0F172A" }}>
                            {f.label}
                          </Typography>
                        )}

                        {f.field_type === "description" && (
                          <Typography variant="body1" sx={{ color: "#475569", lineHeight: 1.7 }}>
                            {f.placeholder || f.description || "Descriptive block text."}
                          </Typography>
                        )}

                        {f.field_type === "section_divider" && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </Box>
                    </Box>

                    {f.help_text && (
                      <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 1, fontSize: "0.75rem" }}>
                        {f.help_text}
                      </Typography>
                    )}

                    {hasErr && (
                      <Typography variant="caption" color="error" sx={{ fontWeight: 600, mt: 1, display: "block" }}>
                        This question is required.
                      </Typography>
                    )}
                  </Paper>
                );
              })}

              {/* Submit Action */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Preview Mode • Submissions do not create database records.
                </Typography>
                <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700, px: 3.5, py: 1, borderRadius: 2 }}>
                  Submit Test Response
                </Button>
              </Paper>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <Button variant="outlined" onClick={() => setOpenPreview(false)} sx={{ fontWeight: 600 }}>
            Close Preview &amp; Return to Studio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Form Schema Dialog Modal */}
      <Dialog open={openCreate} onClose={() => { if (formId) setOpenCreate(false); else navigate("/forms"); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Create New Form Schema
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Form Title"
              fullWidth
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. Customer Survey 2026"
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Briefly describe the purpose of this form..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="outlined" onClick={() => navigate("/forms")} disabled={creating} sx={{ borderColor: "#E2E8F0" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!createTitle.trim()) {
                toast.error("Form title is required");
                return;
              }

              try {
                setCreating(true);
                const formRes = await api.post(
                  "/forms/",
                  { title: createTitle, description: createDesc },
                  { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                );
                const newForm = formRes.data;

                await api.post("/form-versions/", {
                  form_id: newForm.id,
                  version_number: 1,
                });

                toast.success("Form created successfully!");
                setOpenCreate(false);
                navigate(`/create-form?id=${newForm.id}`);
              } catch (err) {
                console.error(err);
                toast.error("Failed to create form");
              } finally {
                setCreating(false);
              }
            }}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon sx={{ fontSize: 16 }} />}
          >
            {creating ? "Creating..." : "Create & Edit"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Form Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Delete Form Permanently?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>"{form?.title}"</strong> (ID #{form?.id})?
          </Typography>
          <Typography variant="caption" sx={{ color: "#DC2626", display: "block", mt: 1.5, fontWeight: 700 }}>
            ⚠️ This will permanently remove all questions, logic rules, versions, and respondent submissions. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenDeleteConfirm(false)} disabled={deletingForm}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteForm}
            disabled={deletingForm}
            startIcon={deletingForm ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ fontWeight: 700 }}
          >
            {deletingForm ? "Deleting..." : "Delete Form"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Form Reset Confirmation Dialog */}
      <Dialog
        open={openResetConfirm}
        onClose={() => setOpenResetConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>
          Create New Form?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ color: "#64748B", lineHeight: 1.6 }}>
            Are you sure you want to start a new form schema? Any unsaved changes on <strong>"{form?.title}"</strong> will be discarded.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenResetConfirm(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleConfirmResetForm} sx={{ fontWeight: 700 }}>
            Start New Form
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          LIVE LOGIC TESTING STUDIO & ANSWER SIMULATOR DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={openTestLogic}
        onClose={() => setOpenTestLogic(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, overflow: "hidden" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFFFFF",
            py: 2.5,
            px: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <PlayCircleOutlineRoundedIcon sx={{ color: "#818CF8", fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#FFFFFF", lineHeight: 1.2 }}>
                Live Logic Testing Studio ⭐
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                Simulate respondent answers in real time and evaluate conditional visibility, dynamic requirements, and skip branching logic.
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              onClick={() => setTestAnswers({})}
              sx={{ color: "#CBD5E1", borderColor: "#475569", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}
            >
              Reset Answers
            </Button>
            <IconButton size="small" onClick={() => setOpenTestLogic(false)} sx={{ color: "#94A3B8" }}>
              ✕
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
          <Grid container spacing={3}>
            {/* LEFT COLUMN: SIMULATED ANSWER INPUTS */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", height: "100%" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                  📝 Simulated Respondent Inputs
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Enter or select simulated values for form questions to trigger conditional logic rules:
                </Typography>

                <Stack spacing={2} sx={{ maxHeight: 520, overflowY: "auto", pr: 0.5 }}>
                  {fields.map((f, idx) => {
                    if (["section_divider", "page_break"].includes(f.field_type)) return null;

                    const curVal = testAnswers[f.id] ?? "";
                    const opts = getParsedOptions(f);

                    return (
                      <Box key={f.id} sx={{ p: 1.8, borderRadius: 2, border: "1px solid #E2E8F0", bgcolor: "#FAFAFA" }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#475569", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                          Q{idx + 1}. {f.label} ({f.field_type})
                        </Typography>

                        {/* Choice fields with dropdown selection */}
                        {["dropdown", "radio", "select"].includes(f.field_type) ? (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={curVal}
                            onChange={(e) => setTestAnswers({ ...testAnswers, [f.id]: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.8, bgcolor: "#FFFFFF" } }}
                          >
                            <MenuItem value="">-- Select Choice --</MenuItem>
                            {opts.map((o) => (
                              <MenuItem key={o.id} value={o.text}>
                                {o.text}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : f.field_type === "yes_no" ? (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={curVal}
                            onChange={(e) => setTestAnswers({ ...testAnswers, [f.id]: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.8, bgcolor: "#FFFFFF" } }}
                          >
                            <MenuItem value="">-- Select Yes/No --</MenuItem>
                            <MenuItem value="Yes">Yes</MenuItem>
                            <MenuItem value="No">No</MenuItem>
                          </TextField>
                        ) : f.field_type === "checkbox" ? (
                          <TextField
                            placeholder="Comma-separated selected options (e.g. AI/ML, Python)"
                            fullWidth
                            size="small"
                            value={Array.isArray(curVal) ? curVal.join(", ") : curVal}
                            onChange={(e) => {
                              const vals = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                              setTestAnswers({ ...testAnswers, [f.id]: vals });
                            }}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.8, bgcolor: "#FFFFFF" } }}
                          />
                        ) : ["number", "rating", "linear_scale", "slider"].includes(f.field_type) ? (
                          <TextField
                            type="number"
                            placeholder="Enter numeric score/age..."
                            fullWidth
                            size="small"
                            value={curVal}
                            onChange={(e) => setTestAnswers({ ...testAnswers, [f.id]: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.8, bgcolor: "#FFFFFF" } }}
                          />
                        ) : (
                          <TextField
                            placeholder="Type simulated answer text..."
                            fullWidth
                            size="small"
                            value={curVal}
                            onChange={(e) => setTestAnswers({ ...testAnswers, [f.id]: e.target.value })}
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.8, bgcolor: "#FFFFFF" } }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>

            {/* RIGHT COLUMN: REAL-TIME EVALUATION RESULTS */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", height: "100%" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", display: "flex", alignItems: "center", gap: 1 }}>
                    ⚡ Real-Time Logic Evaluation Results
                  </Typography>
                  <Chip
                    label="Live Evaluated"
                    size="small"
                    sx={{ fontWeight: 800, fontSize: "0.65rem", bgcolor: "#ECFDF5", color: "#059669" }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Formify evaluates dynamic visibility, required/optional states, and page/section skips live:
                </Typography>

                <Stack spacing={1.5} sx={{ maxHeight: 520, overflowY: "auto", pr: 0.5 }}>
                  {fields.map((f, idx) => {
                    const isSkipped = isFieldSkippedByBranching(f.id, testAnswers);
                    const isVisible = isFieldVisibleInPreview(f.id, testAnswers);
                    const isReq = isFieldRequiredInPreview(f, testAnswers);

                    let statusLabel = "VISIBLE";
                    let statusBg = "#ECFDF5";
                    let statusColor = "#059669";

                    if (isSkipped) {
                      statusLabel = "SKIPPED";
                      statusBg = "#F3E8FF";
                      statusColor = "#7E22CE";
                    } else if (!isVisible) {
                      statusLabel = "HIDDEN";
                      statusBg = "#FEF2F2";
                      statusColor = "#DC2626";
                    }

                    let reqLabel = isReq ? "REQUIRED" : "OPTIONAL";
                    let reqBg = isReq ? "#FFFBEB" : "#F1F5F9";
                    let reqColor = isReq ? "#D97706" : "#64748B";

                    let categoryPrefix = "";
                    if (f.field_type === "section_divider") categoryPrefix = "📁 Section: ";
                    else if (f.field_type === "page_break") categoryPrefix = "📄 Page Break: ";

                    return (
                      <Paper
                        key={f.id}
                        elevation={0}
                        sx={{
                          p: 1.8,
                          borderRadius: 2,
                          border: "1px solid #CBD5E1",
                          bgcolor: isSkipped ? "#FAF5FF" : !isVisible ? "#FEF2F2" : "#FFFFFF",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box flex={1} pr={2}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#0F172A" }}>
                            {categoryPrefix}{f.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                            Field #{idx + 1} ({f.field_type})
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {/* Visibility / Skip Status Chip */}
                          <Chip
                            label={statusLabel}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              height: 24,
                              bgcolor: statusBg,
                              color: statusColor,
                              border: `1px solid ${statusColor}33`,
                            }}
                          />

                          {/* Requirement Chip (Only for questions) */}
                          {!["section_divider", "page_break"].includes(f.field_type) && !isSkipped && isVisible && (
                            <Chip
                              label={reqLabel}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                height: 22,
                                bgcolor: reqBg,
                                color: reqColor,
                              }}
                            />
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenTestLogic(false)}
            sx={{ fontWeight: 800, borderRadius: 2, px: 4, py: 1 }}
          >
            Close Testing Studio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Form Settings Modal */}
      <Dialog
        open={openSettingsModal}
        onClose={() => setOpenSettingsModal(false)}
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
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            pt: 2.5,
            px: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #E2E8F0",
              }}
            >
              <SettingsRoundedIcon sx={{ color: "#4F46E5", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ color: "#0F172A", fontSize: "1.15rem" }}
              >
                Form Settings
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configure your form's basic details and visibility status
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setOpenSettingsModal(false)} sx={{ color: "#64748B" }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Form Title */}
            <Box>
              <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 1, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Form Title <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter form title..."
                value={form?.title || ""}
                onChange={(e) => handleFormMetaChange("title", e.target.value)}
                error={Boolean(titleError)}
                helperText={titleError || "The title appears at the top of your public form."}
                inputProps={{ maxLength: 200 }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Box>

            {/* Form Description */}
            <Box>
              <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 1, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Description (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Describe the purpose of this form..."
                value={form?.description || ""}
                onChange={(e) => handleFormMetaChange("description", e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Box>

            {/* Category & Status in 2 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <Box>
                <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 1, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Category
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={form?.category || "General"}
                  onChange={(e) => handleFormMetaChange("category", e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {FORM_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 1, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Status
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={form?.status || "draft"}
                  onChange={(e) => handleFormMetaChange("status", e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="draft">Draft (Private edit)</MenuItem>
                  <MenuItem value="published">Published (Live to public)</MenuItem>
                  <MenuItem value="archived">Archived (Closed to responses)</MenuItem>
                </Select>
              </Box>
            </Box>

            <Divider />

            {/* Metadata Bottom Bar */}
            <Box display="flex" flexWrap="wrap" gap={{ xs: 2, sm: 3 }} sx={{ py: 0.5 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonOutlineRoundedIcon sx={{ color: "#94A3B8", fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                  Owner: <strong>{form?.owner_name || form?.owner_email || "Form Admin"}</strong>
                </Typography>
              </Box>
              {form?.created_at && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarTodayOutlinedIcon sx={{ color: "#94A3B8", fontSize: 14 }} />
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                    Created: <strong>{new Date(form.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</strong>
                  </Typography>
                </Box>
              )}
              {form?.updated_at && (
                <Box display="flex" alignItems="center" gap={1}>
                  <UpdateRoundedIcon sx={{ color: "#94A3B8", fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                    Updated: <strong>{new Date(form.updated_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</strong>
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}
        >
          <Button
            variant="outlined"
            onClick={() => setOpenSettingsModal(false)}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              borderColor: "#CBD5E1",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={async () => {
              await handleSaveDraft();
              setOpenSettingsModal(false);
            }}
            startIcon={<SaveRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Form Doctor Audit & Fix Drawer */}
      <AIFormDoctorDrawer
        open={openDoctorDrawer}
        onClose={() => setOpenDoctorDrawer(false)}
        form={form}
        fields={fields}
        conditionalRules={rules}
        onApplyFix={handleApplyDoctorFix}
      />

      {/* AI Form Simulator Modal */}
      <AIFormSimulatorModal
        open={openSimulatorModal}
        onClose={() => setOpenSimulatorModal(false)}
        form={form}
        fields={fields}
        conditionalRules={rules}
        onApplyFix={handleApplyDoctorFix}
      />

      {/* Micro-Verification & Security Modal */}
      <FormVerificationModal
        open={openVerificationModal}
        onClose={() => setOpenVerificationModal(false)}
        form={form}
        onVerificationUpdated={(updatedForm) => {
          setForm(updatedForm);
          loadFormData();
        }}
      />
    </Box>
  );
}