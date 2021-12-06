import { deviceUtils } from '@rainbow-me/utils';

export const UniqueTokenCardMargin = 15;
export const UniqueTokenRowPadding = 19;

export const CardSize =
  (deviceUtils.dimensions.width -
    UniqueTokenRowPadding * 2 -
    UniqueTokenCardMargin) /
  2;
