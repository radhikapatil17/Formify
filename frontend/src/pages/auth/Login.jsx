import AuthBackground from "../../components/auth/AuthBackground";
import AuthLayout from "../../components/auth/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";

export default function Login() {
  return (
    <AuthBackground>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </AuthBackground>
  );
}