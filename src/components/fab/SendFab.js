import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../navigation/routesNames';
import { colors } from '../../styles';
import { magicMemo } from '../../utils';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';

const FabShadow = [
  [0, 10, 30, colors.dark, 0.4],
  [0, 5, 15, colors.paleBlue, 0.5],
];

const SendFab = ({ disabled, isReadOnlyWallet, ...props }) => {
  const { navigate } = useNavigation();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet) {
      navigate(
        isNativeStackAvailable ? Routes.SEND_SHEET_NAVIGATOR : Routes.SEND_SHEET
      );
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
    >
      <Icon height={22} marginBottom={4} name="send" width={23} />
    </FloatingActionButton>
  );
};

export default magicMemo(SendFab, ['disabled', 'isReadOnlyWallet']);
