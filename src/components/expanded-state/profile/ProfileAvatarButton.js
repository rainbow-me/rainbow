import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../../animations';
import { ContactAvatar } from '../../contacts';

const ProfileAvatarButton = ({
  color,
  marginBottom = 15,
  setColor,
  testID,
  value,
  radiusAndroid,
}) => {
  const { colors } = useTheme();
  const handleChangeColor = useCallback(() => {
    setColor?.(prevColor => {
      const idx =
        typeof prevColor === 'string'
          ? colors.avatarColor.indexOf(prevColor)
          : prevColor;
      return (idx + 1) % colors.avatarColor.length;
    });
  }, [setColor, colors]);

  return (
    <ButtonPressAnimation
      onPress={handleChangeColor}
      overflowMargin={15}
      radiusAndroid={radiusAndroid}
      scaleTo={0.96}
      testID={testID}
    >
      <ContactAvatar
        color={color}
        marginBottom={marginBottom}
        size="large"
        value={value}
      />
    </ButtonPressAnimation>
  );
};

export default React.memo(ProfileAvatarButton);
