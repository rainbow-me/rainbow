import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import FastImage from 'react-native-fast-image';
import { Transition, Transitioning } from 'react-native-reanimated';
import SimulatorFakeCameraImageSource from '../../assets/simulator-fake-camera-image.jpg';
import { usePrevious } from '../../hooks';
import { colors, position } from '../../styles';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import { ErrorText } from '../text';
import QRCodeScannerCamera from './QRCodeScannerCamera';
import QRCodeScannerCrosshair from './QRCodeScannerCrosshair';

const transition = (
  <Transition.Change durationMs={200} interpolation="easeInOut" />
);

const QRCodeScanner = ({
  contentPositionBottom,
  contentPositionTop,
  enableCamera,
  enableScanning,
  isCameraAuthorized,
  isEmulator,
  onSuccess,
  showCrosshairText,
}) => {
  const ref = useRef();
  const [error, setError] = useState(null);
  const [isInitialized, setInitialized] = useState(false);

  const prevContentPositionBottom = usePrevious(contentPositionBottom);
  useEffect(() => {
    if (ref.current && contentPositionBottom !== prevContentPositionBottom) {
      ref.current.animateNextTransition();
    }
  }, [contentPositionBottom, prevContentPositionBottom]);

  let cameraRenderer = null;
  if (isEmulator) {
    cameraRenderer = (
      <FastImage
        source={SimulatorFakeCameraImageSource}
        style={position.sizeAsObject('100%')}
      />
    );
  } else if (enableCamera) {
    cameraRenderer = (
      <QRCodeScannerCamera
        enableScanning={enableScanning}
        onCameraReady={() => setInitialized(true)}
        onMountError={() => setError('mounting')}
        onSuccess={onSuccess}
      />
    );
  }

  const showErrorMessage = error && !isInitialized;
  const showCrosshair = !error && !showErrorMessage;

  return (
    <Centered
      {...position.coverAsObject}
      backgroundColor={colors.black}
      direction="column"
    >
      {cameraRenderer}
      {isCameraAuthorized && (
        <Transitioning.View
          ref={ref}
          style={position.coverAsObject}
          transition={transition}
        >
          <Centered
            {...position.coverAsObject}
            bottom={contentPositionBottom}
            top={contentPositionTop}
          >
            {showErrorMessage && (
              <ErrorText color={colors.red} error={`Error ${error} camera`} />
            )}
            {showCrosshair && (
              <QRCodeScannerCrosshair
                showText={showCrosshairText || isEmulator}
                text={isEmulator ? 'Simulator Mode' : undefined}
              />
            )}
          </Centered>
        </Transitioning.View>
      )}
    </Centered>
  );
};

QRCodeScanner.propTypes = {
  contentPositionBottom: PropTypes.node,
  contentPositionTop: PropTypes.node,
  enableCamera: PropTypes.bool,
  enableScanning: PropTypes.bool,
  isCameraAuthorized: PropTypes.bool,
  isEmulator: PropTypes.bool,
  onSuccess: PropTypes.func,
  showCrosshairText: PropTypes.bool,
};

export default magicMemo(QRCodeScanner, [
  'contentPositionBottom',
  'enableCamera',
  'enableScanning',
  'isCameraAuthorized',
  'showCrosshairText',
]);
