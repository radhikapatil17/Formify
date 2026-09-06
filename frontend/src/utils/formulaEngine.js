/**
 * Formula Evaluation Engine for Formify
 * Supports: +, -, *, /, %, (), variable substitution ({field_123}),
 * percentage calculations, circular dependency detection, and decimal/currency formatting.
 */

// Extract field IDs referenced in a formula (e.g. "{field_101}" -> 101 or "{101}" -> 101)
export function extractReferencedFieldIds(formulaStr) {
  if (!formulaStr || typeof formulaStr !== "string") return [];
  const matches = formulaStr.match(/\{field_(\d+)\}/g) || formulaStr.match(/\{(\d+)\}/g) || [];
  const ids = matches.map((m) => {
    const numMatch = m.match(/\d+/);
    return numMatch ? Number(numMatch[0]) : null;
  }).filter(Boolean);
  return Array.from(new Set(ids));
}

// Detect circular dependencies using DFS graph cycle detection
export function detectCircularDependency(fieldsMap, startFieldId) {
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(fieldId) {
    if (recursionStack.has(fieldId)) return true; // Cycle detected!
    if (visited.has(fieldId)) return false;

    visited.add(fieldId);
    recursionStack.add(fieldId);

    const fieldObj = fieldsMap[fieldId];
    if (fieldObj && fieldObj.field_type === "formula" && fieldObj.formula_expression) {
      const deps = extractReferencedFieldIds(fieldObj.formula_expression);
      for (const depId of deps) {
        if (dfs(depId)) return true;
      }
    }

    recursionStack.delete(fieldId);
    return false;
  }

  return dfs(startFieldId);
}

// Safely parse and evaluate math expression string without unsafe raw eval
export function evaluateMathExpression(exprString) {
  if (!exprString || typeof exprString !== "string") return { isValid: false, value: 0, error: "Empty expression" };

  let cleanExpr = exprString.trim();

  // Handle percentages e.g. "10%" -> "0.1", "50%" -> "0.5"
  cleanExpr = cleanExpr.replace(/(\d+(?:\.\d+)?)%/g, (match, p1) => {
    return String(Number(p1) / 100);
  });

  // Check for invalid characters (allow numbers, +, -, *, /, (, ), ., whitespace)
  if (/[^0-9\+\-\*\/\(\)\.\s]/.test(cleanExpr)) {
    return { isValid: false, value: 0, error: "Contains invalid mathematical characters or unresolved references" };
  }

  // Check for division by zero
  if (/\/0(?!\.)/.test(cleanExpr) || /\/\s*0(?!\.)/.test(cleanExpr)) {
    return { isValid: false, value: 0, error: "Division by zero" };
  }

  try {
    // Safe function evaluator with clean math context
    const safeEval = new Function(`
      "use strict";
      return (${cleanExpr});
    `);

    const result = safeEval();

    if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
      return { isValid: false, value: 0, error: "Invalid numerical result" };
    }

    return { isValid: true, value: result, error: null };
  } catch (err) {
    return { isValid: false, value: 0, error: "Syntax error in expression" };
  }
}

// Evaluate formula field with live respondent answers map
export function calculateFieldValue(formulaExpression, answersMap = {}, fieldsList = [], currentFieldId = null) {
  if (!formulaExpression || typeof formulaExpression !== "string") {
    return { isValid: false, rawValue: 0, formattedValue: "", error: "No formula defined" };
  }

  // Build field mapping
  const fieldsMap = {};
  if (Array.isArray(fieldsList)) {
    for (const f of fieldsList) {
      if (f && f.id) fieldsMap[f.id] = f;
    }
  }

  // Check for circular reference
  if (currentFieldId && detectCircularDependency(fieldsMap, currentFieldId)) {
    return { isValid: false, rawValue: 0, formattedValue: "Error: Circular Reference", error: "Circular reference detected in formula" };
  }

  // Replace {field_123} or {123} tokens with live numeric answers
  let expr = formulaExpression;
  const refIds = extractReferencedFieldIds(formulaExpression);

  for (const id of refIds) {
    let rawVal = answersMap[id];

    // If referenced field is itself a formula field, recursively calculate it
    const refField = fieldsMap[id];
    if (refField && refField.field_type === "formula" && refField.formula_expression) {
      const subRes = calculateFieldValue(refField.formula_expression, answersMap, fieldsList, id);
      rawVal = subRes.isValid ? subRes.rawValue : 0;
    }

    let numVal = 0;
    if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
      const parsed = Number(rawVal);
      numVal = isNaN(parsed) ? 0 : parsed;
    }

    // Replace all occurrences of {field_id} or {id}
    const tokenRegex1 = new RegExp(`\\{field_${id}\\}`, "g");
    const tokenRegex2 = new RegExp(`\\{${id}\\}`, "g");
    expr = expr.replace(tokenRegex1, String(numVal)).replace(tokenRegex2, String(numVal));
  }

  const evalRes = evaluateMathExpression(expr);
  if (!evalRes.isValid) {
    return {
      isValid: false,
      rawValue: 0,
      formattedValue: evalRes.error || "Formula Error",
      error: evalRes.error,
    };
  }

  return {
    isValid: true,
    rawValue: evalRes.value,
    formattedValue: String(evalRes.value),
    error: null,
  };
}

// Format numeric value with decimal places, prefix, and suffix
export function formatFormulaValue(val, decimalPlaces = 2, prefix = "", suffix = "") {
  if (val === undefined || val === null || isNaN(Number(val))) {
    return `${prefix || ""}0${suffix || ""}`;
  }

  const num = Number(val);
  const decimals = typeof decimalPlaces === "number" && decimalPlaces >= 0 ? decimalPlaces : 2;
  const numStr = num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix || ""}${numStr}${suffix || ""}`;
}

// Evaluate all formula fields in a form schema against current answers map
export function evaluateAllFormulas(fieldsList = [], answersMap = {}) {
  const updatedAnswers = { ...answersMap };
  const formulaFields = (fieldsList || []).filter((f) => f.field_type === "formula" && f.formula_expression);

  for (const f of formulaFields) {
    const calcRes = calculateFieldValue(f.formula_expression, updatedAnswers, fieldsList, f.id);
    if (calcRes.isValid) {
      const formatted = formatFormulaValue(calcRes.rawValue, f.decimal_places ?? 2, f.number_prefix ?? "", f.number_suffix ?? "");
      updatedAnswers[f.id] = formatted;
    } else {
      updatedAnswers[f.id] = calcRes.formattedValue || "0";
    }
  }

  return updatedAnswers;
}
