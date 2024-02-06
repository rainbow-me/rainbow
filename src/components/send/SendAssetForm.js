import React, { Fragment, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { KeyboardArea } from 'react-native-keyboard-area';
import { ButtonPressAnimation } from '../animations';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import { Column } from '../layout';
import { Text } from '../text';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';
import { AssetTypes } from '@/entities';
import { useDimensions, useKeyboardHeight } from '@/hooks';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

const AssetRowShadow = colors => [
  [0, 10, 30, colors.shadow, 0.12],
  [0, 5, 15, colors.shadow, 0.06],
];

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
  ios
    ? {
        align: 'end',
        justify: 'space-between',
      }
    : {}
)(({ isNft }) => ({
  flex: 1,
  ...(isNft ? padding.object(0) : padding.object(0, 19)),
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
  const keyboardHeight = useKeyboardHeight();
  const [showNativeValue, setShowNativeValue] = useState(true);

  const isNft = selected.type === AssetTypes.nft;

  const AssetRowElement = isNft ? CollectiblesSendRow : SendCoinRow;

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
          <AssetRowElement
            badgeYPosition={5}
            disablePressAnimation
            item={selected}
            selected
            showNativeValue={showNativeValue}
            testID="send-asset-form"
          >
            <Text align="center" color={colorForAsset || colors.dark} size="large" weight="heavy">
              􀁴
            </Text>
          </AssetRowElement>
        </ShadowStack>
      </ButtonPressAnimation>
      <FormContainer isNft={isNft}>
        {isNft ? (
          <SendAssetFormCollectible asset={selected} buttonRenderer={buttonRenderer} txSpeedRenderer={txSpeedRenderer} />
        ) : (
          <Fragment>
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
            <KeyboardArea initialHeight={keyboardHeight} isOpen />
          </Fragment>
        )}
      </FormContainer>
    </Container>
  );
}
