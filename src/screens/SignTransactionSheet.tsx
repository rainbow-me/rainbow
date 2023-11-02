import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations';
import { ChainBadge, CoinIcon } from '@/components/coin-icon';
import { ImgixImage } from '@/components/images';
import { SheetActionButton } from '@/components/sheet';
import {
  Bleed,
  Box,
  Columns,
  Inline,
  Inset,
  Stack,
  Text,
  globalColors,
  useBackgroundColor,
  useForegroundColor,
} from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { AssetType } from '@/entities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { safeAreaInsetValues } from '@/utils';

type MockAsset = {
  address: string;
  assetType: 'token' | 'nft';
  name: string;
  symbol: string;
};

const IS_MESSAGE = false;

const COLLAPSED_CARD_HEIGHT = 56;
const MAX_CARD_HEIGHT = 176;

const CARD_ROW_HEIGHT = 12;
const SMALL_CARD_ROW_HEIGHT = 10;
const CARD_BORDER_WIDTH = 1.5;

const rotationConfig = {
  duration: 2100,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.2, 0, 0, 1),
};

export const SignTransactionSheet = () => {
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const [simulationData, setSimulationData] = useState(false);

  const label = useForegroundColor('label');
  const surfacePrimary = useBackgroundColor('surfacePrimary');

  useEffect(() => {
    setTimeout(() => {
      setSimulationData(true);
    }, 2000);
  }, []);

  return (
    <Inset bottom={{ custom: safeAreaInsetValues.bottom + 20 }}>
      <Box height="full" justifyContent="flex-end" width="full">
        <Box
          as={Animated.View}
          borderRadius={39}
          paddingBottom="24px"
          paddingHorizontal="20px"
          paddingTop="32px"
          style={{
            backgroundColor: isDarkMode ? '#191A1C' : surfacePrimary,
          }}
        >
          <Stack space="24px">
            <Inset horizontal="12px" right={{ custom: 110 }}>
              <Inline alignVertical="center" space="12px" wrap={false}>
                <Box
                  height={{ custom: 44 }}
                  style={{
                    backgroundColor: isDarkMode
                      ? globalColors.white10
                      : '#FBFCFD',
                    borderRadius: 12,
                    shadowColor: isDarkMode ? colors.trueBlack : colors.dark,
                    shadowOffset: {
                      width: 0,
                      height: 18,
                    },
                    shadowOpacity: isDarkMode ? 1 : 0.12,
                    shadowRadius: 27,
                  }}
                  width={{ custom: 44 }}
                >
                  <ImgixImage
                    resizeMode="cover"
                    size={44}
                    source={{
                      uri:
                        'https://pbs.twimg.com/profile_images/1696986796478091264/79NZgGom_400x400.jpg',
                    }}
                    style={{ borderRadius: 12, height: 44, width: 44 }}
                  />
                </Box>
                <Stack space="12px">
                  <Inline
                    alignVertical="center"
                    space={{ custom: 5 }}
                    wrap={false}
                  >
                    <Text
                      color="label"
                      numberOfLines={1}
                      size="20pt"
                      weight="heavy"
                    >
                      Uniswap
                    </Text>
                    <VerifiedBadge />
                  </Inline>
                  <Text color="labelTertiary" size="15pt" weight="bold">
                    Transaction Request
                  </Text>
                </Stack>
              </Inline>
            </Inset>

            <Stack space={{ custom: 14 }}>
              <SimulationCard simulationData={simulationData} />
              <Box>
                {IS_MESSAGE ? (
                  <MessageCard messageContent={exampleMessage} />
                ) : (
                  <DetailsCard isLoading={!simulationData} />
                )}
                {/* Hidden scroll view to disable sheet dismiss gestures */}
                <Box
                  height={{ custom: 0 }}
                  pointerEvents="none"
                  position="absolute"
                  style={{ opacity: 0 }}
                >
                  <ScrollView scrollEnabled={false} />
                </Box>
              </Box>
            </Stack>

            <Inset horizontal="12px">
              <Inline alignVertical="center" space="12px" wrap={false}>
                <ImgixImage
                  size={44}
                  source={{
                    uri:
                      'https://i.seadn.io/s/raw/files/686674dfe04398afefa5c7c954ec4cf4.png?auto=format&dpr=1&w=1000',
                  }}
                  style={{ borderRadius: 22, height: 44, width: 44 }}
                />
                <Stack space="10px">
                  <Inline space="3px" wrap={false}>
                    <Text color="labelTertiary" size="15pt" weight="semibold">
                      Signing with
                    </Text>
                    <Text
                      color="label"
                      numberOfLines={1}
                      size="15pt"
                      weight="bold"
                    >
                      rainbow.eth
                    </Text>
                  </Inline>
                  <Inline
                    alignVertical="center"
                    space={{ custom: 17 }}
                    wrap={false}
                  >
                    {!IS_MESSAGE && (
                      <Bleed vertical="4px">
                        <ChainBadge
                          assetType={AssetType.zora}
                          badgeXPosition={0}
                          badgeYPosition={-10}
                          size="xtiny"
                        />
                      </Bleed>
                    )}
                    <Text
                      color="labelQuaternary"
                      numberOfLines={1}
                      size="13pt"
                      weight="semibold"
                    >
                      {IS_MESSAGE ? 'Free to sign' : '1.2025 ETH'}
                    </Text>
                  </Inline>
                </Stack>
              </Inline>
            </Inset>

            <Columns space="16px">
              <SheetActionButton
                color={isDarkMode ? globalColors.blueGrey100 : '#F5F5F7'}
                isTransparent
                label="Cancel"
                textColor={label}
                onPress={() => {
                  navigate(Routes.WALLET_SCREEN);
                }}
                size="big"
                weight="bold"
              />
              <SheetActionButton
                label="􀎽 Confirm"
                nftShadows
                size="big"
                weight="heavy"
              />
            </Columns>
          </Stack>
        </Box>
      </Box>
    </Inset>
  );
};

