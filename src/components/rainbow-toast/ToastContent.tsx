import React, { memo } from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';

import { SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { BaseToastIcon } from '@/components/rainbow-toast/icons/BaseToastIcon';
import { SendToastIcon } from '@/components/rainbow-toast/icons/SendToastIcon';
import { isWideSwapIcon, SwapToastIcon } from '@/components/rainbow-toast/icons/SwapToastIcon';
import { type RainbowToast } from '@/components/rainbow-toast/types';
import { useToastColors } from '@/components/rainbow-toast/useToastColors';
import { Text } from '@/design-system';
import { textSizes, textWeights } from '@/design-system/typography/typography';
import { AssetType } from '@/entities/assetTypes';
import { TransactionStatus } from '@/entities/transactions';
import { IS_INTERNAL } from '@/env';
import { getTransactionLaunchToken } from '@/helpers/transactions';
import * as i18n from '@/languages';
import { measureTextSync, type MeasureTextStyle } from '@/utils/measureText';
import { shallowEqual } from '@/worklets/comparisons';

type ToastContentProps = {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  iconWidth?: number;
  type?: 'error';
  bottomLabel?: React.ReactNode;
};

type SwapToastNetworkSymbols = {
  inSymbol: string | undefined;
  outSymbol: string | undefined;
};

export type ToastContentLayout = {
  bottomLabel?: string;
  iconWidth: number;
  subtitle: string;
  title: string;
};

const TOAST_CONTENT_GAP = 12;
const TOAST_TEXT_MAX_WIDTH = 200;
const SWAP_ARROW = '􀄫';

const TITLE_TEXT_STYLE = buildMeasuredTextStyle('15pt', 'heavy');
const SUBTITLE_TEXT_STYLE = buildMeasuredTextStyle('13pt', 'bold');
const BOTTOM_LABEL_TEXT_STYLE = buildMeasuredTextStyle('11pt', 'bold');

export const ToastContent = memo(function ToastContent({ toast }: { toast: RainbowToast }) {
  if (toast.transaction.type === 'swap') {
    return <SwapToastContent toast={toast} />;
  }
  if (toast.transaction.type === 'send') {
    return <SendToastContent toast={toast} />;
  }

  return <BaseToastContent toast={toast} />;
});

export function measureToastContentWidth(layout: ToastContentLayout): number {
  const textWidth = Math.min(
    TOAST_TEXT_MAX_WIDTH,
    Math.max(
      measureTextSync(layout.title, TITLE_TEXT_STYLE),
      measureTextSync(layout.subtitle, SUBTITLE_TEXT_STYLE),
      layout.bottomLabel ? measureTextSync(layout.bottomLabel, BOTTOM_LABEL_TEXT_STYLE) : 0
    )
  );

  return Math.ceil(layout.iconWidth + TOAST_CONTENT_GAP + textWidth);
}

// used by each toast type to display their inner contents
function ToastContentDisplay({ icon, title, subtitle, type, iconWidth = TOAST_ICON_SIZE, bottomLabel }: ToastContentProps) {
  const colors = useToastColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            width: iconWidth,
            height: TOAST_ICON_SIZE,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.textContainer}>
        <Text
          style={{ flex: 1, marginBottom: -5 }}
          color={{ custom: colors.foreground }}
          size="15pt"
          weight="heavy"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text
          color={{ custom: type === 'error' ? colors.red : colors.foreground }}
          size="13pt"
          weight="bold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ opacity: type === 'error' ? 1 : 0.5 }}
        >
          {subtitle}
        </Text>
        {bottomLabel && (
          <Text
            color={{ custom: colors.foreground }}
            size="11pt"
            weight="bold"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ opacity: 0.4 }}
          >
            {bottomLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: TOAST_CONTENT_GAP,
    alignItems: 'center',
  },
  iconContainer: {
    flexShrink: 0,
  },
  textContainer: {
    gap: 9,
    maxWidth: TOAST_TEXT_MAX_WIDTH,
  },
  arrowSeparator: {
    fontWeight: '200',
  },
});

