import type { IconPlayer, Position } from '../data/icons';
import type { Assignment, Formation, Squad, Tournament, TournamentRecord } from '../types';

const STORAGE_VERSION = 1;
const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const FORMATIONS: Formation[] = ['wide', 'double-striker'];

export type AppBackup = {
  format: 'fc26-icon-draft-backup';
  version: 1;
  exportedAt: number;
  tournament: Tournament | null;
  history: TournamentRecord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIconPlayer(value: unknown): value is IconPlayer {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isFiniteNumber(value.rating) &&
    POSITIONS.includes(value.position as Position) &&
    typeof value.nation === 'string' &&
    typeof value.nationCode === 'string' &&
    (value.secondary === undefined ||
      (Array.isArray(value.secondary) && value.secondary.every((position) => POSITIONS.includes(position as Position))));
}

function isSquad(value: unknown): value is Squad {
  return isRecord(value) &&
    typeof value.playerName === 'string' &&
    Array.isArray(value.players) &&
    value.players.length === 10 &&
    value.players.every(isIconPlayer) &&
    typeof value.revealed === 'boolean';
}

export function isTournament(value: unknown): value is Tournament & { formation?: Formation } {
  if (!isRecord(value)) return false;
  const { id, participants, squads, createdAt, formations, formation } = value;
  if (typeof id !== 'string' ||
      !Array.isArray(participants) ||
      participants.length === 0 ||
      !participants.every((participant): participant is string => typeof participant === 'string') ||
      !Array.isArray(squads) ||
      squads.length !== participants.length ||
      !squads.every(isSquad) ||
      !isFiniteNumber(createdAt)) return false;

  if (squads.some((squad, index) => squad.playerName !== participants[index])) return false;
  const playerIds = squads.flatMap((squad) => squad.players.map((player) => player.id));
  if (new Set(playerIds).size !== playerIds.length) return false;
  if (squads.some((squad) => {
    const ids = new Set(squad.players.map((player) => player.id));
    return ids.has('pele') && ids.has('ronaldo');
  })) return false;

  const formationsValid = formations === undefined
    ? formation === undefined || FORMATIONS.includes(formation as Formation)
    : Array.isArray(formations) &&
      formations.length === squads.length &&
      formations.every((item) => FORMATIONS.includes(item as Formation));

  return formationsValid;
}

function isAssignment(value: unknown): value is Assignment {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.tournamentId === 'string' &&
    typeof value.participantName === 'string' &&
    isIconPlayer(value.player) &&
    POSITIONS.includes(value.assignedPosition as Position) &&
    isFiniteNumber(value.timestamp) &&
    isFiniteNumber(value.round);
}

export function isTournamentRecord(value: unknown): value is TournamentRecord {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    isFiniteNumber(value.createdAt) &&
    Array.isArray(value.participants) &&
    value.participants.every((participant) => typeof participant === 'string') &&
    Array.isArray(value.assignments) &&
    value.assignments.every(isAssignment) &&
    ['active', 'completed', 'reset'].includes(value.status as string);
}

export function isTournamentHistory(value: unknown): value is TournamentRecord[] {
  return Array.isArray(value) && value.every(isTournamentRecord);
}

export function createBackup(tournament: Tournament | null, history: TournamentRecord[]): AppBackup {
  return {
    format: 'fc26-icon-draft-backup',
    version: 1,
    exportedAt: Date.now(),
    tournament,
    history,
  };
}

export function parseBackup(text: string): AppBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!isRecord(parsed) || parsed.format !== 'fc26-icon-draft-backup') {
    throw new Error('This file is not an FC 26 ICON DRAFT backup.');
  }
  if (parsed.version !== 1) {
    throw new Error(`Unsupported backup version: ${String(parsed.version)}.`);
  }
  if (!isFiniteNumber(parsed.exportedAt) ||
      !(parsed.tournament === null || isTournament(parsed.tournament)) ||
      !isTournamentHistory(parsed.history)) {
    throw new Error('The backup data is invalid or incomplete. No saved data was changed.');
  }
  const tournament = parsed.tournament === null
    ? null
    : parsed.tournament as Tournament & { formation?: Formation };
  return {
    format: 'fc26-icon-draft-backup',
    version: 1,
    exportedAt: parsed.exportedAt,
    tournament: tournament
      ? {
          ...tournament,
          formations: tournament.formations ?? tournament.squads.map(() => tournament.formation ?? 'wide'),
        }
      : null,
    history: parsed.history,
  };
}

export function readStored<T>(key: string, validate: (value: unknown) => value is T): T | null {
  const saved = localStorage.getItem(key);
  if (!saved) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error(`Saved data for "${key}" is corrupted and could not be read.`);
  }

  if (isRecord(parsed) && 'version' in parsed && 'data' in parsed) {
    if (parsed.version !== STORAGE_VERSION) {
      throw new Error(`Saved data for "${key}" uses an unsupported version.`);
    }
    if (!validate(parsed.data)) {
      throw new Error(`Saved data for "${key}" does not match the expected schema.`);
    }
    return parsed.data;
  }

  if (!validate(parsed)) {
    throw new Error(`Saved data for "${key}" does not match the expected schema.`);
  }

  writeStored(key, parsed);
  return parsed;
}

export function writeStored<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data: value }));
}

export function persistBackup(
  tournamentKey: string,
  historyKey: string,
  backup: AppBackup,
): void {
  const previousTournament = localStorage.getItem(tournamentKey);
  const previousHistory = localStorage.getItem(historyKey);

  try {
    if (backup.tournament) writeStored(tournamentKey, backup.tournament);
    else localStorage.removeItem(tournamentKey);
    writeStored(historyKey, backup.history);
  } catch (error) {
    try {
      if (previousTournament === null) localStorage.removeItem(tournamentKey);
      else localStorage.setItem(tournamentKey, previousTournament);
      if (previousHistory === null) localStorage.removeItem(historyKey);
      else localStorage.setItem(historyKey, previousHistory);
    } catch (rollbackError) {
      throw new Error(`Backup could not be saved, and previous browser data could not be restored: ${String(rollbackError)}`);
    }
    throw error;
  }
}
