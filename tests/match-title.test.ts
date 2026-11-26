import { describe, expect, it } from "vitest";
import { isoDurationSeconds, matchTitle } from "@/lib/highlights/match-title";

const m = (home: string, away: string, hs: number | null = null, as: number | null = null) => ({
  home,
  away,
  homeScore: hs,
  awayScore: as,
});

describe("matchTitle accepts real highlight titles", () => {
  it.each([
    ["Lille vs. Bayern Munich | Champions League Highlights | 2-1", "CBS Sports Golazo", m("Lille", "Bayern München", 2, 1)],
    ["HIGHLIGHTS | PSV - Club Brugge (1-2) | UEFA Champions League", "TNT Sports", m("PSV Eindhoven", "Club Brugge", 1, 2)],
    ["Samenvatting Sparta Rotterdam - AZ (1-5) | Eredivisie", "ESPN NL", m("Sparta Rotterdam", "AZ Alkmaar", 1, 5)],
    ["Crystal Palace v Hoffenheim | Extended Highlights | UEFA Europa League", "TNT Sports", m("Crystal Palace", "Hoffenheim")],
    ["STVV - Brann | Samenvatting Conference League", "Play Sports", m("St.Truiden", "Brann", 1, 1)],
    ["Royale Union SG vs Lech Poznań | Résumé", "Pro League", m("Union St.Gilloise", "Lech Poznań")],
    ["Japan vs Brazil 3-2 | Highlights | International Friendly", "JFA TV", m("Japan", "Brazil", 3, 2)],
    ["Genk 4-0 Beveren | Highlights", "Pro League", m("Genk", "SK Beveren", 4, 0)],
  ])("%s", (title, channel, match) => {
    expect(matchTitle({ title, channel }, match)).toMatchObject({ ok: true });
  });

  it("ranks an official channel with the right score above a fan upload", () => {
    const match = m("Lille", "Bayern München", 2, 1);
    const official = matchTitle({ title: "Lille 2-1 Bayern | Highlights", channel: "UEFA" }, match);
    const fan = matchTitle({ title: "lille bayern highlights", channel: "footy clips 99" }, match);
    expect(official.score).toBeGreaterThan(fan.score);
  });
});

describe("matchTitle rejects the wrong videos", () => {
  it.each([
    ["Lille vs Bayern 0-3 Highlights", m("Lille", "Bayern München", 2, 1), "different score"],
    ["Lille vs Bayern | EA FC 26 Simulation Highlights", m("Lille", "Bayern München"), "rejected word"],
    ["Lille vs Bayern Munich LIVE REACTION", m("Lille", "Bayern München"), "rejected word"],
    ["Lille vs Bayern press conference", m("Lille", "Bayern München"), "rejected word"],
    ["Lille vs Bayern Munich | Full Match", m("Lille", "Bayern München"), "rejected word"],
    ["Japan U-23 vs Brazil U-23 highlights", m("Japan", "Brazil"), "rejected word"],
    ["Lille vs Monaco highlights", m("Lille", "Bayern München"), "teams not both named"],
    ["Lille vs Bayern Munich", m("Lille", "Bayern München"), "not highlights"],
  ])("%s", (title, match, reason) => {
    expect(matchTitle({ title, channel: "Somebody" }, match)).toMatchObject({ ok: false, reason });
  });
});

describe("isoDurationSeconds", () => {
  it("parses YouTube durations", () => {
    expect(isoDurationSeconds("PT6M12S")).toBe(372);
    expect(isoDurationSeconds("PT1H2M")).toBe(3720);
    expect(isoDurationSeconds("PT45S")).toBe(45);
    expect(isoDurationSeconds("P1D")).toBe(0);
  });
});
