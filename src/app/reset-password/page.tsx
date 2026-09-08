import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token || token.length < 10) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-3xl mb-4">Link not valid</h1>
        <p className="text-muted text-sm mb-8">
          This password reset link is missing its token. Request a fresh link and try again.
        </p>
        <Link href="/forgot-password" className="btn btn-primary">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl mb-6">Set a new password</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}
