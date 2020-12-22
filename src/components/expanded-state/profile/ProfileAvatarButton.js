import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../../animations';
import { ContactAvatar } from '../../contacts';
import { colors } from '@rainbow-me/styles';

const ProfileAvatarButton = ({
  color,
  marginBottom = 15,
  setColor,
  testID,
  value,
  radiusAndroid,
}) => {
  const handleChangeColor = useCallback(
    () => setColor?.(prevColor => (prevColor + 1) % colors.avatarColor.length),
    [setColor]
  );

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
