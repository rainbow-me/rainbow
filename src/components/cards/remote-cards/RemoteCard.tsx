import { Linking, StyleSheet } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';
import ConditionalWrap from 'conditional-wrap';

import { Border, Box, Cover, IconContainer, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { Language } from '@/languages';
import { useAccountSettings, useDimensions } from '@/hooks';
import { BackgroundColor, ForegroundColor, TextColor } from '@/design-system/color/palettes';
import { maybeSignUri } from '@/handlers/imgix';
import { colors } from '@/styles';
import LinearGradient from 'react-native-linear-gradient';
import { analyticsV2 } from '@/analytics';
import { FlashList } from '@shopify/flash-list';
import { ButtonPressAnimationTouchEvent } from '@/components/animations/ButtonPressAnimation/types';
import { TrimmedCard } from '@/resources/cards/cardCollectionQuery';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';

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
  const card = remoteCardsStore(state => state.getCard(id)) ?? ({} as TrimmedCard);
  const { cardKey, accentColor, backgroundColor, primaryButton, imageIcon } = card;

  const accent = useForegroundColor(getColorFromString(accentColor));

  const onPress = useCallback(() => {
    analyticsV2.track(analyticsV2.event.remoteCardPrimaryButtonPressed, {
      cardKey: cardKey ?? 'unknown-backend-driven-card',
      action: primaryButton.url || primaryButton.route,
      props: JSON.stringify(primaryButton.props),
    });
    if (primaryButton && primaryButton.url) {
      Linking.openURL(primaryButton.url);
    } else if (primaryButton && primaryButton.route) {
      navigate(primaryButton.route, primaryButton.props);
    }
  }, [navigate, primaryButton, cardKey]);

  const onDismiss = useCallback(
    (e: ButtonPressAnimationTouchEvent) => {
      if (e && 'stopPropagation' in e) {
        e.stopPropagation();
      }
      analyticsV2.track(analyticsV2.event.remoteCardDismissed, {
        cardKey: cardKey ?? card.sys.id ?? 'unknown-backend-driven-card',
      });

      const { cards } = remoteCardsStore.getState();

      const isLastCard = cards.size === 1;

      remoteCardsStore.getState().dismissCard(card.sys.id);
      if (carouselRef?.current) {
        // check if this is the last card and don't scroll if so
        if (isLastCard) return;

        carouselRef.current.scrollToIndex({
          index: Array.from(cards.values()).findIndex(c => c.sys.id === card.sys.id),
          animated: true,
        });
      }
    },
    [carouselRef, cardKey, card.sys.id]
  );

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
    <ConditionalWrap
      condition={primaryButton.route || primaryButton.url}
      wrap={children => (
        <ButtonPressAnimation hapticType="impactHeavy" onPress={onPress} disabled={IS_ANDROID} scaleTo={0.94} disallowInterruption>
          {children}
        </ButtonPressAnimation>
      )}
    >
      <Box
        testID={`remote-card-${cardKey}`}
        width={{ custom: width - gutterSize }}
        overflow="visible"
        justifyContent="center"
        height={'full'}
        borderRadius={CARD_BORDER_RADIUS}
        padding="16px"
        shadow="12px"
        background={(backgroundColor as BackgroundColor) ?? 'surfaceSecondaryElevated'}
        style={backgroundColor || !isDarkMode ? {} : { backgroundColor: '#191A1C' }}
      >
        <Box flexDirection="row" width={{ custom: width - gutterSize - 16 * 2 }} gap={12}>
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
                !imageIcon && imageUri
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
                {imageIcon && (
                  <TextShadow blur={12}>
                    <Text align="center" color={{ custom: accent }} size="icon 17px" weight="heavy">
                      {imageIcon}
                    </Text>
                  </TextShadow>
                )}

                {!imageIcon && imageUri && (
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

          {card.dismissable && (
            <Box
              zIndex={1}
              position="absolute"
              top={{ custom: 2 }}
              right={{ custom: 0 }}
              hitSlop={{ top: 8, right: 12, bottom: 8, left: 8 }}
            >
              <ButtonPressAnimation scaleTo={0.8} overflowMargin={50} skipTopMargin disallowInterruption onPress={onDismiss}>
                <IconContainer height={10} width={11}>
                  <Text align="center" color={'labelTertiary'} size="13pt" weight="heavy">
                    􀆄
                  </Text>
                </IconContainer>
              </ButtonPressAnimation>
            </Box>
          )}
          <Box width={{ custom: contentWidth }}>
            <Box gap={10}>
              <Text color={(card.titleColor as TextColor) ?? 'label'} size="15pt" weight="heavy" numberOfLines={1}>
                {getKeyForLanguage('subtitle', card, language as Language)}
              </Text>

              <Text color={(card.subtitleColor as TextColor) ?? 'labelQuaternary'} size="13pt" weight="bold" numberOfLines={1}>
                {getKeyForLanguage('title', card, language as Language)}
              </Text>

              <ButtonPressAnimation
                scaleTo={0.96}
                overflowMargin={50}
                skipTopMargin
                disabled={!IS_ANDROID}
                disallowInterruption
                onPress={onPress}
              >
                <TextShadow blur={8} shadowOpacity={0.3}>
                  <Text numberOfLines={1} color={{ custom: accent }} size="13pt" weight="heavy">
                    {getKeyForLanguage('primaryButton.text', card, language as Language)}
                  </Text>
                </TextShadow>
              </ButtonPressAnimation>
            </Box>
          </Box>
        </Box>
        <Border borderRadius={CARD_BORDER_RADIUS} />
      </Box>
    </ConditionalWrap>
  );
};

const styles = StyleSheet.create({
  image: {
    height: ICON_SIZE,
    width: ICON_SIZE,
  },
});
