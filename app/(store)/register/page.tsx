import { AuthForm } from "@/components/store/auth-form";

export default async function RegisterPage({
  searchParams
}: {
  searchParams?: Promise<{ email?: string | string[]; emailVerified?: string | string[]; verificationError?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const email = Array.isArray(resolvedSearchParams.email) ? resolvedSearchParams.email[0] : resolvedSearchParams.email;
  const emailVerifiedValue = Array.isArray(resolvedSearchParams.emailVerified)
    ? resolvedSearchParams.emailVerified[0]
    : resolvedSearchParams.emailVerified;
  const verificationErrorValue = Array.isArray(resolvedSearchParams.verificationError)
    ? resolvedSearchParams.verificationError[0]
    : resolvedSearchParams.verificationError;

  return (
    <AuthForm
      mode="register"
      role="user"
      title="Create your account"
      initialEmail={email ? decodeURIComponent(email) : undefined}
      initialEmailVerified={emailVerifiedValue === "1"}
      initialVerificationError={Boolean(verificationErrorValue)}
    />
  );
}
