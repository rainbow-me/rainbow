import { upperFirst } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Row } from '../layout';
import { Text } from '../text';
import { GasSpeedEmoji } from '.';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  height: 30,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(2.5, 4, android ? 2.5 : 3.5, 6)};
  border-radius: 19;
`;

const Symbol = styled(Text).attrs({
  lineHeight: 'normal',
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  size: android ? 'bmedium' : 'lmedium',
  weight: 'heavy',
})`
  ${margin(0, 0)};
`;

const GasSpeedLabel = styled(Text).attrs({
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(android ? 0 : -1, 4, 0, 4)};
`;

const GasSpeedLabelPager = ({
  label,
  theme,
  onPress,
  colorForAsset,
  dropdownEnabled,
}: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SpeedButton
      color={colorForAsset}
      disabled={!dropdownEnabled}
      onPress={onPress}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <GasSpeedEmoji label={label} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <GasSpeedLabel
          color={
            theme === 'dark'
              ? colors.whiteLabel
              : colors.alpha(colors.blueGreyDark, 0.8)
          }
        >
          {upperFirst(label)}
        </GasSpeedLabel>
        {dropdownEnabled && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Symbol
            color={
              theme !== 'light'
                ? colors.whiteLabel
                : colors.alpha(colors.blueGreyDark, 0.8)
            }
          >
            􀁰
          </Symbol>
        )}
      </Row>
    </SpeedButton>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
