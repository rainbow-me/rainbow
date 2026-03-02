import { type ResponseByTheme } from '@/__swaps__/utils/swaps';

export type PolymarketGameMetadata = {
  teams: string[];
  sport: string;
  ordering: TeamSide;
  type: string[];
};

export type RawPolymarketTeamInfo = {
  id: number;
  name: string;
  league: string;
  record: string;
  logo: string;
  abbreviation: string;
  alias: string | null;
  createdAt: string;
  updatedAt: string;
  providerId: number;
  color?: string;
};

export type PolymarketTeamInfo = Omit<RawPolymarketTeamInfo, 'color'> & {
  color: ResponseByTheme<string>;
};

export type TeamSide = 'away' | 'home';
