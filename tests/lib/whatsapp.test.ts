import { describe, it, expect, vi } from "vitest";
import {
  normalizeWhatsAppNumber,
  buildWhatsAppLink,
  getAdminWhatsAppLink,
  getShopWhatsAppLink,
  getProductWhatsAppLink,
  getGeneralSellerWhatsAppLink,
} from "@/lib/whatsapp";

// Mock env validation if necessary, but since vitest runs, let's verify behaviour
describe("WhatsApp helper utilities", () => {
  describe("normalizeWhatsAppNumber", () => {
    it("should strip spaces, parentheses, dashes, and + prefix", () => {
      expect(normalizeWhatsAppNumber("+221 77 123-45 67")).toBe("221771234567");
      expect(normalizeWhatsAppNumber("(221) 77 123 45 67")).toBe("221771234567");
      expect(normalizeWhatsAppNumber("  221-771-234-567  ")).toBe("221771234567");
    });

    it("should return null for empty, null, or undefined values", () => {
      expect(normalizeWhatsAppNumber("")).toBeNull();
      expect(normalizeWhatsAppNumber(null)).toBeNull();
      expect(normalizeWhatsAppNumber(undefined)).toBeNull();
    });

    it("should return null if length of numbers is too short (< 7) or too long (> 15)", () => {
      expect(normalizeWhatsAppNumber("12345")).toBeNull();
      expect(normalizeWhatsAppNumber("123456")).toBeNull();
      expect(normalizeWhatsAppNumber("1234567")).toBe("1234567"); // minimum valid E.164 length
      expect(normalizeWhatsAppNumber("123456789012345")).toBe("123456789012345"); // 15 digits
      expect(normalizeWhatsAppNumber("1234567890123456")).toBeNull(); // 16 digits
    });
  });

  describe("buildWhatsAppLink", () => {
    it("should construct a valid wa.me URL with encoded message", () => {
      const link = buildWhatsAppLink("+221 77 123-45 67", "Bonjour 👋, comment ça va ?");
      expect(link).toBe(
        "https://wa.me/221771234567?text=Bonjour%20%F0%9F%91%8B%2C%20comment%20%C3%A7a%20va%20%3F"
      );
    });

    it("should return null if phone is invalid", () => {
      expect(buildWhatsAppLink("invalid-phone", "Hello")).toBeNull();
    });
  });

  describe("getAdminWhatsAppLink", () => {
    it("should build administrative support link", () => {
      const link = getAdminWhatsAppLink();
      expect(link).toContain("https://wa.me/");
      expect(link).toContain("Je%20souhaite%20obtenir%20des%20informations");
    });
  });

  describe("getShopWhatsAppLink", () => {
    it("should generate prefilled shop visit text if shop name is provided", () => {
      const link = getShopWhatsAppLink("+221 771 234 567", "Chez Diallo");
      expect(link).toContain("https://wa.me/221771234567");
      expect(link).toContain("Chez%20Diallo");
      expect(link).toContain("Je%20visite%20actuellement%20votre%20boutique");
    });

    it("should fallback to general seller text if shop name is missing", () => {
      const link = getShopWhatsAppLink("+221 771 234 567", null);
      expect(link).toContain("https://wa.me/221771234567");
      expect(link).toContain("Je%20souhaite%20obtenir%20davantage%20d'informations");
    });
  });

  describe("getProductWhatsAppLink", () => {
    it("should generate prefilled product text with shop and product name", () => {
      const link = getProductWhatsAppLink("+221 771 234 567", "Café Touba", "Chez Diallo");
      expect(link).toContain("https://wa.me/221771234567");
      expect(link).toContain("Caf%C3%A9%20Touba");
      expect(link).toContain("Chez%20Diallo");
      expect(link).toContain("Je%20suis%20int%C3%A9ress%C3%A9%20par%20le%20produit");
    });
  });

  describe("getGeneralSellerWhatsAppLink", () => {
    it("should build general link without specific context", () => {
      const link = getGeneralSellerWhatsAppLink("+221 771 234 567");
      expect(link).toBe(
        "https://wa.me/221771234567?text=Bonjour%20%F0%9F%91%8B%0AJe%20souhaite%20obtenir%20davantage%20d'informations%20concernant%20votre%20activit%C3%A9%20et%20vos%20produits%20visibles%20sur%20GestionPro.%0AMerci%20de%20votre%20retour."
      );
    });
  });
});
