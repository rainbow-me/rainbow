import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { useNavigation } from '../../navigation/Navigation';
import { swapDetailsTransitionPosition } from '../../navigation/effects';
import TouchableBackdrop from '../TouchableBackdrop';
import { FloatingEmojisTapper } from '../floating-emojis';
import { AssetPanel, FloatingPanels } from '../floating-panels';
import { ColumnWithMargins, KeyboardFixedOpenLayout } from '../layout';
import { SwapDetailRow, SwapDetailsFooter } from './swap-details';

const FloatingEmojisOpacity = swapDetailsTransitionPosition.interpolate({
  inputRange: [0.93, 1],
  outputRange: [0, 1],
});

const SwapDetailsState = ({
  inputCurrencySymbol,
  inputExecutionRate,
  inputNativePrice,
  outputCurrencySymbol,
  outputExecutionRate,
  outputNativePrice,
  restoreFocusOnSwapModal,
}) => {
  const { goBack } = useNavigation();
  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  const {
    params: { toggleGestureEnabled },
  } = useRoute();
  const isFocused = useIsFocused();

  useEffect(() => {
    android && toggleGestureEnabled(!isFocused);
  }, [toggleGestureEnabled, isFocused]);

  const emojis = useMemo(() => {
    const symbols = [inputCurrencySymbol, outputCurrencySymbol];
    if (symbols.includes('FAME')) return ['prayer_beads'];
    if (symbols.includes('SOCKS')) return ['socks'];
    return ['unicorn'];
  }, [inputCurrencySymbol, outputCurrencySymbol]);

  return (
    <KeyboardFixedOpenLayout>
      {ios && <TouchableBackdrop onPress={goBack} />}
      <FloatingPanels maxWidth={275} width={275}>
        <FloatingEmojisTapper
          emojis={emojis}
          opacity={FloatingEmojisOpacity}
          radiusAndroid={20}
        >
          <AssetPanel
            overflow="visible"
            radius={20}
            testID="swap-details-state"
          >
            <ColumnWithMargins
              margin={24}
              paddingHorizontal={19}
              paddingVertical={24}
            >
              {inputCurrencySymbol && inputExecutionRate && (
                <SwapDetailRow
                  label={`1 ${inputCurrencySymbol}`}
                  value={`${inputExecutionRate} ${outputCurrencySymbol}`}
                />
              )}
              {outputCurrencySymbol && outputExecutionRate && (
                <SwapDetailRow
                  label={`1 ${outputCurrencySymbol}`}
                  value={`${outputExecutionRate} ${inputCurrencySymbol}`}
                />
              )}
              {inputCurrencySymbol && inputNativePrice && (
                <SwapDetailRow
                  label={inputCurrencySymbol}
                  value={inputNativePrice}
                />
              )}
              {outputCurrencySymbol && outputNativePrice && (
                <SwapDetailRow
                  label={outputCurrencySymbol}
                  value={outputNativePrice}
                />
              )}
              <SwapDetailsFooter />
            </ColumnWithMargins>
          </AssetPanel>
        </FloatingEmojisTapper>
      </FloatingPanels>
    </KeyboardFixedOpenLayout>
  );
};

export default React.memo(SwapDetailsState);
