import analytics from '@segment/analytics-react-native';
import { toLower, values } from 'lodash';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import networkInfo from '../../helpers/networkInfo';
import { settingsUpdateNetwork } from '../../redux/settings';
import { Column } from '../layout';
import { ListItem } from '../list';
import { RadioList, RadioListItem } from '../radio-list';
import { Emoji } from '../text';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '@rainbow-me/hooks';

const networks = values(networkInfo).filter(network => !network.layer2);

const NetworkSection = () => {
  const {
    network,
    testnetsEnabled,
    settingsChangeTestnetsEnabled,
  } = useAccountSettings();
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

  const toggleTestnetsEnabled = useCallback(async () => {
    await dispatch(settingsChangeTestnetsEnabled(!testnetsEnabled));
  }, [dispatch, settingsChangeTestnetsEnabled, testnetsEnabled]);

  return (
    <>
      <ListItem
        icon={<Emoji name="joystick" />}
        label="Enable Testnets"
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

      <RadioList
        extraData={network}
        items={networks.map(({ disabled, name, value, testnet }) => ({
          disabled: (!testnetsEnabled && testnet) || disabled,
          key: value,
          label: name,
          selected: toLower(network) === toLower(value),
          testID: `${value}-network`,
          value,
        }))}
        marginTop={7}
        onChange={onNetworkChange}
        renderItem={RadioListItem}
        value={network}
      />
    </>
  );
};

export default NetworkSection;
