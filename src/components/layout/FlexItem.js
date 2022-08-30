import styled from '@/styled-thing';

const FlexItem = styled.View(({ flex, grow, shrink }) => {
  const props = {
    flex:
      flex === undefined && grow === undefined && shrink === undefined
        ? 1
        : flex,
  };

  if (grow !== undefined) {
    props.flexGrow = grow;
  }

  if (shrink !== undefined) {
    props.flexShrink = shrink;
  }

  return props;
});

export default FlexItem;
