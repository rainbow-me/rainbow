import React, { Fragment, PropsWithChildren } from 'react';
import { SheetActionButton } from '@/components/sheet';
import { IS_ANDROID } from '@/env';
import { Column } from '@/components/layout';
import { DiagnosticsItemRow } from '@/screens/Diagnostics/DiagnosticsItemRow';
import { UserCredentials } from 'react-native-keychain';
import { useTheme } from '@/theme';
import Spinner from '@/components/Spinner';
import ActivityIndicator from '@/components/ActivityIndicator';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';

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
  copyUUID: () => void;
  presentToast: () => void;
  shareAppState: () => void;
}>;

export function DiagnosticsContent({
  keys,
  oldSeed,
  onClose,
  onPinAuth,
  pinRequired,
  pkeys,
  seeds,
  userPin,
  uuid,
  copyUUID,
  shareAppState,
}: Props) {
  const { colors } = useTheme();

  return (
    <>
      <Box paddingBottom="24px" paddingTop="24px">
        <Text color="label" size="30pt" weight="heavy">
          {i18n.t(i18n.l.wallet.diagnostics.sheet_title)}
        </Text>
      </Box>

      {/* UUID access */}

      <Box paddingBottom="16px">
        <Stack space="10px">
          <Text size="20pt" weight="heavy" color="label">
            {i18n.t(i18n.l.wallet.diagnostics.uuid)}
          </Text>
          <Text size="13pt" weight="semibold" color="labelQuaternary">
            {i18n.t(i18n.l.wallet.diagnostics.uuid_description)}
          </Text>
        </Stack>
      </Box>

      <Box paddingBottom="36px" justifyContent="center" alignItems="center">
        <ButtonPressAnimation onPress={copyUUID} overflowMargin={20}>
          <Text color="label" size="20pt" weight="semibold">
            {uuid ?? i18n.t(i18n.l.wallet.diagnostics.loading)}
          </Text>
        </ButtonPressAnimation>
      </Box>

      {/* App State Diagnostics */}

      <Box paddingBottom="16px">
        <Stack space="10px">
          <Text size="20pt" weight="heavy" color="label">
            {i18n.t(i18n.l.wallet.diagnostics.app_state_diagnostics_title)}
          </Text>
          <Text size="13pt" weight="semibold" color="labelQuaternary">
            {i18n.t(i18n.l.wallet.diagnostics.app_state_diagnostics_description)}
          </Text>
        </Stack>
      </Box>
      <Box paddingBottom="36px">
        <SheetActionButton
          color={colors.appleBlue}
          label={i18n.t(i18n.l.wallet.diagnostics.share_application_state)}
          nftShadows
          onPress={shareAppState}
          weight="heavy"
        />
      </Box>

      {/* PIN Auth to reveal secrets on Android */}
      {IS_ANDROID && keys && pinRequired && !userPin && (
        <>
          <Box paddingBottom="16px">
            <Stack space="10px">
              <Text size="20pt" weight="heavy" color="label">
                {i18n.t(i18n.l.wallet.diagnostics.pin_auth_title)}
              </Text>
              <Text size="13pt" weight="semibold" color="labelQuaternary">
                {i18n.t(i18n.l.wallet.diagnostics.you_need_to_authenticate_with_your_pin)}
              </Text>
            </Stack>
          </Box>
          <Box paddingBottom="36px">
            <SheetActionButton
              color={colors.appleBlue}
              label={i18n.t(i18n.l.wallet.diagnostics.authenticate_with_pin)}
              nftShadows
              onPress={onPinAuth}
              weight="heavy"
            />
          </Box>
        </>
      )}

      {/* Details of all wallets stored in the app */}

      <Box paddingBottom="16px">
        <Text size="20pt" weight="heavy" color="label">
          {i18n.t(i18n.l.wallet.diagnostics.wallet_details_title)}
        </Text>
      </Box>
      {!keys && (
        <Box alignItems="center" justifyContent="center" width="full" height={{ custom: 300 }}>
          <Stack space="16px" alignHorizontal="center">
            <LoadingSpinner color="black" />
            <Text size="17pt" color="label" weight="semibold">
              Loading...
            </Text>
          </Stack>
        </Box>
      )}
      {seeds?.length !== undefined && seeds.length > 0 && (
        <Fragment>
          <Column>
            {seeds.map(key => (
              <DiagnosticsItemRow data={key} key={`row_${key.username}`} />
            ))}
          </Column>
        </Fragment>
      )}
      {pkeys?.length !== undefined && pkeys.length > 0 && (
        <Fragment>
          <Column>{pkeys?.map(key => <DiagnosticsItemRow data={key} key={`row_${key.username}`} />)}</Column>
        </Fragment>
      )}
      {keys?.length !== undefined && keys.length > 0 && (
        <Fragment>
          <Column>{oldSeed?.map(key => <DiagnosticsItemRow data={key} key={`row_${key.username}`} />)}</Column>
        </Fragment>
      )}
      {keys && (
        <Box paddingBottom={IS_ANDROID ? '44px' : '16px'}>
          <SheetActionButton
            color={colors.alpha(colors.appleBlue, 0.06)}
            isTransparent
            label={i18n.t(i18n.l.button.got_it)}
            onPress={onClose}
            size="big"
            style={{ margin: 0, padding: 0 }}
            textColor={colors.appleBlue}
            weight="heavy"
          />
        </Box>
      )}
    </>
  );
}
