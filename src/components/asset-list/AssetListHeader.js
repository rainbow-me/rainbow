import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Row } from '../layout';
import { H1, Monospace } from '../text';
import ContextMenu from '../ContextMenu';
import Divider from '../Divider';

const AssetListHeaderHeight = 35;

const Header = styled(Row).attrs({ align: 'center', justify: 'space-between' })`
  ${padding(0, 19)}
  background-color: ${colors.white};
  height: ${AssetListHeaderHeight};
  width: 100%;
`;

const AssetListHeader = ({
  section: {
    contextMenuOptions,
    title,
    totalValue,
  },
}) => (
  <Fragment>
    <Header>
      <Row align="center">
        <H1>{title}</H1>
        {contextMenuOptions && (<ContextMenu {...contextMenuOptions} />)}
      </Row>
      <Monospace size="large" weight="semibold">
        {`${totalValue}`}
      </Monospace>
    </Header>
    <Divider />
  </Fragment>
);

AssetListHeader.propTypes = {
  section: PropTypes.shape({
    contextMenuOptions: PropTypes.object,
    title: PropTypes.string,
    totalValue: PropTypes.string,
  }),
};

AssetListHeader.height = AssetListHeaderHeight;

export default AssetListHeader;
