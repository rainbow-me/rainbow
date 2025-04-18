import { StyleSheet } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';

import { Border, Box, Column, Columns, Cover, IconContainer, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { ImgixImage } from '@/components/images';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { Language } from '@/languages';
import { useAccountSettings, useDimensions } from '@/hooks';
import { BackgroundColor, ForegroundColor, TextColor } from '@/design-system/color/palettes';
import { maybeSignUri } from '@/handlers/imgix';
import { colors } from '@/styles';
import LinearGradient from 'react-native-linear-gradient';
import { analytics } from '@/analytics';
import { FlashList } from '@shopify/flash-list';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { openInBrowser } from '@/utils/openInBrowser';

const ICON_SIZE = 36;
const CARD_BORDER_RADIUS = 20;

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
  id: string;
  gutterSize: number;
  carouselRef: React.RefObject<FlashList<string>> | null;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({ id, gutterSize, carouselRef }) => {
  const { isDarkMode } = useColorMode();
  const { navigate } = useNavigation();
  const { language } = useAccountSettings();
  const { width } = useDimensions();
  const card = remoteCardsStore(state => state.getCard(id));

  const accent = useForegroundColor(getColorFromString(card?.accentColor || undefined));

  const onPress = useCallback(() => {
    analytics.track(analytics.event.remoteCardPrimaryButtonPressed, {
      cardKey: card?.cardKey ?? 'unknown-backend-driven-card',
      action: card?.primaryButton.url || card?.primaryButton.route,
      props: JSON.stringify(card?.primaryButton.props),
    });
    if (card?.primaryButton && card?.primaryButton.url) {
      openInBrowser(card?.primaryButton.url);
    } else if (card?.primaryButton && card?.primaryButton.route) {
      navigate(card?.primaryButton.route, card?.primaryButton.props);
    }
  }, [card?.cardKey, card?.primaryButton, navigate]);

  const onDismiss = useCallback(() => {
    analytics.track(analytics.event.remoteCardDismissed, {
      cardKey: card?.cardKey ?? card?.sys.id ?? 'unknown-backend-driven-card',
    });

    const { cards } = remoteCardsStore.getState();

    const isLastCard = cards.size === 1;

    card?.sys.id && remoteCardsStore.getState().dismissCard(card.sys.id);
    if (carouselRef?.current) {
      // check if this is the last card and don't scroll if so
      if (isLastCard) return;

      carouselRef.current.scrollToIndex({
        index: Array.from(cards.values()).findIndex(c => c.sys.id === card?.sys.id),
        animated: true,
      });
    }
  }, [card?.cardKey, card?.sys.id, carouselRef]);

  const imageForPlatform = () => {
    if (!card?.imageCollection?.items?.length) {
      return undefined;
    }

    if (card?.imageCollection?.items?.length === 1) {
      return card?.imageCollection?.items[0].url;
    }

    if (IS_IOS) {
      const image = card?.imageCollection?.items?.find(({ url }) => /ios/i.test(url));
      if (image) {
        return image.url;
      }

      return card?.imageCollection?.items[0].url;
    } else {
      const image = card?.imageCollection?.items?.find(({ url }) => /android/i.test(url));
      if (image) {
        return image.url;
      }

      return card?.imageCollection?.items[0].url;
    }
  };

  if (!card || card.dismissed) {
    return null;
  }

  const imageUri = imageForPlatform() ? maybeSignUri(imageForPlatform(), { w: 40, h: 40 }) : undefined;

  // device width - gutter - icon size
  const contentWidth = width - gutterSize - 16 * 2 - ICON_SIZE - 12;
  return (
    <Box
      testID={`remote-card-${card?.cardKey}`}
      width={{ custom: width - gutterSize }}
      overflow="visible"
      justifyContent="center"
      height={'full'}
      borderRadius={CARD_BORDER_RADIUS}
      shadow="12px"
      background={(card?.backgroundColor as BackgroundColor) ?? 'surfaceSecondaryElevated'}
      style={card?.backgroundColor || !isDarkMode ? {} : { backgroundColor: '#191A1C' }}
    >
      <Columns alignVertical="top">
        <Column>
          <GestureHandlerButton scaleTo={0.94} onPressJS={onPress}>
            <Box flexDirection="row" width={{ custom: width - gutterSize - 16 * 2 }} gap={12} padding="16px">
              <Box
                as={LinearGradient}
                style={{
                  backgroundColor: colors.alpha(accent, 0.12),
                  borderColor: colors.alpha(accent, 0.06),
                  borderWidth: 1,
                  marginTop: 'auto',
                  marginBottom: 'auto',
                }}
                colors={[colors.alpha(accent, isDarkMode ? 0.1 : 0), colors.alpha(accent, isDarkMode ? 0 : 0.1)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                borderRadius={card.imageRadius ?? 10}
                height={{ custom: ICON_SIZE }}
                width={{ custom: ICON_SIZE }}
              >
                <Box
                  height="full"
                  style={
                    !card?.imageIcon && imageUri
                      ? {
                          shadowColor: isDarkMode ? colors.shadowBlack : accent,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 3,
                        }
                      : {}
                  }
                  width="full"
                >
                  <Cover alignHorizontal="center" alignVertical="center">
                    {card?.imageIcon && (
                      <TextShadow blur={12}>
                        <Text align="center" color={{ custom: accent }} size="icon 17px" weight="heavy">
                          {card?.imageIcon}
                        </Text>
                      </TextShadow>
                    )}

                    {!card?.imageIcon && imageUri && (
                      <Box
                        as={ImgixImage}
                        enableFasterImage
                        fm="png"
                        source={{ uri: imageForPlatform() }}
                        borderRadius={card.imageRadius ?? 10}
                        size={ICON_SIZE}
                        style={styles.image}
                      />
                    )}
                  </Cover>
                </Box>
              </Box>
              <Box width={{ custom: contentWidth }}>
                <Box gap={10}>
                  <Text color={(card.titleColor as TextColor) ?? 'label'} size="15pt" weight="heavy" numberOfLines={1}>
                    {getKeyForLanguage('subtitle', card, language as Language)}
                  </Text>

                  <Text color={(card.subtitleColor as TextColor) ?? 'labelQuaternary'} size="13pt" weight="bold" numberOfLines={1}>
                    {getKeyForLanguage('title', card, language as Language)}
                  </Text>

                  <TextShadow blur={8} shadowOpacity={0.3}>
                    <Text numberOfLines={1} color={{ custom: accent }} size="13pt" weight="heavy">
                      {getKeyForLanguage('primaryButton.text', card, language as Language)}
                    </Text>
                  </TextShadow>
                </Box>
              </Box>
            </Box>
          </GestureHandlerButton>
        </Column>
        {card.dismissable && (
          <Column width="content">
            <Box hitSlop={12} padding={{ custom: 16 }}>
              <GestureHandlerButton scaleTo={0.8} onPressJS={onDismiss}>
                <IconContainer height={10} width={11}>
                  <Text align="center" color={'labelTertiary'} size="13pt" weight="heavy">
                    􀆄
                  </Text>
                </IconContainer>
              </GestureHandlerButton>
            </Box>
          </Column>
        )}
      </Columns>
      <Border borderRadius={CARD_BORDER_RADIUS} />
    </Box>
  );
};

const styles = StyleSheet.create({
  image: {
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
});
