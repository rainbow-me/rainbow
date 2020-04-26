import PropTypes from 'prop-types';
import React from 'react';
// import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withFabSelection, withTransitionProps } from '../../hoc';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
// import DeleteButton from './DeleteButton';
import FloatingActionButton from './FloatingActionButton';
// import MovableFabWrapper from './MovableFabWrapper';

const FloatingActionButtonWithDisabled = withFabSelection(FloatingActionButton);

const FabShadow = [
  [0, 10, 30, colors.dark, 0.4],
  [0, 5, 15, colors.paleBlue, 0.5],
];

const SendFab = ({
  //areas,
  //deleteButtonScale,
  disabled,
  onPress,
  scaleTo,
  //scrollViewTracker,
  //sections,
  tapRef,
  //...props
}) => (
  <Centered flex={0}>
    {/*
      <DeleteButton deleteButtonScale={deleteButtonScale} />
      <MovableFabWrapper
        actionType="send"
        deleteButtonScale={deleteButtonScale}
        scrollViewTracker={scrollViewTracker}
        sections={sections}
        tapRef={tapRef}
      >
    */}
    <FloatingActionButtonWithDisabled
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={onPress}
      scaleTo={scaleTo}
      shadows={FabShadow}
      tapRef={tapRef}
    >
      <Icon height={22} marginBottom={4} name="send" width={23} />
    </FloatingActionButtonWithDisabled>
    {/*
      </MovableFabWrapper>
    */}
  </Centered>
);

SendFab.propTypes = {
  //areas: PropTypes.array,
  //children: PropTypes.any,
  //deleteButtonScale: PropTypes.object,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  scaleTo: PropTypes.number,
  //scrollViewTracker: PropTypes.object,
  //sections: PropTypes.array,
  tapRef: PropTypes.object,
};

SendFab.defaultProps = {
  // scaleTo: FloatingActionButton.sizeWhileDragging / FloatingActionButton.size
};

export default compose(
  withNavigation,
  withTransitionProps,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate(Routes.SEND_SHEET),
  }),
  onlyUpdateForKeys(['disabled', 'sections'])
  // withProps({
  //   deleteButtonScale: new Animated.Value(DeleteButton.defaultScale),
  //   tapRef: React.createRef(),
  // }),
)(SendFab);
