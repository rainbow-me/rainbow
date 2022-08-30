import React from 'react';
import styled from '@/styled-thing';

const ListFooterHeight = 27;

const Spacer = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  height: ({ height }) => height || ListFooterHeight,
  width: '100%',
});

const neverRerender = () => true;
const ListFooter = React.memo(Spacer, neverRerender);

ListFooter.displayName = 'ListFooter';
ListFooter.height = ListFooterHeight;

export default ListFooter;
