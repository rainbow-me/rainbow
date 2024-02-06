import ConditionalWrap from 'conditional-wrap';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'react-native-image-crop-picker';
import RadialGradient from 'react-native-radial-gradient';
import { atom, useSetRecoilState } from 'recoil';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton from '../../skeleton/Skeleton';
import { Box, Cover, Text, useForegroundColor } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { UploadImageReturnData } from '@/handlers/pinata';
import { useENSModifiedRegistration, useENSRegistration, useENSRegistrationForm, useSelectImageMenu } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { magicMemo, stringifyENSNFTRecord } from '@/utils';
import { ENS_RECORDS } from '@/helpers/ens';

export const coverMetadataAtom = atom<Image | undefined>({
  default: undefined,
  key: 'ens.coverMetadata',
});

const RegistrationCover = ({
  hasSeenExplainSheet,
  onShowExplainSheet,
  enableNFTs,
}: {
  hasSeenExplainSheet: boolean;
  onShowExplainSheet: () => void;
  enableNFTs: boolean;
}) => {
  const {
    images: { coverUrl: initialCoverUrl },
  } = useENSModifiedRegistration();
  const { isLoading, onBlurField, onRemoveField, setDisabled, values } = useENSRegistrationForm();
  const { name } = useENSRegistration();
  const [coverUpdateAllowed, setCoverUpdateAllowed] = useState(true);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl || values?.header);

  useEffect(() => {
    if (coverUpdateAllowed) {
      setCoverUrl(typeof initialCoverUrl === 'string' ? initialCoverUrl : values?.header);
    }
  }, [initialCoverUrl, coverUpdateAllowed]); // eslint-disable-line react-hooks/exhaustive-deps

  // We want to allow cover state update when the screen is first focussed.
  useEffect(() => setCoverUpdateAllowed(true), [setCoverUpdateAllowed, name]);

  const accentColor = useForegroundColor('accent');

  const setCoverMetadata = useSetRecoilState(coverMetadataAtom);
  const onChangeImage = useCallback(
    ({ asset, image }: { asset?: UniqueAsset; image?: Image & { tmpPath?: string } }) => {
      setCoverMetadata(image);
      setCoverUrl(image?.tmpPath || asset?.image_url || asset?.lowResUrl || asset?.image_thumbnail_url || '');

      if (asset) {
        const standard = asset.asset_contract?.schema_name || '';
        const contractAddress = asset.asset_contract?.address || '';
        const tokenId = asset.id;
        onBlurField({
          key: 'header',
          value: stringifyENSNFTRecord({
            contractAddress,
            standard,
            tokenId,
          }),
        });
      } else if (image?.tmpPath) {
        // We want to disallow future avatar state changes (i.e. when upload successful)
        // to avoid avatar flashing (from temp URL to uploaded URL).
        setCoverUpdateAllowed(false);
        onBlurField({
          key: 'header',
          value: image.tmpPath,
        });
      }
    },
    [onBlurField, setCoverMetadata]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const { ContextMenu, handleSelectImage } = useSelectImageMenu({
    imagePickerOptions: {
      cropping: true,
      height: 500,
      width: 1500,
    },
    menuItems: enableNFTs ? ['library', 'nft'] : ['library'],
    onChangeImage: onChangeImage,
    onRemoveImage: () => {
      onRemoveField({ key: ENS_RECORDS.header });
      setCoverMetadata(undefined);
      setDisabled(false);
      setTimeout(() => {
        setCoverUrl('');
      }, 100);
    },
    onUploadError: () => {
      onBlurField({ key: 'header', value: '' });
      setCoverUrl('');
      setIsUploading(false);
    },
    onUploading: () => {
      setIsUploading(true);
      setDisabled(true);
    },
    onUploadSuccess: ({ data }: { data: UploadImageReturnData }) => {
      onBlurField({ key: 'header', value: data.url });
      setDisabled(false);
      setIsUploading(false);
      setIsLoadingImage(true);
    },
    showRemove: Boolean(coverUrl),
    testID: 'cover',
    uploadToIPFS: true,
  });

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
    <ConditionalWrap condition={hasSeenExplainSheet && (enableNFTs || !!coverUrl)} wrap={children => <ContextMenu>{children}</ContextMenu>}>
      <ButtonPressAnimation onPress={!hasSeenExplainSheet ? onShowExplainSheet : enableNFTs ? undefined : handleSelectImage} scaleTo={1}>
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
          {(!coverUrl || isUploading || isLoadingImage) && (
            <Text align="center" color="accent" size="18px / 27px (Deprecated)" weight="heavy">
              􀣵 {isUploading || isLoadingImage ? lang.t('profiles.create.uploading') : lang.t('profiles.create.add_cover')}
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
