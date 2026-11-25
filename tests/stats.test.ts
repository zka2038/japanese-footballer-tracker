import { describe, expect, it } from "vitest";
import { validateSnapshot } from "@/lib/snapshot-validate";
import { aggregate, inScope, ratingBand, type StatLine } from "@/lib/stats";
import type { Snapshot } from "@/lib/types";

const line = (over: Partial<StatLine> = {}): StatLine => ({
  unusedSub: false,
  started: true,
  minutes: 90,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  playerOfTheMatch: false,
  rating: 7,
  xg: 0.1,
  xa: 0.1,
  shots: 1,
  chancesCreated: 1,
  ...over,
});

describe("aggregate", () => {
  it("ignores unused substitutes", () => {
    const t = aggregate([line(), line({ unusedSub: true, minutes: 0, rating: null })]);
    expect(t.apps).toBe(1);
    expect(t.minutes).toBe(90);
  });

  it("computes G+A per 90 and average rating over rated matches only", () => {
    const t = aggregate([
      line({ goals: 1, rating: 8 }),
      line({ assists: 1, rating: 6, started: false, minutes: 45 }),
      line({ rating: null, minutes: 45 }),
    ]);
    expect(t.ga).toBe(2);
    expect(t.ga90).toBe(1); // 2 contributions in 180 minutes
    expect(t.avgRating).toBe(7);
    expect(t.ratedApps).toBe(2);
    expect(t.bestRating).toBe(8);
    expect(t.starts).toBe(2);
  });

  it("returns null per-90 below 90 minutes", () => {
    expect(aggregate([line({ minutes: 30, goals: 1 })]).ga90).toBeNull();
  });

  it("only counts xG from matches with coverage", () => {
    const t = aggregate([line({ xg: 0.5 }), line({ xg: null, xa: null })]);
    expect(t.xg).toBe(0.5); // from the first match only
    expect(t.xMatches).toBe(1);
  });
});

describe("scopes and bands", () => {
  it("maps competition kinds to scopes", () => {
    expect(inScope("league", "club")).toBe(true);
    expect(inScope("national", "club")).toBe(false);
    expect(inScope("other", "cups")).toBe(true);
    expect(inScope("europe", "league")).toBe(false);
  });

  it("bands ratings like FotMob", () => {
    expect(ratingBand(8.0)).toBe("elite");
    expect(ratingBand(7.4)).toBe("good");
    expect(ratingBand(6.0)).toBe("average");
    expect(ratingBand(5.9)).toBe("poor");
  });
});

describe("validateSnapshot", () => {
  const base: Snapshot = {
    version: 1,
    provider: "fotmob",
    generatedAt: "2026-11-25T00:00:00Z",
    season: "2026/2027",
    seasonStart: "2026-07-01",
    competitions: { "87": { id: 87, name: "LaLiga", shortName: "LaLiga", country: "ESP", kind: "league" } },
    teams: { "1": { id: 1, name: "A", shortName: "A", color: "#000" } },
    matches: {},
    players: [],
  };

  it("rejects an empty snapshot", () => {
    expect(validateSnapshot(base, 10)).toContain("no players");
  });

  it("flags dangling references", () => {
    const snap: Snapshot = {
      ...base,
      players: [
        {
          id: 5,
          slug: "x",
          name: "X",
          firstName: "",
          lastName: "X",
          nameJa: null,
          birthDate: null,
          age: null,
          heightCm: null,
          shirtNumber: null,
          preferredFoot: null,
          position: "",
          positionShort: "",
          positionGroup: "MID",
          teamId: 1,
          leagueId: 87,
          onLoan: false,
          contractEnd: null,
          marketValueEur: null,
          injury: null,
          traits: [],
          nextMatch: null,
          appearances: [{ ...line(), matchId: 99, teamId: 1, isTopRating: false, xg: null, xa: null, touches: null, passesCompleted: null, passesAttempted: null, dribblesWon: null, defensiveActions: null, shotsOnTarget: null, goalMinutes: [], assistMinutes: [] }],
        },
      ],
    };
    expect(validateSnapshot(snap, 1).join()).toMatch(/unknown match 99/);
  });
});
