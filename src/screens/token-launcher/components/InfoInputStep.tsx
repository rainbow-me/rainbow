import React, { useCallback, useRef } from 'react';
import i18n from '@/languages';
import { Bleed, Box, Text, Separator } from '@/design-system';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FOOTER_HEIGHT } from './TokenLauncherFooter';
import { TOKEN_LAUNCHER_HEADER_HEIGHT, TOKEN_LAUNCHER_SCROLL_INDICATOR_INSETS } from './TokenLauncherHeader';
import { SingleFieldInput, SingleFieldInputRef } from './SingleFieldInput';
import { TokenLogo } from './TokenLogo';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { NetworkField } from './NetworkField';
import { LinksSection } from './LinksSection';
import { DescriptionField } from './DescriptionField';
import { COLLAPSABLE_FIELD_ANIMATION } from '../constants';
import Animated from 'react-native-reanimated';
import { validateNameWorklet, validateSymbolWorklet } from '../helpers/inputValidators';
import { Icon } from '@/components/icons';
import { IS_ANDROID } from '@/env';
import { getColorForTheme } from '@/design-system/color/useForegroundColor';
import { opacity } from '@/__swaps__/utils/swaps';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { PrebuySection } from '@/screens/token-launcher/components/PrebuySection';

const LABEL_QUINARY = { custom: opacity(getColorForTheme('labelQuaternary', 'dark'), 0.3) };

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
      title={i18n.token_launcher.titles.ticker()}
      placeholder={i18n.token_launcher.placeholders.ticker()}
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
      title={i18n.token_launcher.titles.name()}
      placeholder={i18n.token_launcher.placeholders.enter_coin_name()}
    />
  );
}

function RequiredInfoSection() {
  return (
    <Box paddingVertical={'20px'} gap={16} width="full">
      <Box flexDirection="row" alignItems="center" gap={10}>
        <Icon name="asterisk" color={LABEL_QUINARY.custom} size={10} />
        <Text color={LABEL_QUINARY} size="13pt" weight="heavy">
          {i18n.token_launcher.titles.required_info()}
        </Text>
      </Box>
      <Box gap={8}>
        <SymbolInput />
        <NameInput />
        <NetworkField />
      </Box>
    </Box>
  );
}

function AboutSection() {
  return (
    <Box gap={16} paddingVertical={'20px'}>
      <Box paddingHorizontal={'20px'}>
        <Text color={LABEL_QUINARY} size="13pt" weight="heavy">
          {i18n.token_launcher.titles.about()}
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
  const { infoInputScrollRef, infoInputScrollY } = useTokenLauncherContext();

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = e.nativeEvent.contentOffset.y;
      infoInputScrollY.current = scrollY;
    },
    [infoInputScrollY]
  );

  return (
    <KeyboardAwareScrollView
      ref={infoInputScrollRef}
      onScroll={onScroll}
      scrollEventThrottle={64}
      bottomOffset={FOOTER_HEIGHT + (IS_ANDROID ? 56 : 36)}
      contentContainerStyle={styles.contentContainerStyle}
      extraKeyboardSpace={FOOTER_HEIGHT}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      scrollIndicatorInsets={TOKEN_LAUNCHER_SCROLL_INDICATOR_INSETS}
      showsVerticalScrollIndicator={false}
    >
      <Box width="full" alignItems="center" paddingHorizontal="20px">
        <Box paddingBottom={'16px'}>
          <TokenLogo />
        </Box>
        <RequiredInfoSection />
        <Animated.View style={styles.fullWidth} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <SectionSeparator />
          <AboutSection />
        </Animated.View>
        <Animated.View style={styles.fullWidth} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <SectionSeparator />
          <Box gap={16} paddingVertical="20px" width="full">
            <PrebuySection />
          </Box>
        </Animated.View>
      </Box>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: {
    flexGrow: 1,
    paddingTop: TOKEN_LAUNCHER_HEADER_HEIGHT,
  },
  fullWidth: {
    width: '100%',
  },
});
