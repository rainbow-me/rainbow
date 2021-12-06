import React, { Fragment, useMemo } from 'react';
import { KeyboardArea } from 'react-native-keyboard-area';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { SendCoinRow } from '../coin-row';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../coin-row/CollectiblesSendRow' was resol... Remove this comment to see the full error message
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../coin-row/SendSavingsCoinRow' was resolv... Remove this comment to see the full error message
import SendSavingsCoinRow from '../coin-row/SendSavingsCoinRow';
import { Column } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SendAssetFormCollectible' was resolved t... Remove this comment to see the full error message
import SendAssetFormCollectible from './SendAssetFormCollectible';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SendAssetFormToken' was resolved to '/Us... Remove this comment to see the full error message
import SendAssetFormToken from './SendAssetFormToken';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset, useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const AssetRowShadow = (colors: any) => [
  [0, 10, 30, colors.shadow, 0.12],
  [0, 5, 15, colors.shadow, 0.06],
];

const AssetRowGradient = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.offWhite,
    end: { x: 0.5, y: 1 },
    start: { x: 0.5, y: 0 },
  })
)`
  ${position.cover};
`;

const Container = styled(Column)`
  ${position.size('100%')};
  background-color: ${({ theme: { colors } }) => colors.white};
  flex: 1;
`;

const FormContainer = styled(Column).attrs({
  align: 'end',
  justify: 'space-between',
})`
  ${({ isNft }) => (isNft ? padding(0) : padding(0, 19))};
  flex: 1;
  width: 100%;
`;

const KeyboardSizeView = styled(KeyboardArea)`
  background-color: ${({ theme: { colors } }) => colors.lighterGrey};
`;

export default function SendAssetForm({
  assetAmount,
  buttonRenderer,
  nativeAmount,
  nativeCurrency,
  onChangeAssetAmount,
  onChangeNativeAmount,
  onResetAssetSelection,
  selected,
  sendMaxBalance,
  txSpeedRenderer,
  ...props
}: any) {
  const { isTinyPhone, width: deviceWidth } = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [showNativeValue, setShowNativeValue] = useState(true);

  const isNft = selected.type === AssetTypes.nft;
  const isSavings = selected.type === AssetTypes.compound;

  const AssetRowElement = isNft
    ? CollectiblesSendRow
    : isSavings
    ? SendSavingsCoinRow
    : SendCoinRow;

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const onFocusAssetInput = useCallback(() => {
    setShowNativeValue(false);
  }, []);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const onFocusNativeInput = useCallback(() => {
    setShowNativeValue(true);
  }, []);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const address = selected?.mainnet_address || selected?.address;

  let colorForAsset = useColorForAsset({ address });
  if (isNft) {
    colorForAsset = colors.appleBlue;
  }

  const noShadows = [[0, 0, 0, colors.transparent, 0]];
  const shadows = useMemo(() => AssetRowShadow(colors), [colors]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        onPress={onResetAssetSelection}
        overflowMargin={30}
        scaleTo={0.925}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ShadowStack
          alignSelf="center"
          backgroundColor={colors.white}
          borderRadius={20}
          height={SendCoinRow.selectedHeight}
          overflow={isTinyPhone ? 'visible' : 'hidden'}
          shadows={isTinyPhone ? noShadows : shadows}
          width={deviceWidth - 38}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {isTinyPhone ? null : <AssetRowGradient />}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AssetRowElement
            badgeYPosition={5}
            disablePressAnimation
            item={selected}
            selected
            showNativeValue={showNativeValue}
            testID="send-asset-form"
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              align="center"
              color={colorForAsset || colors.dark}
              size="large"
              weight="heavy"
            >
              􀁴
            </Text>
          </AssetRowElement>
        </ShadowStack>
      </ButtonPressAnimation>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FormContainer isNft={isNft}>
        {isNft ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <SendAssetFormCollectible
            asset={selected}
            buttonRenderer={buttonRenderer}
            txSpeedRenderer={txSpeedRenderer}
          />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Fragment>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SendAssetFormToken
              {...props}
              assetAmount={assetAmount}
              buttonRenderer={buttonRenderer}
              colorForAsset={colorForAsset}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              onChangeAssetAmount={onChangeAssetAmount}
              onChangeNativeAmount={onChangeNativeAmount}
              onFocusAssetInput={onFocusAssetInput}
              onFocusNativeInput={onFocusNativeInput}
              selected={selected}
              sendMaxBalance={sendMaxBalance}
              txSpeedRenderer={txSpeedRenderer}
            />
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
            {ios ? <KeyboardSizeView isOpen /> : null}
          </Fragment>
        )}
      </FormContainer>
    </Container>
  );
}
