import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { InteractionManager, Linking, Share } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import styled from 'styled-components';
import { buildUniqueTokenName } from '../../../helpers/assets';
import Routes from '../../../navigation/routesNames';
import Pill from '../../Pill';
import { ContextCircleButton } from '../../context-menu';
import { ColumnWithMargins, FlexItem, Row, RowWithMargins } from '../../layout';
import { Text } from '../../text';
import { useAccountProfile, useAvatarActions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { padding } from '@rainbow-me/styles';
import { buildRainbowUrl, magicMemo } from '@rainbow-me/utils';
const paddingHorizontal = 19;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(14, paddingHorizontal, paddingHorizontal)};
`;

const HeadingColumn = styled(ColumnWithMargins).attrs({
  align: 'start',
  justify: 'start',
  margin: 3,
  shrink: 1,
})`
  padding-right: ${paddingHorizontal};
`;

const UniqueTokenExpandedStateHeader = ({ asset }) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { setProfileImage, canNFTBeSetAsProfileImage } = useAvatarActions();
  const canBeSetAsProfileImage = canNFTBeSetAsProfileImage(asset);
  const { navigate } = useNavigation();

  const imageUrl =
    asset.image_preview_url || asset.image_url || asset.image_original_url;

  const contextButtonOptions = useMemo(
    () => [
      'Share',
      'View on OpenSea',
      ...(canBeSetAsProfileImage ? ['Set as Profile Image'] : []),
      ...(ios ? [lang.t('wallet.action.cancel')] : []),
    ],
    [canBeSetAsProfileImage]
  );

  const handleActionSheetPress = useCallback(
    buttonIndex => {
      if (buttonIndex === 0) {
        Share.share({
          title: `Share ${buildUniqueTokenName(asset)} Info`,
          url: buildRainbowUrl(asset, accountENS, accountAddress),
        });
      } else if (buttonIndex === 1) {
        // View on OpenSea
        Linking.openURL(asset.permalink);
      } else if (buttonIndex === 2 && canBeSetAsProfileImage) {
        InteractionManager.runAfterInteractions(() => {
          // Set NFT as Profile Image
          ImagePicker.openCropper({
            cropperCircleOverlay: true,
            mediaType: 'photo',
            path: imageUrl,
          })
            .then(setProfileImage)
            .then(() => navigate(Routes.PROFILE_SCREEN));
        });
      }
    },
    [
      accountAddress,
      accountENS,
      asset,
      canBeSetAsProfileImage,
      imageUrl,
      navigate,
      setProfileImage,
    ]
  );

  const { colors } = useTheme();

  return (
    <Container>
      <HeadingColumn>
        <RowWithMargins align="center" margin={3}>
          <Text
            color={colors.blueGreyDark50}
            letterSpacing="uppercase"
            size="smedium"
            uppercase
            weight="semibold"
          >
            {asset.familyName}
          </Text>
          <Pill maxWidth={125}>#{asset.id}</Pill>
        </RowWithMargins>
        <FlexItem flex={1}>
          <Text
            color={colors.dark}
            letterSpacing="roundedMedium"
            size="big"
            weight="bold"
          >
            {buildUniqueTokenName(asset)}
          </Text>
        </FlexItem>
      </HeadingColumn>
      <ContextCircleButton
        flex={0}
        onPressActionSheet={handleActionSheetPress}
        options={contextButtonOptions}
      />
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateHeader, 'asset');
