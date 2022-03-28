import AsyncStorage from '@react-native-community/async-storage';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import { settingsUpdateNetwork } from '../../redux/settings';
import { Column } from '../layout';
import { ListFooter, ListItem } from '../list';
import NetworkSection from './NetworkSection';
import { Network } from '@rainbow-me/helpers/networkTypes';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '@rainbow-me/hooks';
import { clearAllStorages } from '@rainbow-me/model/mmkv';

const UserDevSection = props => {
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
    await dispatch(settingsUpdateNetwork(Network.mainnet));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData(Network.mainnet);
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

  const clearLocalStorage = useCallback(async () => {
    await AsyncStorage.clear();
    clearAllStorages();
  }, []);

  return (
    <ScrollView {...props}>
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
      {testnetsEnabled && <NetworkSection {...props} />}
      <ListItem label="💥 Clear local storage" onPress={clearLocalStorage} />
      <ListFooter />
    </ScrollView>
  );
};

export default UserDevSection;
