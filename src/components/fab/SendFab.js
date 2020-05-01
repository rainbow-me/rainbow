import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { compose } from 'recompact';
import { onlyUpdateForKeys } from 'recompose';
import { withFabSelection, withTransitionProps } from '../../hoc';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import FloatingActionButton from './FloatingActionButton';

const FloatingActionButtonWithDisabled = withFabSelection(FloatingActionButton);

const FabShadow = [
  [0, 10, 30, colors.dark, 0.4],
  [0, 5, 15, colors.paleBlue, 0.5],
];

const SendFab = ({ disabled, isReadOnlyWallet, scaleTo, tapRef }) => {
  const { navigate } = useNavigation();
  const onPressHandler = useCallback(() => {
    if (!isReadOnlyWallet) {
      navigate(Routes.SEND_SHEET);
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    <Centered flex={0}>
      <FloatingActionButtonWithDisabled
        backgroundColor={colors.paleBlue}
        disabled={disabled}
        onPress={onPressHandler}
        scaleTo={scaleTo}
        shadows={FabShadow}
        tapRef={tapRef}
      >
        <Icon height={22} marginBottom={4} name="send" width={23} />
      </FloatingActionButtonWithDisabled>
    </Centered>
  );
};

SendFab.propTypes = {
  disabled: PropTypes.bool,
  isReadOnlyWallet: PropTypes.bool,
  scaleTo: PropTypes.number,
  tapRef: PropTypes.object,
};

export default compose(
  withTransitionProps,
  onlyUpdateForKeys(['disabled', 'isReadOnlyWallet', 'sections'])
)(SendFab);
