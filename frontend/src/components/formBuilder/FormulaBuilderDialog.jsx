import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import {
  extractReferencedFieldIds,
  evaluateMathExpression,
  calculateFieldValue,
  formatFormulaValue,
  detectCircularDependency,
} from "../../utils/formulaEngine";

const OPERATORS = [
  { label: "+", val: " + ", desc: "Addition" },
  { label: "−", val: " - ", desc: "Subtraction" },
  { label: "×", val: " * ", desc: "Multiplication" },
  { label: "÷", val: " / ", desc: "Division" },
  { label: "%", val: "%", desc: "Percentage" },
  { label: "(", val: "(", desc: "Open Parenthesis" },
  { label: ")", val: ")", desc: "Close Parenthesis" },
];

export default function FormulaBuilderDialog({
  open,
  onClose,
  field,
  allFields = [],
  onSave,
}) {
  const [expression, setExpression] = useState(field?.formula_expression || "");
  const [decimalPlaces, setDecimalPlaces] = useState(field?.decimal_places ?? 2);
  const [prefix, setPrefix] = useState(field?.number_prefix || "");
  const [suffix, setSuffix] = useState(field?.number_suffix || "");

  const [testValues, setTestValues] = useState({});

  useEffect(() => {
    if (field) {
      setExpression(field.formula_expression || "");
      setDecimalPlaces(field.decimal_places ?? 2);
      setPrefix(field.number_prefix || "");
      setSuffix(field.number_suffix || "");
    }
  }, [field, open]);

  // Available candidate fields (excluding current field and non-scalar layout blocks)
  const availableFields = useMemo(() => {
    return (allFields || []).filter(
      (f) =>
        f.id !== field?.id &&
        !["heading", "description", "section_divider", "page_break", "image", "video"].includes(f.field_type)
    );
  }, [allFields, field?.id]);

  const fieldsMap = useMemo(() => {
    const map = {};
    for (const f of allFields || []) {
      if (f && f.id) map[f.id] = f;
    }
    return map;
  }, [allFields]);

  // Extracted field IDs in formula
  const referencedIds = useMemo(() => {
    return extractReferencedFieldIds(expression);
  }, [expression]);

  // Validate formula syntax & check circular dependency
  const validationStatus = useMemo(() => {
    if (!expression.trim()) {
      return { isValid: false, message: "Enter a formula expression using fields and operators below." };
    }

    if (field?.id && detectCircularDependency(fieldsMap, field.id)) {
      return { isValid: false, message: "Circular reference detected! A formula field cannot reference itself." };
    }

    // Try evaluating with mock test values
    const sampleAnswers = {};
    for (const id of referencedIds) {
      sampleAnswers[id] = testValues[id] !== undefined ? testValues[id] : 10;
    }

    const calcRes = calculateFieldValue(expression, sampleAnswers, allFields, field?.id);
    if (!calcRes.isValid) {
      return { isValid: false, message: calcRes.error || "Syntax error in formula expression." };
    }

    return { isValid: true, sampleResult: calcRes.rawValue };
  }, [expression, referencedIds, testValues, allFields, field?.id, fieldsMap]);

  const handleInsertToken = (token) => {
    setExpression((prev) => `${prev}${token}`);
  };

  const handleSave = () => {
    onSave({
      formula_expression: expression.trim(),
      decimal_places: Number(decimalPlaces),
      number_prefix: prefix,
      number_suffix: suffix,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 0.5,
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.18)",
        },
      }}
    >
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center" pb={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(79, 70, 229, 0.30)",
            }}
          >
            <CalculateRoundedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#0F172A", lineHeight: 1.2 }}>
              Formula & Calculation Builder
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
              Create cross-field mathematical expressions for live calculations
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8" }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ my: 0.5 }} />

      <DialogContent sx={{ py: 2 }}>
        <Stack spacing={2.5}>
          {/* Formula Canvas Input */}
          <Box>
            <Typography variant="caption" fontWeight={800} sx={{ color: "#334155", display: "block", mb: 0.8, fontSize: "0.78rem" }}>
              Formula Expression
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. {field_101} * {field_102} - ({field_101} * 10%)"
              InputProps={{
                sx: {
                  borderRadius: 2.5,
                  fontSize: "0.95rem",
                  fontFamily: "monospace",
                  bgcolor: "#F8FAFC",
                  fontWeight: 600,
                },
              }}
            />
          </Box>

          {/* Validation Status Indicator */}
          {validationStatus.isValid ? (
            <Alert severity="success" icon={<CheckCircleRoundedIcon fontSize="inherit" />} sx={{ borderRadius: 2.5, fontWeight: 600, fontSize: "0.85rem" }}>
              Valid Formula Syntax — Sample Result:{" "}
              <strong>{formatFormulaValue(validationStatus.sampleResult, decimalPlaces, prefix, suffix)}</strong>
            </Alert>
          ) : (
            <Alert severity="warning" icon={<ErrorOutlineRoundedIcon fontSize="inherit" />} sx={{ borderRadius: 2.5, fontWeight: 600, fontSize: "0.85rem" }}>
              {validationStatus.message}
            </Alert>
          )}

          {/* Insert Operators Keypad */}
          <Box>
            <Typography variant="caption" fontWeight={800} sx={{ color: "#475569", display: "block", mb: 1, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Math Operators & Symbols
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {OPERATORS.map((op) => (
                <Tooltip key={op.label} title={op.desc} arrow>
                  <Chip
                    label={op.label}
                    onClick={() => handleInsertToken(op.val)}
                    clickable
                    sx={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      px: 1,
                      height: 34,
                      bgcolor: "#EEF2FF",
                      color: "#4338CA",
                      border: "1px solid #C7D2FE",
                      "&:hover": { bgcolor: "#E0E7FF" },
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Box>

          {/* Available Fields Picker */}
          <Box>
            <Typography variant="caption" fontWeight={800} sx={{ color: "#475569", display: "block", mb: 1, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Insert Field Variable (Click to add to formula)
            </Typography>
            {availableFields.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No numeric fields available in form canvas yet. Add Number or Short Text fields first.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} maxHeight={130} sx={{ overflowY: "auto" }}>
                {availableFields.map((f) => (
                  <Chip
                    key={f.id}
                    icon={<AddRoundedIcon sx={{ fontSize: "14px !important" }} />}
                    label={`${f.label} ({field_${f.id}})`}
                    onClick={() => handleInsertToken(`{field_${f.id}}`)}
                    clickable
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      bgcolor: "#F1F5F9",
                      color: "#1E293B",
                      border: "1px solid #CBD5E1",
                      "&:hover": { bgcolor: "#E2E8F0", borderColor: "#94A3B8" },
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Formatting & Precision Settings */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: "#FAFAFA", border: "1px solid #E2E8F0" }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", mb: 1.5, fontSize: "0.82rem" }}>
              Number Formatting & Currency Symbols
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="decimals-select-label">Decimal Places</InputLabel>
                <Select
                  labelId="decimals-select-label"
                  value={decimalPlaces}
                  label="Decimal Places"
                  onChange={(e) => setDecimalPlaces(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value={0}>0 (Whole Number)</MenuItem>
                  <MenuItem value={1}>1 Decimal (0.0)</MenuItem>
                  <MenuItem value={2}>2 Decimals (0.00)</MenuItem>
                  <MenuItem value={3}>3 Decimals (0.000)</MenuItem>
                  <MenuItem value={4}>4 Decimals (0.0000)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Prefix (e.g. $, €)"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              <TextField
                size="small"
                label="Suffix (e.g. %, USD, kg)"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Stack>
          </Paper>

          {/* Live Test Runner with Sample Values */}
          {referencedIds.length > 0 && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <PlayArrowRoundedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0F172A", fontSize: "0.82rem" }}>
                  Live Test Calculation Runner
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1.5}>
                {referencedIds.map((id) => {
                  const targetF = fieldsMap[id];
                  return (
                    <TextField
                      key={id}
                      size="small"
                      type="number"
                      label={targetF ? targetF.label : `Field ${id}`}
                      value={testValues[id] !== undefined ? testValues[id] : 10}
                      onChange={(e) => setTestValues({ ...testValues, [id]: e.target.value })}
                      sx={{ width: 150, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  );
                })}
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: "#FAFAFA", borderTop: "1px solid #E2E8F0" }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2.5, px: 3, textTransform: "none", fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!validationStatus.isValid}
          startIcon={<FunctionsRoundedIcon />}
          sx={{
            borderRadius: 2.5,
            px: 3.5,
            py: 1,
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
          }}
        >
          Save Formula
        </Button>
      </DialogActions>
    </Dialog>
  );
}
