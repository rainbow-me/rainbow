import { Linking, View } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';

import {
  Box,
  Stack,
  Text,
  Columns,
  Column,
  Bleed,
  DebugLayout,
  Inline,
} from '@/design-system';
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
  const { dismissCard } = useRemoteCardContext();
  const { width: deviceWidth } = useDimensions();
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
    } else if (primaryButton && primaryButton.action === 'internal') {
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
      flexDirection="column"
      padding={card.padding ? { custom: card.padding } : undefined}
      testID={`remote-card-${card.cardKey}`}
      justifyContent="flex-start"
      alignItems="flex-start"
      width="full"
      overflow="hidden"
      borderRadius={12}
      background={(backgroundColor as BackgroundColor) ?? 'sufaceSecondary'}
    >
      <Box justifyContent="flex-start" flexDirection="row" width="2/3">
        <Media
          url={imageUri ?? ''}
          style={{
            width: 80,
            height: 80,
          }}
          size={80}
        />

        <Stack space="12px">
          <Box
            flexDirection="row"
            alignItems="flex-start"
            justifyContent="space-between"
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
            <Bleed>
              <Box alignItems="flex-end" justifyContent="flex-end">
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
            </Bleed>
          </Box>

          <Text
            color={(card.titleColor as TextColor) ?? 'label'}
            size="18px / 27px (Deprecated)"
            weight="bold"
          >
            {getKeyForLanguage('title', card, language as Language)}
          </Text>

          {!!card.items.length && (
            // <Box
            //   flexDirection="row"
            //   justifyContent="space-between"
            //   width="full"
            //   alignItems="flex-start"
            // >
            <DebugLayout>
              <Box
                flexDirection="row"
                justifyContent="space-between"
                width={{ custom: deviceWidth - 40 - 80 - 40 - 10 }}
                // width="full"
                maxWidth={400}
                gap={30}
                // overflow="hidden"
                // flexWrap="wrap"
              >
                <View style={{ flex: 1 }}>
                  <Inline wrap={false} alignVertical="center" space="4px">
                    <Text
                      align="center"
                      color={card.items[0].color ?? 'accent'}
                      size="11pt"
                      weight="bold"
                      numberOfLines={1}
                    >
                      {card.items[0].icon}
                    </Text>
                    <Text
                      color={{ custom: '#000' }}
                      size="13pt"
                      weight="bold"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      fds
                    </Text>
                  </Inline>
                </View>
                <View style={{ flex: 1 }}>
                  <Inline wrap={false} alignVertical="center" space="4px">
                    <Text
                      align="center"
                      color={card.items[1].color ?? 'accent'}
                      size="11pt"
                      weight="bold"
                      numberOfLines={1}
                    >
                      {card.items[1].icon}
                    </Text>
                    <Text
                      color={{ custom: '#000' }}
                      size="13pt"
                      weight="bold"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      fds
                    </Text>
                  </Inline>
                </View>

                {/* {card.items.map((item: CardItem) => (
                    <Inline key={item.text}>
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
                        color={{ custom: '#000' }}
                        size="13pt"
                        weight="bold"
                        numberOfLines={1}
                      >
                        fdsffdafdafdsfdsfhj
                      </Text>
                    </Inline>
                  ))} */}
              </Box>
            </DebugLayout>
          )}
        </Stack>
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
