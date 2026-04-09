import React, { useMemo } from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Stack, Text } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import { useSendFeedback } from '@/hooks/useSendFeedback';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme/ThemeContext';
import { openInBrowser } from '@/utils/openInBrowser';

import { SettingsExternalURLs } from '../../constants';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';

export const SupportSection = () => {
  return (
    <MenuContainer>
      <Stack space="24px">
        <ContactSupportCard />
        <Menu>
          <ShareFeedbackMenuItem />
          <FaqAndGuidesMenuItem />
        </Menu>
      </Stack>
    </MenuContainer>
  );
};

const ContactSupportCard = () => {
  const { navigate } = useNavigation();

  const handleCardPress = () => {
    navigate(Routes.SETTINGS_SECTION_SUPPORT_CATEGORY_PICKER, {
      title: i18n.t(i18n.l.settings.support.entry.contact_support),
    });
  };

  return (
    <ButtonPressAnimation onPress={handleCardPress} scaleTo={0.98}>
      <Box background="surfaceSecondaryElevated" borderRadius={18} padding="20px" alignItems="center">
        <Box flexDirection="row" alignItems="center" gap={10} paddingBottom="16px">
          <Text color="label" size="20pt" weight="bold" containsEmoji>
            {'🙋'}
          </Text>
          <Text color="label" size="20pt" weight="heavy">
            {i18n.t(i18n.l.settings.support.entry.contact_support)}
          </Text>
        </Box>

        <Box paddingBottom="16px">
          <Text color="labelTertiary" size="15pt" weight="regular" align="center">
            {i18n.t(i18n.l.settings.support.entry.contact_support_description)}
          </Text>
        </Box>

        <ChooseTopicCTAButton />
      </Box>
    </ButtonPressAnimation>
  );
};

const ChooseTopicCTAButton = () => {
  const { colors } = useTheme();
  const ctaButtonStyle = useMemo(() => ({ backgroundColor: opacity(colors.appleBlue, 0.06) }), [colors]);

  return (
    <Box
      alignItems="center"
      justifyContent="center"
      borderRadius={12}
      paddingVertical="12px"
      paddingHorizontal="16px"
      style={ctaButtonStyle}
    >
      <Box flexDirection="row" alignItems="center" gap={6}>
        <Text color="blue" size="17pt" weight="semibold">
          {i18n.t(i18n.l.settings.support.entry.get_started)}
        </Text>
        <Text color="blue" size="15pt" weight="semibold">
          {'→'}
        </Text>
      </Box>
    </Box>
  );
};

const ShareFeedbackMenuItem = () => {
  const sendFeedback = useSendFeedback();

  const handlePress = () => {
    sendFeedback({ type: 'feedback' });
  };

  return (
    <MenuItem
      leftComponent={<MenuItem.TextIcon icon="💡" isEmoji />}
      onPress={handlePress}
      size={60}
      titleComponent={<MenuItem.Title text={i18n.t(i18n.l.settings.support.entry.share_feedback)} />}
      labelComponent={<MenuItem.Label text={i18n.t(i18n.l.settings.support.entry.share_feedback_description)} />}
    />
  );
};

const FaqAndGuidesMenuItem = () => {
  const handlePress = () => {
    openInBrowser(SettingsExternalURLs.rainbowSupport);
  };

  return (
    <MenuItem
      leftComponent={<MenuItem.TextIcon icon="📚" isEmoji />}
      onPress={handlePress}
      size={52}
      titleComponent={<MenuItem.Title text={i18n.t(i18n.l.settings.support.entry.faqs_and_guides)} />}
    />
  );
};
