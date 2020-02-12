//
//  ButtonManager.m
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(ButtonManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPressStart, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLongPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(duration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(enableHapticFeedback, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hapticType, NSString)
RCT_EXPORT_VIEW_PROPERTY(minLongPressDuration, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(scaleTo, CGFloat)

@end 
