export const theme = {
  name: "Ocean Professional",
  colors: {
    primary: "#2563EB", // blue-600
    secondary: "#F59E0B", // amber-500
    success: "#10B981", // teal/green
    error: "#EF4444", // red-500
    background: "#f9fafb", // gray-50
    surface: "#ffffff",
    surfaceAlt: "#f3f4f6", // gray-100
    text: "#111827", // gray-900
    textMuted: "#6B7280", // gray-500
    border: "#E5E7EB", // gray-200
    gradientFrom: "rgba(59,130,246,0.08)", // blue-500/10
    gradientTo: "rgba(249,250,251,1)", // gray-50
  },
  radii: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.06)",
    md: "0 4px 12px rgba(0,0,0,0.08)",
    lg: "0 8px 24px rgba(0,0,0,0.12)",
  },
  transitions: {
    base: "all 200ms ease",
    slow: "all 350ms ease",
  },
};

// PUBLIC_INTERFACE
export function getApiBase() {
  /**
   * Returns the REST API base URL for the Django backend.
   * Uses environment variable REACT_APP_BACKEND_URL if provided; otherwise defaults to same-origin '/api'.
   */
  const fromEnv = process.env.REACT_APP_BACKEND_URL;
  if (fromEnv && fromEnv.trim() !== "") return fromEnv.replace(/\/+$/, "");
  return "/api";
}
