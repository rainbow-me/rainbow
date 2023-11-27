import { Linking, Image } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';

import {
  Box,
  Space,
  Stack,
  Inline,
  Text,
  Columns,
  Column,
  Bleed,
  Cover,
} from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { TrimmedCard } from './RemoteCardProvider';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { Language } from '@/languages';
import { useAccountSettings } from '@/hooks';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { maybeSignUri } from '@/handlers/imgix';

const getKeyForLanguage = (
  key: string,
  promoSheet: any,
  language: Language
) => {
  if (!promoSheet) {
    return '';
  }

  const objectOrPrimitive = get(promoSheet, key);
  if (typeof objectOrPrimitive === 'undefined') {
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
  text: string;
  icon: string;
  color: TextColor | CustomColor;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({
  card = {} as TrimmedCard,
}) => {
  const { navigate } = useNavigation();
  const { language } = useAccountSettings();

  const { backgroundColor, primaryButton } = card;

  const onPress = useCallback(() => {
    const internalNavigation = (route: string) => {
      navigate(route);
    };

    if (primaryButton && primaryButton.url) {
      Linking.openURL(primaryButton.url);
    } else if (primaryButton && primaryButton.action === 'internal') {
      internalNavigation(primaryButton.url);
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
      background={backgroundColor ?? 'surfacePrimaryElevated'}
      width="full"
      borderRadius={14}
      shadow={backgroundColor ? '18px accent' : '18px'}
      style={{
        flex: IS_IOS ? 0 : undefined,
      }}
      padding={`${card.padding}px` as Space}
      testID={`remote-card-${card.cardKey}`}
    >
      <Stack>
        <Inline wrap={false} space="20px">
          {imageUri && (
            <Cover>
              <Box
                as={Image}
                source={{ uri: imageUri }}
                resizeMode="cover"
                width="full"
                height="full"
                borderRadius={card.imageRadius ?? 12}
                overflow="hidden"
              />
            </Cover>
          )}

          <Box
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            <Stack space={{ custom: 5 }}>
              <Text
                color={card.subtitleColor ?? 'accent'}
                size="13pt"
                weight="heavy"
              >
                {getKeyForLanguage('subtitle', card, language as Language)}
              </Text>

              <Text
                color={card.titleColor ?? 'label'}
                size="18px / 27px (Deprecated)"
                weight="bold"
              >
                {getKeyForLanguage('title', card, language as Language)}
              </Text>
            </Stack>

            <Stack space={{ custom: 14 }}>
              {card.items.map((item: CardItem) => (
                <Columns key={item.text} space={{ custom: 13 }}>
                  <Column width="content">
                    <Box paddingTop={IS_ANDROID ? '6px' : undefined}>
                      <Text
                        align="center"
                        color={item.color ?? 'accent'}
                        size="11pt"
                        weight="bold"
                      >
                        {item.icon}
                      </Text>
                    </Box>
                  </Column>
                  <Bleed top="3px">
                    <Text color="label" size="13pt" weight="bold">
                      {item.text}
                    </Text>
                  </Bleed>
                </Columns>
              ))}
            </Stack>
          </Box>
        </Inline>

        {card.description && (
          <Text
            color={card.descriptionColor ?? 'labelSecondary'}
            size="13pt"
            weight="medium"
          >
            {getKeyForLanguage(
              'description',
              card,
              language as Language
            ).replace(/\n/g, ' ')}
          </Text>
        )}

        {card.primaryButton && (
          <ButtonPressAnimation
            onPress={onPress}
            scaleTo={0.96}
            overflowMargin={50}
            skipTopMargin
          >
            <Text color="label" size="13pt" weight="bold">
              {getKeyForLanguage(
                'card.primaryButton.text',
                card,
                language as Language
              )}
            </Text>
          </ButtonPressAnimation>
        )}
      </Stack>
    </Box>
  );
};
