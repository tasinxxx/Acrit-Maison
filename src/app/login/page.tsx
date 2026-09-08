import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage() {
  try {
    const customer = await getCurrentCustomer();
    if (customer) redirect("/account");
  } catch {
    // Database unavailable at build time — render the login form anyway.
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl mb-6">Sign in</h1>
      <LoginForm />
    </div>
  );
}
