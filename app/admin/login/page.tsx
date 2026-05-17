import { AuthForm } from "@/components/store/auth-form";

export default function AdminLoginPage() {
  return <AuthForm mode="login" role="admin" title="Admin login" variant="admin" />;
}
