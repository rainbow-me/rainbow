import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { compose } from 'recompact';
import { onlyUpdateForKeys } from 'recompose';
import { withFabSelection } from '../../hoc';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';

const FabShadow = [
  [0, 10, 30, colors.dark, 0.4],
  [0, 5, 15, colors.swapPurple, 0.5],
];

const ExchangeFab = ({ disabled, isReadOnlyWallet, ...props }) => {
  const { navigate } = useNavigation();
  const onPress = useCallback(() => {
    if (!isReadOnlyWallet) {
      navigate(Routes.EXCHANGE_MODAL);
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.swapPurple}
      disabled={disabled}
      onPress={onPress}
      shadows={FabShadow}
    >
      <Icon height={21} marginBottom={2} name="swap" width={26} />
    </FloatingActionButton>
  );
};

ExchangeFab.propTypes = {
  disabled: PropTypes.bool,
  isReadOnlyWallet: PropTypes.bool,
};

export default compose(
  withFabSelection,
  onlyUpdateForKeys(['disabled', 'isReadOnlyWallet'])
)(ExchangeFab);
