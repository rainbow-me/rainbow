import React, { memo } from 'react';

import { Bleed, Text, TextShadow } from '@/design-system';
import { type TextProps, type TextWeight } from '@/design-system/components/Text/Text';
import { type TextSize } from '@/design-system/typography/typeHierarchy';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';

type PerpsNameRowProps = {
  symbol: string;
  name?: string;
  isLoading?: boolean;
  nameColor: TextProps['color'];
  nameSize: TextSize;
  nameWeight?: TextWeight;
  nameShadow?: boolean;
  suffixColor?: TextProps['color'];
  suffixSize?: TextSize;
  suffixWeight?: TextWeight;
  skeletonWidth?: number;
  skeletonHeight?: number;
};

export const PerpsNameRow = memo(function PerpsNameRow({
  symbol,
  name,
  isLoading,
  nameColor,
  nameSize,
  nameWeight = 'heavy',
  nameShadow = false,
  suffixColor = 'labelQuinary',
  suffixSize = '15pt',
  suffixWeight = 'bold',
  skeletonWidth = 120,
  skeletonHeight = 23,
}: PerpsNameRowProps) {
  if (isLoading) {
    return (
      <Bleed vertical="4px">
        <PerpsTextSkeleton height={skeletonHeight} width={skeletonWidth} />
      </Bleed>
    );
  }

  const baseSymbol = extractBaseSymbol(symbol);
  const displayName = name ?? baseSymbol;
  const showSuffix = !!name && name !== baseSymbol;

  const nameText = (
    <Text color={nameColor} size={nameSize} weight={nameWeight}>
      {displayName}
    </Text>
  );

  return (
    <>
      {nameShadow ? (
        <TextShadow blur={12} shadowOpacity={0.16}>
          {nameText}
        </TextShadow>
      ) : (
        nameText
      )}
      {showSuffix && (
        <Text color={suffixColor} size={suffixSize} weight={suffixWeight}>
          {baseSymbol}
        </Text>
      )}
    </>
  );
});
