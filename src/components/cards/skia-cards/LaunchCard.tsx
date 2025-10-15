import { opacity } from '@/__swaps__/utils/swaps';
import { BlendColor, Circle, Group, ImageSVG, LinearGradient, Mask, Paint, Rect, Shadow, vec } from '@shopify/react-native-skia';
import React, { memo, useState } from 'react';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { SkiaText, SkiaTextChild } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import { useCleanup } from '@/hooks/useCleanup';
import i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { watchingAlert } from '@/utils';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import Navigation from '@/navigation/Navigation';
import { DEFAULT_CARD_SIZE, SkiaCard, SkiaCardProps } from './SkiaCard';
import { plusButtonSvg, stars } from './cardSvgs';

const CARD_HEIGHT = 175;
const PLUS_BUTTON_SIZE = 64;
const PLUS_BUTTON_HORIZONTAL_INSET = (DEFAULT_CARD_SIZE - PLUS_BUTTON_SIZE) / 2;

const CARD_CONFIG = {
  colors: {
    plusButtonDropShadow: opacity(globalColors.grey100, 0.15),
    plusButtonInnerShadowDark: opacity(globalColors.grey100, 0.3),
    plusButtonInnerShadowLight: opacity(globalColors.white100, 0.8),
    plusButtonStroke: opacity(globalColors.white100, 0.175),
  },
  dimensions: {
    plusButton: {
      x: (DEFAULT_CARD_SIZE - PLUS_BUTTON_SIZE) / 2,
      y: 56,
    },
    plusButtonIcon: {
      size: 24,
      cx: DEFAULT_CARD_SIZE / 2,
      y: 44,
    },
  },
  gradients: {
    card: {
      colors: ['#EBAF09', '#FFC800'],
      end: vec(DEFAULT_CARD_SIZE, CARD_HEIGHT / 2),
      start: vec(0, CARD_HEIGHT / 2),
    },
    plusButton: {
      colors: ['#FFC31D', '#FFDF23'],
      end: vec(DEFAULT_CARD_SIZE - PLUS_BUTTON_HORIZONTAL_INSET, CARD_HEIGHT / 2),
      start: vec(PLUS_BUTTON_HORIZONTAL_INSET, CARD_HEIGHT / 2),
    },
    text: {
      colors: ['#3D1E0A', '#7A600A'],
      end: vec(DEFAULT_CARD_SIZE - 20, CARD_HEIGHT / 2),
      start: vec(20, CARD_HEIGHT / 2),
    },
  },
};

const CARD_PROPS: Partial<SkiaCardProps> = {
  shadowColor: {
    dark: opacity(globalColors.grey100, 0.3),
    light: opacity(CARD_CONFIG.gradients.card.colors[0], 0.56),
  },
};

function navigateToTokenLauncher(): void {
  if (!enableActionsOnReadOnlyWallet && getIsReadOnlyWallet()) {
    return watchingAlert();
  }
  Navigation.handleAction(Routes.TOKEN_LAUNCHER_SCREEN);
}

export const LaunchCard = memo(function LaunchCard() {
  const [svgs] = useState(() => ({
    plusButton: plusButtonSvg(),
    stars: {
      one: stars.one(),
      two: stars.two(),
      three: stars.three(),
    },
  }));

  useCleanup(() => {
    svgs.plusButton?.dispose?.();
    svgs.stars.one?.dispose?.();
    svgs.stars.two?.dispose?.();
    svgs.stars.three?.dispose?.();
  });

  return (
    <SkiaCard
      height={CARD_HEIGHT}
      onPress={navigateToTokenLauncher}
      shadowColor={CARD_PROPS.shadowColor}
      skiaBackground={
        <Paint antiAlias dither>
          <LinearGradient
            colors={CARD_CONFIG.gradients.card.colors}
            end={CARD_CONFIG.gradients.card.end}
            start={CARD_CONFIG.gradients.card.start}
          />
        </Paint>
      }
      skiaForeground={
        <Group>
          <Group
            layer={
              <Paint blendMode="plus" opacity={0.12}>
                <BlendColor color={globalColors.white100} mode="srcIn" />
              </Paint>
            }
          >
            <ImageSVG height={16} svg={svgs.stars.one} width={16} x={30} y={65} />
            <ImageSVG height={24} svg={svgs.stars.two} width={24} x={26} y={21} />
            <ImageSVG height={21} svg={svgs.stars.three} width={21} x={122} y={64} />
          </Group>

          <Circle cx={DEFAULT_CARD_SIZE / 2} cy={CARD_CONFIG.dimensions.plusButton.y} r={PLUS_BUTTON_SIZE / 2}>
            <Shadow blur={15} color={CARD_CONFIG.colors.plusButtonDropShadow} dx={0} dy={10} />
            <Shadow blur={2} color={CARD_CONFIG.colors.plusButtonInnerShadowDark} dx={0} dy={-1.5} inner />
            <Shadow blur={1.25} color={CARD_CONFIG.colors.plusButtonInnerShadowLight} dx={0} dy={1.5} inner />
            <LinearGradient
              colors={CARD_CONFIG.gradients.plusButton.colors}
              end={CARD_CONFIG.gradients.plusButton.end}
              start={CARD_CONFIG.gradients.plusButton.start}
            />
          </Circle>

          <Circle
            blendMode="plus"
            color={CARD_CONFIG.colors.plusButtonStroke}
            cx={DEFAULT_CARD_SIZE / 2}
            cy={CARD_CONFIG.dimensions.plusButton.y}
            r={PLUS_BUTTON_SIZE / 2 - 2}
            style="stroke"
            strokeWidth={4}
          />

          <Group
            layer={
              <Paint>
                <BlendColor color={globalColors.grey100} mode="srcIn" />
              </Paint>
            }
          >
            <ImageSVG
              height={CARD_CONFIG.dimensions.plusButtonIcon.size}
              svg={svgs.plusButton}
              width={CARD_CONFIG.dimensions.plusButtonIcon.size}
              x={(DEFAULT_CARD_SIZE - CARD_CONFIG.dimensions.plusButtonIcon.size) / 2}
              y={CARD_CONFIG.dimensions.plusButtonIcon.y}
            />
          </Group>

          <Mask
            mask={
              <SkiaText
                align="center"
                lineHeight={26}
                size="22pt"
                weight="heavy"
                width={DEFAULT_CARD_SIZE - 40}
                x={20}
                y={CARD_HEIGHT - (42 + 30)}
              >
                <SkiaTextChild>{i18n.token_launcher.cards.launch.line_one()}</SkiaTextChild>
                <SkiaTextChild opacity={0.6}>{i18n.token_launcher.cards.launch.line_two()}</SkiaTextChild>
              </SkiaText>
            }
          >
            <Rect height={CARD_HEIGHT} width={DEFAULT_CARD_SIZE - 40} x={20} y={CARD_HEIGHT - (42 + 30)} />
            <LinearGradient
              colors={CARD_CONFIG.gradients.text.colors}
              end={CARD_CONFIG.gradients.text.end}
              start={CARD_CONFIG.gradients.text.start}
            />
          </Mask>
        </Group>
      }
    />
  );
});
