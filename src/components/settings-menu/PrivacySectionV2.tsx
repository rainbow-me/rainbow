import lang from 'i18n-js';
import { isNil } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { Source } from 'react-native-fast-image';
import { Switch } from 'react-native-gesture-handler';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import ShowcaseIcon from '@rainbow-me/assets/showcaseIcon.png';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import { Box } from '@rainbow-me/design-system';
import { useShowcaseTokens, useWebData } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

const PrivacySectionV2 = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();

  const [publicShowCase, setPublicShowCase] = useState();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  useEffect(() => {
    if (isNil(publicShowCase) && webDataEnabled) {
      setPublicShowCase(webDataEnabled);
    }
  }, [publicShowCase, webDataEnabled]);

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
          iconPadding="medium"
          leftComponent={
            <Box
              as={ImgixImage}
              height={{ custom: 17.5 }}
              marginTop="-1px"
              source={ShowcaseIcon as Source}
              width={{ custom: 22 }}
            />
          }
          rightComponent={
            <Switch onValueChange={toggleWebData} value={publicShowCase} />
          }
          size="medium"
          titleComponent={
            <MenuItem.Title
              text={lang.t('settings.privacy_section.public_showcase')}
            />
          }
        />
      </Menu>
      {profilesEnabled && (
        <Menu>
          <MenuItem
            iconPadding="medium"
            leftComponent={<MenuItem.Title isLink text="􀉭" />}
            size="medium"
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

export default PrivacySectionV2;
