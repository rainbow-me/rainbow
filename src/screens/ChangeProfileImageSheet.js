import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, InteractionManager, StatusBar } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { AssetList } from '../components/asset-list';
import { Centered } from '../components/layout';
import { SheetTitle, SlackSheet } from '../components/sheet';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { useTheme } from '../context/ThemeContext';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import {
  useAccountProfile,
  useAccountSettings,
  useAvatarActions,
  useDimensions,
  useWallets,
  useWalletSectionsData,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { position } from '@rainbow-me/styles';

const Container = styled(Centered).attrs({
  direction: 'column',
})`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

export default function ChangeProfileImageSheet() {
  const { accountAddress } = useAccountProfile();
  const { setProfileImage } = useAvatarActions();
  const { network } = useAccountSettings();
  const { goBack } = useNavigation();

  const { layout } = useContext(ModalContext) || {};
  const handleCollectiblePress = useCallback(
    asset => {
      const imageUrl =
        asset.image_preview_url || asset.image_url || asset.image_original_url;
      if (imageUrl) {
        InteractionManager.runAfterInteractions(() => {
          // Set NFT as Profile Image
          ImagePicker.openCropper({
            cropperCircleOverlay: true,
            mediaType: 'photo',
            path: imageUrl,
          })
            .then(setProfileImage)
            .then(goBack);
        });
      } else {
        Alert.alert(
          'No Image Available',
          'This collectible does not have an image file that we can use for your profile.'
        );
      }
    },
    [goBack, setProfileImage]
  );

  const contextValue = useMemo(
    () => ({
      address: accountAddress,
      customHandleCollectiblePress: handleCollectiblePress,
    }),
    [accountAddress, handleCollectiblePress]
  );

  const { sections } = useWalletSectionsData();
  const { isReadOnlyWallet } = useWallets();
  const { isDarkMode } = useTheme();
  const insets = useSafeArea();
  const [collectiblesSection, setCollectiblesSection] = useState([]);
  useEffect(() => {
    if (sections) {
      const collectibles = sections.filter(sec => sec.collectibles);
      if (collectibles) {
        setCollectiblesSection(collectibles);
      }
    }
  }, [sections]);

  useEffect(() => {
    setTimeout(() => layout?.(), 300);
  }, [layout, sections]);

  const { height: deviceHeight } = useDimensions();

  return (
    <Container deviceHeight={deviceHeight} insets={insets}>
      {ios && !isDarkMode && <StatusBar barStyle="light-content" />}
      {ios && <TouchableBackdrop onPress={goBack} />}
      <SlackSheet
        additionalTopPadding={android}
        contentHeight={deviceHeight}
        scrollEnabled
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight - 80 })}
      >
        <SheetTitle>Select</SheetTitle>
        <ShowcaseContext.Provider value={contextValue}>
          <AssetList
            disableAutoScrolling
            disableRefreshControl
            disableStickyHeaders
            hideHeader
            isReadOnlyWallet={isReadOnlyWallet}
            isWalletEthZero={false}
            network={network}
            openFamilies
            sections={collectiblesSection}
          />
        </ShowcaseContext.Provider>
      </SlackSheet>
    </Container>
  );
}
