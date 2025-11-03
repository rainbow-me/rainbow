import React, { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ButtonPressAnimation } from '../animations';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import { Column } from '../layout';
import { Text } from '../text';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { assetIsUniqueAsset } from '@/handlers/web3';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTheme } from '@/theme';
import { IS_IOS } from '@/env';
import { NAVIGATION_BAR_HEIGHT } from '@/utils/deviceUtils';

const AssetRowShadow = colors => [
  [0, 10, 30, colors.shadow, 0.12],
  [0, 5, 15, colors.shadow, 0.06],
];

// FIXME: Quick fix for now, plz check if required again when react-native-keyboard-controller update
// iOS 26 has keyboard behavior changes that require extra space
// Footer height calculation: button (~56px) + tx speed selector (~90px) + spacing (~104px) = ~250px
const IOS_26_FOOTER_HEIGHT = 250;
const isIOS26OrHigher = IS_IOS && parseFloat(String(Platform.Version)) >= 26;

const AssetRowGradient = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.offWhite,
  end: { x: 0.5, y: 1 },
  start: { x: 0.5, y: 0 },
}))(position.coverAsObject);

const Container = styled(Column)({
  ...position.sizeAsObject('100%'),
  backgroundColor: ({ theme: { colors } }) => colors.white,
  flex: 1,
});

const FormContainer = styled(Column).attrs(
  IS_IOS
    ? {
        align: 'end',
        justify: 'space-between',
      }
    : {}
)(({ isUniqueAsset }) => ({
  flex: 1,
  ...(isUniqueAsset ? padding.object(0) : padding.object(0, 19)),
}));

export default function SendAssetForm({
  assetAmount,
  buttonRenderer,
  colorForAsset,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  setLastFocusedInputHandle,
  nativeCurrencyInputRef,
  assetInputRef,
  onResetAssetSelection,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}) {
  const { isTinyPhone, width: deviceWidth } = useDimensions();
  const [showNativeValue, setShowNativeValue] = useState(true);

  const isUniqueAsset = assetIsUniqueAsset(selected);

  const AssetRowElement = isUniqueAsset ? CollectiblesSendRow : SendCoinRow;

  const onFocusAssetInput = useCallback(() => {
    setLastFocusedInputHandle(assetInputRef);
    setShowNativeValue(false);
  }, [assetInputRef, setLastFocusedInputHandle]);

  const onFocusNativeInput = useCallback(() => {
    setLastFocusedInputHandle(nativeCurrencyInputRef);
    setShowNativeValue(true);
  }, [nativeCurrencyInputRef, setLastFocusedInputHandle]);

  const { colors } = useTheme();

  const noShadows = [[0, 0, 0, colors.transparent, 0]];
  const shadows = useMemo(() => AssetRowShadow(colors), [colors]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="always"
      extraKeyboardSpace={isIOS26OrHigher ? IOS_26_FOOTER_HEIGHT : IS_IOS ? 0 : -NAVIGATION_BAR_HEIGHT}
    >
      <Container>
        <ButtonPressAnimation onPress={onResetAssetSelection} overflowMargin={30} scaleTo={0.925}>
          <ShadowStack
            alignSelf="center"
            backgroundColor={colors.white}
            borderRadius={20}
            height={SendCoinRow.selectedHeight}
            overflow={isTinyPhone ? 'visible' : 'hidden'}
            shadows={isTinyPhone ? noShadows : shadows}
            width={deviceWidth - 38}
          >
            {isTinyPhone ? null : <AssetRowGradient />}
            <AssetRowElement disablePressAnimation item={selected} selected showNativeValue={showNativeValue} testID="send-asset-form">
              <Text align="center" color={colorForAsset || colors.dark} size="large" weight="heavy">
                􀁴
              </Text>
            </AssetRowElement>
          </ShadowStack>
        </ButtonPressAnimation>
        <FormContainer isUniqueAsset={isUniqueAsset}>
          {isUniqueAsset ? (
            <SendAssetFormCollectible asset={selected} buttonRenderer={buttonRenderer} txSpeedRenderer={txSpeedRenderer} />
          ) : (
            <SendAssetFormToken
              {...props}
              assetAmount={assetAmount}
              assetInputRef={assetInputRef}
              buttonRenderer={buttonRenderer}
              colorForAsset={colorForAsset}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              nativeCurrencyInputRef={nativeCurrencyInputRef}
              onChangeAssetAmount={onChangeAssetAmount}
              onChangeNativeAmount={onChangeNativeAmount}
              onFocusAssetInput={onFocusAssetInput}
              onFocusNativeInput={onFocusNativeInput}
              selected={selected}
              sendMaxBalance={sendMaxBalance}
              txSpeedRenderer={txSpeedRenderer}
            />
          )}
        </FormContainer>
      </Container>
    </KeyboardAwareScrollView>
  );
}
