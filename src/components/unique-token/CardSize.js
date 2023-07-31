import { deviceUtils } from '@/utils';

export const UniqueTokenCardMargin = 16;
export const UniqueTokenRowPadding = 20;

export const CardSize =
  (deviceUtils.dimensions.width -
    UniqueTokenRowPadding * 2 -
    UniqueTokenCardMargin) /
  2;
