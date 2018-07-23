import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import { H1, Monospace } from '../text';
import ContextMenu from '../ContextMenu';
import Divider from '../Divider';

const Header = styled(Row).attrs({ align: 'center', justify: 'space-between' })`
  ${padding(0, 19)}
  background-color: ${colors.white};
  height: 35;
  width: 100%;
`;

const AssetListHeader = ({ section: { showContextMenu, title, totalValue } }) => (
  <Fragment>
    <Header>
      <Row align="center">
        <H1>{title}</H1>
        {showContextMenu && (
          <ContextMenu
            cancelButtonIndex={1}
            onPress={(index) => console.log('ON PRESS', index)}
            options={['Hide zero value assets', 'Cancel']}
          />
        )}
      </Row>
      <Monospace
        color={colors.blueGreyDark}
        size="large"
        weight="semibold"
      >
        {`${totalValue}`}
      </Monospace>
    </Header>
    <Divider />
  </Fragment>
);

AssetListHeader.propTypes = {
  section: PropTypes.shape({
    showContextMenu: PropTypes.bool,
    title: PropTypes.string,
    totalValue: PropTypes.string,
  }),
};

export default AssetListHeader;
