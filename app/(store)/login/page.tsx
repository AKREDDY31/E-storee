import { AuthForm } from "@/components/store/auth-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ redirect?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const redirectValue = Array.isArray(resolvedSearchParams.redirect)
    ? resolvedSearchParams.redirect[0]
    : resolvedSearchParams.redirect;
  const redirectPath = redirectValue ? decodeURIComponent(redirectValue) : undefined;
  return <AuthForm mode="login" role="user" title="User login" redirectPath={redirectPath} />;
}
