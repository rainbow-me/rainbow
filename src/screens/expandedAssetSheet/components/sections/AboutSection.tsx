import React, { useMemo } from 'react';
import { Box, IconContainer, Inline, Stack, Text, TextShadow } from '@/design-system';
import { Row } from '../shared/Row';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ButtonPressAnimation } from '@/components/animations';
import { useAccountSettings, useAdditionalAssetData } from '@/hooks';
import { Linking } from 'react-native';
import { formatURLForDisplay } from '@/utils';
import { Icon } from '@/components/icons';

interface RowItem {
  icon?: string;
  iconName?: string;
  title: string;
  url: string;
  value?: string;
}

interface RowButtonProps {
  highlighted?: boolean;
  icon?: string;
  iconName?: string;
  title: string;
  url: string;
  value?: string;
}

function RowButton({ highlighted, icon, iconName, title, url, value }: RowButtonProps) {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <ButtonPressAnimation onPress={() => Linking.openURL(url)} scaleTo={0.96}>
      <Row highlighted={highlighted}>
        <Inline space="12px" alignVertical="center">
          {icon && (
            <IconContainer height={10} width={20}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="medium" align="center" size="15pt" color="accent">
                  {icon}
                </Text>
              </TextShadow>
            </IconContainer>
          )}
          {iconName && (
            <IconContainer height={10} width={20}>
              <Icon width={20} height={20} color={accentColors.opacity100} name={iconName} />
            </IconContainer>
          )}
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

  const rowItems = useMemo(() => {
    const items: RowItem[] = [];

    if (metadata?.links?.homepage?.url) {
      items.push({
        icon: '􀎞',
        title: 'Website',
        url: metadata.links.homepage.url,
        value: formatURLForDisplay(metadata.links.homepage.url),
      });
    }

    if (metadata?.links?.twitter?.url) {
      items.push({
        iconName: 'twitter',
        title: 'Twitter',
        url: metadata.links.twitter.url,
        value: `@${metadata.links.twitter.url.split('/').pop()}`,
      });
    }

    items.push({
      icon: '􀊫',
      title: 'Search on Twitter',
      url: `https://x.com/search?q=${asset.name}`,
    });

    return items;
  }, [asset.name, metadata?.links?.homepage, metadata?.links?.twitter]);

  return (
    <Box gap={40}>
      <Stack space="4px">
        {rowItems.map((item, index) => (
          <RowButton
            key={`${item.title}-${index}`}
            highlighted={index % 2 === 0}
            icon={item.icon}
            iconName={item.iconName}
            title={item.title}
            url={item.url}
            value={item.value}
          />
        ))}
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
