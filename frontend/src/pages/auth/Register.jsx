import AuthBackground from "../../components/auth/AuthBackground";
import AuthLayout from "../../components/auth/AuthLayout";
import RegisterForm from "../../components/auth/RegisterForm";

export default function Register() {
  return (
    <AuthBackground>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </AuthBackground>
  );
}