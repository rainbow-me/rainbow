import { createStackNavigator } from '@react-navigation/stack';
import { captureException } from '@sentry/react-native';
import React, { useCallback, useState } from 'react';
import { Animated } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { PERMISSIONS, request } from 'react-native-permissions';
import styled from 'styled-components/native';
import { Modal, ModalHeader } from '../components/modal';
import {
  BackupSection,
  CurrencySection,
  LanguageSection,
  NetworkSection,
  SettingsSection,
} from '../components/settings-menu';
import DevSection from '../components/settings-menu/DevSection';
import { useNavigation } from '../navigation/Navigation';
import { colors } from '@rainbow-me/styles';

function cardStyleInterpolator({
  current,
  next,
  inverted,
  layouts: { screen },
}) {
  const translateFocused = Animated.multiply(
    current.progress.interpolate({
      extrapolate: 'clamp',
      inputRange: [0, 1],
      outputRange: [screen.width, 0],
    }),
    inverted
  );
  const translateUnfocused = next
    ? Animated.multiply(
        next.progress.interpolate({
          extrapolate: 'clamp',
          inputRange: [0, 1],
          outputRange: [0, -screen.width],
        }),
        inverted
      )
    : 0;

  return {
    cardStyle: {
      transform: [
        {
          translateX: Animated.add(translateFocused, translateUnfocused),
        },
      ],
    },
  };
}

const statusBarHeight = getStatusBarHeight(true);

const SettingsPages = {
  backup: {
    component: BackupSection,
    key: 'BackupSection',
    title: 'Backup',
  },
  currency: {
    component: CurrencySection,
    key: 'CurrencySection',
    title: 'Currency',
  },
  default: {
    component: null,
    key: 'SettingsSection',
    title: 'Settings',
  },
  dev: {
    component: __DEV__ ? DevSection : null,
    key: 'DevSection',
    title: 'Dev',
  },
  language: {
    component: LanguageSection,
    key: 'LanguageSection',
    title: 'Language',
  },
  network: {
    component: NetworkSection,
    key: 'NetworkSection',
    title: 'Network',
  },
};

const Container = styled.View`
  flex: 1;
  overflow: hidden;
`;

const Stack = createStackNavigator();

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

export default function SettingsModal() {
  const { goBack, navigate } = useNavigation();
  const [currentSettingsPage, setCurrentSettingsPage] = useState(
    SettingsPages.default
  );

  const { title } = currentSettingsPage;
  const isDefaultPage = title === SettingsPages.default.title;

  const onPressBack = useCallback(() => {
    setCurrentSettingsPage(SettingsPages.default);
    navigate('SettingsSection');
  }, [navigate, setCurrentSettingsPage]);

  const onPressSection = useCallback(
    section => () => {
      setCurrentSettingsPage(section);
      navigate(section.key);
    },
    [navigate, setCurrentSettingsPage]
  );

  return (
    <Modal marginBottom={statusBarHeight} minHeight={580} onCloseModal={goBack}>
      <Container>
        <ModalHeader
          onPressBack={onPressBack}
          onPressClose={goBack}
          showBackButton={!isDefaultPage}
          title={title}
        />
        <Stack.Navigator
          headerMode="none"
          screenOptions={{
            cardStyle: { backgroundColor: colors.white },
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="SettingsSection">
            {() => (
              <SettingsSection
                onCloseModal={goBack}
                onPressBackup={onPressSection(SettingsPages.backup)}
                onPressCurrency={onPressSection(SettingsPages.currency)}
                onPressDev={onPressSection(SettingsPages.dev)}
                onPressHiddenFeature={requestFaceIDPermission}
                onPressLanguage={onPressSection(SettingsPages.language)}
                onPressNetwork={onPressSection(SettingsPages.network)}
              />
            )}
          </Stack.Screen>
          {Object.values(SettingsPages).map(
            ({ component, title, key }) =>
              component && (
                <Stack.Screen
                  component={component}
                  name={key}
                  options={{
                    cardStyleInterpolator,
                  }}
                  title={title}
                />
              )
          )}
        </Stack.Navigator>
      </Container>
    </Modal>
  );
}
