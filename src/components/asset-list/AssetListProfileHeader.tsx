import Clipboard from '@react-native-community/clipboard';
import lang from 'i18n-js';
import * as React from 'react';
import { Text as NativeText, PressableProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { ImgixImage } from '../images';
import Skeleton, { FakeText } from '../skeleton/Skeleton';
import { enableActionsOnReadOnlyWallet } from '@/config';
import {
  AccentColorProvider,
  Box,
  Cover,
  Heading,
  Inline,
  Stack,
  Text,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { maybeSignUri } from '@/handlers/imgix';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import {
  useAccountProfile,
  useDimensions,
  useOnAvatarPress,
  usePersistentDominantColorFromImage,
  useSwapCurrencyHandlers,
  useWallets,
} from '@/hooks';
import { delayNext } from '@/hooks/useMagicAutofocus';
import { useNavigation } from '@/navigation';
import { AppState } from '@/redux/store';
import { useTheme } from '@/theme';
import {
  getFirstGrapheme,
  showActionSheetWithOptions,
  watchingAlert,
} from '@/utils';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import Routes from '@rainbow-me/routes';
import { StickyHeader } from './RecyclerAssetList2/core/StickyHeaders';
import { FloatingEmojis } from '../floating-emojis';
import showWalletErrorAlert from '@/helpers/support';
import { analytics } from '@/analytics';

export const AssetListProfileHeaderHeight = 240;
export const AssetListProfileHeaderCompactHeight = 52;

const horizontalInset = 19;
const accountNameLeftOffset = 15;

export function AssetListProfileWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      alignItems="center"
      paddingHorizontal={`${horizontalInset}px`}
      paddingTop="10px"
      width="full"
      marginTop={{ custom: -AssetListProfileHeaderCompactHeight }}
    >
      {children}
    </Box>
  );
}

export function AssetListProfileHeaderCompact() {
  return (
    <StickyHeader name="test" offset={140}>
      <Box
        background="body"
        justifyContent="center"
        height={{ custom: AssetListProfileHeaderCompactHeight }}
        paddingHorizontal={`${horizontalInset}px`}
        width="full"
      >
        <AssetListProfileName />
      </Box>
    </StickyHeader>
  );
}

// ///////////////////////////////////////////////////////////////
// Account Avatar

export const AssetListProfileAvatarHeight = 80;
export const AssetListProfileAvatarSize = 80;

export function AssetListProfileAvatar({
  size = AssetListProfileAvatarSize,
}: {
  size?: number;
}) {
  const { colors } = useTheme();
  const { colorMode } = useColorMode();

  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const { onAvatarPress } = useOnAvatarPress({ screenType: 'wallet' });

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '') ?? ''
  );

  let accentColor = colors.skeleton;
  if (accountImage) {
    accentColor = dominantColor || colors.skeleton;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }

  const hasLoaded = accountSymbol || accountImage;

  const opacity = useDerivedValue(() => {
    return hasLoaded ? 1 : 0;
  });
  const fadeInStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, {
        duration: 100,
        easing: Easing.linear,
      }),
    };
  });

  const scale = useDerivedValue(() => {
    return hasLoaded ? 1 : 0.9;
  });
  const expandStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(scale.value, {
            damping: 12,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
            stiffness: 280,
          }),
        },
      ],
    };
  });

  return (
    <AccentColorProvider color={accentColor}>
      <Animated.View style={[expandStyle]}>
        <ButtonPressAnimation onPress={onAvatarPress} scale={0.8}>
          <Box
            alignItems="center"
            background="accent"
            borderRadius={size / 2}
            height={{ custom: size }}
            justifyContent="center"
            shadow={
              hasLoaded
                ? colorMode === 'dark'
                  ? '30px light'
                  : '30px light accent'
                : undefined
            }
            style={{
              backgroundColor: accountImage ? colors.skeleton : accentColor,
            }}
            width={{ custom: size }}
          >
            <>
              {!hasLoaded && (
                <Cover alignHorizontal="center">
                  <Box height={{ custom: size }} width="full">
                    <Skeleton animated>
                      <Box
                        background="body"
                        borderRadius={size / 2}
                        height={{ custom: size }}
                        width={{ custom: size }}
                      />
                    </Skeleton>
                  </Box>
                </Cover>
              )}
              <Animated.View style={[fadeInStyle]}>
                {accountImage ? (
                  <Box
                    as={ImgixImage}
                    borderRadius={size / 2}
                    height={{ custom: size }}
                    source={{ uri: accountImage }}
                    width={{ custom: size }}
                  />
                ) : (
                  <EmojiAvatar size={size} />
                )}
              </Animated.View>
            </>
          </Box>
        </ButtonPressAnimation>
      </Animated.View>
    </AccentColorProvider>
  );
}

