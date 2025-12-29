import { ResponseByTheme } from '@/__swaps__/utils/swaps';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import colors from '@/styles/colors';
import { addressHashedColorIndex } from '@/utils/profileUtils';

export function getOutcomeTeam({
  outcome,
  outcomeIndex,
  teams,
}: {
  outcome: string;
  outcomeIndex: number;
  teams?: PolymarketTeamInfo[];
}): PolymarketTeamInfo | undefined {
  if (!teams) return undefined;
  const outcomeLowerCase = outcome.toLowerCase();
  const team = teams.find(team => {
    if (team.alias?.toLowerCase() === outcomeLowerCase) return true;
    if (team.name?.toLowerCase() === outcomeLowerCase) return true;
    if (team.abbreviation?.toLowerCase() === outcomeLowerCase) return true;
  });

  if (team) return team;

  // Sometimes we cannot match the outcome to the team because it uses some name that is neither the alias, name, nor abbreviation
  // i.e. "memphis" instead of "memphis grizzlies" or "grizzlies"
  if (!team && teams?.[outcomeIndex]) {
    return teams[outcomeIndex];
  }
}

export function getOutcomeTeamColor({
  outcome,
  outcomeIndex,
  teams,
}: {
  outcome: string;
  outcomeIndex: number;
  teams?: PolymarketTeamInfo[];
}): ResponseByTheme<string> {
  const team = getOutcomeTeam({ outcome, outcomeIndex, teams });
  return team?.color ?? getOutcomeTeamFallbackColor(outcome);
}

function getOutcomeTeamFallbackColor(outcome: string): ResponseByTheme<string> {
  const fallbackColorIndex = addressHashedColorIndex(outcome) ?? 0;
  const fallbackColor = colors.avatarBackgrounds[fallbackColorIndex];
  return { light: getHighContrastColor(fallbackColor, false), dark: getHighContrastColor(fallbackColor, true) };
}
