import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { InteractionManager, View, StyleSheet, Animated } from 'react-native';
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
import { PanGestureHandler } from 'react-native-gesture-handler'
import { deviceUtils } from '../utils';
import withBlockedVerticalSwipe from '../hoc/withBlockedVerticalSwipe';

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

const { height } = deviceUtils.dimensions;

const GestureBlocker = ({ type }) => (
  <View
    style={{
      height,
      position: 'absolute',
      [type]: -height,
      width: '100%',
      zIndex: 10,
    }}
  >
    <PanGestureHandler
      minDeltaY={1}
      minDeltaX={1}
    >
      <View style={StyleSheet.absoluteFillObject} />
    </PanGestureHandler>
  </View>
)

const SettingsModal = ({
  currentSettingsPage,
  navigation,
  onCloseModal,
  onPressBack,
  onPressImportSeedPhrase,
  onPressSection,
}) => {
  const { title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  return (
      <Modal containerPadding={0} minHeight={580} onCloseModal={onCloseModal}>
        <GestureBlocker type='top'/>
        <Column flex={1}>
          <ModalHeader
            onPressBack={onPressBack}
            onPressClose={() => navigation.navigate('CurrencySelectScreen')}
            showBackButton={!isDefaultPage}
            title={title}
          />
        </Column>
        <GestureBlocker type='bottom'/>
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
  withBlockedVerticalSwipe,
)(SettingsModal);
