import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Icon } from '../../icons';
import { useTheme } from '@rainbow-me/context';
import { Bleed, Box, Inline, Inset, Text } from '@rainbow-me/design-system';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import { useENSRecordDisplayProperties } from '@rainbow-me/hooks';

export default function RecordTags({
  records,
  show,
}: {
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
    <Bleed horizontal="19px">
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
          </Inline>
        </Inset>
      </ScrollView>
    </Bleed>
  );
}

function RecordTag({
  recordKey,
  recordValue,
}: {
  recordKey: string;
  recordValue: string;
}) {
  const { colors } = useTheme();
  const { ContextMenuButton, icon, value } = useENSRecordDisplayProperties({
    key: recordKey,
    type: 'record',
    value: recordValue,
  });
  return (
    <ContextMenuButton>
      <ButtonPressAnimation>
        <Box
          alignItems="center"
          as={LinearGradient}
          borderRadius={46}
          colors={colors.gradients.transparentToAppleBlue}
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
                    color={colors.appleBlue}
                    height="16"
                    name={icon}
                    width="16"
                  />
                </Bleed>
              )}
              <Text color="action" size="14px" weight="bold">
                {value}
              </Text>
            </Inline>
          </Inset>
        </Box>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
}
