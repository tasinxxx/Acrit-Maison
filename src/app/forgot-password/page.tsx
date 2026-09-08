import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl mb-2">Forgot your password?</h1>
      <p className="text-muted text-sm mb-6">
        Enter the email on your account and we will send a link to set a new password.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
