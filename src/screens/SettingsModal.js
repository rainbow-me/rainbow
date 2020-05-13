import { captureException } from '@sentry/react-native';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement, useCallback } from 'react';
import { InteractionManager, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { PERMISSIONS, request } from 'react-native-permissions';
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
import Routes from './Routes/routesNames';

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

const requestFaceIDPermission = () =>
  request(PERMISSIONS.IOS.FACE_ID)
    .then(permission => {
      if (permission !== 'granted') {
        captureException(new Error(`FaceID permission: ${permission}`));
      }
    })
    .catch(error => {
      captureException(error);
    });

const SettingsModal = ({ navigation }) => {
  const currentSettingsPage = get(
    navigation,
    'state.params.section',
    SettingsPages.default
  );

  const { component, title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  const onCloseModal = useCallback(() => navigation.goBack(), [navigation]);

  const onPressBack = useCallback(
    () => navigation.setParams({ section: SettingsPages.default }),
    [navigation]
  );

  const onPressImportSeedPhrase = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate(Routes.IMPORT_SEED_PHRASE_SHEET);
      StatusBar.setBarStyle('light-content');
    });
  }, [navigation]);

  const onPressSection = useCallback(
    section => () => navigation.setParams({ section }),
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
            onPressHiddenFeature={requestFaceIDPermission}
            onPressImportSeedPhrase={onPressImportSeedPhrase}
            onPressLanguage={onPressSection(SettingsPages.language)}
            onPressNetwork={onPressSection(SettingsPages.network)}
          />
          {component && createElement(component, { navigation })}
        </AnimatedPager>
      </Column>
    </Modal>
  );
};

SettingsModal.propTypes = {
  navigation: PropTypes.object,
};

export default SettingsModal;
