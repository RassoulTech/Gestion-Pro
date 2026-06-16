// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// On évite d'instancier le vrai client Prisma (tokens.ts l'importe au chargement).
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { hashToken } from "@/lib/tokens";

describe("hashToken", () => {
  it("est déterministe et renvoie un SHA-256 en hex (64 caractères)", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produit des hash différents pour des entrées différentes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("correspond au SHA-256 de référence (jamais le token en clair)", () => {
    // SHA-256("abc") — valeur de référence connue.
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
});
