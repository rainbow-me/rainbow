import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import networkTypes from '../../helpers/networkTypes';
import { settingsUpdateNetwork } from '../../redux/settings';
import { Column } from '../layout';
import { ListFooter, ListItem } from '../list';
import NetworkSection from './NetworkSection';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '@rainbow-me/hooks';

const UserDevSection = () => {
  const dispatch = useDispatch();

  const {
    testnetsEnabled,
    settingsChangeTestnetsEnabled,
  } = useAccountSettings();

  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();

  const revertToMainnet = useCallback(async () => {
    await resetAccountState();
    await dispatch(settingsUpdateNetwork(networkTypes.mainnet));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData(networkTypes.mainnet);
      initializeAccountData();
    });
  }, [dispatch, initializeAccountData, loadAccountData, resetAccountState]);

  const toggleTestnetsEnabled = useCallback(async () => {
    testnetsEnabled && revertToMainnet();
    await dispatch(settingsChangeTestnetsEnabled(!testnetsEnabled));
  }, [
    dispatch,
    revertToMainnet,
    settingsChangeTestnetsEnabled,
    testnetsEnabled,
  ]);

  return (
    <ScrollView testID="developer-settings-modal">
      <ListItem
        label="🕹️ Enable Testnets"
        onPress={toggleTestnetsEnabled}
        testID="testnet-switch"
      >
        <Column align="end" flex="1" justify="end">
          <Switch
            onValueChange={toggleTestnetsEnabled}
            value={testnetsEnabled}
          />
        </Column>
      </ListItem>
      {testnetsEnabled && <NetworkSection />}
      <ListFooter />
    </ScrollView>
  );
};

export default UserDevSection;