export function EmojiAvatar({ size }: { size: number }) {
  const { colors } = useTheme();
  const { accountColor, accountSymbol } = useAccountProfile();

  const accentColor =
    accountColor !== undefined
      ? colors.avatarBackgrounds[accountColor]
      : colors.skeleton;

  return (
    <AccentColorProvider color={accentColor}>
      <Box
        background="accent"
        borderRadius={size / 2}
        height={{ custom: size }}
        width={{ custom: size }}
      >
        <Cover alignHorizontal="center" alignVertical="center">
          <Box>
            <NativeText style={{ fontSize: 48 }}>
              {typeof accountSymbol === 'string' &&
                getFirstGrapheme(accountSymbol.toUpperCase())}
            </NativeText>
          </Box>
        </Cover>
      </Box>
    </AccentColorProvider>
  );
}

// ///////////////////////////////////////////////////////////////
// Account Name

export const AssetListProfileNameHeight = 16;

export function AssetListProfileName() {
  const { accountENS, accountName } = useAccountProfile();

  const { width: deviceWidth } = useDimensions();

  const { navigate } = useNavigation();
  const onPressName = () => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  };

  const iconColor = useForegroundColor('secondary');

  const name = accountENS
    ? abbreviateEnsForDisplay(accountENS, 20)
    : accountName;

  const caretIconWidth = 22;
  const maxWidth =
    deviceWidth -
    (caretIconWidth + accountNameLeftOffset) -
    horizontalInset * 2;

  return (
    <>
      {name && (
        <ButtonPressAnimation onPress={onPressName} scale={0.8}>
          <Inline alignVertical="center" space="4px" wrap={false}>
            <Box style={{ maxWidth }}>
              <Text numberOfLines={1} size="23px" weight="bold">
                {name}
              </Text>
            </Box>
            <Icon
              color={iconColor}
              height={9}
              name="caretDownIcon"
              width={caretIconWidth}
            />
          </Inline>
        </ButtonPressAnimation>
      )}
    </>
  );
}

// ///////////////////////////////////////////////////////////////
// Balance

export const AssetListProfileBalanceHeight = 24;

export function AssetListProfileBalance({
  totalValue,
}: {
  totalValue: string;
}) {
  const isLoadingAssets = useSelector(
    (state: AppState) => state.data.isLoadingAssets
  );

  const placeholderWidth = 200;

  return (
    <>
      {isLoadingAssets ? (
        <Box height={{ custom: 34 }} width={{ custom: placeholderWidth }}>
          <Skeleton>
            <FakeText height={34} width={placeholderWidth} />
          </Skeleton>
        </Box>
      ) : (
        <Heading
          numberOfLines={1}
          size={totalValue?.length > 14 ? '26px' : '34px'}
          weight="heavy"
        >
          {totalValue}
        </Heading>
      )}
    </>
  );
}

// ///////////////////////////////////////////////////////////////
// Buttons

export const AssetListProfileActionButtonsHeight = 80;

export function AssetListProfileActionButtons() {
  const { colors } = useTheme();
  const { accountColor, accountImage } = useAccountProfile();

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '') ?? ''
  );

  let accentColor = colors.white;
  if (accountImage) {
    accentColor = dominantColor || colors.white;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }

  const hasAvatarLoaded = !accountImage && accountColor;
  const hasImageColorLoaded = state === 2 || state === 3;
  const hasLoaded = hasAvatarLoaded || hasImageColorLoaded;

  const scale = useDerivedValue(() => {
    return hasLoaded ? 1 : 0.9;
  });
  const expandStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(scale.value, {
            damping: 12,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
            stiffness: 280,
          }),
        },
      ],
    };
  });

  if (!hasLoaded) return null;
  return (
    <AccentColorProvider color={accentColor}>
      <Inline space="24px" wrap={false}>
        <Animated.View style={[expandStyle]}>
          <CopyButton />
        </Animated.View>
        <Animated.View style={[expandStyle]}>
          <SwapButton />
        </Animated.View>
        <Animated.View style={[expandStyle]}>
          <SendButton />
        </Animated.View>
        <Animated.View style={[expandStyle]}>
          <MoreButton />
        </Animated.View>
      </Inline>
    </AccentColorProvider>
  );
}

