import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe] Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe] Webhook received: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscriptionId = session.subscription as string;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const firstItem = sub.items.data[0];

      await db
        .update(users)
        .set({
          plan: "pro",
          stripeSubscriptionId: subscriptionId,
          stripePriceId: firstItem?.price.id ?? null,
          stripeCurrentPeriodEnd: firstItem
            ? new Date(firstItem.current_period_end * 1000)
            : null,
        })
        .where(eq(users.id, userId));

      console.log(`[stripe] User ${userId} upgraded to pro`);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object;
      // Stripe v22: subscription moved to parent.subscription_details.subscription
      const subscriptionId =
        (invoice.parent?.subscription_details?.subscription as string | undefined) ?? null;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const firstItem = sub.items.data[0];
      const customerId = invoice.customer as string;

      await db
        .update(users)
        .set({
          plan: "pro",
          stripeCurrentPeriodEnd: firstItem
            ? new Date(firstItem.current_period_end * 1000)
            : null,
        })
        .where(eq(users.stripeCustomerId, customerId));

      console.log(`[stripe] Subscription ${subscriptionId} renewed`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await db
        .update(users)
        .set({
          plan: "free",
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        })
        .where(eq(users.stripeCustomerId, customerId));

      console.log(`[stripe] Customer ${customerId} cancelled, reverted to free`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
