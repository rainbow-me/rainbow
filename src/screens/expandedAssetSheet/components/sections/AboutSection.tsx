import React, { useMemo, useState } from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, IconContainer, Inline, Stack, Text, TextShadow } from '@/design-system';
import { Row } from '../shared/Row';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ButtonPressAnimation } from '@/components/animations';
import { Linking } from 'react-native';
import { formatURLForDisplay } from '@/utils';
import { XIcon } from '../../icons/XIcon';
import { Icon } from '@/components/icons';
import { formatUrl } from '@/components/DappBrowser/utils';

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
        <Box width="full" flexDirection="row" alignItems="center">
          <Inline space="12px" alignVertical="center">
            {icon && (
              <IconContainer height={10} width={20}>
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text weight="medium" align="center" size="icon 15px" color="accent">
                    {icon}
                  </Text>
                </TextShadow>
              </IconContainer>
            )}
            {iconName === 'x' && (
              <IconContainer height={10} width={20}>
                <XIcon color={accentColors.color} />
              </IconContainer>
            )}
            {iconName === 'telegram' && (
              <IconContainer height={10} width={20}>
                <Bleed left="8px">
                  <Icon width={'23'} height={'15'} name="telegram" color={accentColors.color} />
                </Bleed>
              </IconContainer>
            )}
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text weight="semibold" size="17pt" color="accent">
                {title}
              </Text>
            </TextShadow>
          </Inline>
          <Box flexDirection="row" gap={8} alignItems="center" style={{ flex: 1 }} justifyContent="flex-end">
            {value && (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                weight="semibold"
                align="right"
                size="17pt"
                style={{ flex: 1 }}
                color={{ custom: accentColors.opacity56 }}
              >
                {value}
              </Text>
            )}
            <IconContainer height={9} width={16}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text weight="bold" align="center" size="15pt" color="accent">
                  {`􀄯`}
                </Text>
              </TextShadow>
            </IconContainer>
          </Box>
        </Box>
      </Row>
    </ButtonPressAnimation>
  );
}

function truncate(text: string) {
  const minTruncatedLength = 100;

  const paragraphs = text.split('\n').filter(paragraph => paragraph.trim().length > 0);

  const firstParagraph = paragraphs[0];
  const secondParagraph = paragraphs[1];
  const first4Sentences = text.split('.').slice(0, 4).join('.') + '.';

  const firstSection = firstParagraph.length > minTruncatedLength ? firstParagraph : [firstParagraph, secondParagraph].join('\n\n');
  const shorterOne = first4Sentences.length < firstSection.length ? first4Sentences : firstSection;

  // If there is not much to expand, return the whole text
  if (text.length < shorterOne.length * 1.5) {
    return text;
  }

  return shorterOne;
}

function Description({ text }: { text: string }) {
  const { accentColors } = useExpandedAssetSheetContext();
  const truncatedText = useMemo(() => truncate(text), [text]);
  const canExpand = text.length > truncatedText.length;
  const [showFullDescription, setShowFullDescription] = useState(!canExpand);

  return (
    <Box gap={16}>
      <Text color="labelTertiary" size="17pt / 150%">
        {showFullDescription ? text : truncatedText}
      </Text>
      {!showFullDescription && (
        <ButtonPressAnimation scaleTo={0.96} hapticTrigger="tap-end" onPress={() => setShowFullDescription(prev => !prev)}>
          <Row highlighted={true}>
            <Bleed vertical="4px" horizontal="2px">
              <Box width="full" flexDirection="row" alignItems="center" gap={8}>
                <Box
                  width={{ custom: 20 }}
                  height={{ custom: 20 }}
                  borderRadius={40}
                  style={{ backgroundColor: accentColors.opacity6 }}
                  borderWidth={1.33}
                  borderColor={{ custom: accentColors.opacity2 }}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text weight="black" align="center" size="icon 10px" color="labelQuaternary">
                    {`􀆈`}
                  </Text>
                </Box>
                <TextShadow blur={12} shadowOpacity={0.24}>
                  <Text weight="semibold" size="17pt" align="center" color="labelTertiary">
                    {i18n.t(i18n.l.button.more)}
                  </Text>
                </TextShadow>
              </Box>
            </Bleed>
          </Row>
        </ButtonPressAnimation>
      )}
    </Box>
  );
}

export function AboutSection() {
  const { basicAsset: asset, assetMetadata: metadata } = useExpandedAssetSheetContext();

  const rowItems = useMemo(() => {
    const items: RowItem[] = [];

    if (metadata?.links?.homepage?.url) {
      items.push({
        icon: '􀎞',
        title: i18n.t(i18n.l.expanded_state.asset.social.website),
        url: metadata.links.homepage.url,
        value: formatUrl(metadata.links.homepage.url, false, true, true),
      });
    }

    if (metadata?.links?.twitter?.url) {
      items.push({
        iconName: 'x',
        title: i18n.t(i18n.l.expanded_state.asset.social.twitter),
        url: metadata.links.twitter.url,
        value: `@${metadata.links.twitter.url.split('/').pop()}`,
      });
    }

    if (metadata?.links?.telegram?.url) {
      items.push({
        iconName: 'telegram',
        title: i18n.t(i18n.l.expanded_state.asset.social.telegram),
        url: metadata.links.telegram.url,
        value: formatURLForDisplay(metadata.links.telegram.url),
      });
    }

    items.push({
      icon: '􀊫',
      title: i18n.t(i18n.l.expanded_state.asset.social.search_on_twitter),
      url: `https://x.com/search?q=$${asset.symbol}`,
    });

    return items;
  }, [asset.symbol, metadata?.links]);

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
            {i18n.t(i18n.l.expanded_state.sections.about.what_is, { assetName: asset.name })}
          </Text>
          <Description text={metadata.description} />
        </Box>
      )}
    </Box>
  );
}
