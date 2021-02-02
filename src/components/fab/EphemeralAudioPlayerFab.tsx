import * as React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { lightModeThemeColors } from '../../styles/colors';
import { magicMemo } from '../../utils';
import { Icon } from '../icons';
import { Bold, Text } from '../text';
import FloatingActionButton, {
  FloatingActionButtonSize,
} from './FloatingActionButton';
import { useAudio } from '@rainbow-me/hooks';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.8],
  [0, 5, 15, lightModeThemeColors.orangeLight, 1],
];

export type EphemeralAudioPlayerFabProps = {
  readonly disabled: boolean;
  readonly isReadOnlyWallet: boolean;
  readonly remainingSpace: number;
};

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  background: {
    borderBottomLeftRadius: FloatingActionButtonSize * 0.5,
    borderTopLeftRadius: FloatingActionButtonSize * 0.5,
    height: FloatingActionButtonSize,
    paddingLeft: FloatingActionButtonSize + 5,
    paddingRight: 5,
    paddingVertical: 5,
  },
  details: {
    justifyContent: 'center',
  },
  noOverflow: { overflow: 'hidden' },
  overflowContainer: {
    borderRadius: FloatingActionButtonSize * 0.5,
    height: FloatingActionButtonSize,
  },
});

function EphemeralAudioPlayerFab({
  disabled,
  remainingSpace,
  ...props
}: EphemeralAudioPlayerFabProps): JSX.Element {
  const { colors } = useTheme();
  const [open, setOpen] = React.useState(false);
  const { isPlayingAsset, currentlyPlayingAsset } = useAudio();
  const progress = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    // If the user plays an asset and we weren't before, we should automatically open.
    setOpen(isPlayingAsset);
  }, [isPlayingAsset, setOpen]);

  const handlePress = React.useCallback(() => {
    setOpen(isCurrentlyOpen => !isCurrentlyOpen);
  }, [setOpen]);

  // translation
  React.useEffect(() => {
    Animated.timing(progress, {
      duration: 350,
      toValue: open ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const containerStyle = React.useMemo(() => [{ width: remainingSpace }], [
    remainingSpace,
  ]);

  return (
    <Animated.View pointerEvents="box-none" {...props} style={containerStyle}>
      {/* Overflow Container */}
      <Animated.View
        style={[
          styles.absolute,
          styles.overflowContainer,
          styles.noOverflow,
          { width: remainingSpace - 15 },
        ]}
      >
        {/* Animated Background */}
        <Animated.View
          style={[
            styles.absolute,
            styles.background,
            styles.noOverflow,
            styles.details,
            {
              backgroundColor: colors.white,
              borderRadius: FloatingActionButtonSize * 0.5,
              transform: [
                {
                  translateX: Animated.multiply(
                    Animated.subtract(1, progress),
                    remainingSpace - (FloatingActionButtonSize + 15)
                  ),
                },
              ],
              width: remainingSpace - 15,
            },
          ]}
        >
          {!!currentlyPlayingAsset && (
            <>
              <Bold
                children={currentlyPlayingAsset.name}
                numberOfLines={1}
                style={{ color: colors.orangeLight }}
              />
              <Text
                children="01:03"
                numberOfLines={1}
                style={{ color: colors.lightGrey }}
              />
            </>
          )}
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          styles.absolute,
          {
            transform: [
              {
                translateX: Animated.multiply(
                  Animated.subtract(1, progress),
                  remainingSpace - (FloatingActionButtonSize + 15)
                ),
              },
            ],
          },
        ]}
      >
        <FloatingActionButton
          backgroundColor={colors.orangeLight}
          disabled={disabled}
          onPress={handlePress}
          shadows={FabShadow}
          testID="audio-fab"
        >
          <Icon
            color={colors.whiteLabel}
            height={21}
            marginBottom={2}
            name="audio"
            width={26}
          />
        </FloatingActionButton>
      </Animated.View>
    </Animated.View>
  );
}

export default magicMemo(EphemeralAudioPlayerFab, [
  'disabled',
  'isReadOnlyWallet',
]);
