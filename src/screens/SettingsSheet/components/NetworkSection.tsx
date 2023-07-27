import { values } from 'lodash';
import React, { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import { Separator, Stack } from '@/design-system';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useRefreshAccountData,
  useResetAccountState,
} from '@/hooks';
import { settingsUpdateNetwork } from '@/redux/settings';
import { Network } from '@/helpers';
import { RainbowNetworks } from '@/networks';
import { Switch } from 'react-native-gesture-handler';
import * as ls from '@/storage';

const testnets = values(RainbowNetworks).filter(
  ({ networkType }) => networkType !== 'layer2'
);

const networks = values(RainbowNetworks).filter(
  ({ networkType, enabled }) => networkType !== 'testnet' && enabled
);

interface NetworkSectionProps {
  inDevSection?: boolean;
}

const NetworkSection = ({ inDevSection }: NetworkSectionProps) => {
  const { network, testnetsEnabled } = useAccountSettings();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const dispatch = useDispatch();
  const { refresh } = useRefreshAccountData();

  const onNetworkChange = useCallback(
    async (network: Network) => {
      await resetAccountState();
      await dispatch(settingsUpdateNetwork(network));
      InteractionManager.runAfterInteractions(async () => {
        await loadAccountData(network);
        initializeAccountData();
        analytics.track('Changed network', { network });
      });
    },
    [dispatch, initializeAccountData, loadAccountData, resetAccountState]
  );

  const [enabledNetworks, setEnabledNetworks] = useState(
    ls.device.get(['enabledNetworks']) || {}
  );

  const toggleStateForNetwork = (topic: Network) =>
    setEnabledNetworks(prev => ({ ...prev, [topic]: !prev[topic] }));

  const onToggleNetwork = useCallback(
    (network: Network) => {
      toggleStateForNetwork(network);
      ls.device.set(['enabledNetworks'], {
        ...enabledNetworks,
        [network]: !enabledNetworks[network],
      });
      refresh();
    },
    [enabledNetworks, refresh]
  );

  const renderTestnetList = useCallback(() => {
    return testnets.map(({ name, value, networkType }) => (
      <MenuItem
        disabled={!testnetsEnabled && networkType === 'testnet'}
        key={value}
        onPress={() => onNetworkChange(value)}
        rightComponent={
          value === network && <MenuItem.StatusIcon status="selected" />
        }
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

  const renderNetworkList = useCallback(() => {
    return networks.map(({ name, value, networkType }) => (
      <MenuItem
        disabled={!testnetsEnabled && networkType === 'testnet'}
        key={value}
        onPress={() => ls.device.set(['enabledNetworks'], { optimism: true })}
        rightComponent={
          <Switch
            value={enabledNetworks[value]}
            onValueChange={() => onToggleNetwork(value)}
          />
        }
        size={52}
        testID={`${value}-network`}
        titleComponent={
          <MenuItem.Title
            text={name}
            weight={inDevSection ? 'medium' : 'semibold'}
          />
        }
      />
    ));
  }, [enabledNetworks, inDevSection, onToggleNetwork, testnetsEnabled]);

  return inDevSection ? (
    <Stack separator={<Separator color="divider60 (Deprecated)" />}>
      {renderTestnetList()}
    </Stack>
  ) : (
    <MenuContainer>
      <Menu>{renderNetworkList()}</Menu>
      <Menu>{renderTestnetList()}</Menu>
    </MenuContainer>
  );
};

export default NetworkSection;
