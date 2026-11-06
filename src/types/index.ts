import type { IconPlayer, Position } from '../data/icons';

export type Formation = 'wide' | 'double-striker';
export type Squad = { playerName: string; players: IconPlayer[]; revealed: boolean };
export type Assignment = { id: string; tournamentId: string; participantName: string; player: IconPlayer; assignedPosition: Position; timestamp: number; round: number };
export type Tournament = { id: string; participants: string[]; squads: Squad[]; formations: Formation[]; createdAt: number };
export type TournamentRecord = { id: string; createdAt: number; participants: string[]; assignments: Assignment[]; status: 'active' | 'completed' | 'reset' };
export type Confirmation = { type: 'reset' } | { type: 'redraw'; index: number } | { type: 'delete'; player: IconPlayer };
