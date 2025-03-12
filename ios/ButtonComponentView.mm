//
//  ButtonComponentView 2.h
//  Rainbow
//
//  Created by Christian Baroni on 11/15/24.
//  Copyright © 2024 Rainbow. All rights reserved.
//


#import "ButtonComponentView.h"
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import "Rainbow-Swift.h"

#import <react/renderer/components/ButtonNativeComponent/Props.h>
#import <react/renderer/components/ButtonNativeComponent/EventEmitters.h>
#import <react/renderer/components/ButtonNativeComponent/ComponentDescriptor.h>
#import <react/renderer/components/ButtonNativeComponent/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface ButtonComponentView () <RCTButtonViewProtocol>
@end

@implementation ButtonComponentView {
  Button *_button;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ButtonProps>();
    _props = defaultProps;
    
    _button = [[Button alloc] init];
    self.contentView = _button;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldButtonProps = *std::static_pointer_cast<ButtonProps const>(_props);
  const auto &newButtonProps = *std::static_pointer_cast<ButtonProps const>(props);

  if (oldButtonProps.disabled != newButtonProps.disabled) {
    _button.disabled = newButtonProps.disabled;
  }
  
  if (oldButtonProps.duration != newButtonProps.duration) {
    _button.duration = newButtonProps.duration;
  }
  
  if (oldButtonProps.pressOutDuration != newButtonProps.pressOutDuration) {
    _button.pressOutDuration = newButtonProps.pressOutDuration;
  }
  
  if (oldButtonProps.scaleTo != newButtonProps.scaleTo) {
    _button.scaleTo = newButtonProps.scaleTo;
  }
  
  if (oldButtonProps.transformOrigin != newButtonProps.transformOrigin) {
    _button.transformOrigin = CGPointMake(
      newButtonProps.transformOrigin.x,
      newButtonProps.transformOrigin.y
    );
  }
  
  if (oldButtonProps.enableHapticFeedback != newButtonProps.enableHapticFeedback) {
    _button.enableHapticFeedback = newButtonProps.enableHapticFeedback;
  }
  
  if (oldButtonProps.hapticType != newButtonProps.hapticType) {
    _button.hapticType = RCTNSStringFromString(newButtonProps.hapticType);
  }
  
  if (oldButtonProps.useLateHaptic != newButtonProps.useLateHaptic) {
    _button.useLateHaptic = newButtonProps.useLateHaptic;
  }
  
  if (oldButtonProps.throttle != newButtonProps.throttle) {
    _button.throttle = newButtonProps.throttle;
  }
  
  if (oldButtonProps.shouldLongPressHoldPress != newButtonProps.shouldLongPressHoldPress) {
    _button.shouldLongPressHoldPress = newButtonProps.shouldLongPressHoldPress;
  }
  
  if (oldButtonProps.minLongPressDuration != newButtonProps.minLongPressDuration) {
    _button.minLongPressDuration = newButtonProps.minLongPressDuration;
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> ButtonCls(void)
{
  return ButtonComponentView.class;
}