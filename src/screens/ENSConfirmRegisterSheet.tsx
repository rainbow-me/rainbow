import { useFocusEffect, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import * as DeviceInfo from 'react-native-device-info';
import { useRecoilState, useRecoilValue } from 'recoil';
import { HoldToAuthorizeButton } from '../components/buttons';
import {
  CommitContent,
  EditContent,
  RegisterContent,
  RenewContent,
  WaitCommitmentConfirmationContent,
  WaitENSConfirmationContent,
} from '../components/ens-registration';
import { avatarMetadataAtom } from '../components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { GasSpeedButton } from '../components/gas';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { AccentColorProvider, Box, Heading, Inset, Row, Rows, Stack, Text } from '@/design-system';
import { accentColorAtom, ENS_DOMAIN, ENS_SECONDS_WAIT, REGISTRATION_MODES, REGISTRATION_STEPS } from '@/helpers/ens';
import {
  useAccountProfile,
  useDimensions,
  useENSModifiedRegistration,
  useENSRegistration,
  useENSRegistrationActionHandler,
  useENSRegistrationCosts,
  useENSRegistrationForm,
  useENSRegistrationStepHandler,
  useENSSearch,
  useWallets,
} from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';

export const ENSConfirmRegisterSheetHeight = 600;
export const ENSConfirmRenewSheetHeight = 560;
export const ENSConfirmUpdateSheetHeight = 290;
const avatarSize = 60;

function TransactionActionRow({
  action,
  accentColor,
  label,
  isValidGas,
  isSufficientGas,
  testID,
}: {
  action: any;
  accentColor?: string;
  label: string;
  isValidGas: boolean;
  isSufficientGas: boolean;
  testID: string;
}) {
  const insufficientEth = isSufficientGas === false && isValidGas;
  return (
    <>
      <Box>
        {/* @ts-expect-error JavaScript component */}
        <SheetActionButtonRow paddingBottom={5}>
          {/* @ts-expect-error JavaScript component */}
          <HoldToAuthorizeButton
            backgroundColor={accentColor ?? ''}
            disabled={!isSufficientGas || !isValidGas}
            hideInnerBorder
            label={insufficientEth ? lang.t('profiles.confirm.insufficient_eth') : label}
            onLongPress={action}
            parentHorizontalPadding={19}
            showBiometryIcon={!insufficientEth}
            testID={`ens-transaction-action-${testID}`}
          />
        </SheetActionButtonRow>
      </Box>
      <Box alignItems="center" justifyContent="center">
        {/* @ts-expect-error JavaScript component */}
        <GasSpeedButton
          asset={{ color: accentColor }}
          currentNetwork="mainnet"
          marginBottom={DeviceInfo.hasNotch() ? 0 : undefined}
          theme="light"
        />
      </Box>
    </>
  );
}

export default function ENSConfirmRegisterSheet() {
  const { params } = useRoute<any>();
  const { name: ensName, mode } = useENSRegistration();
  const {
    changedRecords,
    images: { avatarUrl: initialAvatarUrl },
  } = useENSModifiedRegistration();
  const { isSmallPhone } = useDimensions();

  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);
  const avatarMetadata = useRecoilValue(avatarMetadataAtom);

  const avatarImage = avatarMetadata?.path || initialAvatarUrl || params?.externalAvatarUrl || '';
  const dominantColor = usePersistentDominantColorFromImage(avatarImage);

  useEffect(() => {
    if (dominantColor || (!dominantColor && !avatarImage)) {
      setAccentColor(dominantColor || colors.purple);
    }
  }, [avatarImage, dominantColor, setAccentColor]);

  const [duration, setDuration] = useState(1);

  const { navigate, goBack } = useNavigation();

  const { blurFields, values } = useENSRegistrationForm();
  const accountProfile = useAccountProfile();

  const avatarUrl = initialAvatarUrl || values.avatar;

  const name = ensName?.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSSearch({
    name,
  });

  const [sendReverseRecord, setSendReverseRecord] = useState(
    accountProfile.accountENS !== ensName && (!isEmpty(changedRecords) || mode === REGISTRATION_MODES.EDIT)
  );
  const { step, secondsSinceCommitConfirmed } = useENSRegistrationStepHandler(false);
  const { action } = useENSRegistrationActionHandler({
    sendReverseRecord,
    step,
    yearsDuration: duration,
  });

  const { data: registrationCostsData } = useENSRegistrationCosts({
    name: ensName,
    rentPrice: registrationData?.rentPrice,
    sendReverseRecord,
    step,
    yearsDuration: duration,
  });
  const { clearCurrentRegistrationName } = useENSRegistration();

  const goToProfileScreen = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      goBack();
      setTimeout(() => {
        navigate(Routes.PROFILE_SCREEN);
      }, 100);

      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          handleReviewPromptAction(ReviewPromptAction.EnsNameRegistration);
        });
      }, 500);
    });
  }, [goBack, navigate]);

  const stepLabel = useMemo(() => {
    if (mode === REGISTRATION_MODES.EDIT) return lang.t('profiles.confirm.confirm_updates');
    if (mode === REGISTRATION_MODES.RENEW) return lang.t('profiles.confirm.extend_registration');
    if (step === REGISTRATION_STEPS.COMMIT) return lang.t('profiles.confirm.registration_details');
    if (step === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) return lang.t('profiles.confirm.requesting_register');
    if (step === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT) return lang.t('profiles.confirm.reserving_name');
    if (step === REGISTRATION_STEPS.REGISTER) return lang.t('profiles.confirm.confirm_registration');
    if (step === REGISTRATION_STEPS.SET_NAME) return lang.t('profiles.confirm.set_name_registration');
  }, [mode, step]);

  const onMountSecondsSinceCommitConfirmed = useMemo(
    () => secondsSinceCommitConfirmed,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const stepContent = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: (
        <CommitContent duration={duration} registrationCostsData={registrationCostsData} setDuration={setDuration} />
      ),
      [REGISTRATION_STEPS.REGISTER]: (
        <RegisterContent
          accentColor={accentColor}
          sendReverseRecord={sendReverseRecord}
          setSendReverseRecord={registrationCostsData?.isSufficientGasForStep ? setSendReverseRecord : null}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <EditContent
          accentColor={accentColor}
          sendReverseRecord={sendReverseRecord}
          setSendReverseRecord={registrationCostsData?.isSufficientGasForStep ? setSendReverseRecord : null}
          showReverseRecordSwitch={accountProfile.accountENS !== ensName}
        />
      ),
      [REGISTRATION_STEPS.SET_NAME]: null,
      [REGISTRATION_STEPS.TRANSFER]: null,
      [REGISTRATION_STEPS.RENEW]: (
        <RenewContent name={name} registrationCostsData={registrationCostsData} setDuration={setDuration} yearsDuration={duration} />
      ),
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: (
        <WaitCommitmentConfirmationContent
          accentColor={accentColor}
          action={() => action(accentColor)}
          secondsSinceCommitConfirmed={secondsSinceCommitConfirmed}
        />
      ),
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: (
        <WaitENSConfirmationContent
          seconds={ENS_SECONDS_WAIT - (onMountSecondsSinceCommitConfirmed > 0 ? onMountSecondsSinceCommitConfirmed : 0)}
        />
      ),
    }),
    [
      duration,
      registrationCostsData,
      accentColor,
      sendReverseRecord,
      accountProfile.accountENS,
      ensName,
      name,
      secondsSinceCommitConfirmed,
      onMountSecondsSinceCommitConfirmed,
      action,
    ]
  );

  const stepActions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          isSufficientGas={Boolean(registrationCostsData?.isSufficientGasForRegistration && registrationCostsData?.isSufficientGasForStep)}
          isValidGas={Boolean(registrationCostsData?.isValidGas && registrationCostsData?.stepGasLimit)}
          label={lang.t('profiles.confirm.hold_to_begin')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.REGISTER]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={Boolean(registrationCostsData?.isSufficientGasForStep)}
          isValidGas={Boolean(registrationCostsData?.isValidGas && registrationCostsData?.stepGasLimit)}
          label={lang.t('profiles.confirm.hold_to_register')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.RENEW]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={Boolean(registrationCostsData?.isSufficientGasForRegistration && registrationCostsData?.isSufficientGasForStep)}
          isValidGas={Boolean(registrationCostsData?.isValidGas && registrationCostsData?.stepGasLimit)}
          label={lang.t('profiles.confirm.hold_to_extend')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={Boolean(registrationCostsData?.isSufficientGasForStep)}
          isValidGas={Boolean(registrationCostsData?.isValidGas && registrationCostsData?.stepGasLimit)}
          label={lang.t('profiles.confirm.hold_to_confirm')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.SET_NAME]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={Boolean(registrationCostsData?.isSufficientGasForStep)}
          isValidGas={Boolean(registrationCostsData?.isValidGas && registrationCostsData?.stepGasLimit)}
          label={lang.t('profiles.confirm.hold_to_confirm')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.TRANSFER]: null,
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    [
      accentColor,
      action,
      registrationCostsData?.isSufficientGasForRegistration,
      registrationCostsData?.isSufficientGasForStep,
      registrationCostsData?.isValidGas,
      registrationCostsData?.stepGasLimit,
      step,
      goToProfileScreen,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      Keyboard.dismiss();
      blurFields();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(
    () => () => {
      if (step === REGISTRATION_STEPS.RENEW || step === REGISTRATION_STEPS.SET_NAME) clearCurrentRegistrationName();
    },
    [clearCurrentRegistrationName, step]
  );

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={params.longFormHeight || ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <AccentColorProvider color={accentColor}>
        <Box
          background="body (Deprecated)"
          paddingTop="19px (Deprecated)"
          paddingVertical="30px (Deprecated)"
          style={{
            height: params.longFormHeight || ENSConfirmRegisterSheetHeight,
          }}
          testID="ens-confirm-register-sheet"
        >
          <Rows>
            <Row height="content">
              {/* @ts-expect-error JavaScript component */}
              <Box horizontal="30px">
                <Stack alignHorizontal="center" space="15px (Deprecated)">
                  {avatarUrl && (
                    <Box
                      background="body (Deprecated)"
                      borderRadius={avatarSize / 2}
                      height={{ custom: avatarSize }}
                      shadow="15px light (Deprecated)"
                      width={{ custom: avatarSize }}
                    >
                      <Box
                        as={ImgixImage}
                        borderRadius={avatarSize / 2}
                        height={{ custom: avatarSize }}
                        source={{ uri: avatarUrl }}
                        width={{ custom: avatarSize }}
                        size={200}
                      />
                    </Box>
                  )}
                  <Inset horizontal="30px (Deprecated)">
                    <Heading align="center" numberOfLines={1} color="primary (Deprecated)" size="26px / 30px (Deprecated)" weight="heavy">
                      {abbreviateEnsForDisplay(ensName, 15)}
                    </Heading>
                  </Inset>
                  <Text color="accent" size="16px / 22px (Deprecated)" testID={`ens-confirm-register-label-${step}`} weight="heavy">
                    {stepLabel}
                  </Text>
                </Stack>
              </Box>
            </Row>
            <Row>
              <Box flexGrow={1} paddingHorizontal={isSmallPhone ? '24px' : '30px (Deprecated)'}>
                {stepContent[step]}
              </Box>
            </Row>
          </Rows>
          <Box>{stepActions[step]}</Box>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
