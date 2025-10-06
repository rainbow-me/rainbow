/** @refresh reset */
import React from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { CollapsibleSectionBase } from '@/components/collapsible/CollapsibleSectionBase';
import { SectionId, useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';

interface CollapsibleSectionProps {
  content: React.ReactNode;
  icon: string;
  id: SectionId;
  primaryText: string;
  secondaryText?: string;
}

export function CollapsibleSection({ content, icon, id, primaryText, secondaryText }: CollapsibleSectionProps) {
  const { expandedSections } = useExpandedAssetSheetContext();

  const expanded = useDerivedValue(() => {
    'worklet';
    const map = expandedSections.value;
    return !!map[id];
  });

  const onToggle = () => {
    'worklet';
    expandedSections.modify(current => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <CollapsibleSectionBase
      content={content}
      icon={icon}
      primaryText={primaryText}
      secondaryText={secondaryText}
      expanded={expanded}
      onToggle={onToggle}
    />
  );
}

export { LAYOUT_ANIMATION } from '@/components/collapsible/CollapsibleSectionBase';
