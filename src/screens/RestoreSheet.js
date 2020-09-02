import { useRoute } from '@react-navigation/native';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components';
import RestoreIcloudStep from '../components/restore/RestoreIcloudStep';
import RestoreSheetFirstStep from '../components/restore/RestoreSheetFirstStep';
import { SlackSheet } from '../components/sheet';
import WalletBackupStepTypes from '@rainbow-me/helpers/walletBackupStepTypes';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const switchSheetContentTransition = (
  <Transition.Sequence>
    <Transition.Out durationMs={0.1} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={150} interpolation="easeOut" />
    <Transition.In durationMs={400} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const StyledSheet = styled(SlackSheet)`
  top: 0;
  height: 100%;
`;

const RestoreSheet = () => {
  const { goBack, navigate, setOptions } = useNavigation();

  const { jumpToLong } = useContext(ModalContext);
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const [step, setStep] = useState(WalletBackupStepTypes.first);

  useEffect(() => {
    if (!params?.userData) {
      setOptions({
        isShortFormEnabled: false,
        longFormHeight: 363,
      });
    }
  }, [params?.userData, setOptions]);

  const onIcloudRestore = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupStepTypes.cloud);
    setOptions({
      isShortFormEnabled: false,
      longFormHeight: 770,
    });
    setImmediate(jumpToLong);
  }, [jumpToLong, setOptions]);

  const onManualRestore = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [goBack, navigate]);

  const onWatchAddress = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [goBack, navigate]);

  return (
    <StyledSheet>
      <Transitioning.View
        ref={switchSheetContentTransitionRef}
        transition={switchSheetContentTransition}
      >
        {step === WalletBackupStepTypes.cloud ? (
          <RestoreIcloudStep userData={params?.userData} />
        ) : (
          <RestoreSheetFirstStep
            onIcloudRestore={onIcloudRestore}
            onManualRestore={onManualRestore}
            onWatchAddress={onWatchAddress}
            userData={params?.userData}
          />
        )}
      </Transitioning.View>
    </StyledSheet>
  );
};

export default React.memo(RestoreSheet);
