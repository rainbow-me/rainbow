import { useRoute } from '@react-navigation/core';
import ConditionalWrap from 'conditional-wrap';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Spinner from '../components/Spinner';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { sharedCoolModalTopOffset } from '../navigation/config';
import { useTheme } from '@rainbow-me/context';
import { BackgroundProvider, Box } from '@rainbow-me/design-system';
import { useDimensions, useENSProfile } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

export default function RegisterENSNavigator() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const { height: deviceHeight } = useDimensions();
  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  const profile = useENSProfile(params?.address);

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor = colors.appleBlue;

  const coverUrl = profile.data?.images.coverUrl;

  return (
    <BackgroundProvider color="body">
      {({ backgroundColor }) => (
        // @ts-expect-error JavaScript component
        <SlackSheet
          backgroundColor={backgroundColor}
          contentHeight={contentHeight}
          height="100%"
          removeTopPadding
          scrollEnabled
        >
          <ConditionalWrap
            condition={profile.isLoading}
            wrap={children => <Box style={wrapperStyle}>{children}</Box>}
          >
            <>
              {profile.isLoading ? (
                <Box alignItems="center" height="full" justifyContent="center">
                  <Spinner color={colors.appleBlue} size="large" />
                </Box>
              ) : (
                <Box>
                  <Box
                    alignItems="center"
                    as={ios ? RadialGradient : View}
                    height="126px"
                    justifyContent="center"
                    {...(ios
                      ? {
                          center: [80, 100],
                          colors: [accentColor + '33', accentColor + '10'],
                        }
                      : {
                          style: { backgroundColor: accentColor + '10' },
                        })}
                  >
                    {coverUrl && (
                      <Box
                        as={ImgixImage}
                        height="126px"
                        source={{ uri: coverUrl }}
                        width="full"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </>
          </ConditionalWrap>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
}
