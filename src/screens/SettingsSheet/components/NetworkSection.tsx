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
import { RainbowNetworkObjects } from '@/networks';
import { ChainId } from '@/__swaps__/types/chains';

const networkObjects = values(RainbowNetworkObjects).filter(({ networkType }) => networkType !== 'layer2');

interface NetworkSectionProps {
  inDevSection?: boolean;
}

const NetworkSection = ({ inDevSection }: NetworkSectionProps) => {
  const { chainId, testnetsEnabled } = useAccountSettings();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const dispatch = useDispatch();

  const onNetworkChange = useCallback(
    async (chainId: ChainId) => {
      await resetAccountState();
      await dispatch(settingsUpdateNetwork(chainId));
      InteractionManager.runAfterInteractions(async () => {
        await loadAccountData();
        initializeAccountData();
        analytics.track('Changed network', { chainId });
      });
    },
    [dispatch, initializeAccountData, loadAccountData, resetAccountState]
  );

  const renderNetworkList = useCallback(() => {
    return networkObjects.map(({ name, id, networkType }) => (
      <MenuItem
        disabled={!testnetsEnabled && networkType === 'testnet'}
        key={id}
        onPress={() => onNetworkChange(id)}
        rightComponent={id === chainId && <MenuItem.StatusIcon status="selected" />}
        size={52}
        testID={`${id}-network`}
        titleComponent={
          <MenuItem.Title
            disabled={!testnetsEnabled && networkType === 'testnet'}
            text={name}
            weight={inDevSection ? 'medium' : 'semibold'}
          />
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