function ActionButton({
  children,
  icon,
  onPress,
}: {
  children: string;
  icon: string;
  onPress: PressableProps['onPress'];
}) {
  const { colorMode } = useColorMode();
  return (
    <ButtonPressAnimation onPress={onPress} scale={0.8}>
      <Stack alignHorizontal="center" space="10px">
        <Box
          alignItems="center"
          background="accent"
          borderRadius={60}
          height={{ custom: 60 }}
          justifyContent="center"
          shadow={{
            custom: {
              ios: [
                {
                  offset: { x: 0, y: 8 },
                  blur: 24,
                  opacity: 0.3,
                  color: colorMode === 'dark' ? 'shadow' : 'accent',
                },
                {
                  offset: { x: 0, y: 2 },
                  blur: 6,
                  opacity: 0.04,
                  color: 'shadow',
                },
              ],
              android: {
                elevation: 21,
                opacity: 1,
                color: colorMode === 'dark' ? 'shadow' : 'accent',
              },
            },
          }}
          width={{ custom: 60 }}
        >
          <Text size="icon 23px" weight="bold">
            {icon}
          </Text>
        </Box>
        <Text color="secondary80" size="14px" weight="medium">
          {children}
        </Text>
      </Stack>
    </ButtonPressAnimation>
  );
}

function CopyButton() {
  const { accountAddress } = useAccountProfile();
  const { isDamaged } = useWallets();

  const onNewEmoji = React.useRef<() => void>();

  const handlePress = React.useCallback(() => {
    if (isDamaged) showWalletErrorAlert();
    onNewEmoji?.current && onNewEmoji.current();
    Clipboard.setString(accountAddress);
  }, [accountAddress, isDamaged]);

  return (
    <Box>
      {/* @ts-expect-error – JS component */}
      <FloatingEmojis
        distance={150}
        duration={500}
        fadeOut={false}
        scaleTo={0}
        size={50}
        wiggleFactor={0}
        // @ts-expect-error – JS component
        setOnNewEmoji={newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji)}
      />
      <ActionButton icon="􀐅" onPress={handlePress}>
        Copy
      </ActionButton>
    </Box>
  );
}

function SwapButton() {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: false,
    type: ExchangeModalTypes.swap,
  });

  const handlePress = React.useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      android && delayNext();
      navigate(Routes.EXCHANGE_MODAL, {
        fromDiscover: true,
        params: {
          fromDiscover: true,
          onSelectCurrency: updateInputCurrency,
          title: lang.t('swap.modal_types.swap'),
          type: CurrencySelectionTypes.input,
        },
        screen: Routes.CURRENCY_SELECT_SCREEN,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate, updateInputCurrency]);

  return (
    <ActionButton icon="􀖅" onPress={handlePress}>
      Swap
    </ActionButton>
  );
}

function SendButton() {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();

  const handlePress = React.useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SEND_FLOW);
    } else {
      watchingAlert();
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    <ActionButton icon="􀈟" onPress={handlePress}>
      Send
    </ActionButton>
  );
}

function MoreButton() {
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();

  const handlePressAddCash = () => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });

    if (ios) {
      navigate(Routes.ADD_CASH_FLOW);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      });
    }
  };

  const items = {
    addCash: 'Add Cash',
    myQRCode: 'My QR Code',
    cancel: 'Cancel',
  };
  const options = [
    items.addCash,
    items.myQRCode,
    ios ? items.cancel : null,
  ].filter(x => x);

  const handlePress = () => {
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1 },
      (index: number) => {
        if (options[index] === items.addCash) {
          handlePressAddCash();
        }
        if (options[index] === items.myQRCode) {
          navigate(Routes.RECEIVE_MODAL);
        }
      }
    );
  };

  return (
    <ActionButton icon="􀍡" onPress={handlePress}>
      More
    </ActionButton>
  );
}
