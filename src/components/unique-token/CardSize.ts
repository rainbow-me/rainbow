// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { deviceUtils } from '@rainbow-me/utils';

export const UniqueTokenCardMargin = 15;
export const UniqueTokenRowPadding = 19;

export const CardSize =
  (deviceUtils.dimensions.width -
    UniqueTokenRowPadding * 2 -
    UniqueTokenCardMargin) /
  2;
