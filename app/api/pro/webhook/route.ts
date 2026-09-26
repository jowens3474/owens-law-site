// Stripe webhook: keeps the Pro audience in step with subscriptions.
// checkout.session.completed subscribes the payer; subscription deletion
// unsubscribes them. Signature is verified against STRIPE_WEBHOOK_SECRET.
import { pro } from "@/lib/pro";
import { absoluteUrl } from "@/lib/markdown";
import { getCustomerEmail, verifyStripeSignature } from "@/lib/stripe";
import { sendEmail, setUnsubscribed, upsertContact } from "@/lib/resend";

export const runtime = "nodejs";

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      customer?: string | null;
      customer_details?: { email?: string | null; name?: string | null } | null;
      customer_email?: string | null;
      metadata?: Record<string, string>;
    };
  };
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const audienceId = process.env.RESEND_PRO_AUDIENCE_ID;
  if (!secret || !audienceId || !process.env.RESEND_API_KEY) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return Response.json({ error: "bad signature" }, { status: 400 });
  }
  let event: StripeEvent;
  try {
    event = JSON.parse(raw) as StripeEvent;
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  const obj = event.data.object;

  if (event.type === "checkout.session.completed") {
    if (obj.metadata?.product && obj.metadata.product !== "pipeline-pro") return Response.json({ ok: true });
    const email = (obj.customer_details?.email || obj.customer_email || "").toLowerCase();
    if (email) {
      const [first, ...rest] = (obj.customer_details?.name || "").split(/\s+/);
      const ok = await upsertContact(audienceId, email, {
        unsubscribed: false,
        first_name: first || undefined,
        last_name: rest.join(" ") || undefined,
      });
      console.log(`[pro-webhook] subscribed ${email}: ${ok}`);
      await sendEmail({
        from: pro.from,
        to: email,
        subject: `Welcome to ${pro.name}`,
        text: [
          `You're in. The first ${pro.name} briefing lands ${pro.briefingDay} at 6 a.m. Central, and alerts start now.`,
          "",
          `Your desk: ${absoluteUrl("/pro/dashboard")} (sign in with this email address; we send a one-time link).`,
          "",
          "Reply to any briefing with a question. A researcher answers within one business day.",
          "",
          "The Jackson Wire",
        ].join("\n"),
      });
    }
  } else if (event.type === "customer.subscription.deleted") {
    const customer = typeof obj.customer === "string" ? obj.customer : null;
    const email = customer ? await getCustomerEmail(customer) : null;
    if (email) {
      const ok = await setUnsubscribed(audienceId, email.toLowerCase(), true);
      console.log(`[pro-webhook] unsubscribed ${email}: ${ok}`);
    }
  }
  return Response.json({ received: true });
}
