import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import styled from 'styled-components/primitives';
import Column from '../layout/Column';

const Cointainer = styled(Column)`
  width: 100%;
`;

const Content = styled.View`
  background-color: #f7f7f7;
`;

const AssetList = ({ assets, label }) => (
  <Cointainer>
    <Content>
      <Fragment>
        {assets}
      </Fragment>
    </Content>
  </Cointainer>
);

AssetList.propTypes = {
  assets: PropTypes.arrayOf(PropTypes.node),
  label: PropTypes.string,
};

export default AssetList;
