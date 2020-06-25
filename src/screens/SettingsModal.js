import { useNavigation, useRoute } from '@react-navigation/native';
import React, { createElement, useCallback } from 'react';
import { Alert } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { Column } from '../components/layout';
import { Modal, ModalHeader } from '../components/modal';
import { AnimatedPager } from '../components/pager';
import {
  BackupSection,
  CurrencySection,
  LanguageSection,
  NetworkSection,
  SettingsSection,
} from '../components/settings-menu';
import { wipeKeychain } from '../model/keychain';

const statusBarHeight = getStatusBarHeight(true);

const SettingsPages = {
  backup: {
    component: BackupSection,
    title: 'Backup',
  },
  currency: {
    component: CurrencySection,
    title: 'Currency',
  },
  default: {
    component: null,
    title: 'Settings',
  },
  language: {
    component: LanguageSection,
    title: 'Language',
  },
  network: {
    component: NetworkSection,
    title: 'Network',
  },
};

const onPressHiddenFeature = () => {
  Alert.alert(
    '🚨🚨🚨 WARNING  🚨🚨🚨',
    `This feature is intended to be used only for developers! \n\n
    You are about to reset all the wallet information from the keychain. \n
    Do you really want to proceed?  If you're not sure, press NO`,
    [
      {
        onPress: () => () => null,
        style: 'cancel',
        text: 'NO',
      },
      {
        onPress: async () => {
          await wipeKeychain();
          Alert.alert('Now you can restart the app');
        },
        text: 'Yes',
      },
    ],
    { cancelable: false }
  );
};

const SettingsModal = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const currentSettingsPage = params?.section ?? SettingsPages.default;

  const { component, title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  const onCloseModal = useCallback(() => navigation.goBack(), [navigation]);

  const onPressBack = useCallback(
    () =>
      navigation.setParams({ section: SettingsPages.default, wallet_id: null }),
    [navigation]
  );

  const onPressSection = useCallback(
    section => () => {
      navigation.setParams({ section });
    },
    [navigation]
  );

  return (
    <Modal
      marginBottom={statusBarHeight}
      minHeight={580}
      onCloseModal={onCloseModal}
    >
      <Column flex={1}>
        <ModalHeader
          onPressBack={onPressBack}
          onPressClose={onCloseModal}
          showBackButton={!isDefaultPage}
          title={title}
        />
        <AnimatedPager
          isOpen={!isDefaultPage}
          style={{ top: ModalHeader.height }}
        >
          <SettingsSection
            onCloseModal={onCloseModal}
            onPressBackup={onPressSection(SettingsPages.backup)}
            onPressCurrency={onPressSection(SettingsPages.currency)}
            onPressHiddenFeature={onPressHiddenFeature}
            onPressLanguage={onPressSection(SettingsPages.language)}
            onPressNetwork={onPressSection(SettingsPages.network)}
          />
          {component && createElement(component, { navigation })}
        </AnimatedPager>
      </Column>
    </Modal>
  );
};

export default SettingsModal;
