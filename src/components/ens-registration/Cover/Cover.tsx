import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Spinner from '../../Spinner';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { useTheme } from '@rainbow-me/context';
import {
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { useENSProfileForm, useSelectImageMenu } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

const alpha = '33';

export default function CoverPhoto() {
  const { colors } = useTheme();
  const { values, onBlurField, setDisabled } = useENSProfileForm();

  const [coverUrl, setCoverUrl] = useState(values?.cover);
  useEffect(() => {
    setCoverUrl(values?.cover);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const accentColor = useForegroundColor('accent');

  const { ContextMenu, isUploading } = useSelectImageMenu({
    menuItems: ['library'],
    onChangeImage: ({ image }) => {
      setCoverUrl(image?.path);
    },
    onUploadError: () => {
      setDisabled(false);
    },
    onUploading: ({ image }) => {
      onBlurField({ key: 'cover', value: image.path });
      setDisabled(true);
    },
    onUploadSuccess: ({ data }) => {
      onBlurField({ key: 'cover', value: data.url });
      setDisabled(false);
    },
    uploadToIPFS: true,
  });

  return (
    <ContextMenu>
      <ButtonPressAnimation scaleTo={1}>
        <Box
          alignItems="center"
          as={ios ? RadialGradient : View}
          height="126px"
          justifyContent="center"
          {...(ios
            ? {
                colors: [colors.whiteLabel + alpha, accentColor + alpha],
                stops: [0.6, 0],
              }
            : {
                style: { backgroundColor: accentColor + '10' },
              })}
        >
          {coverUrl ? (
            <>
              <Box
                as={ImgixImage}
                height="126px"
                source={{ uri: coverUrl }}
                style={{
                  opacity: isUploading ? 0.3 : 1,
                }}
                width="full"
              />
              {isUploading && (
                <Cover alignHorizontal="center" alignVertical="center">
                  <Spinner
                    color={accentColor}
                    duration={1000}
                    size={'large' as 'large'}
                  />
                </Cover>
              )}
            </>
          ) : (
            <Text color="accent" size="18px" weight="heavy">
              􀣵 Add Cover
            </Text>
          )}
        </Box>
      </ButtonPressAnimation>
    </ContextMenu>
  );
}
