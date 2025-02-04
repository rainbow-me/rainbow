import React from 'react';
import { CollapsableField } from './CollapsableField';
import { Bleed, Box, IconContainer, Text, TextIcon, TextShadow } from '@/design-system';
import { useTokenLauncherStore, Link } from '../state/tokenLauncherStore';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { SingleFieldInput } from './SingleFieldInput';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Icon } from '@/components/icons';
import { FIELD_INNER_BORDER_RADIUS, INNER_FIELD_BACKGROUND_COLOR } from '../constants';

const ANIMATION_CONFIG = SPRING_CONFIGS.slowSpring;

// TODO: add discord (maybe), other
const LINK_SETTINGS = {
  x: {
    Icon: () => <Icon name="x" color={'white'} size={26} />,
    iconBackgroundColor: 'black',
    placeholder: 'Username',
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
    placeholder: 'Channel',
  },
  // TODO: get warpcast W svg
  farcaster: {
    Icon: () => (
      <TextIcon color="label" size="13pt" weight="heavy">
        W
      </TextIcon>
    ),
    iconBackgroundColor: '#855DCD',
    placeholder: 'Username',
  },
  website: {
    Icon: () => (
      <TextIcon color="label" size="13pt" weight="heavy">
        􀆪
      </TextIcon>
    ),
    iconBackgroundColor: '#000000',
    placeholder: 'https://token.com',
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
        onInputChange={url => editLink(index, url)}
        placeholder={placeholder}
      />
      <ButtonPressAnimation onPress={() => deleteLink(index)}>
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
  const links = useTokenLauncherStore(state => state.links);
  const addLink = useTokenLauncherStore(state => state.addLink);

  return (
    <CollapsableField title="Links">
      <Animated.View layout={LAYOUT_ANIMATION}>
        <Box gap={8}>
          {links.map((link, index) => (
            <LinkField key={`${link.type}-${index}`} link={link} index={index} />
          ))}
        </Box>
      </Animated.View>
    </CollapsableField>
  );
}
