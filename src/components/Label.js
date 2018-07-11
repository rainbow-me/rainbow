import PropTypes from 'prop-types';
import styled from 'styled-components/primitives';

const StyledLabel = styled.Text`
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 16px;
`;

const Label = ({ children, ...props }) => <StyledLabel {...props}>{children}</StyledLabel>;

Label.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Label;
