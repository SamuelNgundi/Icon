export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type IconPlayer = {
  id: string;
  name: string;
  rating: number;
  position: Position;
  nation: string;
  nationCode: string;
  secondary?: Position[];
};

/**
 * Add new ICONs to the relevant primary-position group below.
 * Secondary positions keep the player eligible for alternate draft slots.
 */
export const ICONS_BY_POSITION: Record<Exclude<Position, 'CM'>, IconPlayer[]> = {
  GK: [
    { id: 'yashin', name: 'Yashin', rating: 95, position: 'GK', nation: 'Russia', nationCode: 'RU' },
    { id: 'buffon', name: 'Buffon', rating: 93, position: 'GK', nation: 'Italy', nationCode: 'IT' },
    { id: 'casillas', name: 'Casillas', rating: 92, position: 'GK', nation: 'Spain', nationCode: 'ES' },
  ],
  CB: [
    { id: 'maldini', name: 'Maldini', rating: 94, position: 'CB', nation: 'Italy', nationCode: 'IT', secondary: ['LB'] },
    { id: 'bekenbauer', name: 'Beckenbauer', rating: 95, position: 'CB', nation: 'Germany', nationCode: 'DE', secondary: ['CDM'] },
    { id: 'cannavaro', name: 'Cannavaro', rating: 93, position: 'CB', nation: 'Italy', nationCode: 'IT' },
    { id: 'vidic', name: 'Vidić', rating: 91, position: 'CB', nation: 'Serbia', nationCode: 'RS' },
    { id: 'ferdinand', name: 'Ferdinand', rating: 91, position: 'CB', nation: 'England', nationCode: 'GB' },
    { id: 'hierro', name: 'Hierro', rating: 91, position: 'CB', nation: 'Spain', nationCode: 'ES', secondary: ['CDM'] },
    { id: 'desailly', name: 'Desailly', rating: 91, position: 'CB', nation: 'France', nationCode: 'FR', secondary: ['CDM'] },
  ],
  LB: [
    { id: 'roberto-carlos', name: 'Roberto Carlos', rating: 94, position: 'LB', nation: 'Brazil', nationCode: 'BR' },
    { id: 'ashley-cole', name: 'Ashley Cole', rating: 90, position: 'LB', nation: 'England', nationCode: 'GB' },
  ],
  RB: [
    { id: 'cafu', name: 'Cafu', rating: 93, position: 'RB', nation: 'Brazil', nationCode: 'BR' },
    { id: 'zanetti', name: 'Zanetti', rating: 92, position: 'RB', nation: 'Argentina', nationCode: 'AR', secondary: ['LB'] },
    { id: 'thuram', name: 'Thuram', rating: 90, position: 'RB', nation: 'France', nationCode: 'FR', secondary: ['CB'] },
    { id: 'lahm', name: 'Lahm', rating: 91, position: 'RB', nation: 'Germany', nationCode: 'DE', secondary: ['LB', 'CDM'] },
  ],
  CDM: [
    { id: 'lothar', name: 'Lothar Matthäus', rating: 94, position: 'CDM', nation: 'Germany', nationCode: 'DE', secondary: ['CM'] },
    { id: 'vieira', name: 'Vieira', rating: 92, position: 'CDM', nation: 'France', nationCode: 'FR' },
    { id: 'makalele', name: 'Makélélé', rating: 90, position: 'CDM', nation: 'France', nationCode: 'FR' },
    { id: 'pirlo', name: 'Pirlo', rating: 92, position: 'CDM', nation: 'Italy', nationCode: 'IT', secondary: ['CAM'] },
  ],
  CAM: [
    { id: 'zidane', name: 'Zidane', rating: 96, position: 'CAM', nation: 'France', nationCode: 'FR' },
    { id: 'ronaldinho', name: 'Ronaldinho', rating: 95, position: 'CAM', nation: 'Brazil', nationCode: 'BR', secondary: ['LW'] },
    { id: 'kaka', name: 'Kaká', rating: 93, position: 'CAM', nation: 'Brazil', nationCode: 'BR', secondary: ['ST'] },
    { id: 'rivaldo', name: 'Rivaldo', rating: 92, position: 'CAM', nation: 'Brazil', nationCode: 'BR', secondary: ['LW', 'ST'] },
    { id: 'scholes', name: 'Scholes', rating: 89, position: 'CAM', nation: 'England', nationCode: 'GB', secondary: ['CDM'] },
  ],
  LW: [
    { id: 'henry', name: 'Henry', rating: 94, position: 'LW', nation: 'France', nationCode: 'FR', secondary: ['ST'] },
    { id: 'nedved', name: 'Nedvěd', rating: 91, position: 'LW', nation: 'Czechia', nationCode: 'CZ', secondary: ['CAM'] },
    { id: 'best', name: 'George Best', rating: 93, position: 'LW', nation: 'Northern Ireland', nationCode: 'GB', secondary: ['RW'] },
    { id: 'stoichkov', name: 'Stoichkov', rating: 91, position: 'LW', nation: 'Bulgaria', nationCode: 'BG', secondary: ['ST'] },
  ],
  RW: [
    { id: 'figo', name: 'Figo', rating: 92, position: 'RW', nation: 'Portugal', nationCode: 'PT', secondary: ['CAM'] },
    { id: 'garrincha', name: 'Garrincha', rating: 94, position: 'RW', nation: 'Brazil', nationCode: 'BR', secondary: ['LW'] },
  ],
  ST: [
    { id: 'ronaldo', name: 'Ronaldo', rating: 96, position: 'ST', nation: 'Brazil', nationCode: 'BR' },
    { id: 'pele', name: 'Pelé', rating: 95, position: 'ST', nation: 'Brazil', nationCode: 'BR', secondary: ['CAM'] },
    { id: 'eusebio', name: 'Eusébio', rating: 94, position: 'ST', nation: 'Portugal', nationCode: 'PT' },
    { id: 'van-basten', name: 'Van Basten', rating: 93, position: 'ST', nation: 'Netherlands', nationCode: 'NL' },
    { id: 'shevchenko', name: 'Shevchenko', rating: 91, position: 'ST', nation: 'Ukraine', nationCode: 'UA' },
    { id: 'dalglish', name: 'Dalglish', rating: 90, position: 'ST', nation: 'Scotland', nationCode: 'GB' },
  ],
};

export const ICONS: IconPlayer[] = Object.values(ICONS_BY_POSITION).flat();
