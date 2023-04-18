import { RewardStatsActionType } from '@/graphql/__generated__/metadata';
import * as i18n from '@/languages';

export const TOP_RANK_SYMBOLS: Record<string, string> = {
  '1': '🥇',
  '2': '🥈',
  '3': '🥉',
};

export const DARK_RANK_1_GRADIENT_COLORS = ['#FFE456', '#CF9500'];
export const DARK_RANK_2_GRADIENT_COLORS = ['#FBFCFE', '#B3BCC7'];
export const DARK_RANK_3_GRADIENT_COLORS = ['#DE8F38', '#AE5F25'];

export const LIGHT_RANK_1_GRADIENT_COLORS = ['#E2B730', '#CF9500'];
export const LIGHT_RANK_2_GRADIENT_COLORS = ['#ABAFB6', '#81858B'];
export const LIGHT_RANK_3_GRADIENT_COLORS = ['#D48834', '#AA5820'];
export const STATS_TITLES = {
  [RewardStatsActionType.Swap]: i18n.t(i18n.l.rewards.swapped),
  [RewardStatsActionType.Bridge]: i18n.t(i18n.l.rewards.bridged),
};
