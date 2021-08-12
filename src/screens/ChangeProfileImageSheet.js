import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, InteractionManager, StatusBar } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import styled from 'styled-components';
import Divider from '../components/Divider';
import { AssetList } from '../components/asset-list';
import { Centered } from '../components/layout';
import { SheetHandle, SheetTitle } from '../components/sheet';
import { ShowcaseContext } from '../components/showcase/ShowcaseHeader';
import { ModalContext } from '../react-native-cool-modals/NativeStackView';
import {
  useAccountProfile,
  useAccountSettings,
  useAvatarActions,
  useWallets,
  useWalletSectionsData,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { padding } from '@rainbow-me/styles';

const Wrapper = styled.View`
  background-color: ${({ theme: { colors } }) => colors.white};
  border-top-left-radius: 15;
  border-top-right-radius: 15;
  height: 100%;
`;

const HandleWrapper = styled(Centered).attrs({
  pointerEvents: 'none',
})`
  ${padding(6, 0, 6)};
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 9;
`;

const TitleWrapper = styled.View`
  ${padding(18, 0, 10)}
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

  return (
    <Wrapper>
      <StatusBar barStyle="light-content" />
      <HandleWrapper>
        <SheetHandle />
      </HandleWrapper>
      <TitleWrapper>
        <SheetTitle>Select</SheetTitle>
      </TitleWrapper>
      <Divider />
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
    </Wrapper>
  );
}
