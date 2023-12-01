/* eslint-disable no-nested-ternary */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AnimatePresence } from '@/components/animations/AnimatePresence';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import {
  Bleed,
  Box,
  Cover,
  Inset,
  Stack,
  Text,
  globalColors,
  useForegroundColor,
} from '@/design-system';
import { alignHorizontalToFlexAlign } from '@/design-system/layout/alignment';
import { IS_DEV } from '@/env';
import {
  useAccountProfile,
  useDimensions,
  useSwapCurrencyHandlers,
} from '@/hooks';
import { fonts } from '@/styles';
import { useTheme } from '@/theme';
import { safeAreaInsetValues } from '@/utils';
import { HapticFeedbackType } from '@/utils/haptics';
import { getNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { metadataClient } from '@/graphql';
import { signPersonalMessage } from '@/model/wallet';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { RainbowError, logger } from '@/logger';
import {
  OnboardPointsMutation,
  PointsErrorType,
} from '@/graphql/__generated__/metadata';
import { pointsQueryKey } from '@/resources/points';
import { queryClient } from '@/react-query';
import { Network } from '@/networks/types';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import * as i18n from '@/languages';
import { delay } from '@/utils/delay';
import { abbreviateNumber } from '@/helpers/utilities';
import {
  address as formatAddress,
  abbreviateEnsForDisplay,
} from '@/utils/abbreviations';

const SCREEN_BOTTOM_INSET = safeAreaInsetValues.bottom + 20;
const CHARACTER_WIDTH = 9.2725;

type ConsoleSheetParams = {
  ConsoleSheet: {
    referralCode?: string;
  };
};

export const ConsoleSheet = () => {
  const { params } = useRoute<RouteProp<ConsoleSheetParams, 'ConsoleSheet'>>();
  const referralCode = params?.referralCode;

  const [didConfirmOwnership, setDidConfirmOwnership] = useState(false);
  const [showSignInButton, setShowSignInButton] = useState(false);
  const [showSwapOrBuyButton, setShowSwapOrBuyButton] = useState(false);
  const [pointsProfile, setPointsProfile] = useState<OnboardPointsMutation>();
  const [hasEth, setHasEth] = useState(false);

  const { accountAddress } = useAccountProfile();
  const { goBack, navigate } = useNavigation();
  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: false,
    type: ExchangeModalTypes.swap,
  });

  useEffect(() => {
    (async () => {
      const ethAsset = await getNativeAssetForNetwork(
        Network.mainnet,
        accountAddress
      );
      setHasEth(!!Number(ethAsset?.balance?.amount));
    })();
  }, [accountAddress]);

  useEffect(() => {
    if (IS_DEV) {
      setDidConfirmOwnership(false);
      setShowSignInButton(false);
      setShowSwapOrBuyButton(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    let points;
    let signature;
    let challenge;
    const challengeResponse = await metadataClient.getPointsOnboardChallenge({
      address: accountAddress,
      referral: referralCode,
    });
    challenge = challengeResponse?.pointsOnboardChallenge;
    if (challenge) {
      const signatureResponse = await signPersonalMessage(challenge);
      signature = signatureResponse?.result;
      if (signature) {
        points = await metadataClient.onboardPoints({
          address: accountAddress,
          signature,
          referral: referralCode,
        });
      }
    }
    if (!points) {
      logger.error(new RainbowError('Error onboarding points user'), {
        referralCode,
        challenge,
        signature,
      });
      Alert.alert(i18n.t(i18n.l.points.console.generic_alert));
    } else {
      if (points.onboardPoints?.error) {
        const errorType = points.onboardPoints?.error?.type;
        if (errorType === PointsErrorType.ExistingUser) {
          Alert.alert(i18n.t(i18n.l.points.console.existing_user_alert));
        } else if (errorType === PointsErrorType.InvalidReferralCode) {
          Alert.alert(
            i18n.t(i18n.l.points.console.invalid_referral_code_alert)
          );
        }
      } else {
        setDidConfirmOwnership(true);
        setPointsProfile(points);
        queryClient.setQueryData(
          pointsQueryKey({ address: accountAddress }),
          points
        );
      }
    }
  }, [accountAddress, referralCode]);

  const swap = useCallback(async () => {
    goBack();
    await delay(1000);
    navigate(Routes.WALLET_SCREEN);
    await delay(1000);
    navigate(Routes.EXCHANGE_MODAL, {
      fromDiscover: true,
      params: {
        fromDiscover: true,
        onSelectCurrency: updateInputCurrency,
        title: i18n.t(i18n.l.swap.modal_types.swap),
        type: CurrencySelectionTypes.input,
      },
      screen: Routes.CURRENCY_SELECT_SCREEN,
    });
  }, [goBack, navigate, updateInputCurrency]);

  const getEth = useCallback(async () => {
    goBack();
    await delay(1000);
    navigate(Routes.WALLET_SCREEN);
    await delay(1000);
    navigate(Routes.ADD_CASH_SHEET);
  }, [goBack, navigate]);

  return (
    <Inset bottom={{ custom: SCREEN_BOTTOM_INSET }}>
      <Box
        height="full"
        justifyContent="flex-end"
        paddingHorizontal="16px"
        style={{ gap: 24 }}
        width="full"
      >
        <Animated.View style={styles.sheet}>
          <Box
            borderRadius={5}
            height={{ custom: 5 }}
            position="absolute"
            style={{
              alignSelf: 'center',
              backgroundColor: globalColors.white50,
            }}
            top={{ custom: 6 }}
            width={{ custom: 36 }}
          />
          <ClaimRetroactivePointsFlow
            pointsProfile={pointsProfile}
            didConfirmOwnership={didConfirmOwnership}
            setShowSignInButton={setShowSignInButton}
            setShowSwapOrBuyButton={setShowSwapOrBuyButton}
          />
        </Animated.View>
      </Box>
      <AnimatePresence
        condition={showSignInButton && !didConfirmOwnership}
        duration={300}
      >
        <NeonButton
          label={`􀎽 ${i18n.t(i18n.l.points.console.sign_in)}`}
          onPress={signIn}
        />
      </AnimatePresence>
      <AnimatePresence condition={showSwapOrBuyButton} duration={300}>
        <NeonButton
          color="#FEC101"
          label={
            hasEth
              ? `􀖅 ${i18n.t(i18n.l.points.console.try_a_swap)}`
              : `􀁍 ${i18n.t(i18n.l.points.console.get_some_eth)}`
          }
          onPress={hasEth ? swap : getEth}
        />
      </AnimatePresence>
    </Inset>
  );
};

const NeonButton = ({
  color,
  label,
  onPress,
}: {
  color?: string;
  label: string;
  onPress?: () => void;
}) => {
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const green = useForegroundColor('green');

  return (
    <Box
      alignItems="center"
      width="full"
      justifyContent="center"
      position="absolute"
      bottom={{ custom: 16 }}
    >
      <ButtonPressAnimation
        hapticType="impactHeavy"
        onPress={onPress}
        scaleTo={0.94}
        style={styles.neonButtonWrapper}
        transformOrigin="top"
      >
        <Animated.View
          style={[
            styles.neonButton,
            {
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: color || green,
              shadowColor: color || green,
              width: deviceWidth - 64,
            },
          ]}
        >
          <Cover>
            <Box
              borderRadius={11}
              height={{ custom: 46 }}
              style={[
                styles.neonButtonFill,
                {
                  backgroundColor: colors.alpha(color || green, 0.1),
                },
              ]}
              width={{ custom: deviceWidth - 66 }}
            />
          </Cover>
          <RNText
            style={[
              styles.neonButtonText,
              {
                textShadowColor: colors.alpha(color || green, 0.6),
              },
            ]}
          >
            <Text
              align="center"
              color={color ? { custom: color } : 'green'}
              size="20pt"
              weight="heavy"
            >
              {label}
            </Text>
          </RNText>
        </Animated.View>
      </ButtonPressAnimation>
    </Box>
  );
};

const ClaimRetroactivePointsFlow = ({
  didConfirmOwnership,
  onComplete,
  pointsProfile,
  setShowSignInButton,
  setShowSwapOrBuyButton,
}: {
  didConfirmOwnership: boolean;
  onComplete?: () => void;
  pointsProfile?: OnboardPointsMutation;
  setShowSignInButton: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSwapOrBuyButton: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { accountENS, accountAddress } = useAccountProfile();
  const [animationKey, setAnimationKey] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isCalculationComplete, setIsCalculationComplete] = useState(false);

  const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
    formatAddress(accountAddress, 4, 5)) as string;

  useEffect(() => {
    if (IS_DEV) {
      setAnimationKey(prevKey => prevKey + 1);
      setAnimationPhase(0);
      setIsCalculationComplete(false);
    }
  }, []);

  const onboardingData = pointsProfile?.onboardPoints?.user?.onboarding;
  const rainbowSwaps = onboardingData?.categories?.find(
    c => c.type === 'rainbow-swaps'
  );
  const metamaskSwaps = onboardingData?.categories?.find(
    c => c.type === 'metamask-swaps'
  );
  const rainbowBridges = onboardingData?.categories?.find(
    c => c.type === 'metamask-swaps'
  );
  const nftCollections = onboardingData?.categories?.find(
    c => c.type === 'nft-collections'
  );
  const historicBalance = onboardingData?.categories?.find(
    c => c.type === 'historic-balance'
  );
  const bonus = onboardingData?.categories?.find(c => c.type === 'bonus');

  const hasRetroactivePoints =
    rainbowSwaps?.earnings?.total ||
    metamaskSwaps?.earnings?.total ||
    rainbowBridges?.earnings?.total ||
    nftCollections?.earnings?.total ||
    historicBalance?.earnings?.total;

  return (
    <TypingAnimation key={animationKey}>
      {animationPhase === 0 && (
        <>
          <Paragraph>
            <Line>
              <AnimatedText
                delayStart={500}
                color={textColors.gray}
                textContent={`${i18n.t(i18n.l.points.console.account)}:`}
                weight="normal"
              />
              <AnimatedText
                color={textColors.account}
                enableHapticTyping
                delayStart={300}
                textContent={accountName}
              />
            </Line>
            <AnimatedText
              color={textColors.gray}
              delayStart={500}
              textContent={`> ${i18n.t(i18n.l.points.console.auth_required)}`}
              weight="normal"
            />
            <AnimatedText
              color={textColors.gray}
              onComplete={() => setShowSignInButton(true)}
              textContent={`> ${i18n.t(
                i18n.l.points.console.sign_in_with_wallet
              )}`}
              weight="normal"
            />
            <AnimatedText
              color={textColors.green}
              enableHapticTyping
              startWhenTrue={didConfirmOwnership}
              textContent={`> ${i18n.t(i18n.l.points.console.access_granted)}`}
            />
          </Paragraph>
          <Paragraph leftIndent={2}>
            <AnimatedText
              delayStart={1000}
              rainbowText
              textContent={rainbowText.row1}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row2}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row3}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row4}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row5}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row6}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row7}
              typingSpeed={10}
            />
            <AnimatedText
              rainbowText
              textContent={rainbowText.row8}
              typingSpeed={10}
            />
            <Line leftIndent={7}>
              <AnimatedText
                color={textColors.white}
                enableHapticTyping
                onComplete={() => {
                  const beginNextPhase = setTimeout(() => {
                    setAnimationKey(prevKey => prevKey + 1);
                    setAnimationPhase(1);
                  }, 2500);
                  onComplete?.();
                  return () => clearTimeout(beginNextPhase);
                }}
                textContent={rainbowText.row9}
                typingSpeed={100}
              />
            </Line>
          </Paragraph>
        </>
      )}
      {animationPhase === 1 &&
        (hasRetroactivePoints ? (
          <Stack separator={<LineBreak lines={3} />}>
            <Paragraph>
              <Line>
                <AnimatedText
                  delayStart={500}
                  color={textColors.gray}
                  skipAnimation
                  textContent={`${i18n.t(i18n.l.points.console.account)}:`}
                  weight="normal"
                />
                <AnimatedText
                  color={textColors.account}
                  skipAnimation
                  textContent={accountName}
                />
              </Line>
              <Line gap={0}>
                <AnimatedText
                  color={textColors.gray}
                  delayStart={1000}
                  textContent={`> ${i18n.t(
                    i18n.l.points.console.calculating_points
                  )}`}
                  weight="normal"
                />
                <AnimatedText
                  color={textColors.gray}
                  repeat={!isCalculationComplete}
                  textContent="..."
                  typingSpeed={500}
                  weight="normal"
                />
              </Line>
            </Paragraph>
            <Stack separator={<LineBreak lines={2} />}>
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={rainbowColors.blue}
                  enableHapticTyping
                  textContent={`${i18n.t(
                    i18n.l.points.console.rainbow_swaps
                  )}:`}
                />
                <AnimatedText
                  color={rainbowColors.blue}
                  delayStart={1000}
                  enableHapticTyping
                  textAlign="right"
                  textContent={`$${abbreviateNumber(
                    (rainbowSwaps?.data?.usd_amount ?? 0) +
                      (rainbowBridges?.data?.usd_amount ?? 0)
                  )}`}
                  typingSpeed={100}
                />
              </Line>
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={rainbowColors.green}
                  delayStart={1000}
                  enableHapticTyping
                  textContent={`${i18n.t(
                    i18n.l.points.console.rainbow_nfts_owned
                  )}:`}
                />
                <AnimatedText
                  color={rainbowColors.green}
                  delayStart={1000}
                  enableHapticTyping
                  textAlign="right"
                  textContent={`${nftCollections?.data?.owned_collections} of ${nftCollections?.data?.total_collections}`}
                  typingSpeed={100}
                />
              </Line>
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={rainbowColors.yellow}
                  delayStart={1000}
                  enableHapticTyping
                  textContent={`${i18n.t(
                    i18n.l.points.console.wallet_balance
                  )}:`}
                />
                <AnimatedText
                  color={rainbowColors.yellow}
                  delayStart={1000}
                  enableHapticTyping
                  textAlign="right"
                  textContent={`$${abbreviateNumber(
                    historicBalance?.data?.usd_amount ?? 0
                  )}`}
                  typingSpeed={100}
                />
              </Line>
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={rainbowColors.red}
                  delayStart={1000}
                  enableHapticTyping
                  textContent={`${i18n.t(
                    i18n.l.points.console.metamask_swaps
                  )}:`}
                />
                <AnimatedText
                  color={rainbowColors.red}
                  delayStart={1000}
                  enableHapticTyping
                  textAlign="right"
                  textContent={`$${abbreviateNumber(
                    metamaskSwaps?.data?.usd_amount ?? 0
                  )}`}
                  typingSpeed={100}
                />
              </Line>
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={rainbowColors.purple}
                  delayStart={1000}
                  enableHapticTyping
                  textContent={`${i18n.t(i18n.l.points.console.bonus_points)}:`}
                />
                <AnimatedText
                  color={rainbowColors.purple}
                  delayStart={1000}
                  enableHapticTyping
                  onComplete={() => setIsCalculationComplete(true)}
                  textAlign="right"
                  textContent={`+ ${bonus?.earnings?.total}`}
                  typingSpeed={100}
                />
              </Line>
            </Stack>
            <Paragraph gap={30}>
              <AnimatedText
                color={textColors.gray}
                delayStart={1000}
                textContent={`> ${i18n.t(
                  i18n.l.points.console.calculation_complete
                )}`}
                weight="normal"
              />
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={textColors.white}
                  delayStart={1000}
                  enableHapticTyping
                  textContent={`${i18n.t(
                    i18n.l.points.console.points_earned
                  )}:`}
                />
                <AnimatedText
                  color={textColors.white}
                  delayStart={1000}
                  enableHapticTyping
                  hapticType="impactHeavy"
                  textAlign="right"
                  textContent={(
                    onboardingData?.earnings?.total ?? 0
                  ).toLocaleString('en-US')}
                  typingSpeed={100}
                />
              </Line>
            </Paragraph>
          </Stack>
        ) : (
          <Stack separator={<LineBreak lines={2} />}>
            <Paragraph>
              <Line>
                <AnimatedText
                  delayStart={500}
                  color={textColors.gray}
                  skipAnimation
                  textContent={`${i18n.t(i18n.l.points.console.account)}:`}
                  weight="normal"
                />
                <AnimatedText
                  color={textColors.account}
                  skipAnimation
                  textContent={accountName}
                />
              </Line>
              <AnimatedText
                color={textColors.green}
                textContent={`> ${i18n.t(
                  i18n.l.points.console.registration_complete
                )}`}
              />
            </Paragraph>
            <Line alignHorizontal="justify">
              <AnimatedText
                color={rainbowColors.purple}
                delayStart={1000}
                enableHapticTyping
                textContent={`${i18n.t(i18n.l.points.console.bonus_points)}:`}
              />
              <AnimatedText
                color={rainbowColors.purple}
                delayStart={1000}
                enableHapticTyping
                textAlign="right"
                textContent={`+ ${bonus?.earnings?.total}`}
                typingSpeed={100}
              />
            </Line>
            <AnimatedText
              color={textColors.gray}
              delayStart={1000}
              onComplete={() => setShowSwapOrBuyButton(true)}
              weight="normal"
              multiline
              textContent={i18n.t(i18n.l.points.console.claim_bonus_paragraph)}
            />
          </Stack>
        ))}
    </TypingAnimation>
  );
};

