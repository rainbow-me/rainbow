import React, { useState } from 'react';
import * as i18n from '@/languages';
import { StyleSheet } from 'react-native';
import { CollapsableField } from './CollapsableField';
import { Bleed, Box, IconContainer, Separator, Text, TextIcon, TextShadow } from '@/design-system';
import { useTokenLauncherStore, Link, LinkType } from '../state/tokenLauncherStore';
import Animated from 'react-native-reanimated';
import { SingleFieldInput } from './SingleFieldInput';
import { ButtonPressAnimation } from '@/components/animations';
import { Icon } from '@/components/icons';
import {
  COLLAPSABLE_FIELD_ANIMATION,
  FIELD_BORDER_RADIUS,
  FIELD_BORDER_WIDTH,
  FIELD_INNER_BORDER_RADIUS,
  INNER_FIELD_BACKGROUND_COLOR,
  SMALL_INPUT_HEIGHT,
} from '../constants';
import { useTheme } from '@/theme';
import FastImage from 'react-native-fast-image';
import { Grid } from './Grid';
import { validateLinkWorklet } from '../helpers/inputValidators';
import { colors } from '@/styles';

export const LINK_SETTINGS = {
  x: {
    Icon: () => <Icon name="x" color={'white'} size={26} />,
    iconBackgroundColor: '#000000',
    primaryColor: '#000000',
    placeholder: i18n.t(i18n.l.token_launcher.links.x.placeholder),
    displayName: i18n.t(i18n.l.token_launcher.links.x.name),
    type: 'x',
  },
  telegram: {
    Icon: () => (
      <IconContainer height={20} width={20}>
        <Bleed left="6px">
          <Icon name="telegram" width="20" height="12" color={colors.white} />
        </Bleed>
      </IconContainer>
    ),
    iconBackgroundColor: '#24A1DE',
    primaryColor: '#24A1DE',
    placeholder: i18n.t(i18n.l.token_launcher.links.telegram.placeholder),
    displayName: i18n.t(i18n.l.token_launcher.links.telegram.name),
    type: 'telegram',
  },
  farcaster: {
    Icon: () => <FastImage source={require('@/assets/warpcast.png')} style={{ width: 20, height: 20 }} />,
    iconBackgroundColor: '#855DCD',
    primaryColor: '#855DCD',
    placeholder: i18n.t(i18n.l.token_launcher.links.farcaster.placeholder),
    displayName: i18n.t(i18n.l.token_launcher.links.farcaster.name),
    type: 'farcaster',
  },
  website: {
    Icon: () => (
      <TextIcon
        // This specific globe icon has a problem being centered. Even this is not absolutely centered, but it's closer
        textStyle={{ marginLeft: StyleSheet.hairlineWidth * 2 }}
        containerSize={20}
        color="label"
        size="icon 13px"
        weight="heavy"
      >
        {'􀆪'}
      </TextIcon>
    ),
    iconBackgroundColor: colors.appleBlue,
    primaryColor: '#fff',
    placeholder: i18n.t(i18n.l.token_launcher.links.website.placeholder),
    displayName: i18n.t(i18n.l.token_launcher.links.website.name),
    type: 'website',
  },
  other: {
    Icon: () => (
      <TextIcon containerSize={20} color="label" size="icon 10px" weight="heavy">
        {'􀉣'}
      </TextIcon>
    ),
    iconBackgroundColor: '#000000',
    primaryColor: '#000000',
    placeholder: i18n.t(i18n.l.token_launcher.links.other.placeholder),
    displayName: i18n.t(i18n.l.token_launcher.links.other.name),
    type: 'other',
  },
};

function LinkField({ link, index }: { link: Link; index: number }) {
  const editLink = useTokenLauncherStore(state => state.editLink);
  const deleteLink = useTokenLauncherStore(state => state.deleteLink);
  const { Icon, placeholder, iconBackgroundColor } = LINK_SETTINGS[link.type as keyof typeof LINK_SETTINGS];

  const [isValid, setIsValid] = useState(true);

  const onInputChange = (input: string) => {
    editLink({ index, input, url: input });
    const isValidInput = !validateLinkWorklet({ link: input, type: link.type });
    if (isValidInput !== isValid) {
      setIsValid(isValidInput);
    }
  };

  return (
    <Box>
      <Box flexDirection="row" alignItems="center" gap={16}>
        <SingleFieldInput
          style={{
            flex: 1,
            backgroundColor: INNER_FIELD_BACKGROUND_COLOR,
            paddingHorizontal: 16,
            borderRadius: FIELD_INNER_BORDER_RADIUS,
            height: SMALL_INPUT_HEIGHT,
          }}
          icon={
            <Box width={20} height={20} borderRadius={10} backgroundColor={iconBackgroundColor} justifyContent="center" alignItems="center">
              <Icon />
            </Box>
          }
          validationWorklet={(input: string) => {
            return validateLinkWorklet({ link: input, type: link.type });
          }}
          textAlign="left"
          inputStyle={{ textAlign: 'left', paddingLeft: 8 }}
          onInputChange={onInputChange}
          placeholder={placeholder}
          autoCorrect={false}
          spellCheck={false}
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
      {!isValid && (
        <Box paddingVertical={'8px'} paddingHorizontal={'20px'}>
          <Text color="red" size="13pt" weight="heavy">
            {i18n.t(i18n.l.token_launcher.input_errors.invalid_input)}
          </Text>
        </Box>
      )}
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
      <Box gap={8}>
        {links.map((link, index) => (
          <Animated.View key={`${link.type}`} layout={COLLAPSABLE_FIELD_ANIMATION}>
            <LinkField link={link} index={index} />
          </Animated.View>
        ))}
      </Box>
      <Animated.View layout={COLLAPSABLE_FIELD_ANIMATION} style={{ width: '100%' }}>
        <Box paddingVertical="16px">
          <Separator color="separatorSecondary" />
          <Text style={{ paddingTop: 16 }} color="labelSecondary" size="17pt" weight="heavy">
            {i18n.t(i18n.l.token_launcher.links.add_more)}
          </Text>
        </Box>
        <Grid columns={2} spacing={8}>
          {addMoreLinks.map((linkType, index) => {
            const { Icon, displayName, iconBackgroundColor, primaryColor } = LINK_SETTINGS[linkType as keyof typeof LINK_SETTINGS];
            const backgroundColor = colors.alpha(primaryColor, 0.05);
            const hasAddedLink = links.some(link => link.type === linkType);

            return (
              <ButtonPressAnimation key={`${linkType}-${index}`} disabled={hasAddedLink} onPress={() => addLink(linkType as LinkType)}>
                <Box
                  paddingLeft="10px"
                  paddingRight="16px"
                  paddingVertical="10px"
                  borderWidth={FIELD_BORDER_WIDTH}
                  borderRadius={FIELD_BORDER_RADIUS}
                  borderColor="fillTertiary"
                  backgroundColor={backgroundColor}
                  style={{ opacity: hasAddedLink ? 0.5 : 1 }}
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
