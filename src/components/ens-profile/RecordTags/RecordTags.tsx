import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Icon } from '../../icons';
import Skeleton from '../../skeleton/Skeleton';
import { useTheme } from '@rainbow-me/context';
import {
  Bleed,
  Box,
  Inline,
  Inset,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import { useENSRecordDisplayProperties } from '@rainbow-me/hooks';

export default function RecordTags({
  firstTransactionTimestamp,
  records,
  show,
}: {
  firstTransactionTimestamp?: number;
  records: Partial<Records>;
  show: ENS_RECORDS[];
}) {
  const recordsToShow = useMemo(
    () =>
      Object.entries(records)
        .map(([key, value]) =>
          show.includes(key as ENS_RECORDS)
            ? {
                key,
                value,
              }
            : undefined
        )
        .filter(x => x) as { key: string; value: string }[],
    [records, show]
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Inset horizontal="19px">
        <Inline space="10px">
          {recordsToShow?.map(({ key: recordKey, value: recordValue }) =>
            recordValue ? (
              <RecordTag
                key={recordKey}
                recordKey={recordKey}
                recordValue={recordValue}
              />
            ) : null
          )}
          {firstTransactionTimestamp && (
            <Tag color="grey" symbol="􀉉">
              Since {format(firstTransactionTimestamp, 'MMM yyyy')}
            </Tag>
          )}
        </Inline>
      </Inset>
    </ScrollView>
  );
}

function Tag({
  color,
  children,
  icon,
  symbol,
}: {
  color: 'appleBlue' | 'grey';
  children: React.ReactNode;
  icon?: string;
  symbol?: string;
}) {
  const { colors } = useTheme();

  const gradients = {
    appleBlue: colors.gradients.transparentToAppleBlue,
    grey: colors.gradients.lightGrey,
  };

  const action = useForegroundColor('action');
  const secondary80 = useForegroundColor('secondary80');
  const iconColors = {
    appleBlue: action,
    grey: secondary80,
  } as const;

  const textColors = {
    appleBlue: 'action',
    grey: 'secondary80',
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
              <Icon
                color={iconColors[color]}
                height="16"
                name={icon}
                width="16"
              />
            </Bleed>
          )}
          <Text color={textColors[color]} size="14px" weight="bold">
            {symbol ? `${symbol} ` : ''}
            {children}
          </Text>
        </Inline>
      </Inset>
    </Box>
  );
}

function RecordTag({
  recordKey,
  recordValue,
}: {
  recordKey: string;
  recordValue: string;
}) {
  const { ContextMenuButton, icon, value } = useENSRecordDisplayProperties({
    key: recordKey,
    type: 'record',
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
        <Inset horizontal="19px">
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
  return (
    <Box
      background="body"
      borderRadius={30}
      height={{ custom: 30 }}
      width={{ custom: 140 }}
    />
  );
}
