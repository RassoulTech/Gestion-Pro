import { describe, it, expect } from "vitest";
import {
  loginSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/schemas/auth.schema";

describe("auth.schema — normalisation de l'email", () => {
  it("login : trim + minuscules", () => {
    const r = loginSchema.parse({ email: "  John@Example.COM ", password: "x" });
    expect(r.email).toBe("john@example.com");
  });

  it("forgot : trim + minuscules", () => {
    const r = forgotPasswordSchema.parse({ email: "  USER@X.FR " });
    expect(r.email).toBe("user@x.fr");
  });
});

describe("auth.schema — complexité au reset (anti-affaiblissement)", () => {
  it("rejette un mot de passe sans majuscule/chiffre", () => {
    const r = resetPasswordSchema.safeParse({
      token: "t",
      password: "aaaaaaaa",
      confirmPassword: "aaaaaaaa",
    });
    expect(r.success).toBe(false);
  });

  it("accepte un mot de passe conforme", () => {
    const r = resetPasswordSchema.safeParse({
      token: "t",
      password: "Abcdef12",
      confirmPassword: "Abcdef12",
    });
    expect(r.success).toBe(true);
  });

  it("rejette un token vide", () => {
    const r = resetPasswordSchema.safeParse({
      token: "",
      password: "Abcdef12",
      confirmPassword: "Abcdef12",
    });
    expect(r.success).toBe(false);
  });

  it("rejette si la confirmation diffère", () => {
    const r = resetPasswordSchema.safeParse({
      token: "t",
      password: "Abcdef12",
      confirmPassword: "Abcdef13",
    });
    expect(r.success).toBe(false);
  });
});

describe("auth.schema — complexité à l'inscription (inchangée)", () => {
  it("rejette un mot de passe faible", () => {
    const r = registerSchema.safeParse({
      name: "Jo",
      email: "user@example.com",
      password: "aaaaaaaa",
      confirmPassword: "aaaaaaaa",
    });
    expect(r.success).toBe(false);
  });
});
