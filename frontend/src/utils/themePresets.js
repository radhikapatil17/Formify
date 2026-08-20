export const PRESET_THEMES = [
  {
    id: "default",
    name: "Default",
    description: "Clean Slate & Off-White SaaS style",
    primaryColor: "#0F172A",
    backgroundColor: "#FAFAFA",
    textColor: "#0F172A",
    buttonColor: "#0F172A",
    accentColor: "#4F46E5",
    cardColor: "#FFFFFF",
    previewGradient: "linear-gradient(135deg, #0F172A 0%, #334155 100%)",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Vibrant Cyan & Marine Blue",
    primaryColor: "#0369A1",
    backgroundColor: "#F0F9FF",
    textColor: "#0C4A6E",
    buttonColor: "#0284C7",
    accentColor: "#38BDF8",
    cardColor: "#FFFFFF",
    previewGradient: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
  },
  {
    id: "purple",
    name: "Purple",
    description: "Royal Indigo & Soft Lavender",
    primaryColor: "#6D28D9",
    backgroundColor: "#F5F3FF",
    textColor: "#4C1D95",
    buttonColor: "#7C3AED",
    accentColor: "#A78BFA",
    cardColor: "#FFFFFF",
    previewGradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
  },
  {
    id: "green",
    name: "Green",
    description: "Fresh Emerald & Sage",
    primaryColor: "#047857",
    backgroundColor: "#ECFDF5",
    textColor: "#064E3B",
    buttonColor: "#059669",
    accentColor: "#34D399",
    cardColor: "#FFFFFF",
    previewGradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  },
  {
    id: "orange",
    name: "Orange",
    description: "Warm Sunset & Amber",
    primaryColor: "#C2410C",
    backgroundColor: "#FFF7ED",
    textColor: "#7C2D12",
    buttonColor: "#EA580C",
    accentColor: "#FB923C",
    cardColor: "#FFFFFF",
    previewGradient: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Sleek Midnight Slate Contrast",
    primaryColor: "#F8FAFC",
    backgroundColor: "#0F172A",
    textColor: "#F8FAFC",
    buttonColor: "#6366F1",
    accentColor: "#818CF8",
    cardColor: "#1E293B",
    previewGradient: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
  },
];

export const DEFAULT_FORM_THEME = PRESET_THEMES[0];

export function parseFormTheme(themeConfigRaw) {
  if (!themeConfigRaw) return DEFAULT_FORM_THEME;
  try {
    const parsed = typeof themeConfigRaw === "string" ? JSON.parse(themeConfigRaw) : themeConfigRaw;
    return {
      preset: parsed.preset || "default",
      primaryColor: parsed.primaryColor || DEFAULT_FORM_THEME.primaryColor,
      backgroundColor: parsed.backgroundColor || DEFAULT_FORM_THEME.backgroundColor,
      textColor: parsed.textColor || DEFAULT_FORM_THEME.textColor,
      buttonColor: parsed.buttonColor || DEFAULT_FORM_THEME.buttonColor,
      accentColor: parsed.accentColor || DEFAULT_FORM_THEME.accentColor,
      cardColor: parsed.cardColor || (parsed.preset === "dark" ? "#1E293B" : "#FFFFFF"),
    };
  } catch {
    return DEFAULT_FORM_THEME;
  }
}
