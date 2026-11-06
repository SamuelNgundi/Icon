import type { Formation } from '../types';
import type { Position } from '../data/icons';

export const POSITION_PLANS: Record<Formation, Position[]> = {
  wide: ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', 'LW', 'RW', 'ST'],
  'double-striker': ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', 'LW', 'ST', 'ST'],
};

export function getPositionPlan(formation: Formation): Position[] {
  if (formation === 'double-striker') {
    const wing: Position = Math.random() < 0.5 ? 'LW' : 'RW';
    return ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', wing, 'ST', 'ST'];
  }
  return POSITION_PLANS[formation];
}
