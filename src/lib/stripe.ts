import Stripe from "stripe";
import { env } from "@/env.mjs";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-22.acacia" as any,
  typescript: true,
});
