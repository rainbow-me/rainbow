import lang from 'i18n-js';
import { isNil } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import ShowcaseIcon from '@rainbow-me/assets/showcaseIcon.png';
import { Column, Row } from '../layout';
import { ListItem } from '../list';
import { Emoji } from '../text';
import { Source } from 'react-native-fast-image';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import {
  useAccountSettings,
  useShowcaseTokens,
  useWebData,
} from '@rainbow-me/hooks';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';
import MenuContainer from './components/MenuContainer';
import Menu from './components/Menu';
import MenuItem from './components/MenuItem';
import { Box, Text } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
import { useTheme } from '@rainbow-me/theme';

const PrivacySectionV2 = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();
  const { colors, isDarkMode } = useTheme();

  const [publicShowCase, setPublicShowCase] = useState();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  useEffect(() => {
    if (isNil(publicShowCase) && webDataEnabled) {
      setPublicShowCase(webDataEnabled);
    }
  }, [publicShowCase, webDataEnabled]);

  const { accountAddress } = useAccountSettings();
  const rainbowProfileLink = `${RAINBOW_PROFILES_BASE_URL}/${accountAddress}`;

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

  const handleLinkPress = useCallback(
    () => Linking.openURL(rainbowProfileLink),
    [rainbowProfileLink]
  );

  return (
    <MenuContainer>
      <Menu description={lang.t('settings.privacy_section.when_public')}>
        <MenuItem
          size="medium"
          iconPadding="medium"
          disabled
          titleComponent={
            <MenuItem.Title
              text={lang.t('settings.privacy_section.public_showcase')}
            />
          }
          rightComponent={
            <Switch onValueChange={toggleWebData} value={publicShowCase} />
          }
          leftComponent={
            <Box
              as={ImgixImage}
              marginTop="-1px"
              height={{ custom: 17.5 }}
              source={ShowcaseIcon as Source}
              width={{ custom: 22 }}
            />
          }
        />
      </Menu>
      {profilesEnabled && (
        <Menu>
          <MenuItem
            size="medium"
            iconPadding="medium"
            titleComponent={
              <MenuItem.Title
                isLink
                text={lang.t('settings.privacy_section.view_profile')}
              />
            }
            leftComponent={<MenuItem.Title text="􀉭" isLink />}
          />
        </Menu>
      )}
    </MenuContainer>
  );
};

export default PrivacySectionV2;
