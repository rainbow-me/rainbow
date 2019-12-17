import PropTypes from 'prop-types';
import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { expandedStateTransitionPosition } from '../../navigation/transitions/effects';
import { colors, padding, position } from '../../styles';
import { FloatingEmojis, FloatingEmojisTapHandler } from '../floating-emojis';
import {
  ColumnWithMargins,
  KeyboardFixedOpenLayout,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Text } from '../text';
import TouchableBackdrop from '../TouchableBackdrop';
import { AssetPanel } from './asset-panel';
import FloatingPanels from './FloatingPanels';

const DetailsRow = ({ label, value, ...props }) => (
  <Row {...props} align="center" justify="space-between">
    <Text flex={0} size="lmedium">
      {label}
    </Text>
    <Text color={colors.alpha(colors.dark, 0.6)} size="lmedium">
      {value}
    </Text>
  </Row>
);

const SwapDetailsState = ({
  inputCurrencySymbol,
  inputExecutionRate,
  inputNativePrice,
  outputCurrencySymbol,
  outputExecutionRate,
  outputNativePrice,
}) => {
  const { goBack } = useNavigation();

  return (
    <KeyboardFixedOpenLayout>
      <TouchableBackdrop onPress={goBack} />
      <FloatingPanels maxWidth={275} width={275}>
        <AssetPanel overflow="visible">
          <FloatingEmojis
            distance={350}
            duration={2000}
            emoji="unicorn_face"
            size={36}
            transitionPosition={expandedStateTransitionPosition}
            wiggleFactor={1}
          >
            {({ onNewEmoji }) => (
              <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
                <ColumnWithMargins
                  {...position.centeredAsObject}
                  css={padding(24, 19)}
                  margin={24}
                >
                  {inputCurrencySymbol && inputExecutionRate && (
                    <DetailsRow
                      label={`1 ${inputCurrencySymbol}`}
                      value={`${inputExecutionRate} ${outputCurrencySymbol}`}
                    />
                  )}
                  {outputCurrencySymbol && outputExecutionRate && (
                    <DetailsRow
                      label={`1 ${outputCurrencySymbol}`}
                      value={`${outputExecutionRate} ${inputCurrencySymbol}`}
                    />
                  )}
                  {inputCurrencySymbol && inputNativePrice && (
                    <DetailsRow
                      label={inputCurrencySymbol}
                      value={inputNativePrice}
                    />
                  )}
                  {outputCurrencySymbol && outputNativePrice && (
                    <DetailsRow
                      label={outputCurrencySymbol}
                      value={outputNativePrice}
                    />
                  )}
                  <Row align="center" justify="space-between">
                    <Text size="lmedium">Exchange</Text>
                    <RowWithMargins align="center" margin={5}>
                      <Emoji
                        lineHeight="none"
                        name="unicorn_face"
                        size="lmedium"
                        weight="medium"
                      />
                      <Text color="#DC6BE5" size="lmedium" weight="medium">
                        Uniswap
                      </Text>
                    </RowWithMargins>
                  </Row>
                </ColumnWithMargins>
              </FloatingEmojisTapHandler>
            )}
          </FloatingEmojis>
        </AssetPanel>
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
};

SwapDetailsState.propTypes = {
  inputCurrencySymbol: PropTypes.string,
  inputExecutionRate: PropTypes.string,
  inputNativePrice: PropTypes.string,
  outputCurrencySymbol: PropTypes.string,
  outputExecutionRate: PropTypes.string,
  outputNativePrice: PropTypes.string,
};

export default React.memo(SwapDetailsState);
