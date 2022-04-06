import React from 'react';
import Tag from '../Tag';
import { magicMemo } from '@rainbow-me/utils';

interface AttributeItemProps {
  color: string;
  display_type: string;
  slug: string;
  trait_type: string;
  value: string | number;
  disableMenu?: boolean;
  max_value?: string | number;
}

const UniqueTokenAttributeItem: React.FC<AttributeItemProps> = ({
  color,
  disableMenu,
  trait_type: type,
  slug,
  value,
  max_value: maxValue,
  display_type: displayType,
}) => {
  if (!type || !value) {
    return null;
  }

  const shouldDisableMenu = disableMenu || displayType === 'date';

  return (
    <Tag
      color={color}
      disableMenu={shouldDisableMenu}
      maxValue={maxValue}
      slug={slug}
      text={value}
      title={type}
    />
  );
};

export default magicMemo(UniqueTokenAttributeItem, ['slug', 'color', 'value']);
