import PropTypes from 'prop-types';
import React from 'react';
import { sortList } from '../../helpers/sortList';
import { margin } from '../../styles';
import { magicMemo } from '../../utils';
import Tag from '../Tag';
import { Row } from '../layout';

const AttributeItem = ({ trait_type: type, value }) =>
  type ? (
    <Tag
      css={margin(0, 10, 10, 0)}
      key={`${type}${value}`}
      text={value}
      title={type}
    />
  ) : null;

AttributeItem.propTypes = {
  trait_type: PropTypes.string.isRequired,
  value: PropTypes.string,
};

const UniqueTokenAttributes = ({ traits }) => (
  <Row align="start" wrap>
    {sortList(traits, 'trait_type', 'asc').map(AttributeItem)}
  </Row>
);

UniqueTokenAttributes.propTypes = {
  traits: PropTypes.arrayOf(
    PropTypes.shape({
      trait_type: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
    })
  ),
};

export default magicMemo(UniqueTokenAttributes, 'traits');
