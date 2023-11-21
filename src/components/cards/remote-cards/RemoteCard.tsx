import { Linking } from 'react-native';
import React, { useCallback } from 'react';
import ConditionalWrap from 'conditional-wrap';

import { Box, AccentColorProvider, Space } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { TrimmedCard } from './RemoteCardProvider';
import { IS_IOS } from '@/env';

type RemoteCardProps = {
  card: TrimmedCard;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({ card }) => {
  const { backgroundColor, primaryButton } = card;

  const onPress = useCallback(() => {
    if (primaryButton && primaryButton.url) {
      Linking.openURL(primaryButton.url);
    }
  }, [primaryButton]);

  return (
    <ConditionalWrap
      condition={!!primaryButton}
      wrap={(children: React.ReactNode) => (
        <ButtonPressAnimation
          onPress={onPress}
          scaleTo={0.96}
          overflowMargin={50}
          skipTopMargin
        >
          {children}
        </ButtonPressAnimation>
      )}
    >
      <ConditionalWrap
        condition={
          backgroundColor !== undefined && backgroundColor !== 'accent'
        }
        wrap={(children: React.ReactNode) => (
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          <AccentColorProvider color={backgroundColor!}>
            {children}
          </AccentColorProvider>
        )}
      >
        <Box
          background={backgroundColor ? 'accent' : 'surfacePrimaryElevated'}
          width="full"
          height="full"
          borderRadius={14}
          shadow={backgroundColor ? '18px accent' : '18px'}
          style={{
            flex: IS_IOS ? 0 : undefined,
          }}
          padding={`${card.padding}px` as Space}
          testID={`remote-card-${card.cardKey}`}
        ></Box>
      </ConditionalWrap>
    </ConditionalWrap>
  );
};
