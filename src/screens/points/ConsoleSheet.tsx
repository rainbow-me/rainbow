/* eslint-disable no-nested-ternary */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Inset, Stack, globalColors } from '@/design-system';
import { useAccountProfile } from '@/hooks';
import { metadataPOSTClient } from '@/graphql';
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
import * as i18n from '@/languages';
import { abbreviateNumber } from '@/helpers/utilities';
import {
  address as formatAddress,
  abbreviateEnsForDisplay,
} from '@/utils/abbreviations';
import { usePointsTweetIntentQuery } from '@/resources/pointsTweetIntent/pointsTweetIntentQuery';
import { useNavigation } from '@/navigation';

import Line from './components/Line';
import {
  POINTS_TWEET_INTENT_ID,
  SCREEN_BOTTOM_INSET,
  rainbowColors,
  rainbowText,
  textColors,
} from './constants';
import { TypingAnimation } from './contexts/AnimationContext';
import Paragraph from './components/Paragraph';
import { AnimatedText } from './components/AnimatedText';
import LineBreak from './components/LineBreak';

type ConsoleSheetParams = {
  ConsoleSheet: {
    referralCode?: string;
  };
};

type ClaimFlowRef = {
  isCalculationComplete: boolean;
  setIsCalculationComplete: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ConsoleSheet = () => {
  const { params } = useRoute<RouteProp<ConsoleSheetParams, 'ConsoleSheet'>>();
  const referralCode = params?.referralCode;

  const claimFlowRef = useRef<ClaimFlowRef>(null);
  const { navigate } = useNavigation();

  const [pointsProfile, setPointsProfile] = useState<OnboardPointsMutation>();

  const { accountAddress } = useAccountProfile();

  const signIn = useCallback(async () => {
    let points;
    let signature;
    const challengeResponse = await metadataPOSTClient.getPointsOnboardChallenge(
      {
        address: accountAddress,
        referral: referralCode,
      }
    );

    const challenge = challengeResponse?.pointsOnboardChallenge;
    if (challenge) {
      const signatureResponse = await signPersonalMessage(challenge);
      signature = signatureResponse?.result;
      if (signature) {
        points = await metadataPOSTClient.onboardPoints({
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
            ref={claimFlowRef}
            pointsProfile={pointsProfile}
          />
        </Animated.View>
      </Box>
      {/* <AnimatePresence
        condition={
          claimFlowRef.current?.showSignInButton && !didConfirmOwnership
        }
        duration={300}
      >
        <NeonButton
          label={`􀎽 ${i18n.t(i18n.l.points.console.sign_in)}`}
          onPress={signIn}
        />
      </AnimatePresence>
      <AnimatePresence
        condition={
          animationPhase === 1 && claimFlowRef.current?.isCalculationComplete
        }
        duration={300}
      >
        <NeonButton
          color="#FEC101"
          label={`􀖅 ${i18n.t(i18n.l.points.console.proceed_to_share)}`}
          onPress={() => setAnimationPhase(2)}
        />
      </AnimatePresence>
      <AnimatePresence
        condition={
          animationPhase === 2 && showShareButtons && !!tweetIntent.length
        }
        duration={300}
      >
        <Inline wrap={false} horizontalSpace={{ custom: 12 }}>
          <NeonButton
            color="#F5F8FF8F"
            label={`􀖅 ${i18n.t(i18n.l.points.console.skip_referral)}`}
            onPress={() => setAnimationPhase(3)}
          />

          <NeonButton
            color="#FEC101"
            label={`􀖅 ${i18n.t(i18n.l.points.console.proceed_to_share)}`}
            onPress={() => {
              Linking.openURL(tweetIntent);
              setDidShare(true);
              setAnimationPhase(3);
            }}
          />
        </Inline>
      </AnimatePresence>

      <AnimatePresence
        condition={animationPhase === 3 && showDoneButton}
        duration={300}
      >
        <NeonButton
          color="#FEC101"
          label={`􀖅 ${i18n.t(i18n.l.points.console.complete_onboarding)}`}
          onPress={() => navigate(Routes.POINTS_SCREEN)}
        />
      </AnimatePresence> */}
    </Inset>
  );
};

const ClaimRetroactivePointsFlow = forwardRef(
  (
    {
      pointsProfile,
    }: {
      pointsProfile?: OnboardPointsMutation;
    },
    ref
  ) => {
    const { accountENS, accountAddress } = useAccountProfile();
    const [animationKey, setAnimationKey] = useState(0);

    const [isCalculationComplete, setIsCalculationComplete] = useState(false);
    const [didConfirmOwnership, setDidConfirmOwnership] = useState(false);
    const [showSignInButton, setShowSignInButton] = useState(false);
    const [animationPhase, setAnimationPhase] = useState(0);
    const [showShareButtons, setShowShareButtons] = useState(false);
    const [tweetIntent, setTweetIntent] = useState<string>('');
    const [didShare, setDidShare] = useState(false);
    const [showDoneButton, setShowDoneButton] = useState(false);

    const accountName = (abbreviateEnsForDisplay(accountENS, 10) ||
      formatAddress(accountAddress, 4, 5)) as string;

    useEffect(() => {
      setAnimationKey(prevKey => prevKey + 1);
    }, []);

    useImperativeHandle(ref, () => ({
      isCalculationComplete,
      setIsCalculationComplete,
      didConfirmOwnership,
      setDidConfirmOwnership,
      showSignInButton,
      showShareButtons,
      tweetIntent,
      didShare,
      setDidShare,
      showDoneButton,
    }));

    usePointsTweetIntentQuery(
      {
        id: POINTS_TWEET_INTENT_ID,
      },
      {
        enabled: animationPhase === 2,
        onSuccess: data => {
          if (!data.pointsTweetIntent) {
            return;
          }

          try {
            const tweetIntent = data.pointsTweetIntent;
            const pointsValue =
              pointsProfile?.onboardPoints?.user.onboarding.earnings.total;
            if (!pointsValue) {
              // TODO: Fallback to some default msg
              return;
            }

            // do a string replace to replace {POINTS_VALUE} with their points value
            let text = tweetIntent.text?.replace(
              '{POINTS_VALUE}',
              pointsValue?.toString()
            );
            if (Number(metamaskSwaps?.earnings.total) > 0) {
              text += `, including ${metamaskSwaps?.earnings.total} points because I switched from Metamask`;
            }

            // build the tweet intent url
            let intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              text ?? ''
            )}`;
            if (tweetIntent.url) {
              intent += `&url=${encodeURIComponent(tweetIntent.url)}`;
            }

            if (tweetIntent.via) {
              intent += `&via=${encodeURIComponent(tweetIntent.via)}`;
            }

            console.log({ intent });
            setTweetIntent(intent);
          } catch (e) {
            console.log(e);
            // TODO: add logging
          }
        },
      }
    );

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

    console.log({ animationKey, animationPhase });

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
                textContent={`> ${i18n.t(
                  i18n.l.points.console.access_granted
                )}`}
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
                    textContent={`${i18n.t(
                      i18n.l.points.console.bonus_points
                    )}:`}
                  />
                  <AnimatedText
                    color={rainbowColors.purple}
                    delayStart={1000}
                    enableHapticTyping
                    onComplete={() => {
                      setIsCalculationComplete(true);
                    }}
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
                  color={textColors.gray}
                  textContent={`> ${i18n.t(
                    i18n.l.points.console.calculating_points
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
                onComplete={() => {
                  setIsCalculationComplete(true);
                }}
                weight="normal"
                multiline
                textContent={i18n.t(
                  i18n.l.points.console.claim_bonus_paragraph
                )}
              />
            </Stack>
          ))}

        {animationPhase === 2 && (
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
                color={textColors.gray}
                textContent={`> ${i18n.t(
                  i18n.l.points.console.referral_link_is_ready
                )}`}
              />
            </Paragraph>
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              weight="normal"
              multiline
              textContent={`${i18n.t(
                i18n.l.points.console.referral_link_bonus_text
              )}:`}
            />
            <AnimatedText
              color={rainbowColors.yellow}
              delayStart={1000}
              onComplete={() => {
                setAnimationKey(prevKey => prevKey + 1);
                setShowShareButtons(true);
              }}
              weight="normal"
              multiline
              textContent={i18n.t(
                i18n.l.points.console.referral_link_bonus_text_extended
              )}
            />
          </Stack>
        )}

        {animationPhase === 3 && (
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
                  i18n.l.points.console.referral_link_is_ready
                )}`}
              />
            </Paragraph>
            {didShare && (
              <Line alignHorizontal="justify">
                <AnimatedText
                  color={rainbowColors.yellow}
                  delayStart={1000}
                  enableHapticTyping
                  textContent={`${i18n.t(i18n.l.points.console.share_bonus)}:`}
                />
                <AnimatedText
                  color={rainbowColors.yellow}
                  delayStart={1000}
                  enableHapticTyping
                  textAlign="right"
                  textContent={`+ 250`} // TODO: Where does this amount come from?
                />
              </Line>
            )}
            <Paragraph>
              <AnimatedText
                delayStart={500}
                color={textColors.gray}
                textContent={`${i18n.t(
                  i18n.l.points.console.share_bonus_paragraph_one
                )}:`}
                weight="normal"
              />
              <AnimatedText
                color={textColors.gray}
                delayStart={500}
                textContent={`> ${i18n.t(
                  i18n.l.points.console.share_bonus_paragraph_two
                )}`}
                weight="normal"
              />
              <AnimatedText
                color={textColors.gray}
                onComplete={() => setShowDoneButton(true)}
                textContent={`> ${i18n.t(
                  i18n.l.points.console.share_bonus_paragraph_three
                )}`}
                weight="normal"
              />
            </Paragraph>
          </Stack>
        )}
      </TypingAnimation>
    );
  }
);

ClaimRetroactivePointsFlow.displayName = 'ClaimRetroactivePointsFlow';

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#191A1C',
    borderColor: 'rgba(245, 248, 255, 0.06)',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1.5,
    height: 504,
    gap: 45,
    paddingHorizontal: 30,
    paddingVertical: 45,
    width: '100%',
    zIndex: -1,
  },
});
