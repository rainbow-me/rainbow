import lang from 'i18n-js';
import { isNil } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import { Box } from '@rainbow-me/design-system';
import {
  useAccountProfile,
  useShowcaseTokens,
  useWebData,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

const PrivacySection = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();
  const { navigate } = useNavigation();
  const { accountENS } = useAccountProfile();

  const [publicShowCase, setPublicShowCase] = useState();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  useEffect(() => {
    if (isNil(publicShowCase) && webDataEnabled) {
      setPublicShowCase(webDataEnabled);
    }
  }, [publicShowCase, webDataEnabled]);

  const viewProfile = useCallback(() => {
    navigate(Routes.PROFILE_SHEET, {
      address: accountENS,
      fromRoute: 'PrivacySettings',
    });
  }, [accountENS, navigate]);

  const toggleWebData = useCallback(() => {
    setPublicShowCase(!webDataEnabled as any);
    if (webDataEnabled) {
      wipeWebData();
    } else {
      initWebData(showcaseTokens);
    }
  }, [
    initWebData,
    setPublicShowCase,
    showcaseTokens,
    webDataEnabled,
    wipeWebData,
  ]);

  return (
    <MenuContainer>
      <Menu description={lang.t('settings.privacy_section.when_public')}>
        <MenuItem
          disabled
          leftComponent={<MenuItem.TextIcon icon="􀏅" isLink shiftLeft />}
          rightComponent={
            <Switch onValueChange={toggleWebData} value={publicShowCase} />
          }
          shiftLeft
          size={52}
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
            leftComponent={
              // added padding to offset variable icon width
              <Box paddingLeft="3px">
                <MenuItem.TextIcon icon="􀉭" isLink shiftLeft />
              </Box>
            }
            onPress={viewProfile}
            shiftLeft
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
