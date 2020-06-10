import React, { createElement, Fragment } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import AssetTypes from '../../helpers/assetTypes';
import { useAsset, useDimensions } from '../../hooks';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import { colors, padding, position } from '../../styles';
import { SendCoinRow } from '../coin-row';
import CollectiblesSendRow from '../coin-row/CollectiblesSendRow';
import SendSavingsCoinRow from '../coin-row/SendSavingsCoinRow';
import { Icon } from '../icons';
import { Column } from '../layout';
import SendAssetFormCollectible from './SendAssetFormCollectible';
import SendAssetFormToken from './SendAssetFormToken';

const tokenPaddingBottom = sheetVerticalOffset + 19;

const AssetRowShadow = [
  [0, 1, 0, colors.dark, 0.01],
  [0, 4, 12, colors.dark, 0.04],
  [0, 8, 23, colors.dark, 0.05],
];

const Container = styled(Column)`
  ${position.size('100%')};
  background-color: ${colors.white};
  flex: 1;
  overflow: hidden;
`;

const FormContainer = styled(Column).attrs({
  align: 'end',
  justify: 'space-between',
})`
  ${({ insets, isNft }) =>
    padding(22, isNft ? 0 : 15, isNft ? insets.bottom : tokenPaddingBottom)};
  background-color: ${colors.lighterGrey};
  flex: 1;
  width: 100%;
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
}) {
  const insets = useSafeArea();
  const { width: deviceWidth } = useDimensions();

  const selectedAsset = useAsset(selected);

  const isNft = selectedAsset.type === AssetTypes.nft;
  const isSavings = selectedAsset.type === AssetTypes.cToken;

  return (
    <Container>
      <ShadowStack
        borderRadius={0}
        height={SendCoinRow.selectedHeight}
        shadows={AssetRowShadow}
        width={deviceWidth}
      >
        {createElement(
          isNft
            ? CollectiblesSendRow
            : isSavings
            ? SendSavingsCoinRow
            : SendCoinRow,
          {
            children: <Icon name="doubleCaret" />,
            item: selectedAsset,
            onPress: onResetAssetSelection,
            selected: true,
          }
        )}
      </ShadowStack>
      <FormContainer insets={insets} isNft={isNft}>
        {isNft ? (
          <SendAssetFormCollectible
            asset={selectedAsset}
            buttonRenderer={buttonRenderer}
            txSpeedRenderer={txSpeedRenderer}
          />
        ) : (
          <Fragment>
            <SendAssetFormToken
              {...props}
              assetAmount={assetAmount}
              buttonRenderer={buttonRenderer}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              onChangeAssetAmount={onChangeAssetAmount}
              onChangeNativeAmount={onChangeNativeAmount}
              selected={selectedAsset}
              sendMaxBalance={sendMaxBalance}
              txSpeedRenderer={txSpeedRenderer}
            />
          </Fragment>
        )}
      </FormContainer>
    </Container>
  );
}
