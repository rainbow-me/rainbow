import React from 'react';
import { GasSpeed } from '@/__swaps__/types/gas';
import { Inline, Text, TextIcon } from '@/design-system';
import * as i18n from '@/languages';
import { IS_ANDROID } from '@/env';
import { gasUtils } from '@/utils';

const SWAP_GAS_ICONS = gasUtils.SWAP_GAS_ICONS;

export function SelectedGasSpeed({ isPill, selectedGasSpeed }: { isPill?: boolean; selectedGasSpeed: GasSpeed }) {
  return (
    <Inline alignVertical="center" space={{ custom: 5 }}>
      <Inline alignVertical="center" space="4px">
        <TextIcon
          color={SWAP_GAS_ICONS[selectedGasSpeed].color}
          height={10}
          size="icon 13px"
          textStyle={{ top: IS_ANDROID ? 1 : 0 + (selectedGasSpeed === 'fast' ? 0.5 : 0) }}
          width={isPill ? 14 : 18}
          weight="bold"
        >
          {SWAP_GAS_ICONS[selectedGasSpeed].icon}
        </TextIcon>
        <Text align={isPill ? 'center' : 'left'} color="label" size="15pt" weight="heavy">
          {i18n.t(i18n.l.gas.speeds[selectedGasSpeed])}
        </Text>
      </Inline>
      <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
        􀆏
      </TextIcon>
    </Inline>
  );
}
