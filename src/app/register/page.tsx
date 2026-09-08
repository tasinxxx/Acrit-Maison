import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl mb-6">Create account</h1>
      <RegisterForm />
    </div>
  );
}
