import AsyncStorage from '@react-native-community/async-storage';
import React, { Fragment, useCallback, useMemo } from 'react';
import { Linking, NativeModules, ScrollView, Share } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import { REVIEW_ANDROID } from '../../config/experimental';
import useExperimentalFlag from '../../config/experimentalHooks';
//import { supportedLanguages } from '../../languages';
import AppVersionStamp from '../AppVersionStamp';
import { Icon } from '../icons';
import { Column, ColumnWithDividers } from '../layout';
import {
  ListFooter,
  ListItem,
  ListItemArrowGroup,
  ListItemDivider,
} from '../list';
import { Emoji } from '../text';
import BackupIcon from '@rainbow-me/assets/settingsBackup.png';
import CurrencyIcon from '@rainbow-me/assets/settingsCurrency.png';
import NetworkIcon from '@rainbow-me/assets/settingsNetwork.png';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  useAccountSettings,
  useDimensions,
  useSendFeedback,
  useWallets,
} from '@rainbow-me/hooks';
import { colors, position } from '@rainbow-me/styles';
import {
  AppleReviewAddress,
  REVIEW_DONE_KEY,
} from '@rainbow-me/utils/reviewAlert';

const { RainbowRequestReview, RNReview } = NativeModules;

export const SettingsExternalURLs = {
  rainbowHomepage: 'https://rainbow.me',
  review:
    'itms-apps://itunes.apple.com/us/app/appName/id1457119021?mt=8&action=write-review',
  twitterDeepLink: 'twitter://user?screen_name=rainbowdotme',
  twitterWebUrl: 'https://twitter.com/rainbowdotme',
};

const CheckmarkIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
})`
  box-shadow: 0px 4px 6px ${colors.alpha(colors.blueGreyDark50, 0.4)};
`;

const contentContainerStyle = { flex: 1 };
const Container = styled(ScrollView).attrs({
  contentContainerStyle,
  scrollEventThrottle: 32,
})`
  ${position.cover};
`;

// ⚠️ Beware: magic numbers lol
const SettingIcon = styled(FastImage)`
  ${position.size(60)};
  margin-left: -16;
  margin-right: -11;
  margin-top: 8;
`;

const VersionStampContainer = styled(Column).attrs({
  align: 'center',
  justify: 'end',
})`
  flex: 1;
  padding-bottom: 19;
`;

const WarningIcon = styled(Icon).attrs({
  color: colors.orangeLight,
  name: 'warning',
})`
  box-shadow: 0px 4px 6px ${colors.alpha(colors.orangeLight, 0.4)};
  margin-top: 1;
`;

const checkAllWallets = wallets => {
  if (!wallets) return false;
  let areBackedUp = true;
  let canBeBackedUp = false;
  let allBackedUp = true;
  Object.keys(wallets).forEach(key => {
    if (!wallets[key].backedUp && wallets[key].type !== WalletTypes.readOnly) {
      allBackedUp = false;
    }

    if (
      !wallets[key].backedUp &&
      wallets[key].type !== WalletTypes.readOnly &&
      !wallets[key].imported
    ) {
      areBackedUp = false;
    }
    if (!wallets[key].type !== WalletTypes.readOnly) {
      canBeBackedUp = true;
    }
  });
  return { allBackedUp, areBackedUp, canBeBackedUp };
};

