import React from 'react';
import { ButtonPressAnimation } from '../../animations';
import { ContactAvatar } from '../../contacts';

const ProfileAvatarButton = ({
  changeAvatar,
  color,
  marginBottom = 15,
  testID,
  value,
  radiusAndroid,
}) => {
  return (
    <ButtonPressAnimation
      onPress={changeAvatar}
      overflowMargin={15}
      radiusAndroid={radiusAndroid}
      scaleTo={0.9}
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
