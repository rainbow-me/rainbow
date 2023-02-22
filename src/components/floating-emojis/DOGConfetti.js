import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Emoji } from '../text';
import { ImgixImage } from '../images';
import dogSunglasses from '@/assets/partnerships/dogSunglasses.png';

const NUM_CONFETTI = 15;
const CONFETTI_SIZE = 30;

const createConfetti = () => {
  const { width: screenWidth } = Dimensions.get('screen');

  return [...new Array(NUM_CONFETTI)].map((_, i) => {
    const clock = new Animated.Clock();

    return {
      key: i,
      // Spawn confetti from two different areas
      x: new Animated.Value(
        screenWidth * (i % 2 ? 0.33 : 0.66) - CONFETTI_SIZE / 2
      ),
      y: new Animated.Value(-60),
      angle: new Animated.Value(0),
      xVel: new Animated.Value(Math.random() * 400 - 200),
      yVel: new Animated.Value(Math.random() * 150 + 150),
      angleVel: new Animated.Value((Math.random() * 3 - 1.5) * Math.PI),
      delay: new Animated.Value(Math.floor(i / 10) * 0.3),
      elasticity: Math.random() * 0.3 + 0.1,
      clock,
    };
  });
};

export const DOGConfetti = () => {
  const confetti = useMemo(createConfetti, []);

  return (
    <View
      pointerEvents="none"
      style={[{ zIndex: -1 }, StyleSheet.absoluteFill]}
    >
      {confetti.map(
        ({
          key,
          x,
          y,
          angle,
          xVel,
          yVel,
          angleVel,
          elasticity,
          delay,
          clock,
        }) => {
          return (
            <React.Fragment key={key}>
              <Animated.Code>
                {() => {
                  const {
                    startClock,
                    set,
                    add,
                    sub,
                    divide,
                    diff,
                    multiply,
                    cond,
                    clockRunning,
                    greaterThan,
                    lessThan,
                  } = Animated;
                  const { width: screenWidth } = Dimensions.get('window');

                  const timeDiff = diff(clock);
                  const dt = divide(timeDiff, 1000);
                  const dy = multiply(dt, yVel);
                  const dx = multiply(dt, xVel);
                  const dAngle = multiply(dt, angleVel);

                  return cond(
                    clockRunning(clock),
                    [
                      cond(
                        greaterThan(delay, 0),
                        [set(delay, sub(delay, dt))],
                        [
                          set(y, add(y, dy)),
                          set(x, add(x, dx)),
                          set(angle, add(angle, dAngle)),
                        ]
                      ),
                      cond(greaterThan(x, screenWidth - CONFETTI_SIZE), [
                        set(x, screenWidth - CONFETTI_SIZE),
                        set(xVel, multiply(xVel, -elasticity)),
                      ]),
                      cond(lessThan(x, 0), [
                        set(x, 0),
                        set(xVel, multiply(xVel, -elasticity)),
                      ]),
                    ],
                    [startClock(clock), timeDiff]
                  );
                }}
              </Animated.Code>
              <Animated.View
                style={[
                  styles.confettiContainer,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      { rotate: angle },
                    ],
                  },
                ]}
              >
                {key % 2 === 0 ? (
                  <Emoji name="rainbow" style={styles.confetti} />
                ) : (
                  <ImgixImage
                    source={dogSunglasses}
                    style={styles.confetti}
                    size={30}
                  />
                )}
              </Animated.View>
            </React.Fragment>
          );
        }
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99,
    elevation: 99,
  },
  confetti: {
    width: CONFETTI_SIZE,
    height: CONFETTI_SIZE,
    zIndex: 99,
    opacity: 0.3,
    elevation: 99,
  },
});
