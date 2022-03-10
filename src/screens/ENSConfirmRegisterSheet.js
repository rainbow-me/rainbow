import { useFocusEffect, useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { useRecoilState } from 'recoil';
import brain from '../assets/brain.png';
import ActivityIndicator from '../components/ActivityIndicator';
import Spinner from '../components/Spinner';
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
  usePrevious,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { colors } from '@rainbow-me/styles';

export const ENSConfirmRegisterSheetHeight = 600;
export const ENSConfirmUpdateSheetHeight = 600;
const avatarSize = 70;

const LoadingSpinner = android ? Spinner : ActivityIndicator;

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

function TransactionActionRow({ action, accentColor, label, disabled }) {
  return (
    <Box>
      <Box>
        <SheetActionButtonRow paddingBottom={5}>
          <HoldToAuthorizeButton
            color={accentColor}
            disabled={disabled}
            hideInnerBorder
            isLongPressAvailableForBiometryType
            label={label}
            onLongPress={action}
            parentHorizontalPadding={19}
            showBiometryIcon
          />
        </SheetActionButtonRow>
      </Box>
      <Box alignItems="center" justifyContent="center">
        <GasSpeedButton
          borderColor={accentColor}
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
  const { gasFeeParamsBySpeed, updateTxFee, startPollingGasFees } = useGas();
  const {
    images: { avatarUrl: initialAvatarUrl },
    name: ensName,
    mode,
  } = useENSRegistration();
  const [accentColor] = useRecoilState(accentColorAtom);

  const [duration, setDuration] = useState(1);
  const [sendReverseRecord, setSendReverseRecord] = useState(true);
  const { step, stepGasLimit, action } = useENSRegistrationActionHandler({
    sendReverseRecord,
    yearsDuration: duration,
  });
  const prevStepGasLimit = usePrevious(stepGasLimit);

  const { blurFields, values } = useENSRegistrationForm();
  const avatarUrl = initialAvatarUrl || values.avatar;

  const name = ensName.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSSearch({
    name,
  });
  const rentPrice = registrationData?.rentPrice;
  const { data: registrationCostsData } = useENSRegistrationCosts({
    duration,
    name,
    rentPrice,
    sendReverseRecord,
  });

  const updateGasLimit = useCallback(async () => {
    updateTxFee(stepGasLimit);
  }, [stepGasLimit, updateTxFee]);

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

  const stepContent = useMemo(
    () => ({
      [REGISTRATION_STEPS.REGISTER]: (
        <RegisterContent
          accentColor={accentColor}
          sendReverseRecord={sendReverseRecord}
          setSendReverseRecord={setSendReverseRecord}
        />
      ),
      [REGISTRATION_STEPS.COMMIT]: (
        <CommitContent
          duration={duration}
          registrationCostsData={registrationCostsData}
          setDuration={setDuration}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <Inset horizontal="30px">
          <Divider color="divider40" />
          <Text color="secondary50" size="14px" weight="heavy">
            TODO
          </Text>
        </Inset>
      ),
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: (
        <Box alignItems="center">
          <LoadingSpinner />
        </Box>
      ),
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: (
        <Box alignItems="center">
          <LoadingSpinner />
        </Box>
      ),
    }),
    [accentColor, duration, registrationCostsData, sendReverseRecord]
  );

  const stepActions = useMemo(
    () => ({
      [REGISTRATION_STEPS.COMMIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          disabled={!stepGasLimit}
          label={lang.t('profiles.confirm.start_registration')}
        />
      ),
      [REGISTRATION_STEPS.REGISTER]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          disabled={!stepGasLimit}
          label={lang.t('profiles.confirm.confirm_registration')}
        />
      ),
      [REGISTRATION_STEPS.EDIT]: (
        <TransactionActionRow
          accentColor={accentColor}
          action={action}
          disabled={!stepGasLimit}
          label={lang.t('profiles.confirm.confirm_update')}
        />
      ),
      [REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION]: null,
      [REGISTRATION_STEPS.WAIT_ENS_COMMITMENT]: null,
    }),
    [accentColor, action, stepGasLimit]
  );

  // Update gas limit
  useEffect(() => {
    if (
      (stepGasLimit && !isEmpty(gasFeeParamsBySpeed)) ||
      prevStepGasLimit !== stepGasLimit
    ) {
      updateGasLimit();
    }
  }, [
    gasFeeParamsBySpeed,
    prevStepGasLimit,
    stepGasLimit,
    updateGasLimit,
    updateTxFee,
  ]);

  useEffect(() => startPollingGasFees(), [startPollingGasFees]);

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
