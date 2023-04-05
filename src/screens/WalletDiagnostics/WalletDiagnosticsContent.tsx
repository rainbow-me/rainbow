import React, { Fragment, PropsWithChildren } from 'react';
import { SheetActionButton, SheetTitle } from '@/components/sheet';
import lang from 'i18n-js';
import { IS_ANDROID, IS_IOS } from '@/env';
import { Column, ColumnWithMargins, RowWithMargins } from '@/components/layout';
import { Bold, Text } from '@/components/text';
import Divider from '@/components/Divider';
import { WalletDiagnosticsItemRow } from '@/screens/WalletDiagnostics/WalletDiagnosticsItemRow';
import { UserCredentials } from 'react-native-keychain';
import { useTheme } from '@/theme';
// @ts-expect-error untyped JS library
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import { Box, Stack, Text as RDSText } from '@/design-system';

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

type Props = PropsWithChildren<{
  keys: UserCredentials[] | undefined;
  pinRequired: boolean;
  userPin: string | undefined;
  uuid: string | undefined;
  seeds: UserCredentials[] | undefined;
  pkeys: UserCredentials[] | undefined;
  oldSeed: UserCredentials[] | undefined;
  onPinAuth: () => void;
  onClose: () => void;
}>;

export function WalletDiagnosticsContent({
  keys,
  oldSeed,
  onClose,
  onPinAuth,
  pinRequired,
  pkeys,
  seeds,
  userPin,
  uuid,
}: Props) {
  const { colors } = useTheme();

  if (!keys) {
    return (
      <Box
        alignItems="center"
        justifyContent="center"
        width="full"
        height={{ custom: 300 }}
      >
        <Stack space="16px" alignHorizontal="center">
          {/* @ts-expect-error color not needed really */}
          <LoadingSpinner />
          <RDSText size="17pt" color="label" weight="semibold">
            Loading...
          </RDSText>
        </Stack>
      </Box>
    );
  } else {
    return (
      <ColumnWithMargins
        margin={15}
        style={{
          paddingBottom: IS_IOS ? 60 : 40 + getSoftMenuBarHeight(),
          paddingHorizontal: 19,
          paddingTop: 19,
          width: '100%',
        }}
      >
        {/* @ts-expect-error JS component */}
        <SheetTitle align="center" size="big" weight="heavy">
          {lang.t('wallet.diagnostics.wallet_diagnostics_title')}
        </SheetTitle>

        {IS_ANDROID && keys && pinRequired && !userPin && (
          <ColumnWithMargins>
            <Text align="center">
              {lang.t(
                'wallet.diagnostics.you_need_to_authenticate_with_your_pin'
              )}
            </Text>
            <SheetActionButton
              color={colors.alpha(colors.green, 0.06)}
              isTransparent
              label={lang.t('wallet.diagnostics.authenticate_with_pin')}
              onPress={onPinAuth}
              size="big"
              style={{ margin: 0, padding: 0 }}
              textColor={colors.green}
              weight="heavy"
            />
          </ColumnWithMargins>
        )}

        {uuid && (
          <Fragment>
            <ColumnWithMargins>
              <RowWithMargins>
                <Text size="lmedium">
                  <Bold>{lang.t('wallet.diagnostics.uuid')}:</Bold> {` `}
                  <Text color={colors.blueGreyDark50}>{uuid}</Text>
                </Text>
              </RowWithMargins>
            </ColumnWithMargins>
            {/* @ts-expect-error JS component */}
            <Divider />
          </Fragment>
        )}

        {seeds?.length !== undefined && seeds.length > 0 && (
          <Fragment>
            <Column>
              {seeds.map(key => (
                <WalletDiagnosticsItemRow
                  data={key}
                  key={`row_${key.username}`}
                />
              ))}
            </Column>
          </Fragment>
        )}

        {pkeys?.length !== undefined && pkeys.length > 0 && (
          <Fragment>
            <Column>
              {pkeys?.map(key => (
                <WalletDiagnosticsItemRow
                  data={key}
                  key={`row_${key.username}`}
                />
              ))}
            </Column>
          </Fragment>
        )}

        {keys?.length !== undefined && keys.length > 0 && (
          <Fragment>
            <Column>
              {oldSeed?.map(key => (
                <WalletDiagnosticsItemRow
                  data={key}
                  key={`row_${key.username}`}
                />
              ))}
            </Column>
          </Fragment>
        )}

        {keys && (
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            label={lang.t('button.got_it')}
            onPress={onClose}
            size="big"
            style={{ margin: 0, padding: 0 }}
            textColor={colors.appleBlue}
            weight="heavy"
          />
        )}
      </ColumnWithMargins>
    );
  }
}
