import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Text } from '@/design-system';

const WalletOption = ({
  editMode,
  label,
  onPress,
}: {
  editMode: boolean;
  label: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <ButtonPressAnimation disabled={editMode} onPress={onPress} scaleTo={0.96}>
      <Text
        size="17pt"
        weight="semibold"
        color={
          editMode ? { custom: colors.alpha(colors.blueGreyDark, 0.2) } : 'blue'
        }
      >
        {label}
      </Text>
    </ButtonPressAnimation>
  );
};

export default React.memo(WalletOption);
