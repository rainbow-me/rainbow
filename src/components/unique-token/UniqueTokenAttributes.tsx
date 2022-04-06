import { format } from 'date-fns';
import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from '../Tag';
import { Inline } from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';

interface AttributeItemProps {
  color: string;
  display_type: string;
  slug: string;
  trait_type: string;
  value: string | number;
  disableMenu?: boolean;
  max_value?: string | number;
}

const formatTextValue = (value: string | number, displayType: string) => {
  switch (displayType) {
    case 'date':
      // the value is in seconds, formatted like Jan 29th, 2022
      return typeof value === 'number'
        ? format(value * 1000, 'MMM do, y')
        : value;
    default:
      return value;
  }
};

const renderAttributeItem = ({
  color,
  disableMenu,
  trait_type: type,
  slug,
  value,
  max_value: maxValue,
  display_type: displayType,
}: AttributeItemProps) => {
  if (!type || !value) {
    return null;
  }

  const textValue = formatTextValue(value, displayType);
  const shouldDisableMenu = disableMenu || displayType === 'date';

  return (
    <Tag
      color={color}
      disableMenu={shouldDisableMenu}
      key={`${type}${value}`}
      maxValue={maxValue}
      slug={slug}
      text={textValue}
      title={type}
    />
  );
};

interface UniqueTokenAttributesProps {
  color: string;
  disableMenu?: boolean;
  slug: string;
  traits: UniqueAsset['traits'];
}

const UniqueTokenAttributes = ({
  color,
  disableMenu,
  slug,
  traits,
}: UniqueTokenAttributesProps) => {
  const sortedTraits = (sortList(
    traits,
    'trait_type',
    'asc'
  ) as typeof traits).map(trait => ({
    ...trait,
    color,
    disableMenu,
    slug,
  }));

  return <Inline space="10px">{sortedTraits.map(renderAttributeItem)}</Inline>;
};

export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
