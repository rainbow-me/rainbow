import { isNil } from 'lodash';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { uniswapUpdateAllowances } from '../redux/uniswap';
import { getAllowance } from '../utils/contract';

const mapStateToProps = ({
  settings: { accountAddress },
  uniswap: { allowances },
}) => ({ accountAddress, allowances });

export default Component => compose(
  connect(mapStateToProps, { uniswapUpdateAllowances }),
  withHandlers({
    getCurrencyAllowance: (ownProps) => async (token, exchangeAddress, inputAmount) => {
      /*
      // if input amount
      const result = ownProps.allowances[token.address];
      if (!isNil(result)) {
        if (greaterThan(result, 0)) {
          // TODO
        } else {
        }
      } else {
        const allowance = await getAllowance(ownProps.accountAddress, token, exchangeAddress);
        ownProps.uniswapUpdateAllowances(token.address, allowance);
      }
      */
    },
  }),
)(Component);
