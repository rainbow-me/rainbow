import { useFocusEffect } from '@react-navigation/core';
import ConditionalWrap from 'conditional-wrap';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'react-native-image-crop-picker';
import RadialGradient from 'react-native-radial-gradient';
import { atom, useSetRecoilState } from 'recoil';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton from '../../skeleton/Skeleton';
import { Box, Text, useForegroundColor } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';
import { UploadImageReturnData } from '@rainbow-me/handlers/pinata';
import {
  useENSModifiedRegistration,
  useENSRegistrationForm,
  useSelectImageMenu,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { magicMemo, stringifyENSNFTRecord } from '@rainbow-me/utils';

export const coverMetadataAtom = atom<Image | undefined>({
  default: undefined,
  key: 'ens.coverMetadata',
});

const RegistrationCover = ({
  hasSeenExplainSheet,
  onShowExplainSheet,
}: {
  hasSeenExplainSheet: boolean;
  onShowExplainSheet: () => void;
}) => {
  const {
    images: { coverUrl: initialCoverUrl },
  } = useENSModifiedRegistration();
  const {
    isLoading,
    onBlurField,
    onRemoveField,
    values,
  } = useENSRegistrationForm();

  const [coverUpdateAllowed, setCoverUpdateAllowed] = useState(true);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl || values?.cover);
  useEffect(() => {
    if (coverUpdateAllowed) {
      setCoverUrl(
        typeof initialCoverUrl === 'string' ? initialCoverUrl : values?.cover
      );
    }
  }, [initialCoverUrl, coverUpdateAllowed, values, coverUrl]);

  // We want to allow cover state update when the screen is first focussed.
  useFocusEffect(useCallback(() => setCoverUpdateAllowed(true), []));

  const accentColor = useForegroundColor('accent');

  const setCoverMetadata = useSetRecoilState(coverMetadataAtom);

  const { ContextMenu } = useSelectImageMenu({
    imagePickerOptions: {
      cropping: true,
      height: 500,
      width: 1500,
    },
    menuItems: ['library', 'nft'],
    onChangeImage: ({
      asset,
      image,
    }: {
      asset?: UniqueAsset;
      image?: Image & { tmpPath?: string };
    }) => {
      // We want to disallow future avatar state changes (i.e. when upload successful)
      // to avoid avatar flashing (from temp URL to uploaded URL).
      setCoverUpdateAllowed(false);
      setCoverMetadata(image);
      setCoverUrl(image?.tmpPath);

      if (asset) {
        const standard = asset.asset_contract?.schema_name || '';
        const contractAddress = asset.asset_contract?.address || '';
        const tokenId = asset.id;
        onBlurField({
          key: 'cover',
          value: stringifyENSNFTRecord({
            contractAddress,
            standard,
            tokenId,
          }),
        });
      } else if (image?.tmpPath) {
        onBlurField({
          key: 'cover',
          value: image.tmpPath,
        });
      }
    },
    onRemoveImage: () => {
      onRemoveField({ key: 'cover' });
      setCoverUrl('');
      setCoverMetadata(undefined);
    },
    onUploadSuccess: ({ data }: { data: UploadImageReturnData }) => {
      onBlurField({ key: 'cover', value: data.url });
    },
    showRemove: Boolean(coverUrl),
    testID: 'cover',
    uploadToIPFS: true,
  });

  if (isLoading) {
    return (
      <Box height="126px">
        <Skeleton animated>
          <Box background="body" height="126px" />
        </Skeleton>
      </Box>
    );
  }
  return (
    <ConditionalWrap
      condition={hasSeenExplainSheet}
      wrap={children => <ContextMenu>{children}</ContextMenu>}
    >
      <ButtonPressAnimation
        onPress={!hasSeenExplainSheet ? onShowExplainSheet : undefined}
        scaleTo={1}
      >
        <Box
          alignItems="center"
          as={ios ? RadialGradient : View}
          height="126px"
          justifyContent="center"
          {...(ios
            ? {
                colors: [accentColor + '10', accentColor + '33'],
                stops: [0.6, 0],
              }
            : {
                style: { backgroundColor: accentColor + '10' },
              })}
        >
          {coverUrl ? (
            <Box
              as={ImgixImage}
              height="126px"
              source={{ uri: coverUrl }}
              width="full"
            />
          ) : (
            <Text align="center" color="accent" size="18px" weight="heavy">
              􀣵 {lang.t('profiles.create.add_cover')}
            </Text>
          )}
        </Box>
      </ButtonPressAnimation>
    </ConditionalWrap>
  );
};

export default magicMemo(RegistrationCover, [
  'hasSeenExplainSheet',
  'onShowExplainSheet',
]);
