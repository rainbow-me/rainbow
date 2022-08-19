import { values } from 'lodash';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import networkInfo from '../../helpers/networkInfo';
import { settingsUpdateNetwork } from '../../redux/settings';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { analytics } from '@rainbow-me/analytics';
import { Divider, Stack } from '@/design-system';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '@rainbow-me/hooks';

const networks = values(networkInfo).filter(network => !network.layer2);

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
    async network => {
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

  const renderNetworkList = useCallback(() => {
    return networks.map(({ disabled, name, value, testnet }: any) => (
      <MenuItem
        disabled={(!testnetsEnabled && testnet) || disabled}
        key={value}
        onPress={() => onNetworkChange(value)}
        rightComponent={
          value === network && <MenuItem.StatusIcon status="selected" />
        }
        size={52}
        testID={`${value}-network`}
        titleComponent={
          <MenuItem.Title
            disabled={(!testnetsEnabled && testnet) || disabled}
            text={name}
            weight={inDevSection ? 'medium' : 'semibold'}
          />
        }
      />
    ));
  }, [inDevSection, network, onNetworkChange, testnetsEnabled]);

  return inDevSection ? (
    <Stack separator={<Divider color="divider60" />}>
      {renderNetworkList()}
    </Stack>
  ) : (
    <MenuContainer>
      <Menu>{renderNetworkList()}</Menu>
    </MenuContainer>
  );
};

export default NetworkSection;
