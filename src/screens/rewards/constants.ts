import { RewardStatsActionType } from '@/graphql/__generated__/metadata';
import * as i18n from '@/languages';

export const RANK_SYMBOLS: Record<string, string> = {
  '1': '🥇',
  '2': '🥈',
  '3': '🥉',
  '4': '􀁀',
  '5': '􀁂',
  '6': '􀁄',
  '7': '􀁆',
  '8': '􀁈',
  '9': '􀁊',
  '10': '􀓵',
  '11': '􀓶',
  '12': '􀓷',
  '13': '􀓸',
  '14': '􀓹',
  '15': '􀓺',
  '16': '􀓻',
  '17': '􀓼',
  '18': '􀓽',
  '19': '􀓾',
  '20': '􀓿',
  '21': '􀔀',
  '22': '􀔁',
  '23': '􀔂',
  '24': '􀔃',
  '25': '􀔄',
  '26': '􀔅',
  '27': '􀔆',
  '28': '􀔇',
  '29': '􀔈',
  '30': '􀔉',
  '31': '􀘠',
  '32': '􀚗',
  '33': '􀚙',
  '34': '􀚛',
  '35': '􀚝',
  '36': '􀚟',
  '37': '􀚡',
  '38': '􀚣',
  '39': '􀚥',
  '40': '􀚧',
  '41': '􀚩',
  '42': '􀚫',
  '43': '􀚭',
  '44': '􀚯',
  '45': '􀚱',
  '46': '􀚳',
  '47': '􀚵',
  '48': '􀚷',
  '49': '􀚹',
  '50': '􀚻',
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
