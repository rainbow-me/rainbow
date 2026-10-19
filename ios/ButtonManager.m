//
//  ButtonManager.m
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

#import "React/RCTConvert.h"
#import "React/RCTViewManager.h"
#import "Rainbow-Swift.h"

@interface RCT_EXTERN_MODULE(ButtonManager, RCTViewManager)

RCT_REMAP_VIEW_PROPERTY(onButtonPress, onPress, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(onButtonCancel, onCancel, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(onButtonPressStart, onPressStart, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(onButtonLongPress, onLongPress, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(onButtonLongPressEnded, onLongPressEnded, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(shouldLongPressHoldPress, BOOL)
RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(duration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(pressOutDuration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(enableHapticFeedback, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hapticType, NSString)
RCT_CUSTOM_VIEW_PROPERTY(transformOrigin, NSArray, Button)
{
  view.transformOrigin = json ? [RCTConvert CGPoint:json] : defaultView.transformOrigin;
}
RCT_EXPORT_VIEW_PROPERTY(minLongPressDuration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(scaleTo, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(useLateHaptic, BOOL)
RCT_EXPORT_VIEW_PROPERTY(throttle, BOOL)

@end

@implementation ButtonManager : RCTViewManager

- (UIView *)view {
  return [[Button alloc] init];
}

@end
