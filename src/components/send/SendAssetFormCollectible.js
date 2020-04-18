import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { compose, onlyUpdateForKeys, withProps, withState } from 'recompact';
import { withImageDimensionsCache } from '../../hoc';
import { colors, position } from '../../styles';
import { deviceUtils } from '../../utils';
import { OpacityToggler } from '../animations';
import { Column, ColumnWithMargins } from '../layout';
import { UniqueTokenCard } from '../unique-token';

const enhance = compose(
  withImageDimensionsCache,
  withState('previousContainerHeight', 'setPreviousContainerHeight', 0),
  withState('isGradientVisible', 'setIsGradientVisible', false),
  withViewLayoutProps(
    ({ width: containerWidth, height: containerHeight, y }) => ({
      containerHeight: containerHeight - y * 2,
      containerWidth,
    })
  ),
  withProps(({ image_preview_url, imageDimensionsCache }) => ({
    imageDimensions: imageDimensionsCache[image_preview_url],
  })),
  withProps(
    ({
      containerHeight,
      imageDimensions,
      previousContainerHeight,
      setIsGradientVisible,
      setPreviousContainerHeight,
    }) => {
      if (!imageDimensions) {
        imageDimensions = { height: 512, width: 512 };
      }
      let width = deviceUtils.dimensions.width - 30;
      let height = !imageDimensions
        ? width
        : (width * imageDimensions.height) / imageDimensions.width;

      const calculatedHeight =
        deviceUtils.dimensions.height -
        (deviceUtils.dimensions.height < 812 ? 330 : 440);

      if (containerHeight < previousContainerHeight) {
        setPreviousContainerHeight(containerHeight);
        setIsGradientVisible(true);
      } else if (containerHeight > previousContainerHeight) {
        setPreviousContainerHeight(containerHeight);
        setIsGradientVisible(false);
      }

      if (height > calculatedHeight) {
        height = calculatedHeight;
        width = (height * imageDimensions.width) / imageDimensions.height;

        if (width > deviceUtils.dimensions.width - 30) {
          width = deviceUtils.dimensions.width - 30;
          height = !imageDimensions
            ? width
            : (width * imageDimensions.height) / imageDimensions.width;
        }
      }

      return {
        height,
        width,
      };
    }
  ),
  onlyUpdateForKeys(['containerHeight', 'containerWidth', 'height', 'width'])
);

const SendAssetFormCollectible = enhance(
  ({
    buttonRenderer,
    containerHeight,
    containerWidth,
    height,
    isGradientVisible,
    onLayout,
    width,
    txSpeedRenderer,
    ...props
  }) => (
    <>
      <Column align="center" flex={1} onLayout={onLayout} width="100%">
        {!!containerHeight && !!containerWidth && (
          <UniqueTokenCard
            {...props}
            borderEnabled={false}
            enableHapticFeedback={false}
            height={height}
            item={props}
            opacity={1}
            scaleTo={1}
            resizeMode="contain"
            shadowStyle={{
              shadowColor: colors.dark,
              shadowOffset: { height: 10, width: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 25,
            }}
            width={width}
          />
        )}
      </Column>
      <View
        width="100%"
        marginBottom={0}
        height={210}
        justifyContent="flex-end"
      >
        <ColumnWithMargins
          flex={0}
          margin={deviceUtils.dimensions.height < 812 ? 15.5 : 25}
          style={{ zIndex: 3 }}
          width="100%"
          marginBottom={29}
          paddingHorizontal={15}
          paddingBottom={15}
        >
          {buttonRenderer}
          {txSpeedRenderer}
        </ColumnWithMargins>
        <OpacityToggler
          isVisible={isGradientVisible}
          style={position.coverAsObject}
          tension={500}
        >
          <LinearGradient
            borderRadius={19}
            overflow="hidden"
            colors={['#FAFAFA00', '#FAFAFAFF']}
            end={{ x: 0.5, y: deviceUtils.dimensions.height < 812 ? 0.4 : 0.2 }}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            style={position.coverAsObject}
          />
        </OpacityToggler>
      </View>
    </>
  )
);

SendAssetFormCollectible.propTypes = {
  containerHeight: PropTypes.number,
  containerWidth: PropTypes.number,
  height: PropTypes.number,
  onLayout: PropTypes.func,
  width: PropTypes.number,
};

export default SendAssetFormCollectible;
