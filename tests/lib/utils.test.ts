import { describe, it, expect } from "vitest";
import { slugify, getInitials, generateCode } from "@/lib/utils";

describe("slugify", () => {
  it("retire les accents et passe en minuscules", () => {
    expect(slugify("Diallo Électronique")).toBe("diallo-electronique");
  });

  it("remplace les caractères spéciaux par des tirets sans en laisser aux extrémités", () => {
    expect(slugify("  Boutique N°5 !! ")).toBe("boutique-n-5");
  });

  it("gère les chaînes déjà propres", () => {
    expect(slugify("ma-boutique")).toBe("ma-boutique");
  });
});

describe("getInitials", () => {
  it("prend les initiales des deux premiers mots", () => {
    expect(getInitials("Amadou Diallo")).toBe("AD");
  });

  it("se limite à 2 caractères pour les noms composés", () => {
    expect(getInitials("Amadou Diallo Ba")).toBe("AD");
  });

  it("gère un nom unique", () => {
    expect(getInitials("Awa")).toBe("A");
  });

  it("ignore les espaces superflus", () => {
    expect(getInitials("  Awa   Ndiaye  ")).toBe("AN");
  });
});

describe("generateCode", () => {
  it("produit un code préfixé au format attendu", () => {
    const code = generateCode("CMD");
    expect(code).toMatch(/^CMD-[0-9A-Z]+-[0-9A-Z]+$/);
  });

  it("respecte le préfixe demandé", () => {
    expect(generateCode("FAC").startsWith("FAC-")).toBe(true);
  });
});
