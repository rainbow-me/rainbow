import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { Separator, Stack } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { settingsStore } from '@/state/settings/settingsStore';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { isL2Chain } from '@/handlers/web3';

interface NetworkSectionProps {
  inDevSection?: boolean;
}

const NetworkSection = ({ inDevSection }: NetworkSectionProps) => {
  const { chainId, testnetsEnabled } = useAccountSettings();

  const onNetworkChange = useCallback(async (chainId: ChainId) => {
    settingsStore.getState().setChainId(chainId);
    InteractionManager.runAfterInteractions(async () => {
      analytics.track(analytics.event.changedNetwork, { chainId });
    });
  }, []);

  const renderNetworkList = useCallback(() => {
    return Object.values(useBackendNetworksStore.getState().getDefaultChains())
      .filter(({ id }) => !isL2Chain({ chainId: id }))
      .map(({ name, id, testnet }) => (
        <MenuItem
          disabled={!testnetsEnabled && testnet}
          key={id}
          onPress={() => onNetworkChange(id)}
          rightComponent={id === chainId && <MenuItem.StatusIcon status="selected" />}
          size={52}
          testID={`${id}-network`}
          titleComponent={
            <MenuItem.Title disabled={!testnetsEnabled && testnet} text={name} weight={inDevSection ? 'medium' : 'semibold'} />
          }
        />
      ));
  }, [inDevSection, chainId, onNetworkChange, testnetsEnabled]);

  return inDevSection ? (
    <Stack separator={<Separator color="divider60 (Deprecated)" />}>{renderNetworkList()}</Stack>
  ) : (
    <MenuContainer>
      <Menu>{renderNetworkList()}</Menu>
    </MenuContainer>
  );
};

export default NetworkSection;
