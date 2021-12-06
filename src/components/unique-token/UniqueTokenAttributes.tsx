import PropTypes from 'prop-types';
import React from 'react';
import { sortList } from '../../helpers/sortList';
import { magicMemo } from '../../utils';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Tag' was resolved to '/Users/nickbytes/... Remove this comment to see the full error message
import Tag from '../Tag';
import { Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin } from '@rainbow-me/styles';

const AttributeItem = ({ color, trait_type: type, slug, value }: any) =>
  type && value ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Tag
      color={color}
      css={margin(7, 10, 3, 0)}
      key={`${type}${value}`}
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

const UniqueTokenAttributes = ({ color, slug, traits }: any) => {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 5 arguments, but got 3.
  const sortedTraits = sortList(traits, 'trait_type', 'asc');
  sortedTraits.forEach(trait => {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
    trait['color'] = color;
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
    trait['slug'] = slug;
  });
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(UniqueTokenAttributes, ['color', 'slug', 'traits']);
