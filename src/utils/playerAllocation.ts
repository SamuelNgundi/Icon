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

export function generateTournament(participants: string[], formations: Formation[], icons: IconPlayer[]): Tournament {
  validateUniqueIconIds(icons);
  const squads: Squad[] = [];
  const used = new Set<string>();
  const order = shuffle(participants.map((playerName, index) => ({ playerName, index })));
  order.forEach(({ playerName, index }) => {
    const result = buildSquad(playerName, used, formations[index], icons);
    result.used.forEach((id) => used.add(id));
    squads[index] = result.squad;
  });
  return { id: `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, participants, squads, formations, createdAt: Date.now() };
}
