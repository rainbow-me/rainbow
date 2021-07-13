import { isNil } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { Column, Row } from '../layout';
import { ListItem } from '../list';
import { Emoji, Text } from '../text';
import {
  useAccountSettings,
  useShowcaseTokens,
  useWebData,
} from '@rainbow-me/hooks';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';

const PrivacySection = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();
  const { colors, isDarkMode } = useTheme();

  const [publicShowCase, setPublicShowCase] = useState();

  useEffect(() => {
    if (isNil(publicShowCase) && webDataEnabled) {
      setPublicShowCase(webDataEnabled);
    }
  }, [publicShowCase, webDataEnabled]);

  const { accountAddress } = useAccountSettings();
  const rainbowProfileLink = `${RAINBOW_PROFILES_BASE_URL}/${accountAddress}`;

  const toggleWebData = useCallback(() => {
    setPublicShowCase(!webDataEnabled);
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
    <Fragment>
      <ListItem
        icon={<Emoji name="framed_picture" />}
        label="Public Showcase"
        onPress={toggleWebData}
        testID="public-showcase"
      >
        <Column align="end" flex="1" justify="end">
          <Switch onValueChange={toggleWebData} value={publicShowCase} />
        </Column>
      </ListItem>
      <Row marginLeft={20} marginRight={20} marginTop={10}>
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          letterSpacing="roundedMedium"
          lineHeight="normal"
          numberOfLines={3}
          size="smedium"
          weight="medium"
        >
          <Text color={colors.alpha(colors.blueGreyDark, 0.3)} weight="bold">
            􀅵
          </Text>{' '}
          When public, your NFT Showcase will be visible on your Rainbow web
          profile! You can view your profile at{' '}
          <Text
            color={
              isDarkMode ? colors.alpha(colors.paleBlue, 0.8) : colors.paleBlue
            }
            onPress={handleLinkPress}
            weight="medium"
          >
            {rainbowProfileLink.replace('https://', '')}
          </Text>
        </Text>
      </Row>
    </Fragment>
  );
};

export default PrivacySection;
