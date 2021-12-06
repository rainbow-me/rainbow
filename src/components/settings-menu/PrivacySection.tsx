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
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';

const PrivacySection = () => {
  const { showcaseTokens } = useShowcaseTokens();
  const { webDataEnabled, initWebData, wipeWebData } = useWebData();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'boolean' is not assignable to pa... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ListItem
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        icon={<Emoji name="framed_picture" />}
        label="Public Showcase"
        onPress={toggleWebData}
        testID="public-showcase"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column align="end" flex="1" justify="end">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Switch onValueChange={toggleWebData} value={publicShowCase} />
        </Column>
      </ListItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row marginLeft={20} marginRight={20} marginTop={10}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          letterSpacing="roundedMedium"
          lineHeight="normal"
          numberOfLines={3}
          size="smedium"
          weight="medium"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text color={colors.alpha(colors.blueGreyDark, 0.3)} weight="bold">
            􀅵
          </Text>{' '}
          When public, your NFT Showcase will be visible on your Rainbow web
          profile! You can view your profile at // @ts-expect-error
          ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is
          provided... Remove this comment to see the full error message
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
