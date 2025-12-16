import { PolymarketTeamInfo } from '@/features/polymarket/types';

export function getOutcomeTeam(outcome: string, teams?: PolymarketTeamInfo[]): PolymarketTeamInfo | undefined {
  if (!teams) return undefined;
  const outcomeLowerCase = outcome.toLowerCase();
  return teams.find(team => {
    if (team.alias?.toLowerCase() === outcomeLowerCase) return true;
    if (team.name?.toLowerCase() === outcomeLowerCase) return true;
    if (team.abbreviation?.toLowerCase() === outcomeLowerCase) return true;
  });
}
