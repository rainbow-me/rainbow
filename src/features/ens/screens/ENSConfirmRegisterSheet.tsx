import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { InteractionManager, Keyboard } from 'react-native';

import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import * as DeviceInfo from 'react-native-device-info';
import { useRecoilState } from 'recoil';

import { HoldToAuthorizeButton } from '@/components/buttons';
import { ImgixImage } from '@/components/images';
import { SheetActionButtonRow, SlackSheet } from '@/components/sheet';
import { AccentColorProvider, Box, Heading, Inset, Row, Rows, Stack, Text } from '@/design-system';
import { abbreviateName } from '@/features/address/core/formatAddress';
import { REGISTRATION_MODES, REGISTRATION_STEPS } from '@/features/ens/types/registration';
import { GasSpeedButton } from '@/features/gas/components/GasSpeedButton';
import { ChainId, Network } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import useDimensions from '@/hooks/useDimensions';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import timeUnits from '@/references/time-units.json';
import { NFTS_PAGE_SIZE } from '@/state/nfts/constants';
import { useNftsStore } from '@/state/nfts/nfts';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { ReviewPromptAction } from '@/storage/schema';
import { colors } from '@/styles';
import { handleReviewPromptAction } from '@/utils/reviewAlert';

import { CommitContent } from '../components/registration/CommitContent';
import { EditContent } from '../components/registration/EditContent';
import { RegisterContent } from '../components/registration/RegisterContent';
import { RenewContent } from '../components/registration/RenewContent';
import { WaitCommitmentConfirmationContent } from '../components/registration/WaitCommitmentConfirmationContent';
import { WaitENSConfirmationContent } from '../components/registration/WaitENSConfirmationContent';
import { ENS_MIN_COMMITMENT_AGE, ensContracts } from '../core/contracts';
import { ENS_PAYMENT_TOKEN } from '../data/registration';
import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { useENSRegistration } from '../hooks/useENSRegistration';
import { useENSRegistrationActionHandler } from '../hooks/useENSRegistrationActionHandler';
import { useENSRegistrationCosts } from '../hooks/useENSRegistrationCosts';
import { useENSRegistrationForm } from '../hooks/useENSRegistrationForm';
import { useENSRegistrationImage } from '../hooks/useENSRegistrationImage';
import { useENSRegistrationStepHandler } from '../hooks/useENSRegistrationStepHandler';
import { useENSSearch } from '../hooks/useENSSearch';
import { accentColorAtom, ENS_DOMAIN } from '../utils/helpers';

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
  isSufficientPayment,
  testID,
}: {
  action: () => void;
  accentColor?: string;
  label: string;
  isValidGas: boolean;
  isSufficientGas: boolean;
  isSufficientPayment: boolean | undefined;
  testID: string;
}) {
  const insufficientPayment = isSufficientPayment === false;
  const insufficientEth = isSufficientGas === false && isValidGas;
  return (
    <>
      <Box>
        <SheetActionButtonRow paddingBottom={5}>
          <HoldToAuthorizeButton
            backgroundColor={accentColor ?? ''}
            disabled={!isSufficientGas || !isValidGas || isSufficientPayment !== true}
            hideInnerBorder
            label={
              insufficientPayment
                ? i18n.t(i18n.l.profiles.confirm.insufficient_payment_token, { symbol: ENS_PAYMENT_TOKEN.symbol })
                : insufficientEth
                  ? i18n.t(i18n.l.profiles.confirm.insufficient_eth)
                  : label
            }
            onLongPress={action}
            parentHorizontalPadding={19}
            showBiometryIcon={!insufficientEth && !insufficientPayment}
            testID={`ens-transaction-action-${testID}`}
          />
        </SheetActionButtonRow>
      </Box>
      <Box alignItems="center" justifyContent="center">
        <GasSpeedButton
          asset={{ color: accentColor }}
          chainId={ChainId.mainnet}
          marginBottom={DeviceInfo.hasNotch() ? 0 : undefined}
          theme="light"
        />
      </Box>
    </>
  );
}

