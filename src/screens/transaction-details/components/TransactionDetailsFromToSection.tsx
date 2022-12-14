import React, { useEffect, useMemo, useState } from 'react';
import { Box, Cover, Stack } from '@/design-system';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import * as i18n from '@/languages';
import { fetchReverseRecord } from '@/handlers/ens';
import { address, formatAddressForDisplay } from '@/utils/abbreviations';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@/utils/profileUtils';
import { useENSAvatar } from '@/hooks';
import { isENSAddressFormat } from '@/helpers/validators';
import { ContactAvatar } from '@/components/contacts';
import Animated, { FadingTransition } from 'react-native-reanimated';
import ImageAvatar from '@/components/contacts/ImageAvatar';

type Props = { from: string; to: string };

export const TransactionDetailsFromToSection: React.FC<Props> = ({
  from,
  to,
}) => {
  const [fromName, setFromName] = useState<string>(
    formatAddressForDisplay(from) ?? ''
  );
  const [toName, setToName] = useState<string>(
    formatAddressForDisplay(to) ?? ''
  );

  const fromColor = addressHashedColorIndex(from);
  const toColor = addressHashedColorIndex(to);
  const fromEmoji = addressHashedEmoji(from);
  const toEmoji = addressHashedEmoji(to);

  const { data: fromAvatar } = useENSAvatar(fromName, {
    enabled: isENSAddressFormat(fromName),
  });
  const fromImageUrl = fromAvatar?.imageUrl;
  const { data: toAvatar } = useENSAvatar(toName, {
    enabled: isENSAddressFormat(toName),
  });
  const toImageUrl = toAvatar?.imageUrl;

  // const accountImage = profilesEnabled
  //   ? avatar?.imageUrl || existingAccount?.image
  //   : existingAccount?.image;

  useEffect(() => {
    fetchReverseRecord(from).then(name => {
      if (name) {
        setFromName(name);
      }
    });
    fetchReverseRecord(to).then(name => {
      if (name) {
        setToName(name);
      }
    });
  }, []);

  return (
    <Box paddingVertical="20px">
      <Stack space="20px">
        {from && (
          <Animated.View>
            <DoubleLineTransactionDetailsRow
              leftComponent={
                fromImageUrl ? (
                  <ImageAvatar image={fromImageUrl} size="medium" />
                ) : (
                  <ContactAvatar
                    color={fromColor}
                    size="medium"
                    value={fromEmoji}
                  />
                )
              }
              title={i18n.t(i18n.l.transaction_details.from)}
              value={fromName}
            />
          </Animated.View>
        )}
        {to && (
          <DoubleLineTransactionDetailsRow
            leftComponent={
              toImageUrl ? (
                <ImageAvatar image={toImageUrl} size="medium" />
              ) : (
                <ContactAvatar color={toColor} size="medium" value={toEmoji} />
              )
            }
            title={i18n.t(i18n.l.transaction_details.to)}
            value={toName}
          />
        )}
      </Stack>
    </Box>
  );
};
