import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import { useTheme } from '@/theme';

interface Props {
  backgroundColor?: string;
  onPressColor: () => void;
}

const ColorCircle = ({ backgroundColor = 'blue', onPressColor }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={sx.container}>
      <ButtonPressAnimation duration={100} enableHapticFeedback onPress={onPressColor} scaleTo={0.7} style={sx.button}>
        <View style={[sx.circle, { backgroundColor, shadowColor: colors.shadowBlack }]} />
      </ButtonPressAnimation>
    </View>
  );
};

const sx = StyleSheet.create({
  button: {
    alignItems: 'center',
  },
  circle: {
    borderRadius: 15,
    height: 24,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: 24,
  },
  container: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 40,
  },
});

export default ColorCircle;
