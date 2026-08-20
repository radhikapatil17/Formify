import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/landing/LandingPage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import Dashboard from "../pages/dashboard/Dashboard";
import Forms from "../pages/forms/Forms";
import CreateForm from "../pages/forms/CreateForm";
import Templates from "../pages/templates/Templates";
import Responses from "../pages/responses/Responses";
import Analytics from "../pages/analytics/Analytics";
import Settings from "../pages/settings/Settings";
import PublicForm from "../pages/public/PublicForm";

import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public Form Filler View (Accessible without credentials) */}
        <Route path="/public/forms/:publicLink" element={<PublicForm />} />

        {/* Protected Workspace Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Layout>
                <Templates />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/forms"
          element={
            <ProtectedRoute>
              <Layout>
                <Forms />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-form"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/responses"
          element={
            <ProtectedRoute>
              <Layout>
                <Responses />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}