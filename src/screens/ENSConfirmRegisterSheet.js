import { useFocusEffect, useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useRecoilState } from 'recoil';
import { HoldToAuthorizeButton } from '../components/buttons';
import {
  CommitContent,
  RegisterContent,
  RenewContent,
  WaitCommitmentConfirmationContent,
  WaitENSConfirmationContent,
} from '../components/ens-registration';
import { GasSpeedButton } from '../components/gas';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import {
  AccentColorProvider,
  Box,
  Heading,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  accentColorAtom,
  ENS_DOMAIN,
  REGISTRATION_MODES,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import {
  useENSRegistration,
  useENSRegistrationActionHandler,
  useENSRegistrationCosts,
  useENSRegistrationForm,
  useENSRegistrationStepHandler,
  useENSSearch,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export const ENSConfirmRegisterSheetHeight = 600;
export const ENSConfirmRenewSheetHeight = 500;
export const ENSConfirmUpdateSheetHeight = 400;
const avatarSize = 60;

function TransactionActionRow({
  action,
  accentColor,
  label,
  isValidGas,
  isSufficientGas,
  testID,
}) {
  const insufficientEth = isSufficientGas === false && isValidGas;
  return (
    <Box>
      <Box>
        <SheetActionButtonRow paddingBottom={5}>
          <HoldToAuthorizeButton
            color={accentColor}
            disabled={!isSufficientGas || !isValidGas}
            hideInnerBorder
            isLongPressAvailableForBiometryType
            label={
              insufficientEth
                ? lang.t('profiles.confirm.insufficient_eth')
                : label
            }
            onLongPress={action}
            parentHorizontalPadding={19}
            showBiometryIcon={!insufficientEth}
            testID={`ens-transaction-action-${testID}`}
          />
        </SheetActionButtonRow>
      </Box>
      <Box alignItems="center" justifyContent="center">
        <GasSpeedButton
          asset={{ color: accentColor }}
          currentNetwork="mainnet"
          marginBottom={0}
          theme="light"
        />
      </Box>
    </Box>
  );
}

export default function ENSConfirmRegisterSheet() {
  const { params } = useRoute();
  const {
    images: { avatarUrl: initialAvatarUrl },
    name: ensName,
    mode,
  } = useENSRegistration();

  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    initialAvatarUrl || ''
  );
  useEffect(() => {
    setAccentColor(dominantColor || colors.purple);
  }, [dominantColor, setAccentColor]);

  const [duration, setDuration] = useState(1);

  const { navigate, goBack } = useNavigation();

  const { blurFields, values } = useENSRegistrationForm();
  const avatarUrl = initialAvatarUrl || values.avatar;

  const name = ensName?.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSSearch({
    name,
  });

  const [sendReverseRecord, setSendReverseRecord] = useState(false);
  const { step } = useENSRegistrationStepHandler(false);
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

  const goToProfileScreen = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      goBack();
      setTimeout(() => {
        navigate(Routes.PROFILE_SCREEN);
      }, 100);
    });
  }, [goBack, navigate]);

  const boxStyle = useMemo(
    () => ({
      height: params.longFormHeight || ENSConfirmRegisterSheetHeight,
    }),
    [params.longFormHeight]
  );

  const stepLabel = useMemo(() => {
    if (mode === REGISTRATION_MODES.EDIT)
      return lang.t('profiles.confirm.confirm_update');
    if (mode === REGISTRATION_MODES.RENEW)
      return lang.t('profiles.confirm.extend_registration');
    if (step === REGISTRATION_STEPS.COMMIT)
      return lang.t('profiles.confirm.registration_details');
    if (step === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION)
      return lang.t('profiles.confirm.requesting_register');
    if (step === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT)
      return lang.t('profiles.confirm.reserving_name');
    if (step === REGISTRATION_STEPS.REGISTER)
      return lang.t('profiles.confirm.confirm_registration');
    if (step === REGISTRATION_STEPS.SET_NAME)
      return lang.t('profiles.confirm.set_name_registration');
  }, [mode, step]);

  const stepContent = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: (
        <CommitContent
          duration={duration}
          registrationCostsData={registrationCostsData}
          setDuration={setDuration}
        />
      ),
      [REGISTRATION_STEPS.REGISTER]: (
        <RegisterContent
          accentColor={accentColor}
          sendReverseRecord={sendReverseRecord}
          setSendReverseRecord={
            registrationCostsData?.isSufficientGasForStep
              ? setSendReverseRecord
              : null
          }
        />
      ),
      [REGISTRATION_STEPS.EDIT]: null,
      [REGISTRATION_STEPS.SET_NAME]: null,
      [REGISTRATION_STEPS.RENEW]: (
        <RenewContent
          accentColor={accentColor}
          name={name}
          registrationCostsData={registrationCostsData}
          setDuration={setDuration}
          yearsDuration={duration}
        />
      ),
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: (
        <WaitCommitmentConfirmationContent
          accentColor={accentColor}
          action={action}
        />
      ),
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: <WaitENSConfirmationContent />,
    }),
    [
      accentColor,
      action,
      duration,
      name,
      registrationCostsData,
      sendReverseRecord,
    ]
  );

  const stepActions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          isSufficientGas={
            registrationCostsData?.isSufficientGasForRegistration &&
            registrationCostsData?.isSufficientGasForStep
          }
          isValidGas={
            registrationCostsData?.isValidGas &&
            Boolean(registrationCostsData?.stepGasLimit)
          }
          label={lang.t('profiles.confirm.start_registration')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.REGISTER]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={registrationCostsData?.isSufficientGasForStep}
          isValidGas={
            registrationCostsData?.isValidGas &&
            Boolean(registrationCostsData?.stepGasLimit)
          }
          label={lang.t('profiles.confirm.confirm_registration')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.RENEW]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => {
            action();
            goToProfileScreen();
          }}
          isSufficientGas={registrationCostsData?.isSufficientGasForStep}
          isValidGas={
            registrationCostsData?.isValidGas &&
            Boolean(registrationCostsData?.stepGasLimit)
          }
          label={lang.t('profiles.confirm.confirm_renew')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={registrationCostsData?.isSufficientGasForStep}
          isValidGas={
            registrationCostsData?.isValidGas &&
            Boolean(registrationCostsData?.stepGasLimit)
          }
          label={lang.t('profiles.confirm.confirm_update')}
          testID={step}
        />
      ),
      [REGISTRATION_STEPS.SET_NAME]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={() => action(goToProfileScreen)}
          isSufficientGas={registrationCostsData?.isSufficientGasForStep}
          isValidGas={
            registrationCostsData?.isValidGas &&
            Boolean(registrationCostsData?.stepGasLimit)
          }
          label={lang.t('profiles.confirm.confirm_set_name')}
          testID={step}
        />
      ),
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

  useEffect(() => {
    registrationCostsData?.hasReverseRecord !== undefined &&
      setSendReverseRecord(!registrationCostsData?.hasReverseRecord);
  }, [registrationCostsData?.hasReverseRecord]);

  useFocusEffect(
    useCallback(() => {
      blurFields();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
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
          background="body"
          paddingTop="19px"
          paddingVertical="30px"
          style={boxStyle}
          testID="ens-confirm-register-sheet"
        >
          <Rows>
            <Row height="content">
              <Box horizontal="30px">
                <Stack alignHorizontal="center" space="15px">
                  {avatarUrl && (
                    <AccentColorProvider color={accentColor + '10'}>
                      <Box
                        background="accent"
                        borderRadius={avatarSize / 2}
                        height={{ custom: avatarSize }}
                        shadow="12px heavy accent"
                        width={{ custom: avatarSize }}
                      >
                        <Box
                          as={ImgixImage}
                          borderRadius={avatarSize / 2}
                          height={{ custom: avatarSize }}
                          source={{ uri: avatarUrl }}
                          width={{ custom: avatarSize }}
                        />
                      </Box>
                    </AccentColorProvider>
                  )}
                  <Heading size="26px">{ensName}</Heading>
                  <Text
                    color="accent"
                    testID={`ens-confirm-register-label-${step}`}
                    weight="heavy"
                  >
                    {stepLabel}
                  </Text>
                </Stack>
              </Box>
            </Row>
            <Row>{stepContent[step]}</Row>
            <Row height="content">{stepActions[step]}</Row>
          </Rows>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
