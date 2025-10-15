import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Border, Box, Text, TextShadow, globalColors } from '@/design-system';
import i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { AirdropClaimable, BalancePill } from '@/screens/Airdrops/AirdropsSheet';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { SectionId, useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { CollapsibleSection, LAYOUT_ANIMATION } from '../shared/CollapsibleSection';
import { SheetSeparator } from '../shared/Separator';
import Animated from 'react-native-reanimated';

const COIN_ROW_HEIGHT = 40;

export const ClaimContent = memo(function ClaimContent({ claimable }: { claimable: RainbowClaimable }) {
  const { accentColors } = useExpandedAssetSheetContext();
  const { navigate } = useNavigation();

  const onPressClaim = () => {
    navigate(Routes.CLAIM_AIRDROP_SHEET, {
      claimable,
      hideViewTokenButton: true,
    });
  };

  const [asset] = claimable.assets;

  return (
    <Box gap={12}>
      <ButtonPressAnimation onPress={onPressClaim} scaleTo={0.95}>
        <Box
          padding="16px"
          borderRadius={20}
          style={{ backgroundColor: accentColors.opacity6, borderColor: accentColors.opacity6, borderWidth: 1 }}
          gap={12}
        >
          <AirdropCoinRow
            address={asset.asset.address}
            airdropValue={claimable.totalCurrencyValue.display}
            chainId={claimable.chainId}
            hasZeroValue={Number(asset.amount.amount) === 0}
            icon={asset.asset.icon_url ?? claimable.iconUrl}
            name={asset.asset.name}
            symbol={asset.asset.symbol}
            uniqueId={asset.asset.uniqueId}
          />
        </Box>
      </ButtonPressAnimation>
      <ButtonPressAnimation
        onPress={onPressClaim}
        scaleTo={0.95}
        style={[styles.buttonPressWrapper, { backgroundColor: accentColors.opacity12 }]}
      >
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text align="center" color={{ custom: accentColors.color }} size="17pt" weight="heavy">
            {i18n.expanded_state.sections.claim.claim_button()}
          </Text>
        </TextShadow>
        <Border borderColor={{ custom: accentColors.opacity6 }} borderRadius={18} borderWidth={THICK_BORDER_WIDTH} />
      </ButtonPressAnimation>
    </Box>
  );
});

const AirdropCoinRow = memo(
  function AirdropCoinRow({ airdropValue, chainId, hasZeroValue, icon, name, symbol }: Omit<AirdropClaimable, 'onPress'>) {
    return (
      <View style={styles.rowContainer}>
        <RainbowCoinIcon chainId={chainId} chainSize={20} icon={icon} showBadge={false} size={40} symbol={symbol} />

        <View style={styles.textContainer}>
          <Text color="label" numberOfLines={1} size="17pt" weight="bold">
            {symbol}
          </Text>
          <Text color="labelQuaternary" numberOfLines={1} size="13pt" weight="bold">
            {name}
          </Text>
        </View>

        <View style={styles.rowEnd}>
          <BalancePill airdropValue={airdropValue} hasZeroValue={hasZeroValue} />
        </View>
      </View>
    );
  },
  (prev, next) => prev.uniqueId === next.uniqueId && prev.airdropValue === next.airdropValue && prev.hasZeroValue === next.hasZeroValue
);

export const ClaimSection = memo(function ClaimSection() {
  const { basicAsset: asset, hideClaimSection } = useExpandedAssetSheetContext();
  const [claimable] = useState(() => (hideClaimSection ? null : useAirdropsStore.getState().getClaimable(asset.uniqueId)));

  if (!claimable) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<ClaimContent claimable={claimable} />}
        icon="􀑉"
        id={SectionId.CLAIM}
        primaryText={i18n.expanded_state.sections.claim.title()}
      />
      <SheetSeparator />
    </Box>
  );
});

const styles = StyleSheet.create({
  buttonPressWrapper: {
    alignItems: 'center',
    backgroundColor: opacity(globalColors.white100, 0.8),
    borderRadius: 18,
    gap: 10,
    height: 36,
    justifyContent: 'center',
    width: '100%',
  },
  rowContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: COIN_ROW_HEIGHT,
    justifyContent: 'center',
    gap: 12,
  },
  rowEnd: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    width: 'auto',
  },
  textContainer: {
    flex: 1,
    gap: 11,
  },
});
