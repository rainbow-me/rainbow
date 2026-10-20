import { type PolymarketTeamInfo } from '@/features/polymarket/types/team-info';
import { type Participant } from '@/features/sports/core/generated/sports';

/** Uses the matching participant's resolved image, including an absent image. */
export function getSportsTeamImage(team: PolymarketTeamInfo | undefined, participants?: Participant[]): string | undefined {
  if (!team) return undefined;
  const participant = participants?.find(participant => participant.id === String(team.id));
  return participant ? participant.imageUrl : team.logo;
}
