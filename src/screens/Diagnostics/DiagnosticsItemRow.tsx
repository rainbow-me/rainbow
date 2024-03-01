import { useTheme } from '@/theme';
import { useImportingWallet } from '@/hooks';
import React, { useCallback } from 'react';
import { WrappedAlert as Alert } from '@/helpers/alert';
import lang from 'i18n-js';
import { logger, RainbowError } from '@/logger';
import { ColumnWithMargins, RowWithMargins } from '@/components/layout';
import { Bold, Text } from '@/components/text';
import { ButtonPressAnimation } from '@/components/animations';
import { View } from 'react-native';
import Divider from '@/components/Divider';
import { DiagnosticsSecretInput } from '@/screens/Diagnostics/DiagnosticsSecretInput';

export const DiagnosticsItemRow = ({ data }: any) => {
  const { colors } = useTheme();
  const { busy, handleSetSeedPhrase, handlePressImportButton } = useImportingWallet();

  const handlePressRestore = useCallback(async () => {
    if (busy) return;
    Alert.alert(
      lang.t('wallet.diagnostics.restore.heads_up_title'),
      lang.t('wallet.diagnostics.restore.this_action_will_completely_replace'),
      [
        {
          onPress: async () => {
            try {
              handleSetSeedPhrase(data.secret);
              // @ts-expect-error poorly typed function
              await handlePressImportButton(null, data.secret);
            } catch (error) {
              logger.error(new RainbowError('Error restoring from wallet diagnostics'), {
                message: (error as Error).message,
                context: 'restore',
              });
            }
          },
          text: lang.t('wallet.diagnostics.restore.yes_i_understand'),
        },
        {
          style: 'cancel',
          text: lang.t('button.cancel'),
        },
      ]
    );
  }, [busy, data.secret, handlePressImportButton, handleSetSeedPhrase]);

  if (data.pinRequired) {
    return (
      <ColumnWithMargins key={`key_${data.username}`}>
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>{lang.t('wallet.diagnostics.restore.key')}:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.username}</Text>
          </Text>
        </RowWithMargins>
      </ColumnWithMargins>
    );
  }

  return (
    <ColumnWithMargins key={`key_${data.username}`}>
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>{lang.t('wallet.diagnostics.restore.type')}:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.type}</Text>
        </Text>
      </RowWithMargins>
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>{lang.t('wallet.diagnostics.restore.key')}:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.username}</Text>
        </Text>
      </RowWithMargins>
      {data.createdAt && (
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>{lang.t('wallet.diagnostics.restore.created_at')}:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.createdAt}</Text>
          </Text>
        </RowWithMargins>
      )}
      {data.label && (
        <RowWithMargins>
          <Text size="lmedium">
            <Bold>{lang.t('wallet.diagnostics.restore.label')}:</Bold> {` `}
            <Text color={colors.blueGreyDark50}>{data.label}</Text>
          </Text>
        </RowWithMargins>
      )}
      <RowWithMargins>
        <Text size="lmedium">
          <Bold>{lang.t('wallet.diagnostics.restore.address')}:</Bold> {` `}
          <Text color={colors.blueGreyDark50}>{data.address}</Text>
        </Text>
      </RowWithMargins>
      <Text size="lmedium">
        <Bold>{lang.t('wallet.diagnostics.restore.secret')}:</Bold> {` `}
      </Text>
      <RowWithMargins>
        <DiagnosticsSecretInput color={colors.blueGreyDark} value={data.secret} />
      </RowWithMargins>
      <ButtonPressAnimation onPress={handlePressRestore}>
        <View
          style={{
            paddingHorizontal: 15,
            paddingVertical: 10,
            backgroundColor: colors.dpiMid,
            borderRadius: 15,
          }}
        >
          <Text align="center" color={colors.whiteLabel} weight="bold">
            {lang.t('wallet.diagnostics.restore.restore')}
          </Text>
        </View>
      </ButtonPressAnimation>
      {/* @ts-expect-error JS component */}
      <Divider />
    </ColumnWithMargins>
  );
};
