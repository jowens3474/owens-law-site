// Sends a signed-in member to Stripe's Billing Portal to cancel or update
// their subscription. Founding members billed outside Stripe have no
// customer record and are pointed to email instead.
import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/markdown";
import { stripeConfigured } from "@/lib/pro";
import { verifyToken, PRO_COOKIE } from "@/lib/pro-session";
import { createPortalSession, findCustomerByEmail } from "@/lib/stripe";

export async function POST() {
  const jar = await cookies();
  const session = verifyToken(jar.get(PRO_COOKIE)?.value, "session");
  if (!session) return Response.redirect(absoluteUrl("/pro/dashboard"), 303);
  if (!stripeConfigured()) return Response.redirect(absoluteUrl("/pro/dashboard?billing=manual"), 303);
  const customer = await findCustomerByEmail(session.email);
  if (!customer) return Response.redirect(absoluteUrl("/pro/dashboard?billing=manual"), 303);
  try {
    const url = await createPortalSession(customer, absoluteUrl("/pro/dashboard"));
    return Response.redirect(url, 303);
  } catch (e) {
    console.error(`[pro-portal] ${(e as Error).message}`);
    return Response.redirect(absoluteUrl("/pro/dashboard?billing=error"), 303);
  }
}
