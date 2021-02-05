import * as React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { magicMemo } from '../../utils';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { CurrentSoundTimestampSpan } from '../audio';
import { Icon } from '../icons';
import { Bold, Text } from '../text';
import FloatingActionButton, {
  FloatingActionButtonSize,
} from './FloatingActionButton';
import { useAudio, useWallets } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.8],
  [0, 5, 15, lightModeThemeColors.orangeLight, 1],
];

const paddingRight = 10;

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
  currentPlayingAssetDetails: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
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
  const { colors, isDarkMode } = useTheme();
  const [open, setOpen] = React.useState(false);
  const { isPlayingAsset, currentlyPlayingAsset, playlist } = useAudio();
  const progress = React.useMemo(() => new Animated.Value(0), []);
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  React.useEffect(() => {
    // If the user plays an asset and we weren't before, we should automatically open.
    setOpen(isPlayingAsset);
  }, [isPlayingAsset, setOpen]);

  const handlePress = React.useCallback(() => {
    setOpen(isCurrentlyOpen => !isCurrentlyOpen);
  }, [setOpen]);
  const handleAudioTitlePress = React.useCallback(() => {
    if (currentlyPlayingAsset) {
      navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset: currentlyPlayingAsset,
          isReadOnlyWallet,
          type: 'unique_token',
        }
      );
    }
  }, [currentlyPlayingAsset, navigate, isReadOnlyWallet]);

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

  const currentPlayingAssetTitle = React.useMemo(() => {
    if (!!currentlyPlayingAsset && typeof currentlyPlayingAsset === 'object') {
      // @ts-ignore
      const { name, asset_contract } = currentlyPlayingAsset;
      if (!!asset_contract && typeof asset_contract === 'object') {
        const { name: assetContractName } = asset_contract;
        if (typeof assetContractName === 'string') {
          return `${name} // ${assetContractName}`;
        }
      }
      return `${name}`;
    }
    return '';
  }, [currentlyPlayingAsset]);

  const currentPlayingAssetDetailsColor = isDarkMode
    ? colors.black
    : colors.lightGrey;

  const currentPlayingAssetDetailsStyle = React.useMemo(
    () => ({
      color: currentPlayingAssetDetailsColor,
    }),
    [currentPlayingAssetDetailsColor]
  );
  return (
    <Animated.View pointerEvents="box-none" {...props} style={containerStyle}>
      {/* Overflow Container */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.absolute,
          styles.overflowContainer,
          styles.noOverflow,
          { width: remainingSpace - paddingRight },
        ]}
      >
        {/* Animated Background */}
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
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
                    remainingSpace - (FloatingActionButtonSize + paddingRight)
                  ),
                },
              ],
              width: remainingSpace - paddingRight,
            },
          ]}
        >
          <ButtonPressAnimation
            disabled={disabled || !currentlyPlayingAsset}
            onPress={handleAudioTitlePress}
            opacity={isDarkMode && disabled ? 0.6 : 1}
            scaleTo={0.95}
            {...props}
          >
            <Bold
              children={
                currentlyPlayingAsset
                  ? currentPlayingAssetTitle
                  : 'Ethereum Playlist'
              }
              numberOfLines={1}
              style={{ color: colors.orangeLight }}
            />
          </ButtonPressAnimation>
          <View style={styles.currentPlayingAssetDetails}>
            <Text numberOfLines={1} style={currentPlayingAssetDetailsStyle}>
              {isPlayingAsset ? 'playing' : 'not playing'}{' '}
            </Text>
            <Text numberOfLines={1} style={currentPlayingAssetDetailsStyle}>
              <>
                {currentlyPlayingAsset ? (
                  <CurrentSoundTimestampSpan />
                ) : (
                  `${playlist.length} tracks`
                )}
              </>
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.absolute,
          {
            transform: [
              {
                translateX: Animated.multiply(
                  Animated.subtract(1, progress),
                  remainingSpace - (FloatingActionButtonSize + paddingRight)
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
