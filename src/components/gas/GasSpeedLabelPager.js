import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPagerItem from './GasSpeedLabelPagerItem';
import { margin, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  border-radius: 15px;
  ${padding(0, 5, 5)};
)
`;

const SpeedContainer = styled(Column).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  border-radius: 15px;
  ${padding(0, 5, 5)};
)
`;

const Symbol = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'heavy',
})``;

const DoneCustomGas = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})`
  ${margin(0, 0, 0, 0)}
`;

const GasSpeedLabelPager = ({
  showGasOptions,
  label,
  theme,
  onPress,
  colorForAsset,
  enabled,
}) => {
  const [touched, setTouched] = useState(false);
  const { colors } = useTheme();

  useEffect(() => setTouched(true), [label]);

  const renderPager = useCallback(
    (children, props) => {
      if (enabled) {
        return (
          <SpeedButton color={colorForAsset} {...props}>
            {children}
          </SpeedButton>
        );
      }
      return <SpeedContainer color={colorForAsset}>{children}</SpeedContainer>;
    },
    [colorForAsset, enabled]
  );

  return (
    <Row align="center" justify="end">
      <Column>
        {!showGasOptions ? (
          renderPager(
            <Row align={(ios && 'end') || 'stretch'}>
              <Column>
                <GasSpeedLabelPagerItem
                  colorForAsset={colorForAsset}
                  key={label}
                  label={label}
                  selected
                  shouldAnimate={touched}
                  theme={theme}
                />
              </Column>
              {enabled && (
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
            </Row>,
            { color: colorForAsset, onPress }
          )
        ) : (
          <DoneCustomGas
            color={
              theme !== 'light'
                ? colors.whiteLabel
                : colors.alpha(colors.blueGreyDark, 0.8)
            }
          >
            Done
          </DoneCustomGas>
        )}
      </Column>
    </Row>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
