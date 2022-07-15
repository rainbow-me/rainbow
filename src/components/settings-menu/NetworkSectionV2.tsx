import analytics from '@segment/analytics-react-native';
import { values } from 'lodash';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import networkInfo from '../../helpers/networkInfo';
import { settingsUpdateNetwork } from '../../redux/settings';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '@rainbow-me/hooks';
import MenuContainer from './components/MenuContainer';
import Menu from './components/Menu';
import MenuItem from './components/MenuItem';

const networks = values(networkInfo).filter(network => !network.layer2);

const NetworkSectionV2 = () => {
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

  return (
    <MenuContainer>
      <Menu>
        {networks.map(({ disabled, name, value, testnet }: any) => {
          return (
            <MenuItem
              onPress={() => onNetworkChange(value)}
              disabled={(!testnetsEnabled && testnet) || disabled}
              rightComponent={
                value === network && <MenuItem.StatusIcon status="selected" />
              }
              titleComponent={
                <MenuItem.Title
                  text={name}
                  disabled={(!testnetsEnabled && testnet) || disabled}
                />
              }
              iconPadding="large"
              size="medium"
            />
          );
        })}
      </Menu>
    </MenuContainer>
  );
};

export default NetworkSectionV2;
