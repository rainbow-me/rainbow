import React, { useRef } from 'react';
import * as i18n from '@/languages';
import { Bleed, Box, Text, useForegroundColor, Separator } from '@/design-system';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FOOTER_HEIGHT } from './TokenLauncherFooter';
import { TOKEN_LAUNCHER_HEADER_HEIGHT } from './TokenLauncherHeader';
import { SingleFieldInput, SingleFieldInputRef } from './SingleFieldInput';
import { TokenLogo } from './TokenLogo';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { NetworkField } from './NetworkField';
import { LinksSection } from './LinksSection';
import { DescriptionField } from './DescriptionField';
import { COLLAPSABLE_FIELD_ANIMATION, DEFAULT_TOTAL_SUPPLY } from '../constants';
import { TokenAllocationSection } from './TokenAllocationSection';
import Animated from 'react-native-reanimated';
import { validateNameWorklet, validateSymbolWorklet, validateTotalSupplyWorklet } from '../helpers/inputValidators';
import { Icon } from '@/components/icons';
import { IS_ANDROID } from '@/env';

function TotalSupplyInput() {
  const setTotalSupply = useTokenLauncherStore(state => state.setTotalSupply);
  const formattedTotalSupply = useTokenLauncherStore(state => state.formattedTotalSupply());

  return (
    <SingleFieldInput
      onInputChange={text => {
        setTotalSupply(parseInt(text.trim()) || 0);
      }}
      validationWorklet={text => {
        'worklet';
        return validateTotalSupplyWorklet(parseInt(text.trim()) || 0);
      }}
      inputMode="numeric"
      title={i18n.t(i18n.l.token_launcher.titles.total_supply)}
      subtitle={formattedTotalSupply}
      defaultValue={DEFAULT_TOTAL_SUPPLY.toString()}
    />
  );
}

function SymbolInput() {
  const setSymbol = useTokenLauncherStore(state => state.setSymbol);
  const inputRef = useRef<SingleFieldInputRef>(null);

  return (
    <SingleFieldInput
      ref={inputRef}
      validationWorklet={validateSymbolWorklet}
      onInputChange={text => {
        setSymbol(text);
      }}
      spellCheck={false}
      autoCapitalize="characters"
      title={i18n.t(i18n.l.token_launcher.titles.ticker)}
      placeholder={i18n.t(i18n.l.token_launcher.placeholders.ticker)}
    />
  );
}

function NameInput() {
  const setName = useTokenLauncherStore(state => state.setName);

  return (
    <SingleFieldInput
      validationWorklet={validateNameWorklet}
      onInputChange={text => {
        setName(text);
      }}
      spellCheck={false}
      autoCapitalize="words"
      title={i18n.t(i18n.l.token_launcher.titles.name)}
      placeholder={i18n.t(i18n.l.token_launcher.placeholders.enter_coin_name)}
    />
  );
}

function RequiredInfoSection() {
  const labelQuaternary = useForegroundColor('labelQuaternary');
  return (
    <Box paddingVertical={'20px'} gap={16} width="full">
      <Box flexDirection="row" alignItems="center" gap={10}>
        <Icon name="asterisk" color={labelQuaternary} size={10} />
        <Text color="labelQuaternary" size="13pt" weight="heavy">
          {i18n.t(i18n.l.token_launcher.titles.required_info)}
        </Text>
      </Box>
      <Box gap={8}>
        <SymbolInput />
        <NameInput />
        <TotalSupplyInput />
        <NetworkField />
      </Box>
    </Box>
  );
}

function AboutSection() {
  return (
    <Box gap={16} paddingVertical={'20px'}>
      <Box paddingHorizontal={'20px'}>
        <Text color="labelQuaternary" size="13pt" weight="heavy">
          {i18n.t(i18n.l.token_launcher.titles.about)}
        </Text>
      </Box>
      <Box gap={12} width={'full'}>
        <DescriptionField />
        <LinksSection />
      </Box>
    </Box>
  );
}

function SectionSeparator() {
  return (
    <Bleed horizontal={'20px'}>
      <Separator direction="horizontal" thickness={1} color={'separatorSecondary'} />
    </Bleed>
  );
}

export function InfoInputStep() {
  return (
    <KeyboardAwareScrollView
      scrollIndicatorInsets={{ top: TOKEN_LAUNCHER_HEADER_HEIGHT }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: TOKEN_LAUNCHER_HEADER_HEIGHT,
      }}
      keyboardDismissMode="interactive"
      bottomOffset={FOOTER_HEIGHT + (IS_ANDROID ? 56 : 36)}
      extraKeyboardSpace={FOOTER_HEIGHT}
    >
      <Box width="full" alignItems="center" paddingBottom={'20px'} paddingHorizontal="20px">
        <Box paddingBottom={'16px'}>
          <TokenLogo />
        </Box>
        <RequiredInfoSection />
        <Animated.View style={{ width: '100%' }} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <SectionSeparator />
          <AboutSection />
        </Animated.View>
        <Animated.View style={{ width: '100%' }} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <SectionSeparator />
          <TokenAllocationSection />
        </Animated.View>
      </Box>
    </KeyboardAwareScrollView>
  );
}
