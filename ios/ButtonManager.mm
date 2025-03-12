//
//  Button.mm
//  Rainbow
//
//  Created by Christian Baroni on 11/16/24.
//  Copyright © 2024 Rainbow. All rights reserved.
//

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "Button.h"

@interface ButtonManager : RCTViewManager
@end

@implementation ButtonManager

RCT_EXPORT_MODULE(Button)

// Properties
RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(duration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(pressOutDuration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(enableHapticFeedback, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hapticType, NSString)
RCT_EXPORT_VIEW_PROPERTY(transformOrigin, CGPoint)
RCT_EXPORT_VIEW_PROPERTY(minLongPressDuration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(scaleTo, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(useLateHaptic, BOOL)
RCT_EXPORT_VIEW_PROPERTY(throttle, BOOL)
RCT_EXPORT_VIEW_PROPERTY(shouldLongPressHoldPress, BOOL)

// Event handlers
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPressStart, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLongPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLongPressEnded, RCTBubblingEventBlock)

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (UIView *)view
{
    return [[Button alloc] init];
}

@end
