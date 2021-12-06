import { isEmpty, upperFirst } from 'lodash';
import React from 'react';
import { ScrollView, View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../discover-sheet/EdgeFade' was resolve... Remove this comment to see the full error message
import EdgeFade from '../../discover-sheet/EdgeFade';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useGas } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils } from '@rainbow-me/utils';

const PillScrollViewStyle = { flexGrow: 1, justifyContent: 'center' };
const ANDROID_EXTRA_LINE_HEIGHT = 6;

const { CUSTOM, URGENT, GasSpeedOrder } = gasUtils;

export const TabPillWrapper = styled(View).attrs({})`
  ${padding(3, 8)};
  ${margin(0, 4, 0, 4)};
  height: 30px;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSelected' does not exist on type 'View... Remove this comment to see the full error message
  border: ${({ isSelected, color, theme: { colors } }) =>
    `2px solid ${
      isSelected
        ? color || colors.appleBlue
        : colors.alpha(colors.blueGreyDark, 0.06)
    }`};
  border-radius: 15px;
  line-height: 20px;
`;
export const TabPillText = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'heavy',
})`
  color: ${({ isSelected, theme: { colors }, color }) =>
    `${
      isSelected
        ? color || colors.appleBlue
        : colors.alpha(colors.blueGreyDark, 0.4)
    }`};
  ${margin(
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
`;

const TabPill = ({
  label,
  isSelected,
  handleOnPressTabPill,
  color,
  testID,
}: any) => {
  const handleOnPress = () => {
    handleOnPressTabPill(label);
  };
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={handleOnPress} testID={testID}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TabPillWrapper color={color} isSelected={isSelected}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TabPillText
          color={color}
          isSelected={isSelected}
          size="lmedium"
          weight="bold"
        >
          {upperFirst(label)}
        </TabPillText>
      </TabPillWrapper>
    </ButtonPressAnimation>
  );
};

export default function FeesPanelTabs({
  onPressTabPill,
  colorForAsset,
  speeds = GasSpeedOrder,
}: any) {
  const {
    updateGasFeeOption,
    selectedGasFeeOption,
    gasFeeParamsBySpeed,
    updateToCustomGasFee,
  } = useGas();

  const handleOnPressTabPill = (label: any) => {
    if (label === CUSTOM && isEmpty(gasFeeParamsBySpeed[CUSTOM])) {
      const gasFeeParams = gasFeeParamsBySpeed[URGENT];
      updateToCustomGasFee({
        ...gasFeeParams,
        option: CUSTOM,
      });
    } else {
      updateGasFeeOption(label);
    }
    onPressTabPill();
  };

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row align="center">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ScrollView contentContainerStyle={PillScrollViewStyle} horizontal>
        {speeds.map((speed: any) => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Column key={speed}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TabPill
              color={colorForAsset}
              handleOnPressTabPill={handleOnPressTabPill}
              isSelected={selectedGasFeeOption === speed}
              label={speed}
              testID={`speed-pill-${speed}`}
            />
          </Column>
        ))}
      </ScrollView>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <EdgeFade />
    </Row>
  );
}
