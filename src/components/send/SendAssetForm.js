import React, { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import styled from '@/framework/ui/styled-thing';
import { assetIsUniqueAsset } from '@/handlers/web3';
import useDimensions from '@/hooks/useDimensions';
import ShadowStack from '@/react-native-shadow-stack';
import { padding, position } from '@/styles';
import { useTheme } from '@/theme/ThemeContext';

import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import { Column } from '../layout';
import { Text } from '../text';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';

const AssetRowShadow = colors => [
  [0, 10, 30, colors.shadow, 0.12],
  [0, 5, 15, colors.shadow, 0.06],
];

const GAS_SPEED_ROW_HEIGHT = 40;
const GAS_SPEED_ROW_VERTICAL_SPACING = 20;
const GAS_SPEED_SLOT_HEIGHT = GAS_SPEED_ROW_HEIGHT + GAS_SPEED_ROW_VERTICAL_SPACING * 2;

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

const GasSpeedSlot = styled.View({
  height: GAS_SPEED_SLOT_HEIGHT,
  paddingBottom: GAS_SPEED_ROW_VERTICAL_SPACING,
  paddingTop: GAS_SPEED_ROW_VERTICAL_SPACING,
  width: '100%',
});

const FormContainer = styled(Column).attrs(
  Platform.OS === 'ios'
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
  const txSpeedSlot = <GasSpeedSlot>{txSpeedRenderer}</GasSpeedSlot>;

  return (
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
          <SendAssetFormCollectible asset={selected} buttonRenderer={buttonRenderer} txSpeedRenderer={txSpeedSlot} />
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
            txSpeedRenderer={txSpeedSlot}
          />
        )}
      </FormContainer>
    </Container>
  );
}
