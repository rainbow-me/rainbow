import React from 'react';
import Menu from '../Menu';
import MenuContainer from '../MenuContainer';
import MenuItem from '../MenuItem';
import * as i18n from '@/languages';
import { useSendFeedback, type SupportCategory } from '@/hooks/useSendFeedback';

const categoryI18n = i18n.l.settings.support.category;
const entryI18n = i18n.l.settings.support.entry;

interface CategoryConfig {
  key: SupportCategory;
  emoji: string;
  titleKey: string;
  labelKey: string;
}

const categories: CategoryConfig[] = [
  { key: 'backup_recovery', emoji: '☁️', titleKey: categoryI18n.backup_recovery.name, labelKey: categoryI18n.backup_recovery.description },
  { key: 'getting_started', emoji: '🚀', titleKey: categoryI18n.getting_started.name, labelKey: categoryI18n.getting_started.description },
  {
    key: 'tokens_transactions',
    emoji: '💰',
    titleKey: categoryI18n.tokens_transactions.name,
    labelKey: categoryI18n.tokens_transactions.description,
  },
  { key: 'bridge_swap', emoji: '🔄', titleKey: categoryI18n.bridge_swap.name, labelKey: categoryI18n.bridge_swap.description },
  { key: 'points_rewards', emoji: '⭐', titleKey: categoryI18n.points_rewards.name, labelKey: categoryI18n.points_rewards.description },
  { key: 'security', emoji: '🚨', titleKey: categoryI18n.security.name, labelKey: categoryI18n.security.description },
  { key: 'partnership', emoji: '🤝', titleKey: categoryI18n.partnership.name, labelKey: categoryI18n.partnership.description },
  { key: 'other', emoji: '❓', titleKey: categoryI18n.other.name, labelKey: categoryI18n.other.description },
];

export const SupportCategoryPickerView = () => {
  const sendFeedback = useSendFeedback();

  const handleCategoryPress = (category: SupportCategory) => {
    sendFeedback({ type: 'help', category });
  };

  return (
    <MenuContainer>
      <Menu description={i18n.t(entryI18n.category_picker_description)} descriptionPosition="leading">
        {categories.map(({ key, emoji, titleKey, labelKey }) => (
          <MenuItem
            key={key}
            leftComponent={<MenuItem.TextIcon icon={emoji} isEmoji />}
            onPress={() => handleCategoryPress(key)}
            size={60}
            titleComponent={<MenuItem.Title text={i18n.t(titleKey)} />}
            labelComponent={<MenuItem.Label text={i18n.t(labelKey)} />}
          />
        ))}
      </Menu>
    </MenuContainer>
  );
};
