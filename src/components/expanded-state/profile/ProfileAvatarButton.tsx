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
}: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      onPress={changeAvatar}
      overflowMargin={15}
      radiusAndroid={radiusAndroid}
      scaleTo={0.9}
      testID={testID}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
