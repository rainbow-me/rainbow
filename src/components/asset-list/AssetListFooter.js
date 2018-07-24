import React from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';

const AssetListFooterHeight = 27;

const Spacer = styled.View`
  background-color: ${colors.white};
  height: ${AssetListFooterHeight};
  width: 100%;
`;

const AssetListFooter = () => <Spacer />;

AssetListFooter.height = AssetListFooterHeight;

export default AssetListFooter;
