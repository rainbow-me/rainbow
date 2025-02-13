import React, { useCallback, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { TouchableWithoutFeedback } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, Inline, Stack, Text } from '@/design-system';

import { useClipboard } from '@/hooks';
import { logger } from '@/logger';
import { isSignTypedData } from '@/utils/signingMethods';

import { sanitizeTypedData } from '@/utils/signingUtils';
import {
  estimateMessageHeight,
  MAX_CARD_HEIGHT,
  CARD_ROW_HEIGHT,
  CARD_BORDER_WIDTH,
  EXPANDED_CARD_TOP_INSET,
} from '@/components/Transactions/constants';
import { FadedScrollCard } from '@/components/FadedScrollCard';
import { AnimatedCheckmark, IconContainer } from '@/components/Transactions/TransactionIcons';

type TransactionMessageCardProps = {
  expandedCardBottomInset: number;
  message: string;
  method: string;
};

export const TransactionMessageCard = ({ expandedCardBottomInset, message, method }: TransactionMessageCardProps) => {
  const { setClipboard } = useClipboard();
  const [didCopy, setDidCopy] = useState(false);

  let displayMessage = message;
  if (isSignTypedData(method)) {
    try {
      const parsedMessage = JSON.parse(message);
      const sanitizedMessage = sanitizeTypedData(parsedMessage);
      displayMessage = sanitizedMessage;
    } catch (error) {
      logger.warn(`[TransactionMessageCard]: Error parsing signed typed data for ${method}`, {
        error,
      });
    }

    displayMessage = JSON.stringify(displayMessage, null, 4);
  }

  const estimatedMessageHeight = useMemo(() => estimateMessageHeight(displayMessage), [displayMessage]);

  const cardHeight = useSharedValue(
    estimatedMessageHeight > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : estimatedMessageHeight + CARD_BORDER_WIDTH * 2
  );
  const contentHeight = useSharedValue(estimatedMessageHeight);

  const handleCopyPress = useCallback(
    (message: string) => {
      if (didCopy) return;
      setClipboard(message);
      setDidCopy(true);
      const copyTimer = setTimeout(() => {
        setDidCopy(false);
      }, 2000);
      return () => clearTimeout(copyTimer);
    },
    [didCopy, setClipboard]
  );

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      expandedCardBottomInset={expandedCardBottomInset}
      expandedCardTopInset={EXPANDED_CARD_TOP_INSET}
      initialScrollEnabled={estimatedMessageHeight > MAX_CARD_HEIGHT}
      isExpanded
      skipCollapsedState
    >
      <Stack space="24px">
        <Box alignItems="flex-end" flexDirection="row" justifyContent="space-between" height={{ custom: CARD_ROW_HEIGHT }}>
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Text align="center" color="label" size="icon 15px" weight="bold">
                􀙤
              </Text>
            </IconContainer>
            <Text color="label" size="17pt" weight="bold">
              {i18n.t(i18n.l.walletconnect.simulation.message_card.title)}
            </Text>
          </Inline>
          <TouchableWithoutFeedback>
            <ButtonPressAnimation disabled={didCopy} onPress={() => handleCopyPress(message)}>
              <Bleed space="24px">
                <Box style={{ padding: 24 }}>
                  <Inline alignHorizontal="right" alignVertical="center" space={{ custom: 4 }}>
                    <AnimatedCheckmark visible={didCopy} />
                    <Text align="right" color={didCopy ? 'labelQuaternary' : 'blue'} size="15pt" weight="bold">
                      {i18n.t(i18n.l.walletconnect.simulation.message_card.copy)}
                    </Text>
                  </Inline>
                </Box>
              </Bleed>
            </ButtonPressAnimation>
          </TouchableWithoutFeedback>
        </Box>
        <Text color="labelTertiary" size="15pt" weight="medium">
          {displayMessage}
        </Text>
      </Stack>
    </FadedScrollCard>
  );
};
