
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { InteractionManager } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
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

const SettingsModal = ({
  currentSettingsPage,
  navigation,
  onCloseModal,
  onPressBack,
  onPressImportSeedPhrase,
  onPressSection,
}) => {
  const { component, title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  return (
    <Modal minHeight={580} onCloseModal={onCloseModal}>
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
  currentSettingsPage: PropTypes.oneOf(Object.values(SettingsPages)),
  navigation: PropTypes.object,
  onCloseModal: PropTypes.func,
  onPressBack: PropTypes.func,
  onPressImportSeedPhrase: PropTypes.func,
  onPressSection: PropTypes.func,
};

export default compose(
  withProps(({ navigation }) => ({
    currentSettingsPage: get(navigation, 'state.params.section', SettingsPages.default),
  })),
  withHandlers({
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onPressBack: ({ navigation }) => () => navigation.setParams({ section: SettingsPages.default }),
    onPressImportSeedPhrase: ({ navigation, setSafeTimeout }) => () => {
      navigation.goBack();
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('ImportSeedPhraseSheet');
      });
    },
    onPressSection: ({ navigation }) => (section) => () => navigation.setParams({ section }),
  }),
  onlyUpdateForKeys(['currentSettingsPage']),
)(SettingsModal);
