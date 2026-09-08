import { getSettings } from "@/lib/settings";
import { cardPaymentsEnabled, webhookSecretConfigured } from "@/lib/stripe";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const stripeReady = cardPaymentsEnabled();
  const webhookOk = webhookSecretConfigured();
  const emailReady = Boolean(process.env.RESEND_API_KEY);

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Settings</h1>

      <div className="card p-5 mb-8 text-sm space-y-2">
        <h2 className="font-display text-lg">Integration status</h2>
        <p className="flex items-center gap-2">
          <span className={`badge ${stripeReady ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"}`}>
            {stripeReady ? "configured" : "not configured"}
          </span>
          Stripe card payments {stripeReady ? "are live — webhook signature " + (webhookOk ? "set" : "MISSING") : "are disabled; checkout offers bank transfer only"}
        </p>
        <p className="text-xs text-muted">
          Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in the environment to enable card payments. No payment
          is ever simulated.
        </p>
        <p className="flex items-center gap-2">
          <span className={`badge ${emailReady ? "bg-green-100 text-green-900" : "bg-yellow-100 text-yellow-900"}`}>
            {emailReady ? "configured" : "not configured"}
          </span>
          Transactional email {emailReady ? "sends via Resend" : "is written to the server log only — no email is sent"}
        </p>
        <p className="text-xs text-muted">
          Set RESEND_API_KEY and RESEND_EMAIL_FROM in the environment to send password resets, order
          confirmations and status updates for real.
        </p>
        <p className="text-xs text-muted">
          bKash and Nagad are configured by setting the numbers below — they stay hidden at checkout until then.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
