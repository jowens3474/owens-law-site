// Starts a Stripe Checkout subscription for Pipeline Pro and redirects.
import { absoluteUrl } from "@/lib/markdown";
import { stripeConfigured } from "@/lib/pro";
import { createCheckoutSession, type Plan } from "@/lib/stripe";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan: Plan = url.searchParams.get("plan") === "annual" ? "annual" : "monthly";
  const email = url.searchParams.get("email") ?? undefined;
  if (!stripeConfigured()) {
    return Response.redirect(absoluteUrl("/pro?checkout=unavailable"), 303);
  }
  try {
    const session = await createCheckoutSession({
      plan,
      email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
      successUrl: absoluteUrl("/pro/welcome?session_id={CHECKOUT_SESSION_ID}"),
      cancelUrl: absoluteUrl("/pro?checkout=cancelled"),
    });
    return Response.redirect(session.url, 303);
  } catch (e) {
    console.error(`[pro-checkout] ${(e as Error).message}`);
    return Response.redirect(absoluteUrl("/pro?checkout=error"), 303);
  }
}
