import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import { compose } from 'recompact';
import { withAccountInfo } from '../../hoc';
import { colors, position } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { Text } from '../text';

const sx = StyleSheet.create({
  avatar: {
    ...position.sizeAsObject(65),
    marginBottom: 16,
  },
  firstLetter: {
    width: '100%',
  },
});

const ProfileAction = ({
  accountColor,
  accountName,
  onPress,
  overlayStyles,
}) => {
  const shadows = useMemo(
    () => ({
      default: [
        [0, 2, 5, colors.dark, 0.2],
        [0, 6, 10, colors.alpha(colors.avatarColor[accountColor], 0.6)],
      ],
      overlay: [
        [0, 6, 10, colors.black, 0.08],
        [0, 2, 5, colors.black, 0.12],
      ],
    }),
    [accountColor]
  );

  return (
    <ButtonPressAnimation
      hapticType="impactMedium"
      marginTop={2}
      onPress={onPress}
      pressOutDuration={200}
      scaleTo={0.9}
    >
      <ShadowStack
        {...position.sizeAsObject(65)}
        backgroundColor={overlayStyles ? 'rgb(51, 54, 59)' : colors.white}
        borderRadius={65}
        height={65}
        marginBottom={12}
        shadows={shadows[overlayStyles ? 'overlay' : 'default']}
        width={65}
      >
        <View
          backgroundColor={colors.avatarColor[accountColor]}
          style={sx.avatar}
        >
          <Text
            align="center"
            color={colors.white}
            letterSpacing={2}
            lineHeight={66}
            size={38}
            style={sx.firstLetter}
            weight="semibold"
          >
            {getFirstGrapheme(accountName)}
          </Text>
          {!overlayStyles && <InnerBorder opacity={0.02} radius={65} />}
        </View>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

ProfileAction.propTypes = {
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  onPress: PropTypes.func,
  overlayStyles: PropTypes.bool,
};

ProfileAction.defaultProps = {
  accountColor: 0,
  accountName: '🤔',
};

export default compose(withAccountInfo)(ProfileAction);