const AnimationContext = createContext({
  currentSequenceIndex: 0,
  getNextAnimationIndex: () => {
    return;
  },
  incrementSequence: () => {
    return;
  },
});

export const useAnimationContext = () => useContext(AnimationContext);

export const TypingAnimation = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const animationIndexRef = useRef(0);

  const getNextAnimationIndex = useCallback(() => {
    const currentIndex = animationIndexRef.current;
    animationIndexRef.current += 1;
    return currentIndex;
  }, []);

  const incrementSequence = useCallback(() => {
    setCurrentSequenceIndex(prevIndex => prevIndex + 1);
  }, []);

  useEffect(() => {
    if (IS_DEV) {
      setCurrentSequenceIndex(0);
      animationIndexRef.current = 0;
    }
  }, []);

  return (
    <AnimationContext.Provider
      value={{ currentSequenceIndex, getNextAnimationIndex, incrementSequence }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

type AnimatedTextProps = {
  color?: { text: string; shadow: string };
  delayStart?: number;
  disableShadow?: boolean;
  enableHapticTyping?: boolean;
  hapticType?: HapticFeedbackType;
  multiline?: boolean;
  onComplete?: () => void;
  opacity?: number;
  rainbowText?: boolean;
  repeat?: boolean;
  shadowOpacity?: number;
  skipAnimation?: boolean;
  startWhenTrue?: boolean;
  textAlign?: 'center' | 'left' | 'right';
  textContent: string;
  typingSpeed?: number;
  weight?: 'bold' | 'normal';
} & ({ color: { text: string; shadow: string } } | { rainbowText: boolean });

const AnimatedText = ({
  color,
  delayStart,
  disableShadow,
  enableHapticTyping,
  hapticType = 'selection',
  multiline,
  onComplete,
  opacity,
  rainbowText,
  repeat,
  shadowOpacity,
  skipAnimation,
  startWhenTrue,
  textAlign,
  textContent,
  typingSpeed = 20,
  weight = 'bold',
}: AnimatedTextProps) => {
  const { colors } = useTheme();
  const {
    currentSequenceIndex,
    getNextAnimationIndex,
    incrementSequence,
  } = useAnimationContext();
  const index = useRef(getNextAnimationIndex()).current;
  const displayedCharacters = useSharedValue(
    skipAnimation ? textContent.length : 0
  );
  const [displayedText, setDisplayedText] = useState(
    skipAnimation ? textContent : ''
  );

  const rainbowTextColors = useMemo(
    () => (rainbowText ? generateRainbowColors(textContent) : undefined),
    [rainbowText, textContent]
  );

  const getRainbowTextStyle = useCallback(
    (i: number) => ({
      color: rainbowTextColors?.[i]?.text,
      opacity,
      textAlign,
      textShadowColor: disableShadow
        ? 'transparent'
        : shadowOpacity && rainbowTextColors?.[i]?.shadow
        ? colors.alpha(rainbowTextColors?.[i]?.shadow, shadowOpacity)
        : rainbowTextColors?.[i]?.shadow,
    }),
    [
      colors,
      disableShadow,
      opacity,
      rainbowTextColors,
      shadowOpacity,
      textAlign,
    ]
  );

  const textStyle = useMemo(
    () => ({
      color: rainbowText ? undefined : color?.text,
      fontWeight: weight,
      opacity,
      textAlign,
      textShadowColor: disableShadow
        ? 'transparent'
        : rainbowText
        ? undefined
        : shadowOpacity && color?.shadow
        ? colors.alpha(color?.shadow, shadowOpacity)
        : color?.shadow,
    }),
    [
      color,
      colors,
      disableShadow,
      opacity,
      rainbowText,
      shadowOpacity,
      textAlign,
      weight,
    ]
  );

  const animationConfig = useMemo(
    () => ({
      duration: textContent.length * typingSpeed,
      easing: Easing.linear,
    }),
    [textContent, typingSpeed]
  );

  const onAnimationComplete = useCallback(
    (isFinished?: boolean) => {
      'worklet';
      if (isFinished) {
        if (onComplete) {
          runOnJS(onComplete)();
        }
        runOnJS(incrementSequence)();

        if (repeat) {
          displayedCharacters.value = withRepeat(
            withSequence(
              withTiming(textContent.length, { duration: typingSpeed }),
              withTiming(0, { duration: 0 }),
              withTiming(0, { duration: typingSpeed }),
              withTiming(textContent.length, animationConfig)
            ),
            -1,
            false
          );
        }
      }
    },
    [
      animationConfig,
      displayedCharacters,
      incrementSequence,
      onComplete,
      repeat,
      textContent.length,
      typingSpeed,
    ]
  );

  useAnimatedReaction(
    () => ({ displayedValue: displayedCharacters.value, repeat }),
    (current, previous) => {
      if (
        !previous?.displayedValue ||
        Math.round(current.displayedValue) !==
          Math.round(previous?.displayedValue)
      ) {
        const newText =
          textContent.slice(0, Math.round(current.displayedValue)) || ' ';

        if (current.repeat === false && newText === textContent) {
          runOnJS(setDisplayedText)(newText);
          cancelAnimation(displayedCharacters);
          displayedCharacters.value = textContent.length;
          return;
        }

        runOnJS(setDisplayedText)(newText);
        if (
          enableHapticTyping &&
          Math.round(current.displayedValue) &&
          newText[newText.length - 1] !== ' '
        ) {
          runOnJS(triggerHapticFeedback)(hapticType);
        }
      }
    }
  );

  useEffect(() => {
    if (
      index !== undefined &&
      currentSequenceIndex === index &&
      (startWhenTrue === undefined || startWhenTrue)
    ) {
      if (!skipAnimation) {
        const timer = setTimeout(() => {
          displayedCharacters.value = 0;
          displayedCharacters.value = withTiming(
            textContent.length,
            animationConfig,
            onAnimationComplete
          );
        }, delayStart || 0);

        return () => {
          clearTimeout(timer);
        };
      } else {
        onComplete?.();
        incrementSequence();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSequenceIndex, index, startWhenTrue, textContent]);

  return (
    <Bleed space="16px">
      <RNText
        style={[styles.text, textStyle, multiline ? { lineHeight: 20.25 } : {}]}
      >
        {rainbowText
          ? displayedText.split('').map((char, i) => (
              <RNText key={i} style={getRainbowTextStyle(i)}>
                {char}
              </RNText>
            ))
          : displayedText}
      </RNText>
    </Bleed>
  );
};

const Line = ({
  alignHorizontal,
  children,
  gap = 10,
  leftIndent = 0,
}: {
  alignHorizontal?: 'center' | 'justify' | 'left' | 'right';
  children: React.ReactNode;
  gap?: number;
  leftIndent?: number;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        justifyContent: alignHorizontal
          ? alignHorizontalToFlexAlign[alignHorizontal]
          : undefined,
        paddingLeft: leftIndent * CHARACTER_WIDTH,
      }}
    >
      {children}
    </View>
  );
};

const LineBreak = ({ lines = 1 }: { lines?: number }) => {
  return <View style={{ height: lines * 15 }} />;
};

const Paragraph = ({
  children,
  gap = 15,
  leftIndent = 0,
}: {
  children: React.ReactNode;
  gap?: number;
  leftIndent?: number;
}) => {
  return (
    <View
      style={{
        flexWrap: 'wrap',
        gap,
        paddingLeft: leftIndent * CHARACTER_WIDTH,
      }}
    >
      {children}
    </View>
  );
};

const generateRainbowColors = (
  text: string
): Array<{ text: string; shadow: string }> | undefined => {
  let colorIndex = 0;
  let repeatCount = 0;
  const colorKeys: string[] = Object.keys(rainbowColors);
  const colors: Array<{ text: string; shadow: string }> = [];
  const repeatLength: number = Math.floor(text.length / (colorKeys.length * 2));

  text.split('').forEach(() => {
    if (repeatCount >= repeatLength + Math.round(Math.random())) {
      repeatCount = 0;
      colorIndex = (colorIndex + 1) % colorKeys.length;
    }
    colors.push(
      rainbowColors[colorKeys[colorIndex] as keyof typeof rainbowColors]
    );
    repeatCount += 1;
  });

  return colors;
};

const triggerHapticFeedback = (hapticType: HapticFeedbackType) =>
  ReactNativeHapticFeedback.trigger(hapticType);

const styles = StyleSheet.create({
  neonButtonWrapper: {
    alignSelf: 'center',
  },
  neonButton: {
    alignContent: 'center',
    backgroundColor: '#191A1C',
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 48,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
  },
  neonButtonFill: {
    marginLeft: -((1 / 3) * 2),
    marginTop: -((1 / 3) * 2),
  },
  neonButtonText: {
    margin: -16,
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  sheet: {
    backgroundColor: '#191A1C',
    borderColor: 'rgba(245, 248, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 444,
    gap: 45,
    paddingHorizontal: 30,
    paddingVertical: 45,
    width: '100%',
    zIndex: -1,
  },
  text: {
    fontFamily: fonts.family.SFMono,
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 11,
    overflow: 'visible',
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});

const rainbowColors = {
  blue: { text: '#31BCC4', shadow: 'rgba(49, 188, 196, 0.8)' },
  green: { text: '#57EA5F', shadow: 'rgba(87, 234, 95, 0.8)' },
  yellow: { text: '#F0D83F', shadow: 'rgba(240, 216, 63, 0.8)' },
  red: { text: '#DF5337', shadow: 'rgba(223, 83, 55, 0.8)' },
  purple: { text: '#B756A7', shadow: 'rgba(183, 86, 167, 0.8)' },
};

const textColors = {
  account: { text: '#FEC101', shadow: 'rgba(254, 193, 1, 0.8)' },
  gray: { text: '#94969B', shadow: 'rgba(148, 150, 155, 0.8)' },
  green: { text: '#3ECF5B', shadow: 'rgba(62, 207, 91, 0.8)' },
  white: { text: '#FFFFFF', shadow: 'rgba(255, 255, 255, 0.8)' },
};

const rainbowText = {
  row1: '\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row2: ' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row3: '  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row4: '   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row5: '    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row6: '     \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row7: '      \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row8: '       \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row9: ' WELCOME TO POINTS ',
};
