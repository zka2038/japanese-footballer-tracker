import { describe, expect, it } from "vitest";
import { classifyCompetition, isExcludedCompetition } from "@/config/competitions";
import {
  buildAppearance,
  extractMatch,
  normalizeProfile,
  parseYouTube,
  positionGroup,
} from "@/lib/providers/fotmob/normalize";
import type { FmMatchDetails, FmPlayerData } from "@/lib/providers/fotmob/raw";
import matchFixture from "./fixtures/match-malaga-real-sociedad.json";
import kuboFixture from "./fixtures/player-kubo.json";

const match = matchFixture as unknown as FmMatchDetails;
const kubo = kuboFixture as unknown as FmPlayerData;
const KUBO = 848289;

describe("extractMatch", () => {
  const extracted = extractMatch(match)!;

  it("reads the scoreline, competition and highlight", () => {
    expect(extracted.match.home).toMatchObject({ name: "Málaga", score: 2 });
    expect(extracted.match.away).toMatchObject({ name: "Real Sociedad", score: 5 });
    expect(extracted.match.finished).toBe(true);
    expect(extracted.competition).toEqual({ id: 87, name: "LaLiga", countryCode: "ESP" });
    expect(extracted.match.highlight?.videoId).toBe("LX3i-cI-EE4");
  });

  it("extracts a detailed line for Japanese players only", () => {
    const line = extracted.lines[String(KUBO)];
    expect(Object.keys(extracted.lines)).toEqual([String(KUBO)]);
    expect(line).toMatchObject({ started: true, cameOn: true, minutes: 71, rating: 8.45, xg: 0.02, xa: 0.08 });
    expect(line.goalMinutes).toEqual([3]);
    expect(line.assistMinutes).toEqual([59]);
    expect(line.passesCompleted).toBe(18);
    expect(line.passesAttempted).toBe(20);
  });
});

describe("buildAppearance", () => {
  const rows = kubo.recentMatches!;
  const byOpp = (name: string) => rows.find((r) => r.opponentTeamName === name)!;

  it("merges the recent-match row with the detailed line", () => {
    const line = extractMatch(match)!.lines[String(KUBO)];
    const app = buildAppearance(byOpp("Málaga"), line);
    expect(app).toMatchObject({ started: true, unusedSub: false, minutes: 71, goals: 1, assists: 1, rating: 8.5 });
  });

  it("treats a substitute appearance as played, not unused", () => {
    const app = buildAppearance(byOpp("Paraguay"), undefined);
    expect(app.unusedSub).toBe(false);
    expect(app.minutes).toBe(29);
  });

  it("marks an unused substitute with zero minutes and no rating", () => {
    const app = buildAppearance(byOpp("Lyon"), undefined);
    expect(app).toMatchObject({ unusedSub: true, started: false, minutes: 0, rating: null });
  });
});

describe("normalizeProfile", () => {
  it("maps profile fields", () => {
    const p = normalizeProfile(kubo, { leagueId: 87, nameJa: "久保建英" });
    expect(p).toMatchObject({
      id: KUBO,
      slug: "takefusa-kubo",
      firstName: "Takefusa",
      lastName: "Kubo",
      teamId: 8560,
      positionGroup: "FWD",
      preferredFoot: "Left",
      heightCm: 173,
    });
    expect(p.marketValueEur).toBeGreaterThan(0);
    expect(p.nextMatch?.competitionId).toBeGreaterThan(0);
  });
});

describe("helpers", () => {
  it("groups positions", () => {
    expect(positionGroup("keeper_long")).toBe("GK");
    expect(positionGroup("centerback")).toBe("DEF");
    expect(positionGroup("leftwingback")).toBe("DEF");
    expect(positionGroup("defensivemidfielder")).toBe("MID");
    expect(positionGroup("centerattackingmidfielder")).toBe("MID");
    expect(positionGroup("rightwinger")).toBe("FWD");
    expect(positionGroup("striker")).toBe("FWD");
  });

  it("parses YouTube urls", () => {
    expect(parseYouTube("https://youtu.be/LX3i-cI-EE4")?.videoId).toBe("LX3i-cI-EE4");
    expect(parseYouTube("https://example.com/video")).toBeNull();
  });

  it("classifies and filters competitions", () => {
    expect(classifyCompetition(149, "Cup", false, "BEL")).toMatchObject({ name: "Belgian Cup", kind: "cup" });
    expect(classifyCompetition(10613, "Europa League Qualification", false)).toMatchObject({ kind: "europe" });
    expect(classifyCompetition(114, "Friendlies", true).kind).toBe("national");
    expect(classifyCompetition(208, "3. Liga", false, "GER").kind).toBe("other");
    expect(isExcludedCompetition("Club Friendlies", "INT", false)).toBe(true);
    expect(isExcludedCompetition("J. League", "JPN", false)).toBe(true);
    expect(isExcludedCompetition("World Cup Qualification AFC", "INT", true)).toBe(false);
  });
});
