// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPaytechConfig, isPaytechConfigured, isPaytechSandbox } from "@/lib/paytech";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  delete process.env.PAYTECH_API_KEY;
  delete process.env.PAYTECH_API_SECRET;
  delete process.env.PAYTECH_ENABLED;
  delete process.env.PAYTECH_ENV;
  delete process.env.PAYTECH_SANDBOX;
  process.env.NEXT_PUBLIC_APP_URL = "https://mongestionpro.com";
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("getPaytechConfig — dérivation sandbox/live", () => {
  it("est en sandbox par défaut (aucune variable d'env de mode)", () => {
    const c = getPaytechConfig();
    expect(c.sandbox).toBe(true);
    expect(c.env).toBe("test");
  });

  it("passe en live avec PAYTECH_ENV=prod", () => {
    process.env.PAYTECH_ENV = "prod";
    const c = getPaytechConfig();
    expect(c.sandbox).toBe(false);
    expect(c.env).toBe("prod");
  });

  it("PAYTECH_SANDBOX=false force le live même si PAYTECH_ENV est absent", () => {
    process.env.PAYTECH_SANDBOX = "false";
    expect(getPaytechConfig().sandbox).toBe(false);
  });

  it("PAYTECH_SANDBOX=true prime sur PAYTECH_ENV=prod (garde-fou)", () => {
    process.env.PAYTECH_ENV = "prod";
    process.env.PAYTECH_SANDBOX = "true";
    expect(getPaytechConfig().sandbox).toBe(true);
  });

  it("construit les URLs depuis NEXT_PUBLIC_APP_URL sans slash final", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://mongestionpro.com/";
    const c = getPaytechConfig();
    expect(c.appUrl).toBe("https://mongestionpro.com");
    expect(c.ipnUrl).toBe("https://mongestionpro.com/api/paytech/ipn");
    expect(c.requestPaymentUrl).toBe("https://paytech.sn/api/payment/request-payment");
    expect(c.currency).toBe("XOF");
  });
});

describe("isPaytechConfigured / isPaytechSandbox", () => {
  it("n'est pas configuré sans clés ou sans activation", () => {
    expect(isPaytechConfigured()).toBe(false);
    process.env.PAYTECH_API_KEY = "k";
    process.env.PAYTECH_API_SECRET = "s";
    expect(isPaytechConfigured()).toBe(false); // PAYTECH_ENABLED manquant
    process.env.PAYTECH_ENABLED = "true";
    expect(isPaytechConfigured()).toBe(true);
  });

  it("isPaytechSandbox reflète le mode courant", () => {
    expect(isPaytechSandbox()).toBe(true);
    process.env.PAYTECH_ENV = "prod";
    expect(isPaytechSandbox()).toBe(false);
  });
});
