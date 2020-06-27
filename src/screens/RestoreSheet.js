import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import RestoreIcloudStep from '../components/restore/RestoreIcloudStep';
import RestoreSheetFirstStep from '../components/restore/RestoreSheetFirstStep';
import { SlackSheet } from '../components/sheet';
import { fetchUserDataFromCloud } from '../handlers/cloudBackup';
import WalletBackupTypes from '../helpers/walletBackupTypes';
import Routes from '../navigation/routesNames';

const switchSheetContentTransition = (
  <Transition.Sequence>
    <Transition.Out durationMs={0.1} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={150} interpolation="easeOut" />
    <Transition.In durationMs={400} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const RestoreSheet = () => {
  const { goBack, navigate } = useNavigation();
  const switchSheetContentTransitionRef = useRef();
  const { params } = useRoute();
  const [step, setStep] = useState(params?.option || 'first');
  const [userData, setUserData] = useState();

  useEffect(() => {
    const initialize = async () => {
      const data = await fetchUserDataFromCloud();
      setUserData(data);
    };

    initialize();
  }, []);

  const onIcloudRestore = useCallback(() => {
    switchSheetContentTransitionRef.current?.animateNextTransition();
    setStep(WalletBackupTypes.cloud);
  }, []);

  const onManualRestore = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [goBack, navigate]);

  const onWatchAddress = useCallback(() => {
    goBack();
    navigate(Routes.IMPORT_SEED_PHRASE_SHEET_NAVIGATOR);
  }, [goBack, navigate]);

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupTypes.cloud:
        return <RestoreIcloudStep userData={userData} />;
      default:
        return (
          <RestoreSheetFirstStep
            onIcloudRestore={onIcloudRestore}
            onManualRestore={onManualRestore}
            onWatchAddress={onWatchAddress}
            userData={userData}
          />
        );
    }
  }, [onIcloudRestore, onManualRestore, onWatchAddress, step, userData]);

  return (
    <SlackSheet>
      <Transitioning.View
        ref={switchSheetContentTransitionRef}
        transition={switchSheetContentTransition}
      >
        {renderStep()}
      </Transitioning.View>
    </SlackSheet>
  );
};

export default React.memo(RestoreSheet);
