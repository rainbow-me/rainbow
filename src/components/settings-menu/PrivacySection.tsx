import lang from 'i18n-js';
import React, { useCallback, useReducer } from 'react';
import { Switch } from 'react-native-gesture-handler';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { useAccountProfile, useShowcaseTokens, useWebData } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import Restart from 'react-native-restart';
import * as storage from '@/storage';

const PrivacySection = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();
  const { navigate } = useNavigation();
  const { accountENS } = useAccountProfile();

  const [publicShowCase, togglePublicShowcase] = useReducer(
    publicShowCase => !publicShowCase,
    webDataEnabled
  );
  const [analyticsEnabled, toggleAnalytics] = useReducer(analyticsEnabled => {
    storage.device.set(['doNotTrack'], analyticsEnabled);
    return !analyticsEnabled;
  }, !storage.device.get(['doNotTrack']));
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const viewProfile = useCallback(() => {
    navigate(Routes.PROFILE_SHEET, {
      address: accountENS,
      fromRoute: 'PrivacySettings',
    });
  }, [accountENS, navigate]);

  const toggleWebData = useCallback(() => {
    if (publicShowCase) {
      wipeWebData();
    } else {
      initWebData(showcaseTokens);
    }
    togglePublicShowcase();
  }, [initWebData, publicShowCase, showcaseTokens, wipeWebData]);

  return (
    <MenuContainer>
      <Menu
        description={
          'Help Rainbow improve its products and services by allowing analytics of usage data. Collected data is not associated with you or your account.'
        }
      >
        <MenuItem
          disabled
          hasSfSymbol
          leftComponent={<MenuItem.TextIcon icon="􀣉" isLink />}
          rightComponent={
            <Switch
              onValueChange={() => {
                toggleAnalytics();
                Restart.Restart();
              }}
              value={analyticsEnabled}
            />
          }
          size={52}
          testID="public-showcase"
          titleComponent={<MenuItem.Title text={'Analytics'} />}
        />
      </Menu>
      <Menu description={lang.t('settings.privacy_section.when_public')}>
        <MenuItem
          disabled
          hasSfSymbol
          leftComponent={<MenuItem.TextIcon icon="􀏅" isLink />}
          rightComponent={
            <Switch onValueChange={toggleWebData} value={publicShowCase} />
          }
          size={52}
          testID="public-showcase"
          titleComponent={
            <MenuItem.Title
              text={lang.t('settings.privacy_section.public_showcase')}
            />
          }
        />
      </Menu>
      {profilesEnabled && accountENS && (
        <Menu>
          <MenuItem
            hasSfSymbol
            leftComponent={<MenuItem.TextIcon icon="􀉭" isLink />}
            onPress={viewProfile}
            size={52}
            titleComponent={
              <MenuItem.Title
                isLink
                text={lang.t('settings.privacy_section.view_profile')}
              />
            }
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default PrivacySection;
