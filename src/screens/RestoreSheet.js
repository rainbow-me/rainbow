import { useNavigation, useRoute } from '@react-navigation/native';
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
import WalletBackupTypes from '../helpers/walletBackupTypes';
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
  const { navigate, setOptions } = useNavigation();

  const { jumpToLong } = useContext(ModalContext);
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const [step, setStep] = useState(params?.option || 'first');

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
    setStep(WalletBackupTypes.cloud);
    setOptions({
      isShortFormEnabled: false,
      longFormHeight: 770,
    });
    setImmediate(jumpToLong);
  }, [jumpToLong, setOptions]);

  const onManualRestore = useCallback(() => {
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [navigate]);

  const onWatchAddress = useCallback(() => {
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [navigate]);

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupTypes.cloud:
        return <RestoreIcloudStep userData={params?.userData} />;
      default:
        return (
          <RestoreSheetFirstStep
            onIcloudRestore={onIcloudRestore}
            onManualRestore={onManualRestore}
            onWatchAddress={onWatchAddress}
            userData={params?.userData}
          />
        );
    }
  }, [
    onIcloudRestore,
    onManualRestore,
    onWatchAddress,
    params?.userData,
    step,
  ]);

  return (
    <StyledSheet>
      <Transitioning.View
        ref={switchSheetContentTransitionRef}
        transition={switchSheetContentTransition}
      >
        {renderStep()}
      </Transitioning.View>
    </StyledSheet>
  );
};

export default React.memo(RestoreSheet);
