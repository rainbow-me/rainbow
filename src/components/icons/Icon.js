import PropTypes from 'prop-types';
import { createElement } from 'react';
import Flex from '../layout/Flex';

import ArrowCircledIcon from './svg/ArrowCircledIcon';
import ArrowIcon from './svg/ArrowIcon';
import AvatarIcon from './svg/AvatarIcon';
import CameraIcon from './svg/CameraIcon';
import CaretIcon from './svg/CaretIcon';
import CaretThinIcon from './svg/CaretThinIcon';
import CheckmarkCircledIcon from './svg/CheckmarkCircledIcon';
import CheckmarkIcon from './svg/CheckmarkIcon';
import ClockIcon from './svg/ClockIcon';
import CloseCircledIcon from './svg/CloseCircledIcon';
import CloseIcon from './svg/CloseIcon';
import CompassIcon from './svg/CompassIcon';
import CopyIcon from './svg/CopyIcon';
import CrosshairIcon from './svg/CrosshairIcon';
import DotIcon from './svg/DotIcon';
import DoubleCaretIcon from './svg/DoubleCaretIcon';
import FaceIdIcon from './svg/FaceIdIcon';
import GearIcon from './svg/GearIcon';
import HandleIcon from './svg/HandleIcon';
import InboxIcon from './svg/InboxIcon';
import OfflineIcon from './svg/OfflineIcon';
import ProgressIcon from './svg/ProgressIcon';
import SendIcon from './svg/SendIcon';
import SendSmallIcon from './svg/SendSmallIcon';
import ShareIcon from './svg/ShareIcon';
import SignatureIcon from './svg/SignatureIcon';
import SpinnerIcon from './svg/SpinnerIcon';
import ThreeDotsIcon from './svg/ThreeDotsIcon';
import TouchIdIcon from './svg/TouchIdIcon';
import WalletConnectIcon from './svg/WalletConnectIcon';
import WarningIcon from './svg/WarningIcon';

const Icon = ({ name, ...props }) => createElement(Icon.IconTypes[name] || Flex, props);

Icon.IconTypes = {
  arrow: ArrowIcon,
  arrowCircled: ArrowCircledIcon,
  avatar: AvatarIcon,
  camera: CameraIcon,
  caret: CaretIcon,
  caretThin: CaretThinIcon,
  checkmark: CheckmarkIcon,
  checkmarkCircled: CheckmarkCircledIcon,
  clock: ClockIcon,
  close: CloseIcon,
  closeCircled: CloseCircledIcon,
  compass: CompassIcon,
  copy: CopyIcon,
  crosshair: CrosshairIcon,
  dot: DotIcon,
  doubleCaret: DoubleCaretIcon,
  faceid: FaceIdIcon,
  gear: GearIcon,
  handle: HandleIcon,
  inbox: InboxIcon,
  offline: OfflineIcon,
  progress: ProgressIcon,
  send: SendIcon,
  sendSmall: SendSmallIcon,
  share: ShareIcon,
  signature: SignatureIcon,
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
