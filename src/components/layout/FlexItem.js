import { isUndefined } from 'lodash';
import styled from 'rainbowed-components';

const FlexItem = styled.View(({ flex, grow, shrink }) => {
  const props = {
    flex:
      isUndefined(flex) && isUndefined(grow) && isUndefined(shrink) ? 1 : flex,
  };

  if (typeof grow !== 'undefined') {
    props.flexGrow = grow;
  }

  if (typeof shrink !== 'undefined') {
    props.flexShrink = shrink;
  }

  return props;
});

export default FlexItem;
