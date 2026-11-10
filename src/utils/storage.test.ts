import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Position } from '../data/icons';
import type { Tournament, TournamentRecord } from '../types';
import {
  createBackup,
  isTournament,
  isTournamentHistory,
  parseBackup,
  persistBackup,
  readStored,
  writeStored,
} from './storage';

const player = {
  id: 'test-keeper',
  name: 'Test Keeper',
  rating: 85,
  position: 'GK' as const,
  nation: 'Testland',
  nationCode: 'TS',
};
const squadPlayers = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', 'LW', 'RW', 'ST'].map((position, index) => ({
  ...player,
  id: `test-player-${index}`,
  position: position as Position,
}));

const tournament: Tournament = {
  id: 'tournament-test',
  participants: ['Alex'],
  squads: [{ playerName: 'Alex', players: squadPlayers, revealed: false }],
  formations: ['wide'],
  createdAt: 1_700_000_000_000,
};

const history: TournamentRecord[] = [{
  id: 'tournament-test',
  createdAt: tournament.createdAt,
  participants: ['Alex'],
  assignments: [{
    id: 'assignment-test',
    tournamentId: 'tournament-test',
    participantName: 'Alex',
    player,
    assignedPosition: 'GK',
    timestamp: tournament.createdAt,
    round: 1,
  }],
  status: 'completed',
}];

function installMemoryStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  vi.stubGlobal('localStorage', storage);
  return { values, storage };
}

afterEach(() => vi.unstubAllGlobals());

describe('versioned application storage', () => {
  it('writes and reads data in the current versioned envelope', () => {
    const { values } = installMemoryStorage();
    writeStored('history', history);

    expect(JSON.parse(values.get('history') ?? '')).toEqual({ version: 1, data: history });
    expect(readStored('history', isTournamentHistory)).toEqual(history);
  });

  it('validates and migrates legacy unversioned values', () => {
    const { values } = installMemoryStorage();
    const { formations: _formations, ...legacyTournament } = tournament;
    values.set('tournament', JSON.stringify({ ...legacyTournament, formation: 'wide' }));

    expect(readStored('tournament', isTournament)).toEqual({ ...legacyTournament, formation: 'wide' });
    expect(JSON.parse(values.get('tournament') ?? '')).toEqual({
      version: 1,
      data: { ...legacyTournament, formation: 'wide' },
    });
  });

  it('rejects unknown storage versions and malformed saved data', () => {
    const { values } = installMemoryStorage();
    values.set('history', JSON.stringify({ version: 2, data: history }));
    expect(() => readStored('history', isTournamentHistory)).toThrow(/unsupported version/i);

    values.set('history', JSON.stringify({ version: 1, data: [{ status: 'invalid' }] }));
    expect(() => readStored('history', isTournamentHistory)).toThrow(/schema/i);
  });

  it('round-trips validated backups and rejects unsupported or invalid files', () => {
    const backup = createBackup(tournament, history);
    expect(parseBackup(JSON.stringify(backup))).toMatchObject({
      format: 'fc26-icon-draft-backup',
      version: 1,
      tournament,
      history,
    });
    expect(() => parseBackup('{')).toThrow(/valid json/i);
    expect(() => parseBackup(JSON.stringify({ ...backup, version: 99 }))).toThrow(/unsupported backup version/i);
    expect(() => parseBackup(JSON.stringify({ ...backup, history: [{ bad: true }] }))).toThrow(/invalid or incomplete/i);
    expect(() => parseBackup(JSON.stringify({
      ...backup,
      tournament: { ...tournament, squads: [{ ...tournament.squads[0], players: [] }] },
    }))).toThrow(/invalid or incomplete/i);
  });

  it('persists imported data together and restores existing values if saving fails', () => {
    const { values } = installMemoryStorage();
    values.set('tournament', 'old-tournament');
    values.set('history', 'old-history');
    const backup = createBackup(tournament, history);

    persistBackup('tournament', 'history', backup);
    expect(readStored('tournament', isTournament)).toEqual(tournament);
    expect(readStored('history', isTournamentHistory)).toEqual(history);

    const failingStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === 'history' && value.startsWith('{"version":1')) throw new Error('quota exceeded');
        values.set(key, value);
      },
      removeItem: (key: string) => { values.delete(key); },
    };
    vi.stubGlobal('localStorage', failingStorage);
    values.set('tournament', 'prior-tournament');
    values.set('history', 'prior-history');

    expect(() => persistBackup('tournament', 'history', backup)).toThrow(/quota exceeded/i);
    expect(values.get('tournament')).toBe('prior-tournament');
    expect(values.get('history')).toBe('prior-history');
  });
});
