import { AuthForm } from "@/components/store/auth-form";

export default function LoginPage({ searchParams }: { searchParams?: { redirect?: string } }) {
  const redirectPath = searchParams?.redirect ? decodeURIComponent(searchParams.redirect) : undefined;
  return <AuthForm mode="login" role="user" title="User login" redirectPath={redirectPath} />;
}
