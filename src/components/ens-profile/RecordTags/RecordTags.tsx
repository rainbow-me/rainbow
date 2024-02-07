import { format } from 'date-fns';
import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Icon } from '../../icons';
import Skeleton from '../../skeleton/Skeleton';
import { Bleed, Box, Inline, Inset, selectTextSizes, Text, useForegroundColor } from '@/design-system';
import { Records } from '@/entities';
import { deprecatedTextRecordFields, ENS_RECORDS } from '@/helpers/ens';
import { useENSRecordDisplayProperties } from '@/hooks';
import { useTheme } from '@/theme';

const getRecordType = (recordKey: string) => {
  switch (recordKey) {
    case ENS_RECORDS.BTC:
    case ENS_RECORDS.LTC:
    case ENS_RECORDS.DOGE:
    case ENS_RECORDS.ETH:
      return 'address';
    default:
      return 'record';
  }
};
export default function RecordTags({
  firstTransactionTimestamp,
  records,
  show,
}: {
  firstTransactionTimestamp?: number | null;
  records: Partial<Records>;
  show: ENS_RECORDS[];
}) {
  const recordsToShow = useMemo(
    () =>
      show
        .map(key => {
          // If a deprecated record exists with it's updated counterpart
          // (e.g. `me.rainbow.displayName` & `name` exists) then omit
          // the deprecated record.
          if (deprecatedTextRecordFields[key] && records[deprecatedTextRecordFields[key]]) return null;
          return {
            key,
            type: getRecordType(key),
            value: records[key],
          };
        })
        .filter(Boolean) as {
        key: string;
        value: string;
        type: 'address' | 'record';
      }[],
    [records, show]
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Inset horizontal="19px (Deprecated)">
        <Inline space="10px">
          {recordsToShow?.map(({ key: recordKey, value: recordValue, type }) =>
            recordValue ? <RecordTag key={recordKey} recordKey={recordKey} recordValue={recordValue} type={type} /> : null
          )}
          {firstTransactionTimestamp && (
            <Tag color="grey" symbol="􀉉">
              {`${lang.t(`profiles.records.since`)} ${format(firstTransactionTimestamp, 'MMM yyyy')}`}
            </Tag>
          )}
        </Inline>
      </Inset>
    </ScrollView>
  );
}

const tagSizes = selectTextSizes('14px / 19px (Deprecated)', '16px / 22px (Deprecated)');

type TagSize = (typeof tagSizes)[number];

function Tag({
  children,
  color,
  icon,
  size = '14px / 19px (Deprecated)',
  symbol,
}: {
  children: React.ReactNode;
  color: 'appleBlue' | 'grey';
  icon?: string;
  size?: TagSize;
  symbol?: string;
}) {
  const { colors } = useTheme();

  const gradients = {
    appleBlue: colors.gradients.transparentToAppleBlue,
    grey: colors.gradients.lightGreyTransparent,
  };

  const action = useForegroundColor('action (Deprecated)');
  const secondary80 = useForegroundColor('secondary80 (Deprecated)');
  const iconColors = {
    appleBlue: action,
    grey: secondary80,
  } as const;

  const textColors = {
    appleBlue: 'action (Deprecated)',
    grey: 'secondary80 (Deprecated)',
  } as const;

  return (
    <Box
      alignItems="center"
      as={LinearGradient}
      borderRadius={46}
      colors={gradients[color]}
      end={{ x: 1, y: 0 }}
      height="30px"
      justifyContent="center"
      start={{ x: 0, y: 0 }}
    >
      <Inset horizontal="10px">
        <Inline alignVertical="center" space="6px">
          {icon && (
            <Bleed vertical="2px">
              <Icon color={iconColors[color]} height="17" name={icon} width="17" />
            </Bleed>
          )}
          <Text align="center" color={textColors[color]} containsEmoji size={size} weight="bold">
            {symbol ? `${symbol} ` : ''}
            {children as string}
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

export function PlaceholderItem() {
  return <Box background="body (Deprecated)" borderRadius={30} height={{ custom: 30 }} width={{ custom: 140 }} />;
}
