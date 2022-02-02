import PropTypes from 'prop-types';
import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
import Tag from '../Tag';
import { Row } from '../layout';
import { margin } from '@rainbow-me/styles';

const AttributeItem = ({
  color,
  trait_type: type,
  slug,
  value,
  disableMenu,
  max_value: maxValue,
}) =>
  type && value ? (
    <Tag
      color={color}
      css={margin(7, 10, 3, 0)}
      disableMenu={disableMenu}
      key={`${type}${value}`}
      maxValue={maxValue}
      slug={slug}
      text={value}
      title={type}
    />
  ) : null;

AttributeItem.propTypes = {
  color: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  trait_type: PropTypes.string.isRequired,
  value: PropTypes.string,
};

const UniqueTokenAttributes = ({ color, slug, traits, disableMenu }) => {
  const sortedTraits = sortList(traits, 'trait_type', 'asc');
  sortedTraits.forEach(trait => {
    trait['color'] = color;
    trait['slug'] = slug;
    trait['disableMenu'] = disableMenu;
  });
  return (
    <Row align="start" wrap>
      {sortedTraits.map(AttributeItem)}
    </Row>
  );
};

UniqueTokenAttributes.propTypes = {
  color: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  traits: PropTypes.arrayOf(
    PropTypes.shape({
      trait_type: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
    })
  ),
};

export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
