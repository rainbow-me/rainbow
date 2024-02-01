import gql from 'graphql-tag';

export const CONTRACT_FUNCTION = gql`
  query contractFunction($chainID: Int!, $hex: String!) {
    contractFunction(chainID: $chainID, hex: $hex) {
      text
    }
  }
`;
