import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from '../Tag';
import { Inline } from '@rainbow-me/design-system';

type Trait = { trait_type: string; value: string };

const AttributeItem = ({ trait_type: type, value }: Trait) =>
  type ? <Tag key={`${type}${value}`} text={value} title={type} /> : null;

const UniqueTokenAttributes = ({ traits }: { traits: Trait[] }) => (
  <Inline space="10dp">
    {sortList(traits, 'trait_type', 'asc').map(AttributeItem)}
  </Inline>
);

export default magicMemo(UniqueTokenAttributes, 'traits');
