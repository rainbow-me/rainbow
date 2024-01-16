import { Linking, Text as RNText, StyleSheet } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';

import { Box, Cover, Stack, Text, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { TrimmedCard, useRemoteCardContext } from './RemoteCardProvider';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { Language } from '@/languages';
import { useAccountSettings, useDimensions } from '@/hooks';
import {
  BackgroundColor,
  ForegroundColor,
  TextColor,
} from '@/design-system/color/palettes';
import { maybeSignUri } from '@/handlers/imgix';
import { colors } from '@/styles';
import { useTheme } from '@/theme';
import LinearGradient from 'react-native-linear-gradient';
import { ImgixImage } from '@/components/images';

const GUTTER_SIZE = 40;

const getKeyForLanguage = (key: string, object: object, language: Language) => {
  if (!object) {
    return '';
  }

  const objectOrPrimitive = get(object, key);
  if (typeof objectOrPrimitive === 'undefined') {
    return '';
  }

  if (objectOrPrimitive === null) {
    return '';
  }

  if (objectOrPrimitive[language]) {
    return objectOrPrimitive[language];
  }

  return objectOrPrimitive[Language.EN_US] ?? '';
};

const getColorFromString = (color: string | undefined | null) => {
  if (!color) {
    return 'green';
  }

  if (color.startsWith('#')) {
    return { custom: color };
  }

  // assume it's in the list of ForegroundColors
  return color as ForegroundColor;
};

type RemoteCardProps = {
  card: TrimmedCard;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({
  card = {} as TrimmedCard,
}) => {
  const { isDarkMode } = useTheme();
  const { navigate } = useNavigation();
  const { language } = useAccountSettings();
  const { width } = useDimensions();
  const { dismissCard } = useRemoteCardContext();

  const { accentColor, backgroundColor, primaryButton, imageIcon } = card;

  const accent = useForegroundColor(getColorFromString(accentColor));
  const border = useForegroundColor('separatorSecondary');

  const onPress = useCallback(() => {
    if (primaryButton && primaryButton.url) {
      Linking.openURL(primaryButton.url);
    } else if (primaryButton && primaryButton.route) {
      navigate(primaryButton.route, primaryButton.props);
    }
  }, [navigate, primaryButton]);

  const imageForPlatform = () => {
    if (!card?.imageCollection?.items?.length) {
      return undefined;
    }

    if (card?.imageCollection?.items?.length === 1) {
      return card?.imageCollection?.items[0].url;
    }

    if (IS_IOS) {
      const image = card?.imageCollection?.items?.find(({ url }) =>
        /ios/i.test(url)
      );
      if (image) {
        return image.url;
      }

      return card?.imageCollection?.items[0].url;
    } else {
      const image = card?.imageCollection?.items?.find(({ url }) =>
        /android/i.test(url)
      );
      if (image) {
        return image.url;
      }

      return card?.imageCollection?.items[0].url;
    }
  };

  if (!card) {
    return null;
  }

  const imageUri = imageForPlatform()
    ? maybeSignUri(imageForPlatform(), { w: 40, h: 40 })
    : undefined;

  return (
    <Box
      testID={`remote-card-${card.cardKey}`}
      width={{ custom: width - GUTTER_SIZE }}
      overflow="visible"
      height={'full'}
      borderRadius={18}
      padding={{ custom: 16 }}
      shadow="12px"
      style={{
        borderColor: border,
        borderWidth: 1,
      }}
      background={
        (backgroundColor as BackgroundColor) ?? 'surfaceSecondaryElevated'
      }
    >
      <Box
        flexDirection="row"
        alignItems="center"
        width={{ custom: width - GUTTER_SIZE - 16 * 2 }}
        gap={12}
        height={'full'}
      >
        <Box
          as={LinearGradient}
          style={{
            borderColor: colors.alpha(accent, 0.06),
            borderWidth: 1,
          }}
          colors={[
            colors.alpha(accent, 0.1),
            colors.alpha(accent, 0.1),
            colors.alpha(accent, 0.12),
            colors.alpha(accent, 0.12),
          ]}
          start={{ x: -0.69, y: 0 }}
          end={{ x: 0.99, y: 1 }}
          borderRadius={card.imageRadius ?? 10}
          height={{ custom: 40 }}
          width={{ custom: 40 }}
        >
          <Box
            height="full"
            style={{
              shadowColor: isDarkMode ? colors.shadowBlack : accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            }}
            width="full"
          >
            <Cover alignHorizontal="center" alignVertical="center">
              {imageIcon && (
                <Text
                  align="center"
                  color={{ custom: accent }}
                  size="icon 17px"
                  weight="bold"
                >
                  {imageIcon}
                </Text>
              )}

              {!imageIcon && imageUri && (
                <ImgixImage
                  source={{ uri: imageUri }}
                  resizeMode="cover"
                  size={40}
                  style={{
                    height: 40,
                    width: 40,
                  }}
                />
              )}
            </Cover>
          </Box>
        </Box>

        {card.dismissable && (
          <Box
            zIndex={1}
            position="absolute"
            top={{ custom: 2 }}
            right={{ custom: 4 }}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <ButtonPressAnimation
              scaleTo={0.96}
              overflowMargin={50}
              skipTopMargin
              disallowInterruption
              onPress={() => dismissCard(card.sys.id)}
            >
              <Text color={'labelTertiary'} size="13pt" weight="bold">
                􀆄
              </Text>
            </ButtonPressAnimation>
          </Box>
        )}

        <Stack space="10px">
          <Text
            color={(card.titleColor as TextColor) ?? 'label'}
            size="17pt"
            weight="heavy"
          >
            {getKeyForLanguage('subtitle', card, language as Language)}
          </Text>

          <Text
            color={(card.subtitleColor as TextColor) ?? 'labelQuaternary'}
            size="13pt"
            weight="bold"
          >
            {getKeyForLanguage('title', card, language as Language)}
          </Text>

          {primaryButton && (
            <ButtonPressAnimation
              hapticType="impactHeavy"
              onPress={onPress}
              scaleTo={0.94}
              transformOrigin="top"
            >
              <RNText
                style={[
                  styles.neonButtonText,
                  {
                    textShadowColor: colors.alpha(accent, 0.6),
                  },
                ]}
              >
                <Text
                  align="left"
                  color={{ custom: accent }}
                  size="13pt"
                  weight="heavy"
                >
                  {getKeyForLanguage(
                    'primaryButton.text',
                    card,
                    language as Language
                  )}
                </Text>
              </RNText>
            </ButtonPressAnimation>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  neonButtonText: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
