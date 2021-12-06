import PropTypes from 'prop-types';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SupportButton' was resolved to '/Users/n... Remove this comment to see the full error message
import SupportButton from './SupportButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useEmailRainbow } from '@rainbow-me/hooks';

const NeedHelpButton = ({ label, subject, ...props }: any) => {
  const onEmailRainbow = useEmailRainbow({ subject });

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <SupportButton label={label} onPress={onEmailRainbow} {...props} />;
};

NeedHelpButton.propTypes = {
  subject: PropTypes.string,
};

NeedHelpButton.defaultProps = {
  label: 'Get Support',
  subject: 'support',
};

export default React.memo(NeedHelpButton);
