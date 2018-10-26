import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';

const Container = styled.Text`

`;

const AssetListItem = ({ item }) => ((typeof item === 'string') ? (<Container>{item}</Container>) : null);

AssetListItem.propTypes = {
  item: PropTypes.object,
};

export default AssetListItem;