export default function SettingsSection({
  onCloseModal,
  onPressBackup,
  onPressCurrency,
  onPressDev,
  onPressIcloudBackup,
  /*onPressLanguage,*/
  onPressNetwork,
  onPressShowSecret,
}) {
  const isReviewAvailable = useExperimentalFlag(REVIEW_ANDROID) || ios;

  const { wallets } = useWallets();
  const { /*language,*/ nativeCurrency, network } = useAccountSettings();
  const { isTinyPhone } = useDimensions();

  const onSendFeedback = useSendFeedback();

  const onPressReview = useCallback(async () => {
    if (ios) {
      onCloseModal();
      RainbowRequestReview.requestReview(handled => {
        if (!handled) {
          AsyncStorage.setItem(REVIEW_DONE_KEY, 'true');
          Linking.openURL(AppleReviewAddress);
        }
      });
    } else {
      RNReview.show();
    }
  }, [onCloseModal]);

  const onPressShare = useCallback(() => {
    Share.share({
      message: `👋️ Hey friend! You should download Rainbow, it's my favorite Ethereum wallet 🌈️🌈️🌈️🌈️🌈️🌈️🌈️🌈️🌈️🌈️ ${SettingsExternalURLs.rainbowHomepage}`,
    });
  }, []);

  const onPressTwitter = useCallback(async () => {
    Linking.canOpenURL(SettingsExternalURLs.twitterDeepLink).then(supported =>
      supported
        ? Linking.openURL(SettingsExternalURLs.twitterDeepLink)
        : Linking.openURL(SettingsExternalURLs.twitterWebUrl)
    );
  }, []);

  const { allBackedUp, areBackedUp, canBeBackedUp } = useMemo(
    () => checkAllWallets(wallets),
    [wallets]
  );

  const backupStatusColor = allBackedUp ? colors.green : colors.blueGreyDark50;

  return (
    <Container scrollEnabled={isTinyPhone}>
      <ColumnWithDividers dividerRenderer={ListItemDivider} marginTop={7}>
        {canBeBackedUp && (
          <ListItem
            icon={<SettingIcon source={BackupIcon} />}
            label="Backup"
            onPress={onPressBackup}
            onPressIcloudBackup={onPressIcloudBackup}
            onPressShowSecret={onPressShowSecret}
            testID="backup-section"
          >
            <ListItemArrowGroup>
              {areBackedUp ? (
                <CheckmarkIcon color={backupStatusColor} />
              ) : (
                <WarningIcon />
              )}
            </ListItemArrowGroup>
          </ListItem>
        )}
        <ListItem
          icon={<SettingIcon source={CurrencyIcon} />}
          label="Currency"
          onPress={onPressCurrency}
          testID="currency-section"
        >
          <ListItemArrowGroup>{nativeCurrency || ''}</ListItemArrowGroup>
        </ListItem>
        <ListItem
          icon={<SettingIcon source={NetworkIcon} />}
          label="Network"
          onPress={onPressNetwork}
          testID="network-section"
        >
          <ListItemArrowGroup>
            {networkInfo?.[network]?.name}
          </ListItemArrowGroup>
        </ListItem>
        {/*<ListItem*/}
        {/*  icon={<SettingIcon source={LanguageIcon} />}*/}
        {/*  label="Language"*/}
        {/*  onPress={onPressLanguage}*/}
        {/*>*/}
        {/*  <ListItemArrowGroup>*/}
        {/*    {supportedLanguages[language] || ''}*/}
        {/*  </ListItemArrowGroup>*/}
        {/*</ListItem>*/}
      </ColumnWithDividers>
      <ListFooter />
      <ColumnWithDividers dividerRenderer={ListItemDivider}>
        <ListItem
          icon={<Emoji name="rainbow" />}
          label="Share Rainbow"
          onPress={onPressShare}
          testID="share-section"
          value={SettingsExternalURLs.rainbowHomepage}
        />
        <ListItem
          icon={<Emoji name="bird" />}
          label="Follow Us on Twitter"
          onPress={onPressTwitter}
          testID="twitter-section"
          value={SettingsExternalURLs.twitter}
        />
        <ListItem
          icon={<Emoji name={ios ? 'speech_balloon' : 'lady_beetle'} />}
          label={ios ? 'Feedback and Support' : 'Feedback & Bug Reports'}
          onPress={onSendFeedback}
          testID="feedback-section"
        />
        {isReviewAvailable && (
          <ListItem
            icon={<Emoji name="red_heart" />}
            label="Review Rainbow"
            onPress={onPressReview}
            testID="review-section"
          />
        )}
      </ColumnWithDividers>
      {IS_DEV && (
        <Fragment>
          <ListFooter height={10} />
          <ListItem
            icon={<Emoji name="construction" />}
            label="Developer Settings"
            onPress={onPressDev}
            testID="developer-section"
          />
        </Fragment>
      )}
      <VersionStampContainer>
        <AppVersionStamp />
      </VersionStampContainer>
    </Container>
  );
}
