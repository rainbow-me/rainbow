import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from '../Tag';
import { Inline } from '@rainbow-me/design-system';

interface AttributeItemProps {
  color: string;
  trait_type: string;
  slug: string;
  value: string;
}

const renderAttributeItem = ({
  color,
  trait_type: type,
  slug,
  value,
}: AttributeItemProps) =>
  type && value ? (
    <Tag
      color={color}
      key={`${type}${value}`}
      slug={slug}
      text={value}
      title={type}
    />
  ) : null;

interface UniqueTokenAttributesProps {
  color: string;
  slug: string;
  traits: {
    trait_type: string;
    value: string;
  }[];
}

const UniqueTokenAttributes = ({
  color,
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
    slug,
  }));

  return <Inline space="10px">{sortedTraits.map(renderAttributeItem)}</Inline>;
};

export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
