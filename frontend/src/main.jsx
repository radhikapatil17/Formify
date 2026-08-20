import React from "react";
import ReactDOM from "react-dom/client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";

import { ColorModeProvider } from "./context/ThemeContext";
import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";

import "./index.css";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID &&
  import.meta.env.VITE_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE"
    ? import.meta.env.VITE_GOOGLE_CLIENT_ID
    : "1234567890-demo.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ColorModeProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: "10px",
                background: "#FFFFFF",
                color: "#0F172A",
                fontWeight: 600,
                fontSize: "0.825rem",
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)",
              },
            }}
          />

          <App />
        </ColorModeProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);