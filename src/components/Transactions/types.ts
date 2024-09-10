import { TextColor } from '@/design-system/color/palettes';

export type EventType = 'send' | 'receive' | 'approve' | 'revoke' | 'failed' | 'insufficientBalance' | 'MALICIOUS' | 'WARNING';

export type EventInfo = {
  amountPrefix: string;
  icon: string;
  iconColor: TextColor;
  label: string;
  textColor: TextColor;
};

export type DetailType = 'chain' | 'contract' | 'to' | 'function' | 'sourceCodeVerification' | 'dateCreated' | 'nonce';

export type DetailInfo = {
  icon: string;
  label: string;
};
