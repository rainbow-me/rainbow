import React from 'react';
import { Box, IconContainer, Inline, Stack, Text, TextShadow } from '@/design-system';
import { Row } from '../shared/Row';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ButtonPressAnimation } from '@/components/animations';
import { useAccountSettings, useAdditionalAssetData } from '@/hooks';

interface RowButtonProps {
  highlighted?: boolean;
  icon: string;
  onPress: () => void;
  title: string;
  value?: string;
}

function RowButton({ highlighted, icon, onPress, title, value }: RowButtonProps) {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <Row highlighted={highlighted}>
        <Inline space="12px" alignVertical="center">
          <IconContainer height={10} width={20}>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="medium" align="center" size="15pt" color="accent">
                {icon}
              </Text>
            </TextShadow>
          </IconContainer>
          <TextShadow blur={12} shadowOpacity={0.24}>
            <Text weight="semibold" size="17pt" color="accent">
              {title}
            </Text>
          </TextShadow>
        </Inline>
        <Inline space="8px" alignVertical="center">
          {value && (
            <Text weight="semibold" align="right" size="17pt" color={{ custom: accentColors.opacity56 }}>
              {value}
            </Text>
          )}
          <IconContainer height={9} width={16}>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="bold" align="center" size="15pt" color="accent">
                􀄯
              </Text>
            </TextShadow>
          </IconContainer>
        </Inline>
      </Row>
    </ButtonPressAnimation>
  );
}

export function AboutSection() {
  const { asset } = useExpandedAssetSheetContext();
  const { nativeCurrency } = useAccountSettings();
  const { data: metadata } = useAdditionalAssetData({
    address: asset.address,
    chainId: asset.chainId,
    currency: nativeCurrency,
  });

  return (
    <Box gap={40}>
      <Stack space="4px">
        <RowButton highlighted icon="􀎞" onPress={() => {}} title="Website" value="makerdao.com" />
        <RowButton icon="􀎞" onPress={() => {}} title="Twitter" value="@SkyEcosystem" />
        <RowButton highlighted icon="􀊫" onPress={() => {}} title="Website" />
      </Stack>
      {metadata?.description && (
        <Box gap={24}>
          <Text weight="bold" size="20pt" color="labelSecondary">
            What is {asset.name}?
          </Text>
          <Text weight="medium" size="17pt" color="labelTertiary">
            {metadata.description}
          </Text>
        </Box>
      )}
    </Box>
  );
}
