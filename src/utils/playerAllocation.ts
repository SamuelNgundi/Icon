import { getPositionPlan } from './formations';
import { shuffle } from './random';
import type { Formation, Squad, Tournament } from '../types';
import type { IconPlayer } from '../data/icons';

export function validateUniqueIconIds(icons: IconPlayer[]): void {
  const duplicateIds = icons.filter((player, index) => icons.findIndex((candidate) => candidate.id === player.id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`The ICON database contains duplicate IDs: ${[...new Set(duplicateIds.map((player) => player.id))].join(', ')}.`);
  }
}

export function buildSquad(playerName: string, unavailable: Set<string>, formation: Formation, icons: IconPlayer[]): { squad: Squad; used: string[] } {
  const picked: IconPlayer[] = [];
  const localIds = new Set<string>();
  const used: string[] = [];
  for (const position of getPositionPlan(formation)) {
    const candidates = shuffle(icons.filter((player) =>
      !localIds.has(player.id) && !unavailable.has(player.id) &&
      (player.position === position || player.secondary?.includes(position)),
    ));
    const choice = candidates[0];
    if (!choice) throw new Error(`Not enough available ICONs for ${position} while building ${playerName}'s squad.`);
    picked.push({ ...choice, position }); localIds.add(choice.id); used.push(choice.id);
  }
  return { squad: { playerName, players: picked, revealed: false }, used };
}

function chooseFairCandidate(candidates: IconPlayer[], participantRating: number, ratingTotals: number[]): IconPlayer {
  const averageRating = candidates.reduce((total, player) => total + player.rating, 0) / candidates.length;
  const averageSquadRating = ratingTotals.reduce((total, rating) => total + rating, 0) / ratingTotals.length;
  const targetRating = averageSquadRating + averageRating;
  return shuffle(candidates).sort((left, right) => {
    const leftDistance = Math.abs(participantRating + left.rating - targetRating);
    const rightDistance = Math.abs(participantRating + right.rating - targetRating);
    return leftDistance - rightDistance;
  })[0];
}

export function generateTournament(participants: string[], formations: Formation[], icons: IconPlayer[]): Tournament {
  validateUniqueIconIds(icons);
  const squads = participants.map((playerName) => ({ playerName, players: [], revealed: false })) as Squad[];
  const used = new Set<string>();
  const ratingTotals = participants.map(() => 0);
  const positionPlans = formations.map(getPositionPlan);

  for (let round = 0; round < 10; round += 1) {
    for (const index of shuffle(participants.map((_, participantIndex) => participantIndex))) {
      const position = positionPlans[index][round];
      const candidates = icons.filter((player) =>
        !used.has(player.id) &&
        (player.position === position || player.secondary?.includes(position)),
      );
      const choice = candidates.length > 0
        ? chooseFairCandidate(candidates, ratingTotals[index], ratingTotals)
        : undefined;
      if (!choice) throw new Error(`Not enough available ICONs for ${position} while building ${participants[index]}'s squad.`);
      squads[index].players.push({ ...choice, position });
      used.add(choice.id);
      ratingTotals[index] += choice.rating;
    }
  }
  return { id: `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, participants, squads, formations, createdAt: Date.now() };
}
