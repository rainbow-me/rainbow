import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';

import ArrowCircledIcon from './svg/ArrowCircledIcon';
import ArrowIcon from './svg/ArrowIcon';
import AssetListItemSkeletonIcon from './svg/AssetListItemSkeletonIcon';
import AvatarIcon from './svg/AvatarIcon';
import RainbowLogoIcon from './svg/BalanceLogoIcon';
import CameraIcon from './svg/CameraIcon';
import CaretIcon from './svg/CaretIcon';
import CaretThinIcon from './svg/CaretThinIcon';
import CheckmarkCircledIcon from './svg/CheckmarkCircledIcon';
import CheckmarkIcon from './svg/CheckmarkIcon';
import ClockIcon from './svg/ClockIcon';
import CloseIcon from './svg/CloseIcon';
import CompassIcon from './svg/CompassIcon';
import CopyIcon from './svg/CopyIcon';
import CrosshairIcon from './svg/CrosshairIcon';
import DotIcon from './svg/DotIcon';
import FaceIdIcon from './svg/FaceIdIcon';
import GearIcon from './svg/GearIcon';
import HandleIcon from './svg/HandleIcon';
import InboxIcon from './svg/InboxIcon';
import OfflineIcon from './svg/OfflineIcon';
import ProgressIcon from './svg/ProgressIcon';
import SendIcon from './svg/SendIcon';
import ShareIcon from './svg/ShareIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import TouchIdIcon from './svg/TouchIdIcon';
import WalletConnectIcon from './svg/WalletConnectIcon';
import WarningIcon from './svg/WarningIcon';

const Icon = ({ name, ...props }) => createElement(Icon.IconTypes[name] || Flex, props);

Icon.IconTypes = {
  arrow: ArrowIcon,
  arrowCircled: ArrowCircledIcon,
  assetListItemSkeleton: AssetListItemSkeletonIcon,
  avatar: AvatarIcon,
  rainbowLogo: RainbowLogoIcon,
  camera: CameraIcon,
  caret: CaretIcon,
  caretThin: CaretThinIcon,
  checkmark: CheckmarkIcon,
  checkmarkCircled: CheckmarkCircledIcon,
  clock: ClockIcon,
  close: CloseIcon,
  compass: CompassIcon,
  copy: CopyIcon,
  crosshair: CrosshairIcon,
  dot: DotIcon,
  faceid: FaceIdIcon,
  gear: GearIcon,
  handle: HandleIcon,
  inbox: InboxIcon,
  offline: OfflineIcon,
  progress: ProgressIcon,
  send: SendIcon,
  share: ShareIcon,
  spinner: SpinnerIcon,
  threeDots: ThreeDotsIcon,
  touchid: TouchIdIcon,
  walletConnect: WalletConnectIcon,
  warning: WarningIcon,
};

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(Icon.IconTypes)),
};

export default Icon;
