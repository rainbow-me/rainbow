import { Linking } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { getRequestDisplayDetails } from '../parsers/requests';
// eslint-disable-next-line import/default
import parseObjectToUrlQueryString from '../utils';
import { Navigation } from '../navigation';
import withAccountSettings from './withAccountSettings';

const mapStateToProps = ({
  data: { assets },
  settings: { accountAddress, nativeCurrency },
}) => ({
  accountAddress,
  assets,
  nativeCurrency,
});

const parseResultsForRedirect = (results, redirectUrl) => {
  const queryString = parseObjectToUrlQueryString(results);
  const updatedRedirectUrl = `${redirectUrl}?${queryString}`;
  return Linking.openURL(updatedRedirectUrl);
};

export default Component =>
  compose(
    connect(mapStateToProps),
    withAccountSettings,
    withHandlers({
      addDeepLinkRequest: ({
        accountAddress,
        assets,
        nativeCurrency,
      }) => uriParams => {
        const {
          dappName,
          imageUrl,
          method,
          redirectUrl,
          ...remainingParams
        } = uriParams;
        let payload = {};
        let redirect = results => parseResultsForRedirect(results, redirectUrl);
        switch (method) {
          case 'connect_sign': {
            const { message } = remainingParams;
            const params = [accountAddress, message];
            payload = {
              method: 'eth_sign',
              params,
            };
            redirect = results => {
              const updatedResults = {
                ...results,
                address: accountAddress,
                message,
              };
              return parseResultsForRedirect(updatedResults, redirectUrl);
            };
            break;
          }
          case 'eth_sign': {
            const { message } = remainingParams;
            const params = [accountAddress, message];
            payload = {
              method,
              params,
            };
            break;
          }
          case 'eth_sendTransaction': {
            const { data, to, value } = remainingParams;
            const transaction = {
              data,
              from: accountAddress,
              to,
              value,
            };
            const params = [transaction];
            payload = {
              method,
              params,
            };
            break;
          }
          case 'eth_signTransaction': {
            const { data, to, value } = remainingParams;
            const transaction = {
              data,
              from: accountAddress,
              to,
              value,
            };
            const params = [transaction];
            payload = {
              method,
              params,
            };
            break;
          }
          default:
            break;
        }
        const displayDetails = getRequestDisplayDetails(
          payload,
          assets,
          nativeCurrency
        );
        const request = {
          dappName,
          displayDetails,
          imageUrl,
          payload,
        };
        return Navigation.handleAction({
          params: {
            autoOpened: true,
            callback: redirect,
            transactionDetails: request,
          },
          routeName: 'ConfirmRequest',
        });
      },
    })
  )(Component);
