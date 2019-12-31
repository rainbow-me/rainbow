import { Linking } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompact';
import { Navigation } from '../navigation';
import { getRequestDisplayDetails } from '../parsers/requests';
// eslint-disable-next-line import/default
import parseObjectToUrlQueryString from '../utils';
import {
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN,
  SIGN_TRANSACTION,
} from '../utils/signingMethods';
import withAccountSettings from './withAccountSettings';

const mapStateToProps = ({ data: { assets } }) => ({
  assets,
});

const parseResultsForRedirect = (results, redirectUrl) => {
  const queryString = parseObjectToUrlQueryString(results);
  const querySeparator = redirectUrl.includes('?') ? '&' : '?';
  const updatedRedirectUrl = `${redirectUrl}${querySeparator}${queryString}`;
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
          case SIGN: {
            const { message } = remainingParams;
            const params = [accountAddress, message];
            payload = {
              method,
              params,
            };
            redirect = results => {
              const updatedResults = {
                ...results,
                address: accountAddress,
                msg: message,
              };
              return parseResultsForRedirect(updatedResults, redirectUrl);
            };
            break;
          }
          case PERSONAL_SIGN: {
            const { message } = remainingParams;
            const params = [message, accountAddress];
            payload = {
              method,
              params,
            };
            redirect = results => {
              const updatedResults = {
                ...results,
                address: accountAddress,
                msg: message,
              };
              return parseResultsForRedirect(updatedResults, redirectUrl);
            };
            break;
          }
          case SEND_TRANSACTION: {
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
          case SIGN_TRANSACTION: {
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
            callback: redirect,
            openAutomatically: true,
            transactionDetails: request,
          },
          routeName: 'ConfirmRequest',
        });
      },
    })
  )(Component);
