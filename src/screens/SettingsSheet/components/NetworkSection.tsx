import { values } from 'lodash';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { Separator, Stack } from '@/design-system';
import { useAccountSettings, useInitializeAccountData, useLoadAccountData, useResetAccountState } from '@/hooks';
import { settingsUpdateNetwork } from '@/redux/settings';
import { Network } from '@/helpers';
import { RainbowNetworks } from '@/networks';

const networks = values(RainbowNetworks).filter(({ networkType }) => networkType !== 'layer2');

interface NetworkSectionProps {
  inDevSection?: boolean;
}

const NetworkSection = ({ inDevSection }: NetworkSectionProps) => {
  const { network, testnetsEnabled } = useAccountSettings();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const dispatch = useDispatch();

  const onNetworkChange = useCallback(
    async (network: Network) => {
      await resetAccountState();
      await dispatch(settingsUpdateNetwork(network));
      InteractionManager.runAfterInteractions(async () => {
        await loadAccountData();
        initializeAccountData();
        analytics.track('Changed network', { network });
      });
    },
    [dispatch, initializeAccountData, loadAccountData, resetAccountState]
  );

  const renderNetworkList = useCallback(() => {
    return networks.map(({ name, value, networkType }) => (
      <MenuItem
        disabled={!testnetsEnabled && networkType === 'testnet'}
        key={value}
        onPress={() => onNetworkChange(value)}
        rightComponent={value === network && <MenuItem.StatusIcon status="selected" />}
        size={52}
        testID={`${value}-network`}
        titleComponent={
          <MenuItem.Title
            disabled={!testnetsEnabled && networkType === 'testnet'}
            text={name}
            weight={inDevSection ? 'medium' : 'semibold'}
          />
        }
      />
    ));
  }, [inDevSection, network, onNetworkChange, testnetsEnabled]);

  return inDevSection ? (
    <Stack separator={<Separator color="divider60 (Deprecated)" />}>{renderNetworkList()}</Stack>
  ) : (
    <MenuContainer>
      <Menu>{renderNetworkList()}</Menu>
    </MenuContainer>
  );
};

export default NetworkSection;