const SimulationCard = ({ simulationData }: { simulationData: boolean }) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(
    COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2
  );
  const spinnerRotation = useSharedValue(0);

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [
        COLLAPSED_CARD_HEIGHT,
        contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
          ? MAX_CARD_HEIGHT
          : contentHeight.value + CARD_BORDER_WIDTH * 2,
      ],
      [0, 1]
    ),
  }));

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinnerRotation.value}deg` }],
    };
  });

  useEffect(() => {
    if (simulationData) {
      spinnerRotation.value = withTiming(360, timingConfig);
    } else {
      spinnerRotation.value = withRepeat(
        withTiming(360, rotationConfig),
        -1,
        false
      );
    }
  }, [simulationData, spinnerRotation]);

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      isExpanded={simulationData}
    >
      <Stack space="24px">
        <Box
          alignItems="center"
          flexDirection="row"
          justifyContent="space-between"
          height={{ custom: CARD_ROW_HEIGHT }}
        >
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Animated.View style={spinnerStyle}>
                <Text
                  align="center"
                  color="label"
                  size="icon 15px"
                  weight="bold"
                >
                  􀬨
                </Text>
              </Animated.View>
            </IconContainer>
            <Text color="label" size="17pt" weight="bold">
              {simulationData ? 'Simulated Result' : 'Simulating'}
            </Text>
          </Inline>
          <Animated.View style={listStyle}>
            <ButtonPressAnimation disabled={!simulationData}>
              <IconContainer hitSlop={14} size={16} opacity={0.6}>
                <Text
                  color="labelQuaternary"
                  size="icon 15px"
                  weight="semibold"
                >
                  􀁜
                </Text>
              </IconContainer>
            </ButtonPressAnimation>
          </Animated.View>
        </Box>
        <Animated.View style={listStyle}>
          <Stack space="20px">
            <SimulatedEventRow
              amount={0.1}
              asset={{
                address: 'ETH',
                assetType: 'token',
                name: 'Ethereum',
                symbol: 'ETH',
              }}
              eventType="send"
            />
            <SimulatedEventRow
              amount={180}
              asset={{
                address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                assetType: 'token',
                name: 'USD Coin',
                symbol: 'USDC',
              }}
              eventType="receive"
            />
          </Stack>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};

const DetailsCard = ({ isLoading }: { isLoading: boolean }) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(
    COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [COLLAPSED_CARD_HEIGHT, MAX_CARD_HEIGHT],
      [0, 1]
    ),
  }));

  const collapsedTextColor: TextColor = isLoading ? 'labelQuaternary' : 'blue';

  return (
    <ButtonPressAnimation
      disabled={isLoading}
      onPress={() => setIsExpanded(true)}
      scaleTo={0.96}
    >
      <FadedScrollCard
        cardHeight={cardHeight}
        contentHeight={contentHeight}
        disableGestures={!isExpanded}
        isExpanded={isExpanded}
      >
        <Stack space="24px">
          <Box
            justifyContent="center"
            height={{ custom: CARD_ROW_HEIGHT }}
            width="full"
          >
            <Inline alignVertical="center" space="12px">
              <IconContainer>
                <Text
                  align="center"
                  color={isExpanded ? 'label' : collapsedTextColor}
                  size="icon 15px"
                  weight="bold"
                >
                  􁙠
                </Text>
              </IconContainer>
              <Text
                color={isExpanded ? 'label' : collapsedTextColor}
                size="17pt"
                weight="bold"
              >
                Details
              </Text>
            </Inline>
          </Box>
          <Animated.View style={listStyle}>
            <Stack space="24px">
              <DetailRow detailType="chain" />
              <DetailRow detailType="contract" />
              <DetailRow detailType="dateCreated" />
              <DetailRow detailType="function" />
              <DetailRow detailType="sourceCodeVerification" />
              <DetailRow detailType="nonce" />
            </Stack>
          </Animated.View>
        </Stack>
      </FadedScrollCard>
    </ButtonPressAnimation>
  );
};

const MessageCard = ({ messageContent }: { messageContent: string }) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(
    COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2
  );

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [
        COLLAPSED_CARD_HEIGHT,
        contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
          ? MAX_CARD_HEIGHT
          : contentHeight.value + CARD_BORDER_WIDTH * 2,
      ],
      [0, 1]
    ),
  }));

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      isExpanded
    >
      <Stack space="24px">
        <Box
          alignItems="flex-end"
          flexDirection="row"
          justifyContent="space-between"
          height={{ custom: CARD_ROW_HEIGHT }}
        >
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Text align="center" color="label" size="icon 15px" weight="bold">
                􀙤
              </Text>
            </IconContainer>
            <Text color="label" size="17pt" weight="bold">
              Message
            </Text>
          </Inline>
          <ButtonPressAnimation>
            <Bleed space="24px">
              <Box style={{ margin: 24 }}>
                <Text align="right" color="blue" size="15pt" weight="bold">
                  Copy
                </Text>
              </Box>
            </Bleed>
          </ButtonPressAnimation>
        </Box>
        <Animated.View style={listStyle}>
          <Text color="labelTertiary" size="15pt" weight="medium">
            {messageContent}
          </Text>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};

const SimulatedEventRow = ({
  amount,
  asset,
  eventType,
  imageUrl,
}: {
  amount: number | 'unlimited';
  asset: MockAsset;
  eventType: EventType;
  imageUrl?: string;
}) => {
  const { colors } = useTheme();

  const eventInfo: EventInfo = infoForEventType[eventType];
  const { address, assetType, symbol } = asset;

  const formattedAmount = `${eventInfo.amountPrefix}${
    amount === 'unlimited' ? 'Unlimited' : amount
  } ${symbol}`;

  return (
    <Box justifyContent="center" height={{ custom: CARD_ROW_HEIGHT }}>
      <Inline
        alignHorizontal="justify"
        alignVertical="center"
        space="20px"
        wrap={false}
      >
        <Inline alignVertical="center" space="12px" wrap={false}>
          <EventIcon eventType={eventType} />
          <Text color="label" size="17pt" weight="bold">
            {eventInfo.label}
          </Text>
        </Inline>
        <Inline alignVertical="center" space={{ custom: 7 }} wrap={false}>
          <Bleed vertical="6px">
            {assetType === 'token' ? (
              <CoinIcon
                address={address}
                forcedShadowColor={colors.transparent}
                size={16}
              />
            ) : (
              <ImgixImage
                size={16}
                source={{ uri: imageUrl }}
                style={{ borderRadius: 16 }}
              />
            )}
          </Bleed>
          <Text
            align="right"
            color={eventInfo.textColor}
            numberOfLines={1}
            size="17pt"
            weight="bold"
          >
            {formattedAmount}
          </Text>
        </Inline>
      </Inline>
    </Box>
  );
};

const DetailRow = ({ detailType }: { detailType: DetailType }) => {
  const detailInfo: DetailInfo = infoForDetailType[detailType];

  return (
    <Box justifyContent="center" height={{ custom: SMALL_CARD_ROW_HEIGHT }}>
      <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
        <Inline alignVertical="center" space="12px" wrap={false}>
          <DetailIcon detailInfo={detailInfo} />
          <Text color="labelTertiary" size="15pt" weight="semibold">
            {detailInfo.label}
          </Text>
        </Inline>
        <Inline alignVertical="center" space={{ custom: 7 }} wrap={false}>
          <Text
            align="right"
            color="labelSecondary"
            numberOfLines={1}
            size="15pt"
            weight="semibold"
          >
            {detailInfo.label}
          </Text>
        </Inline>
      </Inline>
    </Box>
  );
};

const EventIcon = ({ eventType }: { eventType: EventType }) => {
  const eventInfo: EventInfo = infoForEventType[eventType];

  const isApproval = eventType === 'approve';
  const hideInnerFill = eventType === 'approve' || eventType === 'revoke';

  return (
    <IconContainer>
      {!hideInnerFill && (
        <Box
          borderRadius={10}
          height={{ custom: 11 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          width={{ custom: 11 }}
        />
      )}
      <Text
        align="center"
        color={eventInfo.iconColor}
        size={isApproval ? 'icon 15px' : 'icon 17px'}
        weight={isApproval ? 'heavy' : 'bold'}
      >
        {eventInfo.icon}
      </Text>
    </IconContainer>
  );
};

const DetailIcon = ({ detailInfo }: { detailInfo: DetailInfo }) => {
  return (
    <IconContainer>
      <Text
        align="center"
        color="labelTertiary"
        size="icon 13px"
        weight="semibold"
      >
        {detailInfo.icon}
      </Text>
    </IconContainer>
  );
};

const VerifiedBadge = () => {
  return (
    <Bleed bottom={{ custom: 0.5 }}>
      <Box alignItems="center" justifyContent="center">
        <Box
          borderRadius={10}
          height={{ custom: 11 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          width={{ custom: 11 }}
        />
        <Text
          align="center"
          color={{ custom: globalColors.blue40 }}
          size="icon 15px"
          weight="heavy"
        >
          􀇻
        </Text>
      </Box>
    </Bleed>
  );
};

const FadedScrollCard = ({
  cardHeight,
  children,
  contentHeight,
  disableGestures,
  isExpanded,
}: {
  cardHeight: SharedValue<number>;
  children: React.ReactNode;
  contentHeight: SharedValue<number>;
  disableGestures?: boolean;
  isExpanded: boolean;
}) => {
  const { isDarkMode } = useTheme();

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const offset = useScrollViewOffset(scrollViewRef);

  const topGradientStyle = useAnimatedStyle(() => {
    if (!scrollEnabled) {
      return { opacity: withTiming(0, timingConfig) };
    }
    return {
      opacity:
        offset.value <= 0
          ? withTiming(0, timingConfig)
          : withTiming(1, timingConfig),
    };
  });

  const bottomGradientStyle = useAnimatedStyle(() => {
    if (!scrollEnabled) {
      return { opacity: withTiming(0, timingConfig) };
    }
    return {
      opacity:
        offset.value > contentHeight.value + CARD_BORDER_WIDTH - MAX_CARD_HEIGHT
          ? withTiming(0, timingConfig)
          : withTiming(1, timingConfig),
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
    };
  });

  const centerVerticallyWhenCollapsedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            cardHeight.value,
            [
              COLLAPSED_CARD_HEIGHT,
              contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
                ? MAX_CARD_HEIGHT
                : contentHeight.value + CARD_BORDER_WIDTH * 2,
            ],
            [-2, 0]
          ),
        },
      ],
    };
  });

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentHeight.value = Math.round(height);
    },
    [contentHeight]
  );

  useAnimatedReaction(
    () => ({ contentHeight: contentHeight.value, isExpanded }),
    ({ contentHeight, isExpanded }, previous) => {
      if (
        isExpanded !== previous?.isExpanded ||
        contentHeight !== previous?.contentHeight
      ) {
        if (isExpanded) {
          cardHeight.value = withTiming(
            contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
              ? MAX_CARD_HEIGHT
              : contentHeight + CARD_BORDER_WIDTH * 2,
            timingConfig
          );
        } else {
          cardHeight.value = withTiming(COLLAPSED_CARD_HEIGHT, timingConfig);
        }

        const enableScroll =
          isExpanded && contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
        runOnJS(setScrollEnabled)(enableScroll);
      }
    }
  );

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isDarkMode ? globalColors.white10 : '#FBFCFD',
          borderColor: isDarkMode ? '#1F2023' : '#F5F7F8',
          borderCurve: 'continuous',
          borderRadius: 28,
          borderWidth: CARD_BORDER_WIDTH,
          overflow: 'hidden',
        },
        cardStyle,
      ]}
    >
      <Animated.ScrollView
        contentContainerStyle={{ padding: 24 - CARD_BORDER_WIDTH }}
        onContentSizeChange={handleContentSizeChange}
        pointerEvents={disableGestures ? 'none' : 'auto'}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={16}
      >
        <Animated.View style={centerVerticallyWhenCollapsedStyle}>
          {children}
        </Animated.View>
      </Animated.ScrollView>
      <FadeGradient side="top" style={topGradientStyle} />
      <FadeGradient side="bottom" style={bottomGradientStyle} />
    </Animated.View>
  );
};

const FadeGradient = ({
  side,
  style,
}: {
  side: 'top' | 'bottom';
  style: StyleProp<Animated.AnimateStyle<StyleProp<ViewStyle>>>;
}) => {
  const { colors, isDarkMode } = useTheme();

  const isTop = side === 'top';

  const solidColor = isDarkMode ? globalColors.white10 : '#FBFCFD';
  const transparentColor = colors.alpha(solidColor, 0);

  return (
    <Box
      as={Animated.View}
      height={{ custom: 40 }}
      pointerEvents="none"
      position="absolute"
      style={[
        {
          bottom: isTop ? undefined : 0,
          top: isTop ? 0 : undefined,
        },
        style,
      ]}
      width="full"
    >
      <LinearGradient
        colors={[solidColor, transparentColor]}
        end={{ x: 0.5, y: isTop ? 1 : 0 }}
        locations={[0, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: isTop ? 0 : 1 }}
        style={{
          height: 40,
          width: '100%',
        }}
      />
    </Box>
  );
};

const IconContainer = ({
  children,
  hitSlop,
  opacity,
  size = 20,
}: {
  children: React.ReactNode;
  hitSlop?: number;
  opacity?: number;
  size?: number;
}) => {
  // Prevent wide icons from being clipped
  const extraHorizontalSpace = 4;

  return (
    <Bleed
      horizontal={{ custom: (hitSlop || 0) + extraHorizontalSpace }}
      vertical={hitSlop ? { custom: hitSlop } : '6px'}
      space={hitSlop ? { custom: hitSlop } : undefined}
    >
      <Box
        alignItems="center"
        height={{ custom: size }}
        justifyContent="center"
        margin={hitSlop ? { custom: hitSlop } : undefined}
        style={{ opacity }}
        width={{ custom: size + extraHorizontalSpace * 2 }}
      >
        {children}
      </Box>
    </Bleed>
  );
};

type EventType = 'send' | 'receive' | 'approve' | 'revoke';

type EventInfo = {
  amountPrefix: string;
  icon: string;
  iconColor: TextColor;
  label: string;
  textColor: TextColor;
};

const infoForEventType: { [key: string]: EventInfo } = {
  send: {
    amountPrefix: '- ',
    icon: '􀁷',
    iconColor: 'red',
    label: 'Send',
    textColor: 'red',
  },
  receive: {
    amountPrefix: '+ ',
    icon: '􀁹',
    iconColor: 'green',
    label: 'Receive',
    textColor: 'green',
  },
  approve: {
    amountPrefix: '',
    icon: '􀎤',
    iconColor: 'green',
    label: 'Approve',
    textColor: 'label',
  },
  revoke: {
    amountPrefix: '',
    icon: '􀎠',
    iconColor: 'red',
    label: 'Revoke',
    textColor: 'label',
  },
};

type DetailType =
  | 'chain'
  | 'contract'
  | 'dateCreated'
  | 'function'
  | 'sourceCodeVerification'
  | 'nonce';

type DetailInfo = {
  icon: string;
  label: string;
};

const infoForDetailType: { [key: string]: DetailInfo } = {
  chain: {
    icon: '􀤆',
    label: 'Chain',
  },
  contract: {
    icon: '􀉆',
    label: 'Contract',
  },
  dateCreated: {
    icon: '􀉉',
    label: 'Contract Created',
  },
  function: {
    icon: '􀡅',
    label: 'Function',
  },
  sourceCodeVerification: {
    icon: '􀕹',
    label: 'Source Code',
  },
  nonce: {
    icon: '􀆃',
    label: 'Nonce',
  },
};

const exampleMessage = `Welcome to OpenSea!

Click to sign in and accept the OpenSea Terms of Service (https://opensea.io/tos) and Privacy Policy (https://opensea.io/privacy).

This request will not trigger a blockchain transaction or cost any gas fees. Your authentication status will reset after 24 hours.

Wallet address:
0x80a91aeaf3e969de616eb63ea957817937b1

Nonce:
8126fea6-ef17-4c8e-aa81-281aaf96c05c`;
