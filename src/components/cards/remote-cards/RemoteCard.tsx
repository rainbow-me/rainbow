import { Linking, View } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';

import { Box, Stack, Text, Inline } from '@/design-system';
import { Icon } from '@/components/icons';
import { ButtonPressAnimation } from '@/components/animations';
import { TrimmedCard, useRemoteCardContext } from './RemoteCardProvider';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { Language } from '@/languages';
import { useAccountSettings, useDimensions } from '@/hooks';
import { BackgroundColor, TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { maybeSignUri } from '@/handlers/imgix';
import { Media } from '@/components/Media';
import { SheetActionButton } from '@/components/sheet';
import { colors } from '@/styles';

const GUTTER_SIZE = 40;

const getKeyForLanguage = (key: string, object: any, language: Language) => {
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

type RemoteCardProps = {
  card: TrimmedCard;
};

type CardItem = {
  icon: string;
  text: string;
  color?: TextColor | CustomColor;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({
  card = {} as TrimmedCard,
}) => {
  const { navigate } = useNavigation();
  const { language } = useAccountSettings();
  const { width } = useDimensions();
  const { dismissCard } = useRemoteCardContext();

  const { backgroundColor, primaryButton } = card;

  const onDismissCard = useCallback(() => dismissCard(card.sys.id), [
    card.sys.id,
    dismissCard,
  ]);

  const onPress = useCallback(() => {
    const internalNavigation = (route: string, options: any) => {
      navigate(route, options);
    };

    if (primaryButton && primaryButton.url) {
      Linking.openURL(primaryButton.url);
    } else if (primaryButton && primaryButton.route) {
      internalNavigation(primaryButton.route, primaryButton.props);
    }
  }, [navigate, primaryButton]);

  const imageForPlatform = () => {
    if (card.imageCollection.items.length === 1) {
      return card.imageCollection.items[0].url;
    }

    if (IS_IOS) {
      const image = card.imageCollection.items.find(({ url }) =>
        /ios/i.test(url)
      );
      if (image) {
        return image.url;
      }

      return card.imageCollection.items[0].url;
    } else {
      const image = card.imageCollection.items.find(({ url }) =>
        /android/i.test(url)
      );
      if (image) {
        return image.url;
      }

      return card.imageCollection.items[0].url;
    }
  };

  if (!card) {
    return null;
  }

  const imageUri = imageForPlatform()
    ? maybeSignUri(imageForPlatform())
    : undefined;

  return (
    <Box
      padding={card.padding ? { custom: card.padding } : undefined}
      testID={`remote-card-${card.cardKey}`}
      overflow="hidden"
      width={{ custom: width - GUTTER_SIZE }}
      borderRadius={12}
      background={(backgroundColor as BackgroundColor) ?? 'sufaceSecondary'}
    >
      <Box
        flexDirection="row"
        width={{ custom: width - GUTTER_SIZE - Number(card.padding) * 2 }}
        gap={12}
      >
        <Media
          url={imageUri ?? ''}
          style={{
            width: 80,
            height: 80,
          }}
          size={80}
        />

        <Box
          zIndex={1}
          position="absolute"
          top={{ custom: 8 }}
          right={{ custom: 8 }}
          hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <ButtonPressAnimation
            scaleTo={0.96}
            overflowMargin={50}
            skipTopMargin
            disallowInterruption
            onPress={onDismissCard}
          >
            <Icon name="close" size="8" />
          </ButtonPressAnimation>
        </Box>

        <Box
          width={{
            custom:
              width - 40 - Number(card.padding) * 2 - GUTTER_SIZE * 2 - 12,
          }}
          flexDirection="column"
          gap={12}
        >
          <Box
            width={{
              custom:
                width - 40 - Number(card.padding) * 2 - GUTTER_SIZE * 2 - 18,
            }}
            flexDirection="row"
            paddingTop="8px"
          >
            <Text
              uppercase
              color={(card.subtitleColor as TextColor) ?? 'accent'}
              size="13pt / 135%"
              weight="heavy"
            >
              {getKeyForLanguage('subtitle', card, language as Language)}
            </Text>
          </Box>

          <Text
            color={(card.titleColor as TextColor) ?? 'label'}
            size="18px / 27px (Deprecated)"
            weight="bold"
          >
            {getKeyForLanguage('title', card, language as Language)}
          </Text>

          {!!card.items.length && (
            <Box
              flexDirection="row"
              width={{
                custom: width - 40 - Number(card.padding) * 2 - 80 - 18,
              }}
              justifyContent="space-between"
            >
              {card.items.map((item: CardItem) => (
                <View key={item.text} style={{ flex: 1 }}>
                  <Inline wrap={false} alignVertical="center" space="4px">
                    <Text
                      align="center"
                      color={item.color ?? 'accent'}
                      size="11pt"
                      weight="bold"
                      numberOfLines={1}
                    >
                      {item.icon}
                    </Text>
                    <Text
                      color={'labelSecondary'}
                      size="13pt"
                      weight="bold"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {getKeyForLanguage('text', item, language as Language)}
                    </Text>
                  </Inline>
                </View>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Stack>
        <Text
          color={(card.descriptionColor as TextColor) ?? 'label'}
          size="13pt"
          weight="regular"
        >
          {getKeyForLanguage('description', card, language as Language)}
        </Text>

        {!!primaryButton && (
          <SheetActionButton
            color={primaryButton.color ?? ''}
            label={getKeyForLanguage(
              'primaryButton.text',
              card,
              language as Language
            )}
            lightShadows
            scaleTo={0.96}
            onPress={onPress}
            textColor={primaryButton.textColor ?? colors.white}
            textSize="large"
            weight="heavy"
          />
        )}
      </Stack>
    </Box>
  );
};
