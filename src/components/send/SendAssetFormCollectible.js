import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/primitives';
import { useDimensions, useImageMetadata } from '../../hooks';
import { OpacityToggler } from '../animations';
import { Column, ColumnWithMargins } from '../layout';
import { UniqueTokenCard } from '../unique-token';
import { colors, padding, position } from '@rainbow-me/styles';

const defaultImageDimensions = { height: 512, width: 512 };

const ButtonWrapper = styled(ColumnWithMargins).attrs(({ isTallPhone }) => ({
  margin: isTallPhone ? 25 : 15.5,
}))`
  ${padding(0, 15, 15)};
  margin-bottom: 29;
  width: 100%;
  z-index: 3;
`;

const Footer = styled(Column).attrs({ justify: 'end' })`
  height: 210;
  width: 100%;
`;

const Gradient = styled(LinearGradient).attrs(({ isTallPhone }) => ({
  colors: ['#FAFAFA00', '#FAFAFAFF'],
  end: { x: 0.5, y: isTallPhone ? 0.2 : 0.4 },
  pointerEvents: 'none',
  start: { x: 0.5, y: 0 },
}))`
  ${position.cover};
  border-radius: 19;
  overflow: hidden;
`;

const GradientToggler = styled(OpacityToggler).attrs({
  tension: 500,
})`
  ${position.cover};
`;

const SendFormUniqueTokenCard = styled(UniqueTokenCard).attrs({
  borderEnabled: false,
  enableHapticFeedback: false,
  resizeMode: 'contain',
  scaleTo: 1,
  shadow: [0, 10, 25, colors.dark, 0.4],
})`
  opacity: 1;
`;

export default function SendAssetFormCollectible({
  asset,
  buttonRenderer,
  txSpeedRenderer,
  ...props
}) {
  const {
    height: deviceHeight,
    isTallPhone,
    width: deviceWidth,
  } = useDimensions();

  const [containerHeight, setContainerHeight] = useState();
  const [containerWidth, setContainerWidth] = useState();
  const [isGradientVisible, setIsGradientVisible] = useState(false);

  const { dimensions: cachedImageDimensions } = useImageMetadata(
    asset.image_preview_url
  );

  const { height: imageHeight, width: imageWidth } = useMemo(() => {
    const imgDims = cachedImageDimensions || defaultImageDimensions;

    const defaultWidth = deviceWidth - 30;
    const defaultHeight = (defaultWidth * imgDims.height) / imgDims.width;
    let width = defaultWidth;
    let height = defaultHeight;

    const calculatedHeight = deviceHeight - (isTallPhone ? 440 : 330);

    if (height > calculatedHeight) {
      height = calculatedHeight;
      width = (height * imgDims.width) / imgDims.height;
      if (width > defaultWidth) {
        width = defaultWidth;
        height = defaultHeight;
      }
    }

    return { height, width };
  }, [cachedImageDimensions, deviceHeight, deviceWidth, isTallPhone]);

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }) => {
      const newContainerHeight = layout.height - layout.y * 2;
      setIsGradientVisible(newContainerHeight < containerHeight);
      setContainerHeight(newContainerHeight);
      setContainerWidth(layout.width);
    },
    [containerHeight]
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Column align="end" flex={1} width="100%">
        <Column align="center" flex={1} onLayout={handleLayout} width="100%">
          {!!containerHeight && !!containerWidth && (
            <SendFormUniqueTokenCard
              {...props}
              height={imageHeight}
              item={asset}
              width={imageWidth}
            />
          )}
        </Column>
        <Footer>
          <ButtonWrapper isTallPhone={isTallPhone}>
            {buttonRenderer}
            {txSpeedRenderer}
          </ButtonWrapper>
          <GradientToggler isVisible={!isGradientVisible}>
            <Gradient isTallPhone={isTallPhone} />
          </GradientToggler>
        </Footer>
      </Column>
    </TouchableWithoutFeedback>
  );
}
