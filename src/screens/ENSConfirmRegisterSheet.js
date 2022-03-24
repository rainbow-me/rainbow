import { useFocusEffect, useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { useRecoilState } from 'recoil';
import brain from '../assets/brain.png';
import ActivityIndicator from '../components/ActivityIndicator';
import Spinner from '../components/Spinner';
import { ButtonPressAnimation } from '../components/animations';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RegistrationReviewRows } from '../components/ens-registration';
import { GasSpeedButton } from '../components/gas';
import { SheetActionButtonRow, SlackSheet } from '../components/sheet';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Divider,
  Heading,
  Inline,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { fetchReverseRecord } from '@rainbow-me/handlers/ens';
import {
  accentColorAtom,
  ENS_DOMAIN,
  REGISTRATION_STEPS,
} from '@rainbow-me/helpers/ens';
import {
  useAccountSettings,
  useENSRegistration,
  useENSRegistrationActionHandler,
  useENSRegistrationCosts,
  useENSRegistrationForm,
  useENSSearch,
  useGas,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { colors } from '@rainbow-me/styles';

export const ENSConfirmRegisterSheetHeight = 600;
export const ENSConfirmUpdateSheetHeight = 600;
const avatarSize = 70;

const LoadingSpinner = android ? Spinner : ActivityIndicator;

function CommitContent({ registrationCostsData, setDuration, duration }) {
  return (
    <Inset horizontal="30px">
      <Stack space="34px">
        <Inline
          alignHorizontal="center"
          alignVertical="center"
          space="6px"
          wrap={false}
        >
          <Box>
            <ImgixImage source={brain} style={{ height: 20, width: 20 }} />
          </Box>
          <Text color="secondary50" size="14px" weight="heavy">
            {lang.t('profiles.confirm.suggestion')}
          </Text>
        </Inline>
        <RegistrationReviewRows
          duration={duration}
          estimatedCostETH={
            registrationCostsData?.estimatedTotalRegistrationCost?.eth
          }
          maxDuration={99}
          networkFee={registrationCostsData?.estimatedNetworkFee?.display}
          onChangeDuration={setDuration}
          registrationFee={
            registrationCostsData?.estimatedRentPrice?.total?.display
          }
          totalCost={
            registrationCostsData?.estimatedTotalRegistrationCost?.display
          }
        />
        <Divider color="divider40" />
      </Stack>
    </Inset>
  );
}

function RegisterContent({
  setSendReverseRecord,
  accentColor,
  sendReverseRecord,
}) {
  return (
    <Inset horizontal="30px">
      <Columns>
        <Column width="2/3">
          <Text
            color="secondary80"
            lineHeight="loose"
            size="16px"
            weight="bold"
          >
            {lang.t('profiles.confirm.set_ens_name')} 􀅵
          </Text>
        </Column>
        <Column width="1/3">
          <Box alignItems="flex-end">
            <Switch
              onValueChange={() =>
                setSendReverseRecord(sendReverseRecord => !sendReverseRecord)
              }
              trackColor={{ false: colors.white, true: accentColor }}
              value={sendReverseRecord}
            />
          </Box>
        </Column>
      </Columns>
    </Inset>
  );
}

function WaitCommitmentConfirmationContent({ accentColor, action }) {
  return (
    <Box alignItems="center" height="full">
      <LoadingSpinner />
      <ButtonPressAnimation onPress={() => action(accentColor)}>
        <Text
          color={{ custom: accentColor }}
          containsEmoji
          size="16px"
          weight="heavy"
        >
          🚀 Speed Up
        </Text>
      </ButtonPressAnimation>
    </Box>
  );
}

function TransactionActionRow({
  action,
  accentColor,
  label,
  isValidGas,
  isSufficientGas,
}) {
  const insufficientEth = !isSufficientGas && isValidGas;
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
  const { accountAddress } = useAccountSettings();
  const {
    gasFeeParamsBySpeed,
    updateTxFee,
    startPollingGasFees,
    isSufficientGas,
    isValidGas,
  } = useGas();
  const {
    images: { avatarUrl: initialAvatarUrl },
    name: ensName,
    mode,
  } = useENSRegistration();
  const [accentColor] = useRecoilState(accentColorAtom);

  const [duration, setDuration] = useState(1);
  const [gasLimit, setGasLimit] = useState(null);
  const [sendReverseRecord, setSendReverseRecord] = useState(true);
  const { step, stepGasLimit, action } = useENSRegistrationActionHandler({
    sendReverseRecord,
    yearsDuration: duration,
  });

  const { blurFields, values } = useENSRegistrationForm();
  const avatarUrl = initialAvatarUrl || values.avatar;

  const name = ensName.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSSearch({
    name,
  });

  const { data: registrationCostsData } = useENSRegistrationCosts({
    duration,
    name,
    records: values,
    rentPrice: registrationData?.rentPrice,
    sendReverseRecord,
  });

  const boxStyle = useMemo(
    () => ({
      height: params.longFormHeight || ENSConfirmRegisterSheetHeight,
    }),
    [params.longFormHeight]
  );

  const stepLabel = useMemo(() => {
    if (mode === 'edit') return lang.t('profiles.confirm.confirm_update');
    if (step === REGISTRATION_STEPS.COMMIT)
      return lang.t('profiles.confirm.registration_details');
    if (step === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION)
      return lang.t('profiles.confirm.requesting_register');
    if (step === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT)
      return lang.t('profiles.confirm.reserving_name');
    if (step === REGISTRATION_STEPS.REGISTER)
      return lang.t('profiles.confirm.confirm_registration');
  }, [mode, step]);

  const isSufficientGasForStep = useMemo(
    () => stepGasLimit && isSufficientGas && isValidGas,
    [isSufficientGas, stepGasLimit, isValidGas]
  );

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
          setSendReverseRecord={setSendReverseRecord}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <Inset horizontal="30px">
          <Text>TODO</Text>
        </Inset>
      ),
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: (
        <WaitCommitmentConfirmationContent
          accentColor={accentColor}
          action={action}
        />
      ),
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: (
        <Box alignItems="center">
          <LoadingSpinner />
        </Box>
      ),
    }),
    [accentColor, action, duration, registrationCostsData, sendReverseRecord]
  );

  const stepActions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          isSufficientGas={
            registrationCostsData?.isSufficientGasForRegistration &&
            isSufficientGasForStep
          }
          isValidGas={
            isValidGas &&
            Boolean(gasLimit) &&
            Boolean(registrationCostsData?.isSufficientGasForRegistration)
          }
          label={lang.t('profiles.confirm.start_registration')}
        />
      ),
      [REGISTRATION_STEPS.REGISTER]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          isSufficientGas={isSufficientGasForStep}
          isValidGas={isValidGas && Boolean(gasLimit)}
          label={lang.t('profiles.confirm.confirm_registration')}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          isSufficientGas={isSufficientGasForStep}
          isValidGas={isValidGas && Boolean(gasLimit)}
          label={lang.t('profiles.confirm.confirm_update')}
        />
      ),
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    [
      accentColor,
      action,
      gasLimit,
      isSufficientGasForStep,
      isValidGas,
      registrationCostsData?.isSufficientGasForRegistration,
    ]
  );

  // Update gas limit
  useEffect(() => {
    if (
      stepGasLimit &&
      !isEmpty(gasFeeParamsBySpeed) &&
      gasLimit !== stepGasLimit
    ) {
      updateTxFee(stepGasLimit);
      setGasLimit(stepGasLimit);
    }
  }, [gasFeeParamsBySpeed, gasLimit, stepGasLimit, updateTxFee]);

  useEffect(() => {
    if (
      step === REGISTRATION_STEPS.COMMIT ||
      step === REGISTRATION_STEPS.REGISTER ||
      step === REGISTRATION_STEPS.EDIT
    )
      startPollingGasFees();
  }, [startPollingGasFees, step]);

  useEffect(() => {
    // if reverse record is set, we don't want to send the reverse record tx by default
    const getReverseRecord = async () => {
      const reverseRecord = await fetchReverseRecord(accountAddress);
      if (reverseRecord) setSendReverseRecord(false);
    };
    getReverseRecord();
  }, [accountAddress]);

  useFocusEffect(() => {
    blurFields();
  });

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={params.longFormHeight || ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <AccentColorProvider color={accentColor}>
        <Box background="body" paddingVertical="30px" style={boxStyle}>
          <Rows>
            <Row height="content">
              <Box horizontal="30px">
                <Stack alignHorizontal="center" space="15px">
                  {avatarUrl && (
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
                  )}
                  <Heading size="26px">{ensName}</Heading>
                  <Text color="accent" weight="heavy">
                    {stepLabel}
                  </Text>
                </Stack>
                <Inset vertical="24px">
                  <Divider color="divider40" />
                </Inset>
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
