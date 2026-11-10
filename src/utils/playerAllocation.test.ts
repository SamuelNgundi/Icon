import { describe, expect, it } from 'vitest';
import { ICONS } from '../data/icons';
import type { Formation } from '../types';
import { buildSquad, generateTournament } from './playerAllocation';

function createTournament(participantCount = 4, formation: Formation = 'wide') {
  const participants = Array.from({ length: participantCount }, (_, index) => `Player ${index + 1}`);
  const formations = participants.map(() => formation);
  return generateTournament(participants, formations, ICONS);
}

describe('player allocation rules', () => {
  it('assigns every player to an eligible primary or secondary position', () => {
    const tournament = createTournament();

    for (const squad of tournament.squads) {
      expect(squad.players).toHaveLength(10);
      for (const assignedPlayer of squad.players) {
        const databasePlayer = ICONS.find((player) => player.id === assignedPlayer.id);
        expect(databasePlayer).toBeDefined();
        expect(
          databasePlayer?.position === assignedPlayer.position ||
            databasePlayer?.secondary?.includes(assignedPlayer.position),
        ).toBe(true);
      }
    }
  });

  it('prevents duplicate ICON IDs within and across squads', () => {
    const tournament = createTournament(6);
    const assignedIds = tournament.squads.flatMap((squad) => squad.players.map((player) => player.id));

    expect(assignedIds).toHaveLength(60);
    expect(new Set(assignedIds).size).toBe(assignedIds.length);
    for (const squad of tournament.squads) {
      expect(new Set(squad.players.map((player) => player.id)).size).toBe(10);
    }
  });

  it('never assigns Pelé and Ronaldo to the same squad', () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const tournament = createTournament(6);
      for (const squad of tournament.squads) {
        const ids = new Set(squad.players.map((player) => player.id));
        expect(ids.has('pele') && ids.has('ronaldo')).toBe(false);
      }
    }
  });

  it('redraws a squad without using ICONs held by other participants', () => {
    const tournament = createTournament();
    const participantIndex = 0;
    const unavailable = new Set(
      tournament.squads
        .filter((_, index) => index !== participantIndex)
        .flatMap((squad) => squad.players.map((player) => player.id)),
    );
    const ratingTotals = tournament.squads.map((squad, index) =>
      index === participantIndex ? 0 : squad.players.reduce((total, player) => total + player.rating, 0),
    );

    const { squad, used } = buildSquad(
      tournament.participants[participantIndex],
      unavailable,
      tournament.formations[participantIndex],
      ICONS,
      ratingTotals,
      participantIndex,
    );

    expect(squad.players).toHaveLength(10);
    expect(new Set(used).size).toBe(10);
    expect(used.some((id) => unavailable.has(id))).toBe(false);
    const ids = new Set(used);
    expect(ids.has('pele') && ids.has('ronaldo')).toBe(false);
  });

  it('uses lower-rated ICONs and keeps squad rating distributions broadly balanced', () => {
    const participantRatingTotals = [0, 0, 0, 0];
    let lowerRatedPicks = 0;
    const simulationCount = 50;

    for (let attempt = 0; attempt < simulationCount; attempt += 1) {
      const tournament = createTournament();
      const squadAverages = tournament.squads.map((squad, index) => {
        const squadTotal = squad.players.reduce((total, player) => {
          if (player.rating <= 86) lowerRatedPicks += 1;
          return total + player.rating;
        }, 0);
        participantRatingTotals[index] += squadTotal / squad.players.length;
        return squadTotal / squad.players.length;
      });

      expect(Math.max(...squadAverages) - Math.min(...squadAverages)).toBeLessThan(12);
    }

    expect(lowerRatedPicks).toBeGreaterThan(20);
    const averageRatings = participantRatingTotals.map((total) => total / simulationCount);
    expect(Math.max(...averageRatings) - Math.min(...averageRatings)).toBeLessThan(2);
  });
});
