import { Linking } from 'react-native';
import React, { useCallback } from 'react';
import { get } from 'lodash';

import { Box, Stack, Text, Columns, Column, Bleed } from '@/design-system';
import { Icon } from '@/components/icons';
import { ButtonPressAnimation } from '@/components/animations';
import { TrimmedCard, useRemoteCardContext } from './RemoteCardProvider';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { Language } from '@/languages';
import { useAccountSettings } from '@/hooks';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { maybeSignUri } from '@/handlers/imgix';
import { Media } from '@/components/Media';

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
  const { dismissCard } = useRemoteCardContext();

  const { backgroundColor, primaryButton } = card;

  const onDismissCard = useCallback(
    () => dismissCard(card.sys.id as keyof TrimmedCard['sys']['id']),
    [card.sys.id, dismissCard]
  );

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
      shadow={'12px'}
      style={{
        flex: IS_IOS ? 0 : undefined,
      }}
      padding={`${card.padding}px` as Space}
      testID={`remote-card-${card.cardKey}`}
      borderRadius={14}
      width="full"
      background={backgroundColor ?? 'sufaceSecondary'}
    >
      <Columns>
        <Column width="content">
          <Media
            url={imageUri ?? ''}
            style={{
              width: 80,
              height: 80,
            }}
            size={80}
          />
        </Column>
        <Column width="4/5">
          <Box
            alignItems="flex-start"
            justifyContent="flex-start"
            flexGrow={1}
            flexBasis={0}
            width="full"
            padding="8px"
          >
            <Stack space="12px">
              <Box flexDirection="row" justifyContent="space-between">
                <Text
                  uppercase
                  color={card.subtitleColor ?? 'accent'}
                  size="13pt / 135%"
                  weight="heavy"
                >
                  {getKeyForLanguage('subtitle', card, language as Language)}
                </Text>
                <Bleed top="2px">
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
                color={card.titleColor ?? 'label'}
                size="15pt"
                weight="bold"
              >
                {getKeyForLanguage('title', card, language as Language)}
              </Text>
            </Stack>
          </Box>
        </Column>
      </Columns>
    </Box>
  );
};
