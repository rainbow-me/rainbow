import React, { memo, useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, IconContainer, Inline, Stack, Text, TextShadow } from '@/design-system';
import { Row } from '../shared/Row';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ButtonPressAnimation } from '@/components/animations';
import { Linking } from 'react-native';
import { formatURLForDisplay } from '@/utils';
import { XIcon } from '../../icons/XIcon';

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
            <Bleed left="8px" vertical="24px">
              <XIcon color={accentColors.opacity100} size={38} />
            </Bleed>
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

// truncate after the first paragraph or 4th dot
function truncate(text: string) {
  const firstParagraph = text.split('\n')[0];
  const first4Sentences = text.split('.').slice(0, 4).join('.') + '.';
  const shorterOne = first4Sentences.length < firstParagraph?.length ? first4Sentences : firstParagraph;
  // If there is not much to expand, return the whole text
  if (text.length < shorterOne.length * 1.5) {
    return text;
  }

  return shorterOne;
}

// TODO: Determine if this is still needed
function Description({ text }: { text: string }) {
  const truncatedText = truncate(text);
  const needToTruncate = truncatedText.length !== text.length;
  const [truncated, setTruncated] = useState(true);

  return (
    <ButtonPressAnimation disabled={!needToTruncate || !truncated} onPress={() => setTruncated(prev => !prev)} scaleTo={1}>
      <Text weight="medium" size="17pt / 150%" color="labelTertiary">
        {/* {delayedTruncated ? truncatedText : text} */}
        {truncatedText}
      </Text>
      {truncated && needToTruncate && (
        <Text weight="medium" size="17pt / 150%" color="labelTertiary">
          {i18n.t('expanded_state.asset.read_more_button')} 􀯼
        </Text>
      )}
    </ButtonPressAnimation>
  );
}

export const AboutSection = memo(function AboutSection() {
  const { basicAsset: asset, assetMetadata: metadata } = useExpandedAssetSheetContext();

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
        iconName: 'x',
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
          <Text weight="medium" size="17pt / 150%" color="labelTertiary">
            {metadata.description}
          </Text>
          {/* <Description text={metadata.description} /> */}
        </Box>
      )}
    </Box>
  );
});
