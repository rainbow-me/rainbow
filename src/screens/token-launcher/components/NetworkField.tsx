import React from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, Inline, Text, TextIcon } from '@/design-system';
import { FieldContainer } from './FieldContainer';
import { FieldLabel } from './FieldLabel';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ERROR_RED, FIELD_BORDER_COLOR, FIELD_BORDER_WIDTH, INPUT_HEIGHT } from '../constants';
import { ButtonPressAnimation } from '@/components/animations';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { ChainId } from '@/state/backendNetworks/types';

export function NetworkField() {
  const { accentColors } = useTokenLauncherContext();
  const chainId = useTokenLauncherStore(state => state.chainId);
  const setChainId = useTokenLauncherStore(state => state.setChainId);
  const hasSufficientChainNativeAssetForTransactionGas = useTokenLauncherStore(
    state => state.hasSufficientChainNativeAssetForTransactionGas
  );
  const networkLabel = useBackendNetworksStore.getState().getChainsLabel()[chainId];
  const chainNativeAsset = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));
  const allowedNetworks = useBackendNetworksStore.getState().getTokenLauncherSupportedChainIds();

  const onChainSelected = (chainId: ChainId | undefined) => {
    if (chainId) {
      setChainId(chainId);
    }
  };

  return (
    <>
      <FieldContainer
        style={{
          height: INPUT_HEIGHT,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: hasSufficientChainNativeAssetForTransactionGas ? FIELD_BORDER_COLOR : ERROR_RED,
          gap: 8,
        }}
      >
        <Box gap={10} style={{ flex: 1 }}>
          <FieldLabel>{i18n.t(i18n.l.token_launcher.titles.network)}</FieldLabel>
          <Text color="labelQuaternary" size="13pt" weight="bold" numberOfLines={1}>
            {i18n.t(i18n.l.token_launcher.network_field.balance, { balance: chainNativeAsset?.balance.display ?? '0.00' })}
          </Text>
        </Box>
        <Bleed right={{ custom: 7 }}>
          <ButtonPressAnimation
            onPress={() => {
              Navigation.handleAction(Routes.NETWORK_SELECTOR, {
                selected: chainId,
                setSelected: onChainSelected,
                goBackOnSelect: true,
                canEdit: false,
                canSelectAllNetworks: false,
                allowedNetworks,
              });
            }}
          >
            <Box
              backgroundColor={accentColors.opacity10}
              borderColor={{ custom: accentColors.opacity6 }}
              flexDirection="row"
              alignItems="center"
              borderWidth={FIELD_BORDER_WIDTH}
              borderRadius={16}
              paddingLeft="10px"
              paddingRight="12px"
              paddingVertical="8px"
              gap={8}
            >
              <ChainImage position="relative" chainId={chainId} size={24} />
              <Inline alignVertical="center" space="6px">
                <Text
                  color="label"
                  size="17pt"
                  weight="heavy"
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={{ maxWidth: 100, textTransform: 'capitalize' }}
                >
                  {networkLabel}
                </Text>
                <TextIcon color={{ custom: accentColors.opacity60 }} size="icon 15px" textStyle={{ top: 1 }} weight="heavy" width={16}>
                  {'􀆈'}
                </TextIcon>
              </Inline>
            </Box>
          </ButtonPressAnimation>
        </Bleed>
      </FieldContainer>
      {!hasSufficientChainNativeAssetForTransactionGas && (
        <Box paddingHorizontal={'20px'}>
          <Text color={{ custom: ERROR_RED }} size="13pt" weight="bold">
            {i18n.t(i18n.l.token_launcher.network_field.not_enough_funds)}
          </Text>
        </Box>
      )}
    </>
  );
}
