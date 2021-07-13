import React, { useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import Routes from '@rainbow-me/routes';
import { magicMemo, watchingAlert } from '@rainbow-me/utils';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.8],
  [0, 5, 15, lightModeThemeColors.paleBlue, 1],
];

const SendFab = ({ disabled, isReadOnlyWallet, ...props }) => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SEND_FLOW);
    } else {
      watchingAlert();
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="send-fab"
    >
      <Icon
        color={colors.whiteLabel}
        height={22}
        marginBottom={4}
        name="send"
        width={23}
      />
    </FloatingActionButton>
  );
};

export default magicMemo(SendFab, ['disabled', 'isReadOnlyWallet']);
