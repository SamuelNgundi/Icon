import { getPositionPlan } from './formations';
import { shuffle } from './random';
import type { Formation, Squad, Tournament } from '../types';
import type { IconPlayer } from '../data/icons';

const EXCLUSIVE_PLAYER_PAIRS = [['pele', 'ronaldo']] as const;

function violatesExclusivePair(playerId: string, assignedIds: Set<string>): boolean {
  return EXCLUSIVE_PLAYER_PAIRS.some(([firstId, secondId]) =>
    (playerId === firstId && assignedIds.has(secondId)) ||
    (playerId === secondId && assignedIds.has(firstId)),
  );
}

export function validateUniqueIconIds(icons: IconPlayer[]): void {
  const duplicateIds = icons.filter((player, index) => icons.findIndex((candidate) => candidate.id === player.id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`The ICON database contains duplicate IDs: ${[...new Set(duplicateIds.map((player) => player.id))].join(', ')}.`);
  }
}

export function buildSquad(
  playerName: string,
  unavailable: Set<string>,
  formation: Formation,
  icons: IconPlayer[],
  ratingTotals: number[] = [0],
  participantIndex = 0,
): { squad: Squad; used: string[] } {
  const picked: IconPlayer[] = [];
  const localIds = new Set<string>();
  const used: string[] = [];
  let participantRating = ratingTotals[participantIndex] ?? 0;
  for (const position of getPositionPlan(formation)) {
    const candidates = shuffle(icons.filter((player) =>
      !localIds.has(player.id) && !unavailable.has(player.id) &&
      !violatesExclusivePair(player.id, localIds) &&
      (player.position === position || player.secondary?.includes(position)),
    ));
    const choice = candidates.length > 0
      ? chooseFairCandidate(candidates, participantRating, ratingTotals)
      : undefined;
    if (!choice) throw new Error(`Not enough available ICONs for ${position} while building ${playerName}'s squad.`);
    picked.push({ ...choice, position });
    localIds.add(choice.id);
    used.push(choice.id);
    participantRating += choice.rating;
  }
  return { squad: { playerName, players: picked, revealed: false }, used };
}

function chooseFairCandidate(candidates: IconPlayer[], participantRating: number, ratingTotals: number[]): IconPlayer {
  const averageRating = candidates.reduce((total, player) => total + player.rating, 0) / candidates.length;
  const averageSquadRating = ratingTotals.reduce((total, rating) => total + rating, 0) / ratingTotals.length;
  const targetRating = averageSquadRating + averageRating;
  const scored = shuffle(candidates).map((player) => ({
    player,
    distance: Math.abs(participantRating + player.rating - targetRating),
  }));
  const maximumDistance = Math.max(...scored.map(({ distance }) => distance));
  const weighted = scored.map(({ player, distance }) => ({
    player,
    weight: 1 + (maximumDistance - distance) / Math.max(1, maximumDistance),
  }));
  const totalWeight = weighted.reduce((total, candidate) => total + candidate.weight, 0);
  let threshold = Math.random() * totalWeight;
  for (const candidate of weighted) {
    threshold -= candidate.weight;
    if (threshold <= 0) return candidate.player;
  }
  return weighted[weighted.length - 1].player;
}

export function generateTournament(participants: string[], formations: Formation[], icons: IconPlayer[]): Tournament {
  validateUniqueIconIds(icons);
  const squads = participants.map((playerName) => ({ playerName, players: [], revealed: false })) as Squad[];
  const used = new Set<string>();
  const participantIds = participants.map(() => new Set<string>());
  const ratingTotals = participants.map(() => 0);
  const positionPlans = formations.map(getPositionPlan);

  for (let round = 0; round < 10; round += 1) {
    for (const index of shuffle(participants.map((_, participantIndex) => participantIndex))) {
      const position = positionPlans[index][round];
      const candidates = icons.filter((player) =>
        !used.has(player.id) &&
        !violatesExclusivePair(player.id, participantIds[index]) &&
        (player.position === position || player.secondary?.includes(position)),
      );
      const choice = candidates.length > 0
        ? chooseFairCandidate(candidates, ratingTotals[index], ratingTotals)
        : undefined;
      if (!choice) throw new Error(`Not enough available ICONs for ${position} while building ${participants[index]}'s squad.`);
      squads[index].players.push({ ...choice, position });
      used.add(choice.id);
      participantIds[index].add(choice.id);
      ratingTotals[index] += choice.rating;
    }
  }
  return { id: `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, participants, squads, formations, createdAt: Date.now() };
}
