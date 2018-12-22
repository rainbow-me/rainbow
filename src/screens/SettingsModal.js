import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { compose, onlyUpdateForKeys, withHandlers, withProps } from 'recompact';
import { Column } from '../components/layout';
import { Modal, ModalHeader } from '../components/modal';
import { AnimatedPager } from '../components/pager';
import {
  BackupSection,
  CurrencySection,
  LanguageSection,
  SettingsSection,
} from '../components/settings-menu';

const SettingsPages = {
  backup: {
    title: 'Backup',
    component: BackupSection,
  },
  currency: {
    title: 'Currency',
    component: CurrencySection,
  },
  default: {
    title: 'Settings',
    component: null,
  },
  language: {
    title: 'Language',
    component: LanguageSection,
  },
};

const SettingsModal = ({
  currentSettingsPage,
  navigation,
  onCloseModal,
  onPressBack,
  onPressSection,
}) => {
  const { component, title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  return (
    <Modal onCloseModal={onCloseModal}>
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
            onPressBackup={onPressSection(SettingsPages.backup)}
            onPressCurrency={onPressSection(SettingsPages.currency)}
            onPressLanguage={onPressSection(SettingsPages.language)}
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
  onPressSection: PropTypes.func,
};

export default compose(
  withProps(({ navigation }) => ({
    currentSettingsPage: get(navigation, 'state.params.section', SettingsPages.default),
  })),
  withHandlers({
    onCloseModal: ({ navigation }) => () => navigation.goBack(),
    onPressBack: ({ navigation }) => () => navigation.setParams({ section: SettingsPages.default }),
    onPressSection: ({ navigation }) => (section) => () => navigation.setParams({ section }),
  }),
  onlyUpdateForKeys(['currentSettingsPage']),
)(SettingsModal);
