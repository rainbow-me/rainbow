import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';

import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Icon } from '@/components/icons';
import Skeleton from '@/components/skeleton/Skeleton';
import { Bleed, Box, Inline, Inset, Text, useForegroundColor } from '@/design-system';
import { deprecatedTextRecordFields, ENS_RECORDS } from '@/features/ens/core/records';
import * as i18n from '@/languages';
import { useTheme } from '@/theme/ThemeContext';

import type { ProfileRecords } from '../../data/stores/recordsStore';
import { useENSRecordDisplayProperties } from '../../hooks/useENSRecordDisplayProperties';

const PROFILE_TAGS = [
  ENS_RECORDS.name,
  ENS_RECORDS.displayName,
  ENS_RECORDS.url,
  ENS_RECORDS.twitter,
  ENS_RECORDS.email,
  ENS_RECORDS.instagram,
  ENS_RECORDS.discord,
  ENS_RECORDS.github,
  ENS_RECORDS.BTC,
  ENS_RECORDS.snapchat,
  ENS_RECORDS.telegram,
  ENS_RECORDS.reddit,
  ENS_RECORDS.notice,
  ENS_RECORDS.keywords,
  ENS_RECORDS.LTC,
  ENS_RECORDS.DOGE,
];

export function RecordTags({ firstTransactionTimestamp, profile }: { firstTransactionTimestamp?: number | null; profile: ProfileRecords }) {
  const tags = useMemo(() => {
    return PROFILE_TAGS.map(key => {
      const value = profile.coinAddresses[key] ?? profile.records[key];
      const replacement = deprecatedTextRecordFields[key];
      if (!value || (replacement && profile.records[replacement])) return null;
      return <RecordTag key={key} recordKey={key} recordValue={value} type={getRecordType(key)} />;
    });
  }, [profile]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Inset horizontal="19px (Deprecated)">
        <Inline space="10px">
          {tags}
          {firstTransactionTimestamp && (
            <Tag color="grey" symbol="􀉉">
              {`${i18n.t(i18n.l.profiles.records.since)} ${format(firstTransactionTimestamp, 'MMM yyyy')}`}
            </Tag>
          )}
        </Inline>
      </Inset>
    </ScrollView>
  );
}

function getRecordType(recordKey: ENS_RECORDS) {
  switch (recordKey) {
    case ENS_RECORDS.BTC:
    case ENS_RECORDS.LTC:
    case ENS_RECORDS.DOGE:
    case ENS_RECORDS.ETH:
      return 'address';
    default:
      return 'record';
  }
}

function Tag({ children, color, icon, symbol }: { children: string; color: 'appleBlue' | 'grey'; icon?: string; symbol?: string }) {
  const { colors } = useTheme();
  const textColor = color === 'appleBlue' ? 'action (Deprecated)' : 'secondary80 (Deprecated)';
  const iconColor = useForegroundColor(textColor);
  const gradient = color === 'appleBlue' ? colors.gradients.transparentToAppleBlue : colors.gradients.lightGreyTransparent;

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={46}
      colors={gradient}
      end={{ x: 1, y: 0 }}
      height="30px"
      justifyContent="center"
      start={{ x: 0, y: 0 }}
    >
      <Inset horizontal="10px">
        <Inline alignVertical="center" space="6px">
          {icon && (
            <Bleed vertical="2px">
              <Icon color={iconColor} height="17" name={icon} width="17" />
            </Bleed>
          )}
          <Text align="center" color={textColor} containsEmoji size="14px / 19px (Deprecated)" weight="bold">
            {symbol ? `${symbol} ` : ''}
            {children}
          </Text>
        </Inline>
      </Inset>
    </Box>
  );
}

function RecordTag({ recordKey, recordValue, type }: { recordKey: string; recordValue: string; type: 'address' | 'record' }) {
  const { ContextMenuButton, icon, value } = useENSRecordDisplayProperties({
    key: recordKey,
    type,
    value: recordValue,
  });
  return (
    <ContextMenuButton>
      <ButtonPressAnimation>
        <Tag color="appleBlue" icon={icon}>
          {value}
        </Tag>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
}

export function Placeholder() {
  return (
    <Box height={{ custom: 30 }}>
      <Skeleton animated>
        <Inset horizontal="19px (Deprecated)">
          <Inline space="8px" wrap={false}>
            <PlaceholderItem />
            <PlaceholderItem />
            <PlaceholderItem />
            <PlaceholderItem />
          </Inline>
        </Inset>
      </Skeleton>
    </Box>
  );
}

function PlaceholderItem() {
  return <Box background="body (Deprecated)" borderRadius={30} height={{ custom: 30 }} width={{ custom: 140 }} />;
}
