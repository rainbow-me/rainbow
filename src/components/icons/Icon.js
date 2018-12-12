import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';

import ArrowIcon from './svg/ArrowIcon';
import ArrowCircledIcon from './svg/ArrowCircledIcon';
import AssetListItemSkeletonIcon from './svg/AssetListItemSkeletonIcon';
import AvatarIcon from './svg/AvatarIcon';
import BalanceLogoIcon from './svg/BalanceLogoIcon';
import CameraIcon from './svg/CameraIcon';
import CaretIcon from './svg/CaretIcon';
import ClockIcon from './svg/ClockIcon';
import CloseIcon from './svg/CloseIcon';
import CompassIcon from './svg/CompassIcon';
import DotIcon from './svg/DotIcon';
import FaceIdIcon from './svg/FaceIdIcon';
import HandleIcon from './svg/HandleIcon';
import OfflineIcon from './svg/OfflineIcon';
import ProgressIcon from './svg/ProgressIcon';
import SendIcon from './svg/SendIcon';
import ShareIcon from './svg/ShareIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import TouchIdIcon from './svg/TouchIdIcon';
import WalletConnectIcon from './svg/WalletConnectIcon';
import WarningIcon from './svg/WarningIcon';

const Icon = ({ name, ...props }) =>
  createElement((Icon.IconTypes[name] || Flex), props);

Icon.IconTypes = {
  arrow: ArrowIcon,
  arrowCircled: ArrowCircledIcon,
  assetListItemSkeleton: AssetListItemSkeletonIcon,
  avatar: AvatarIcon,
  balanceLogo: BalanceLogoIcon,
  camera: CameraIcon,
  caret: CaretIcon,
  clock: ClockIcon,
  close: CloseIcon,
  compass: CompassIcon,
  dot: DotIcon,
  faceid: FaceIdIcon,
  handle: HandleIcon,
  offline: OfflineIcon,
  progress: ProgressIcon,
  spinner: SpinnerIcon,
  threeDots: ThreeDotsIcon,
  touchid: TouchIdIcon,
  walletConnect: WalletConnectIcon,
  send: SendIcon,
  share: ShareIcon,
  warning: WarningIcon,
};

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(Icon.IconTypes)),
};

export default Icon;
