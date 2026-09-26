// Pipeline Pro: the Wire's paid intelligence tier. Product copy, pricing,
// and the environment checks the routes and pages share. Prices are in
// whole dollars; Stripe prices live in the Stripe dashboard and are
// referenced by id through the environment.

export const pro = {
  name: "Pipeline Pro",
  path: "/pro",
  tagline: "The metro's money decisions, before they are announced.",
  monthly: 79,
  annual: 790,
  founding: 49,
  foundingSeats: 25,
  from: "Pipeline Pro <pro@thejacksonwire.com>",
  briefingDay: "Monday",
  features: [
    {
      title: "The Monday briefing",
      text: "Every decision date, bond, permit, incentive, and rate case on the metro calendar for the week ahead, with the documents linked, in your inbox by 6 a.m. Monday.",
    },
    {
      title: "Same-day alerts",
      text: "New council agenda packets the hour they post. New federal awards over $250,000 landing in Hinds, Madison, or Rankin County. New federal lawsuits naming the city, the county, the water system, or the utilities. Weekdays, three times a day.",
    },
    {
      title: "The Pipeline desk",
      text: "A members-only page with the full project tracker, every dated milestone past and future, and live feeds of awards, dockets, agendas, and fuel prices, refreshed every 30 minutes.",
    },
    {
      title: "Ask the desk",
      text: "Reply to any briefing with a question about a project, a filing, or a number. A researcher answers within one business day.",
    },
  ],
  audiences: [
    "Developers and general contractors",
    "Commercial brokers and lenders",
    "Real estate and municipal lawyers",
    "Lobbyists and government-affairs staff",
    "Bankers, appraisers, and title companies",
  ],
} as const;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_MONTHLY);
}

export function resendProConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_PRO_AUDIENCE_ID);
}

export function sessionConfigured(): boolean {
  return Boolean(process.env.PRO_SESSION_SECRET);
}
