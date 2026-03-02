import Flex from './Flex';
import styled from '@/framework/ui/styled-thing';

const Centered = styled(Flex).attrs({
  align: 'center',
  justify: 'center',
})({});

export default Centered;
