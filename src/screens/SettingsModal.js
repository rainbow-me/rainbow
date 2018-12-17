import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
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
  backup: 'Backup',
  currency: 'Currency',
  default: 'Settings',
  language: 'Language',
  security: 'Security',
};

const Content = styled(Column)`
  flex: 1;
  overflow: hidden;
`;

const renderActiveSettingsSection = currentPage => {
  switch (currentPage) {
    case SettingsPages.language:
      return <LanguageSection />;

    case SettingsPages.currency:
      return <CurrencySection />;

    case SettingsPages.backup:
      return <BackupSection />;

    case SettingsPages.default:
    default:
      return null;
  }
};

const SettingsModal = ({
  currentSettingsPage,
  onCloseModal,
  onPressBack,
  onPressSection,
}) => (
  <Modal onCloseModal={onCloseModal}>
    <Content>
      <ModalHeader
        onPressBack={onPressBack}
        onPressClose={onCloseModal}
        showBackButton={currentSettingsPage !== SettingsPages.default}
        title={currentSettingsPage}
      />
      <AnimatedPager
        isOpen={currentSettingsPage !== SettingsPages.default}
        style={{ top: ModalHeader.height }}
      >
        <SettingsSection
          onPressBackup={onPressSection(SettingsPages.backup)}
          onPressCurrency={onPressSection(SettingsPages.currency)}
          onPressLanguage={onPressSection(SettingsPages.language)}
          onPressSecurity={onPressSection(SettingsPages.security)}
        />
        {renderActiveSettingsSection(currentSettingsPage)}
      </AnimatedPager>
    </Content>
  </Modal>
);

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
)(SettingsModal);
