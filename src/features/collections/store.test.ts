import { describe, expect, it } from "vitest";
import { allQuestions, suggestForCharacter, suggestQuestions } from "@/features/ai/suggestions";
import { parseCollections } from "./store";

describe("parseCollections", () => {
  it("keeps well-formed collections and drops anything else", () => {
    const raw = JSON.stringify([
      { id: "a", name: "Trail", slugs: ["vice-beach"] },
      { id: "b", name: "Broken", slugs: [1] },
      { name: "No id", slugs: [] },
      null,
    ]);
    expect(parseCollections(raw)).toEqual([{ id: "a", name: "Trail", slugs: ["vice-beach"] }]);
  });

  it.each([null, "", "not json", "{}", "42"])("returns an empty list for %o", (raw) => {
    expect(parseCollections(raw)).toEqual([]);
  });
});

describe("suggestQuestions", () => {
  const prison = { slug: "leonida-penitentiary", name: "Leonida Penitentiary", category: "Landmark", region: null };
  const hotel = { slug: "hotel-dixon", name: "Hotel Dixon", category: "Hotel", region: "Vice City" };
  const viceCity = { slug: "vice-city", name: "Vice City", category: "Region", region: null };
  const connected = new Set(["leonida-penitentiary"]);

  it("puts questions about the selected place first", () => {
    expect(suggestQuestions(hotel, connected)[0]).toBe("What else is in Vice City?");
    expect(suggestQuestions(viceCity, connected)[0]).toBe("What is in Vice City?");
    expect(suggestQuestions(prison, connected)[0]).toBe("Who is connected to Leonida Penitentiary?");
  });

  it("never repeats a question for a character", () => {
    const questions = suggestForCharacter({ name: "Lucia Caminos" });
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("lists every suggestion once for recording", () => {
    const questions = allQuestions([hotel, viceCity, prison], connected, [{ name: "Jason Duval" }]);
    expect(new Set(questions).size).toBe(questions.length);
    expect(questions).toContain("Find locations connected to Jason");
  });
});
