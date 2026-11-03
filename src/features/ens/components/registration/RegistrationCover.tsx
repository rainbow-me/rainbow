import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import RadialGradient from 'react-native-radial-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import Skeleton from '@/components/skeleton/Skeleton';
import { Box, Cover, Text, useForegroundColor } from '@/design-system';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { ENS_RECORDS } from '@/features/ens/core/records';
import { type UploadImageReturnData } from '@/handlers/pinata';
import useSelectImageMenu from '@/hooks/useSelectImageMenu';
import * as i18n from '@/languages';
import magicMemo from '@/utils/magicMemo';

import { nftImageRecord } from '../../core/nftRecord';
import { useENSRegistrationForm } from '../../hooks/useENSRegistrationForm';
import { useENSRegistrationImage } from '../../hooks/useENSRegistrationImage';

const RegistrationCover = ({
  hasSeenExplainSheet,
  onShowExplainSheet,
  enableNFTs,
}: {
  hasSeenExplainSheet: boolean;
  onShowExplainSheet: () => void;
  enableNFTs: boolean;
}) => {
  const initialCoverUrl = useENSRegistrationImage('header');
  const { isLoading, onChangeField, onRemoveField, setUploading, uploading, values } = useENSRegistrationForm();
  const accentColor = useForegroundColor('accent');

  const [coverUrl, setCoverUrl] = useState(initialCoverUrl || values.header);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const isUploading = uploading.header;

  useEffect(() => {
    setCoverUrl(initialCoverUrl ?? values.header);
  }, [initialCoverUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSelectNft = useCallback(
    ({ asset }: { asset?: UniqueAsset }) => {
      if (!asset) return;
      const value = nftImageRecord(asset);
      if (!value) return;

      const preview = asset.images.highResUrl || asset.images.lowResUrl || '';
      setCoverUrl(preview);
      onChangeField({ key: 'header', value });
    },
    [onChangeField]
  );

  const { ContextMenu, handleSelectImage } = useSelectImageMenu({
    imagePickerOptions: {
      allowsEditing: true,
      aspect: [3, 1],
      quality: 1,
      height: 500,
      width: 1500,
    },
    menuItems: enableNFTs ? ['library', 'nft'] : ['library'],
    onChangeImage: onSelectNft,
    onRemoveImage: () => {
      onRemoveField({ key: ENS_RECORDS.header });
      setTimeout(() => {
        setCoverUrl('');
      }, 100);
    },
    onUploadError: () => {
      onChangeField({ key: 'header', value: '' });
      setCoverUrl('');
    },
    onUploading: uploading => setUploading('header', uploading),
    onUploadSuccess: ({ data }: { data: UploadImageReturnData }) => {
      onChangeField({ key: 'header', value: data.url });
      setIsLoadingImage(true);
    },
    showRemove: Boolean(coverUrl),
    uploadToIPFS: true,
  });

  const showMenu = hasSeenExplainSheet && (enableNFTs || !!coverUrl);

  if (isLoading) {
    return (
      <Box height="126px">
        <Skeleton animated>
          <Box background="body (Deprecated)" height="126px" />
        </Skeleton>
      </Box>
    );
  }
  return (
    <ConditionalWrap condition={showMenu} wrap={children => <ContextMenu testID="use-select-image-cover">{children}</ContextMenu>}>
      <ButtonPressAnimation
        onPress={!hasSeenExplainSheet ? onShowExplainSheet : showMenu ? undefined : handleSelectImage}
        scaleTo={1}
        testID={showMenu ? undefined : 'use-select-image-cover'}
      >
        <Box
          alignItems="center"
          as={Platform.OS === 'ios' ? RadialGradient : View}
          height="126px"
          justifyContent="center"
          {...(Platform.OS === 'ios'
            ? {
                colors: [accentColor + '10', accentColor + '33'],
                stops: [0.6, 0],
              }
            : {
                style: { backgroundColor: accentColor + '10' },
              })}
        >
          {(!coverUrl || isUploading || isLoadingImage) && (
            <Text align="center" color="accent" size="18px / 27px (Deprecated)" weight="heavy">
              􀣵 {isUploading || isLoadingImage ? i18n.t(i18n.l.profiles.create.uploading) : i18n.t(i18n.l.profiles.create.add_cover)}
            </Text>
          )}
        </Box>
        {!!coverUrl && !isUploading && (
          <Cover>
            <Box
              as={ImgixImage}
              height="126px"
              onLoadEnd={() => setIsLoadingImage(false)}
              size={400}
              source={{ uri: coverUrl }}
              width="full"
            />
          </Cover>
        )}
      </ButtonPressAnimation>
    </ConditionalWrap>
  );
};

export default magicMemo(RegistrationCover, ['hasSeenExplainSheet', 'onShowExplainSheet']);
