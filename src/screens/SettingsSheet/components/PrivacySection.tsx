import { analytics } from '@/analytics';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { useShowcaseTokens, useWebData } from '@/hooks';
import * as i18n from '@/languages';
import { logger } from '@/logger';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { device } from '@/storage';
import React, { useCallback, useReducer } from 'react';
import { Switch } from 'react-native-gesture-handler';
import Menu from './Menu';
import MenuContainer from './MenuContainer';
import MenuItem from './MenuItem';

const TRANSLATIONS = i18n.l.settings.privacy_section;

const PrivacySection = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();
  const { navigate } = useNavigation();
  const { accountENS } = useAccountProfileInfo();

  const [publicShowCase, togglePublicShowcase] = useReducer(publicShowCase => !publicShowCase, webDataEnabled);
  const [analyticsEnabled, toggleAnalytics] = useReducer(
    analyticsEnabled => {
      if (analyticsEnabled) {
        device.set(['doNotTrack'], true);
        logger.debug(`[PrivacySection]: Analytics tracking disabled`);
        analytics.track(analytics.event.analyticsTrackingDisabled);
        logger.disable();
        analytics.disable();
        return false;
      } else {
        device.set(['doNotTrack'], false);
        logger.enable();
        analytics.enable();
        logger.debug(`[PrivacySection]: Analytics tracking enabled`);
        analytics.track(analytics.event.analyticsTrackingEnabled);
        return true;
      }
    },
    !device.get(['doNotTrack'])
  );

  const profilesEnabled = useExperimentalFlag(PROFILES);

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
      <Menu description={i18n.t(TRANSLATIONS.analytics_toggle_description)}>
        <MenuItem
          disabled
          hasSfSymbol
          leftComponent={<MenuItem.TextIcon icon="􀣉" isLink />}
          rightComponent={<Switch onValueChange={toggleAnalytics} value={analyticsEnabled} />}
          size={52}
          titleComponent={<MenuItem.Title text={i18n.t(TRANSLATIONS.analytics_toggle)} />}
        />
      </Menu>
      <Menu description={i18n.t(TRANSLATIONS.when_public)}>
        <MenuItem
          disabled
          hasSfSymbol
          leftComponent={<MenuItem.TextIcon icon="􀏅" isLink />}
          rightComponent={<Switch onValueChange={toggleWebData} value={publicShowCase} />}
          size={52}
          testID="public-showcase"
          titleComponent={<MenuItem.Title text={i18n.t(TRANSLATIONS.public_showcase)} />}
        />
      </Menu>
      {profilesEnabled && accountENS && (
        <Menu>
          <MenuItem
            hasSfSymbol
            leftComponent={<MenuItem.TextIcon icon="􀉭" isLink />}
            onPress={() => {
              navigate(Routes.PROFILE_SHEET, {
                address: accountENS,
                fromRoute: 'PrivacySettings',
              });
            }}
            size={52}
            titleComponent={<MenuItem.Title isLink text={i18n.t(TRANSLATIONS.view_profile)} />}
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default PrivacySection;
