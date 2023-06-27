import { values } from 'lodash';
import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';
import { analytics } from '@/analytics';
import {
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
} from '@/design-system';
import {
  useAccountSettings,
  useInitializeAccountData,
  useLoadAccountData,
  useResetAccountState,
} from '@/hooks';
import { settingsUpdateNetwork } from '@/redux/settings';
import networkInfo from '@/helpers/networkInfo';
import { Network } from '@/helpers';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

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
    <Stack separator={<Separator color="divider60 (Deprecated)" />}>
      {renderNetworkList()}
    </Stack>
  ) : (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top="20px" horizontal="20px" bottom="60px">
            <Inline alignHorizontal="center" alignVertical="center">
              <Box paddingBottom="12px">
                <Text size="22pt" weight="heavy" color="label">
                  {i18n.t(i18n.l.settings.network)}
                </Text>
              </Box>
            </Inline>
            <MenuContainer>
              <Menu>{renderNetworkList()}</Menu>
            </MenuContainer>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
};

export default NetworkSection;
