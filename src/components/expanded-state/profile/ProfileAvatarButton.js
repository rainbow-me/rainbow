import React, { useCallback } from 'react';
import { ButtonPressAnimation } from '../../animations';
import { ContactAvatar } from '../../contacts';
import { colors } from '@rainbow-me/styles';

const ProfileAvatarButton = ({ color, marginBottom = 15, setColor, value }) => {
  const handleChangeColor = useCallback(() => {
    if (setColor) {
      setColor(prevColor => {
        const nextColor = prevColor + 1;
        return nextColor > colors.avatarColor.length - 1 ? 0 : nextColor;
      });
    }
  }, [setColor]);

  return (
    <ButtonPressAnimation onPress={handleChangeColor} scaleTo={0.96}>
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
