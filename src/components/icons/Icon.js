import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';

import ArrowIcon from './svg/ArrowIcon';
import AvatarIcon from './svg/AvatarIcon';
import BalanceLogoIcon from './svg/BalanceLogoIcon';
import CameraIcon from './svg/CameraIcon';
import CaretIcon from './svg/CaretIcon';
import ClockIcon from './svg/ClockIcon';
import CloseIcon from './svg/CloseIcon';
import DotIcon from './svg/DotIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import WalletConnectIcon from './svg/WalletConnectIcon';
import WarningIcon from './svg/WarningIcon';

const Icon = ({ name, ...props }) =>
  createElement((Icon.IconTypes[name] || Flex), props);

Icon.propTypes = {
  name: PropTypes.string,
};

Icon.IconTypes = {
  arrow: ArrowIcon,
  avatar: AvatarIcon,
  balanceLogo: BalanceLogoIcon,
  camera: CameraIcon,
  caret: CaretIcon,
  clock: ClockIcon,
  close: CloseIcon,
  dot: DotIcon,
  spinner: SpinnerIcon,
  threeDots: ThreeDotsIcon,
  walletConnect: WalletConnectIcon,
  warning: WarningIcon,
};

export default Icon;
