import React from 'react';
import { CollapsableField } from './CollapsableField';
import { Bleed, Box, IconContainer, Separator, Text, TextIcon, TextShadow } from '@/design-system';
import { useTokenLauncherStore, Link, LinkType } from '../state/tokenLauncherStore';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SingleFieldInput } from './SingleFieldInput';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Icon } from '@/components/icons';
import { FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR } from '../constants';
import { useTheme } from '@/theme';
import FastImage from 'react-native-fast-image';
import { Grid } from './Grid';

const ANIMATION_CONFIG = SPRING_CONFIGS.slowSpring;

// TODO: add discord (maybe)
const LINK_SETTINGS = {
  x: {
    Icon: () => <Icon name="x" color={'white'} size={26} />,
    iconBackgroundColor: '#000000',
    primaryColor: '#000000',
    placeholder: 'Username',
    displayName: 'X/Twitter',
    type: 'x',
  },
  telegram: {
    Icon: () => (
      <IconContainer height={20} width={20}>
        <Bleed left="6px">
          <Icon name="telegram" width="20" height="12" />
        </Bleed>
      </IconContainer>
    ),
    iconBackgroundColor: '#24A1DE',
    primaryColor: '#24A1DE',
    placeholder: 'Channel',
    displayName: 'Telegram',
    type: 'telegram',
  },
  farcaster: {
    Icon: () => <FastImage source={require('@/assets/warpcast.png')} style={{ width: 20, height: 20 }} />,
    iconBackgroundColor: '#855DCD',
    primaryColor: '#855DCD',
    placeholder: 'Username',
    displayName: 'Farcaster',
    type: 'farcaster',
  },
  website: {
    Icon: () => (
      <TextIcon containerSize={20} color="label" size="icon 11px" weight="heavy">
        􀆪
      </TextIcon>
    ),
    iconBackgroundColor: '#000000',
    primaryColor: '#000000',
    placeholder: 'https://token.com',
    displayName: 'Website',
    type: 'website',
  },
  other: {
    Icon: () => (
      <TextIcon containerSize={20} color="label" size="icon 11px" weight="heavy">
        {'􀉣'}
      </TextIcon>
    ),
    iconBackgroundColor: '#000000',
    primaryColor: '#000000',
    placeholder: 'https://other.com',
    displayName: 'Other',
    type: 'other',
  },
};

export const LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(ANIMATION_CONFIG.mass as number)
  .damping(ANIMATION_CONFIG.damping as number)
  .stiffness(ANIMATION_CONFIG.stiffness as number);

function LinkField({ link, index }: { link: Link; index: number }) {
  const editLink = useTokenLauncherStore(state => state.editLink);
  const deleteLink = useTokenLauncherStore(state => state.deleteLink);
  const { Icon, placeholder, iconBackgroundColor } = LINK_SETTINGS[link.type as keyof typeof LINK_SETTINGS];

  const onInputChange = (input: string) => {
    // TODO: parse input for url and type
    editLink({ index, input, url: input });
  };

  return (
    <Box flexDirection="row" alignItems="center" gap={16}>
      <SingleFieldInput
        style={{
          flex: 1,
          backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
          paddingVertical: 0,
          paddingHorizontal: 16,
          borderRadius: FIELD_INNER_BORDER_RADIUS,
        }}
        icon={
          <Box width={20} height={20} borderRadius={10} backgroundColor={iconBackgroundColor} justifyContent="center" alignItems="center">
            <Icon />
          </Box>
        }
        textAlign="left"
        inputStyle={{ textAlign: 'left', paddingLeft: 8 }}
        onInputChange={onInputChange}
        placeholder={placeholder}
      />
      <ButtonPressAnimation
        style={{ opacity: link.type === 'website' ? 0 : 1 }}
        disabled={link.type === 'website'}
        onPress={() => deleteLink(index)}
      >
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text color="labelSecondary" size="17pt" weight="heavy">
            {'􀈒'}
          </Text>
        </TextShadow>
      </ButtonPressAnimation>
    </Box>
  );
}

export function LinksSection() {
  const { colors } = useTheme();
  const links = useTokenLauncherStore(state => state.links);
  const addLink = useTokenLauncherStore(state => state.addLink);

  const addMoreLinks = Object.keys(LINK_SETTINGS).filter(linkType => linkType !== 'website');

  return (
    <CollapsableField title="Links">
      <Animated.View layout={LAYOUT_ANIMATION}>
        <Box gap={8}>
          <LinkField link={{ type: 'website', url: '', input: '' }} index={links.length} />
          {links.map((link, index) => (
            <LinkField key={`${link.type}-${index}`} link={link} index={index} />
          ))}
        </Box>
        <Box paddingVertical="16px">
          <Separator color="separatorSecondary" />
          <Text style={{ paddingTop: 16 }} color="labelSecondary" size="17pt" weight="heavy">
            {'Add More'}
          </Text>
        </Box>
        <Grid columns={2} spacing={8}>
          {addMoreLinks.map((linkType, index) => {
            const { Icon, displayName, iconBackgroundColor, primaryColor } = LINK_SETTINGS[linkType as keyof typeof LINK_SETTINGS];
            const backgroundColor = colors.alpha(primaryColor, 0.05);
            return (
              <ButtonPressAnimation key={`${linkType}-${index}`} onPress={() => addLink(linkType as LinkType)}>
                <Box
                  paddingLeft="10px"
                  paddingRight="16px"
                  paddingVertical="10px"
                  borderWidth={FIELD_BORDER_WIDTH}
                  borderRadius={FIELD_BORDER_RADIUS}
                  borderColor="fillTertiary"
                  backgroundColor={backgroundColor}
                >
                  <Box flexDirection="row" alignItems="center" gap={8}>
                    <Box
                      width={20}
                      height={20}
                      borderRadius={10}
                      backgroundColor={iconBackgroundColor}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Icon />
                    </Box>
                    <TextShadow containerStyle={{ flex: 1 }} blur={12} shadowOpacity={0.24}>
                      <Text align="center" color="labelSecondary" size="17pt" weight="heavy">
                        {displayName}
                      </Text>
                    </TextShadow>
                  </Box>
                </Box>
              </ButtonPressAnimation>
            );
          })}
        </Grid>
      </Animated.View>
    </CollapsableField>
  );
}