function SwapToastContent({ toast }: { toast: RainbowToast }) {
  const layout = buildToastContentLayout(toast);

  return (
    <ToastContentDisplay
      iconWidth={layout.iconWidth}
      type={toast.transaction.status === TransactionStatus.failed ? 'error' : undefined}
      icon={<SwapToastIcon toast={toast} />}
      title={layout.title}
      subtitle={getSwapToastNetworkLabel(toast)}
      bottomLabel={layout.bottomLabel}
    />
  );
}

export const getSwapToastNetworkLabel = (toast: RainbowToast): React.ReactElement => {
  const symbols = getSwapToastNetworkSymbols(toast);
  // using RNText because it can inherit the color/size from ToastContentDisplay
  return (
    <RNText>
      {symbols.outSymbol} <RNText style={styles.arrowSeparator}>{SWAP_ARROW}</RNText> {symbols.inSymbol}
    </RNText>
  );
};

function SendToastContent({ toast }: { toast: RainbowToast }) {
  const layout = buildToastContentLayout(toast);

  return (
    <ToastContentDisplay
      key={toast.transaction.status}
      icon={<SendToastIcon toast={toast} />}
      title={layout.title}
      subtitle={layout.subtitle}
      type={toast.transaction.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

function BaseToastContent({ toast }: { toast: RainbowToast }) {
  const layout = buildToastContentLayout(toast);

  return (
    <ToastContentDisplay
      icon={<BaseToastIcon toast={toast} />}
      title={layout.title}
      subtitle={layout.subtitle}
      type={toast.transaction.status === TransactionStatus.failed ? 'error' : undefined}
    />
  );
}

export const getToastTitle = (toast: RainbowToast): string => {
  // @ts-expect-error - some of these are dot.notation and some are strings
  return i18n.t(i18n.l.transactions.type[toast.transaction.title]);
};

export function buildToastContentLayout(toast: RainbowToast): ToastContentLayout {
  const title = getToastTitle(toast);

  if (toast.transaction.type === 'swap') {
    return {
      bottomLabel: getSwapToastBottomLabel(toast),
      iconWidth: isWideSwapIcon(toast) ? SWAP_ICON_WIDTH : TOAST_ICON_SIZE,
      subtitle: getSwapToastNetworkLabelText(toast),
      title,
    };
  }

  if (toast.transaction.type === 'send') {
    return {
      iconWidth: TOAST_ICON_SIZE,
      subtitle:
        toast.transaction.asset?.type === AssetType.nft
          ? toast.transaction.asset?.name || ''
          : `${toast.transaction.amount} ${toast.transaction.asset?.symbol}`,
      title,
    };
  }

  const launchToken = getTransactionLaunchToken(toast.transaction);
  return {
    iconWidth: TOAST_ICON_SIZE,
    subtitle: launchToken?.name || toast.transaction.contract?.name || toast.transaction.description || '',
    title,
  };
}

export function areToastContentLayoutsEqual(a: ToastContentLayout | null, b: ToastContentLayout | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return shallowEqual(a, b);
}

function getSwapToastBottomLabel(toast: RainbowToast): string | undefined {
  const { batch, delegation } = toast.transaction;
  return IS_INTERNAL && batch ? (delegation ? 'Type 4' : 'Type 2') : undefined;
}

function getSwapToastNetworkLabelText(toast: RainbowToast): string {
  const symbols = getSwapToastNetworkSymbols(toast);
  return `${symbols.outSymbol ?? ''} ${SWAP_ARROW} ${symbols.inSymbol ?? ''}`;
}

function getSwapToastNetworkSymbols(toast: RainbowToast): SwapToastNetworkSymbols {
  return {
    inSymbol: toast.transaction.changes?.find(c => c?.direction === 'in')?.asset.symbol,
    outSymbol: toast.transaction.changes?.find(c => c?.direction === 'out')?.asset.symbol,
  };
}

function buildMeasuredTextStyle(size: '11pt' | '13pt' | '15pt', weight: 'bold' | 'heavy'): MeasureTextStyle {
  return {
    allowFontScaling: false,
    fontFamily: textWeights[weight].fontFamily,
    fontSize: textSizes[size].fontSize,
    fontWeight: textWeights[weight].fontWeight,
    letterSpacing: textSizes[size].letterSpacing,
  };
}