export function ENSConfirmRegisterSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.ENS_CONFIRM_REGISTER_SHEET>>();
  const { navigate, goBack } = useNavigation();
  const { name: ensName, mode, registrationParameters, changedRecords } = useENSRegistration();
  const accountProfile = useAccountProfileInfo();
  const { isSmallPhone } = useDimensions();
  const { values } = useENSRegistrationForm();
  const initialAvatarUrl = useENSRegistrationImage('avatar');
  const { step, secondsSinceCommitConfirmed } = useENSRegistrationStepHandler(false);
  const [accentColor, setAccentColor] = useRecoilState(accentColorAtom);
  const [requestedDuration, setDuration] = useState(1);
  const [onMountSecondsSinceCommitConfirmed] = useState(secondsSinceCommitConfirmed);
  const [sendReverseRecord, setSendReverseRecord] = useState(
    accountProfile.accountENS !== ensName && (!isEmpty(changedRecords) || mode === REGISTRATION_MODES.EDIT)
  );

  const duration =
    step !== REGISTRATION_STEPS.COMMIT && registrationParameters?.commitment
      ? registrationParameters.commitment.duration / timeUnits.secs.year
      : requestedDuration;
  const avatarImage = initialAvatarUrl || params?.externalAvatarUrl || '';
  const dominantColor = usePersistentDominantColorFromImage(avatarImage);
  const name = ensName.replace(ENS_DOMAIN, '');
  const { data: registrationData } = useENSSearch({
    name: mode === REGISTRATION_MODES.CREATE || mode === REGISTRATION_MODES.RENEW ? name : '',
    yearsDuration: duration,
    renew: mode === REGISTRATION_MODES.RENEW,
  });
  const { submit, speedUpCommit } = useENSRegistrationActionHandler({
    sendReverseRecord,
    step,
    yearsDuration: duration,
  });
  const registrationCostsData = useENSRegistrationCosts({
    name: ensName,
    rentPrice: registrationData?.rentPrice,
    sendReverseRecord,
    step,
    yearsDuration: duration,
  });

  const avatarUrl = initialAvatarUrl || values.avatar;
  const canAffordStep = registrationCostsData.isSufficientGasForStep && registrationCostsData.isSufficientPayment;
  const requiresRegistrationGas = step === REGISTRATION_STEPS.COMMIT || step === REGISTRATION_STEPS.RENEW;

  const goToProfileScreen = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      goBack();
      setTimeout(() => {
        navigate(Routes.PROFILE_SCREEN);
      }, 100);

      // revalidate nft data for ens collection
      const ensCollectionId = `${Network.mainnet}_${ensContracts.ethRegistry}`;
      useNftsStore.getState().fetchNftCollection(ensCollectionId, true);
      useNftsStore.getState().fetch({ limit: NFTS_PAGE_SIZE }, { staleTime: time.seconds(5) });

      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          handleReviewPromptAction(ReviewPromptAction.EnsNameRegistration);
        });
      }, 500);
    });
  }, [goBack, navigate]);

  const stepLabel = useMemo(() => {
    if (mode === REGISTRATION_MODES.EDIT) return i18n.t(i18n.l.profiles.confirm.confirm_updates);
    if (mode === REGISTRATION_MODES.RENEW) return i18n.t(i18n.l.profiles.confirm.extend_registration);
    if (step === REGISTRATION_STEPS.COMMIT) return i18n.t(i18n.l.profiles.confirm.registration_details);
    if (step === REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION) return i18n.t(i18n.l.profiles.confirm.requesting_register);
    if (step === REGISTRATION_STEPS.WAIT_ENS_COMMITMENT) return i18n.t(i18n.l.profiles.confirm.reserving_name);
    if (step === REGISTRATION_STEPS.REGISTER) return i18n.t(i18n.l.profiles.confirm.confirm_registration);
    if (step === REGISTRATION_STEPS.SET_NAME) return i18n.t(i18n.l.profiles.confirm.set_name_registration);
  }, [mode, step]);

  useEffect(() => {
    if (dominantColor || (!dominantColor && !avatarImage)) {
      setAccentColor(dominantColor || colors.purple);
    }
  }, [avatarImage, dominantColor, setAccentColor]);

  useFocusEffect(
    useCallback(() => {
      Keyboard.dismiss();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(
    () => () => {
      if (step === REGISTRATION_STEPS.RENEW || step === REGISTRATION_STEPS.SET_NAME) useEnsRegistrationStore.getState().clear();
    },
    [step]
  );

  let stepContent: ReactNode = null;
  let actionLabel: string | undefined;

  switch (step) {
    case REGISTRATION_STEPS.COMMIT:
      stepContent = <CommitContent duration={duration} registrationCostsData={registrationCostsData} setDuration={setDuration} />;
      actionLabel = i18n.t(i18n.l.profiles.confirm.hold_to_begin);
      break;

    case REGISTRATION_STEPS.REGISTER:
      stepContent = (
        <RegisterContent
          accentColor={accentColor}
          sendReverseRecord={sendReverseRecord}
          setSendReverseRecord={canAffordStep ? setSendReverseRecord : null}
        />
      );
      actionLabel = i18n.t(i18n.l.profiles.confirm.hold_to_register);
      break;

    case REGISTRATION_STEPS.EDIT:
      stepContent = (
        <EditContent
          accentColor={accentColor}
          sendReverseRecord={sendReverseRecord}
          setSendReverseRecord={canAffordStep ? setSendReverseRecord : null}
          showReverseRecordSwitch={accountProfile.accountENS !== ensName}
        />
      );
      actionLabel = i18n.t(i18n.l.profiles.confirm.hold_to_confirm);
      break;

    case REGISTRATION_STEPS.RENEW:
      stepContent = (
        <RenewContent name={name} registrationCostsData={registrationCostsData} setDuration={setDuration} yearsDuration={duration} />
      );
      actionLabel = i18n.t(i18n.l.profiles.confirm.hold_to_extend);
      break;

    case REGISTRATION_STEPS.SET_NAME:
      actionLabel = i18n.t(i18n.l.profiles.confirm.hold_to_confirm);
      break;

    case REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION:
      stepContent = (
        <WaitCommitmentConfirmationContent
          accentColor={accentColor}
          action={() => speedUpCommit(accentColor)}
          secondsSinceCommitConfirmed={secondsSinceCommitConfirmed}
        />
      );
      break;

    case REGISTRATION_STEPS.WAIT_ENS_COMMITMENT:
      stepContent = (
        <WaitENSConfirmationContent
          seconds={ENS_MIN_COMMITMENT_AGE - (onMountSecondsSinceCommitConfirmed > 0 ? onMountSecondsSinceCommitConfirmed : 0)}
        />
      );
      break;
  }

  return (
    <SlackSheet
      additionalTopPadding
      contentHeight={params?.longFormHeight || ENSConfirmRegisterSheetHeight}
      height="100%"
      scrollEnabled={false}
    >
      <AccentColorProvider color={accentColor}>
        <Box
          background="body (Deprecated)"
          paddingTop="19px (Deprecated)"
          paddingVertical="30px (Deprecated)"
          style={{
            height: params?.longFormHeight || ENSConfirmRegisterSheetHeight,
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
                      {abbreviateName(ensName, 15)}
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
                {stepContent}
              </Box>
            </Row>
          </Rows>
          <Box>
            {actionLabel !== undefined && (
              <TransactionActionRow
                accentColor={accentColor}
                action={step === REGISTRATION_STEPS.COMMIT ? submit : () => submit(goToProfileScreen)}
                isSufficientGas={Boolean(
                  registrationCostsData.isSufficientGasForStep &&
                  (!requiresRegistrationGas || registrationCostsData.isSufficientGasForRegistration)
                )}
                isSufficientPayment={registrationCostsData.isSufficientPayment}
                isValidGas={Boolean(registrationCostsData.isValidGas && registrationCostsData.stepGasLimit)}
                label={actionLabel}
                testID={step}
              />
            )}
          </Box>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
