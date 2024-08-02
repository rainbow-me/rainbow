import * as i18n from '@/languages';
import { Screens } from '@/state/performance/operations';
import { safeAreaInsetValues } from '@/utils';
import { TransitionConfig } from 'moti';
import { Easing } from 'react-native-reanimated';
import { EventInfo } from '@/components/Transactions/types';

export const SCREEN_BOTTOM_INSET = safeAreaInsetValues.bottom + 20;
export const GAS_BUTTON_SPACE =
  30 + // GasSpeedButton height
  24; // Between GasSpeedButton and bottom of sheet

export const EXPANDED_CARD_BOTTOM_INSET =
  SCREEN_BOTTOM_INSET +
  24 + // Between bottom of sheet and bottom of Cancel/Confirm
  52 + // Cancel/Confirm height
  24 + // Between Cancel/Confirm and wallet avatar row
  44 + // Wallet avatar row height
  24; // Between wallet avatar row and bottom of expandable area

export const COLLAPSED_CARD_HEIGHT = 56;
export const MAX_CARD_HEIGHT = 176;

export const CARD_ROW_HEIGHT = 12;
export const SMALL_CARD_ROW_HEIGHT = 10;
export const CARD_BORDER_WIDTH = 1.5;

export const EXPANDED_CARD_TOP_INSET = safeAreaInsetValues.top + 72;

export const rotationConfig = {
  duration: 2100,
  easing: Easing.linear,
};

export const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.2, 0, 0, 1),
};

export const motiTimingConfig: TransitionConfig = {
  duration: 225,
  easing: Easing.bezier(0.2, 0, 0, 1),
  type: 'timing',
};

export const SCREEN_FOR_REQUEST_SOURCE = {
  browser: Screens.DAPP_BROWSER,
  walletconnect: Screens.WALLETCONNECT,
};

export const CHARACTERS_PER_LINE = 40;
export const LINE_HEIGHT = 11;
export const LINE_GAP = 9;

export const estimateMessageHeight = (message: string) => {
  const estimatedLines = Math.ceil(message.length / CHARACTERS_PER_LINE);
  const messageHeight = estimatedLines * LINE_HEIGHT + (estimatedLines - 1) * LINE_GAP + CARD_ROW_HEIGHT + 24 * 3 - CARD_BORDER_WIDTH * 2;

  return messageHeight;
};

export const infoForEventType: { [key: string]: EventInfo } = {
  send: {
    amountPrefix: '- ',
    icon: '􀁷',
    iconColor: 'red',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.send),
    textColor: 'red',
  },
  receive: {
    amountPrefix: '+ ',
    icon: '􀁹',
    iconColor: 'green',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.receive),
    textColor: 'green',
  },
  approve: {
    amountPrefix: '',
    icon: '􀎤',
    iconColor: 'green',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.approve),
    textColor: 'label',
  },
  revoke: {
    amountPrefix: '',
    icon: '􀎠',
    iconColor: 'red',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.revoke),
    textColor: 'label',
  },
  failed: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'red',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.likely_to_fail),
    textColor: 'red',
  },
  insufficientBalance: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'blue',
    label: '',
    textColor: 'blue',
  },
  MALICIOUS: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'red',
    label: '',
    textColor: 'red',
  },
  WARNING: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'orange',
    label: '',
    textColor: 'orange',
  },
};
