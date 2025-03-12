//
//  Button.h
//  Rainbow
//
//  Created by Christian Baroni on 11/16/24.
//  Copyright © 2024 Rainbow. All rights reserved.
//

#import <React/RCTViewComponentView.h>
#import <React/RCTComponent.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface Button : RCTViewComponentView

# pragma mark - External Properties

@property (nonatomic, copy, nullable) RCTBubblingEventBlock onPress;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onPressStart;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onLongPress;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onLongPressEnded;

@property (nonatomic, assign) BOOL shouldLongPressHoldPress;
@property (nonatomic, assign) BOOL disabled;
@property (nonatomic, assign) NSTimeInterval duration;
@property (nonatomic, assign) NSTimeInterval pressOutDuration;
@property (nonatomic, assign) BOOL enableHapticFeedback;
@property (nonatomic, copy) NSString *hapticType;
@property (nonatomic, assign) CGPoint transformOrigin;
@property (nonatomic, assign) NSTimeInterval minLongPressDuration;
@property (nonatomic, assign) CGFloat scaleTo;
@property (nonatomic, assign) BOOL useLateHaptic;
@property (nonatomic, assign) BOOL throttle;

# pragma mark - Internal Properties

@property (nonatomic, copy, nullable) void (^onCancel)(BOOL close, NSInteger state);

/* Touch Handling */
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(nullable UIEvent *)event;
- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(nullable UIEvent *)event;
- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(nullable UIEvent *)event;
- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(nullable UIEvent *)event;

/* Animation Methods */
- (UIViewPropertyAnimator *)animateTapStartWithDuration:(NSTimeInterval)duration
                                                scale:(CGFloat)scale
                                           useHaptic:(nullable NSString *)hapticType;

- (UIViewPropertyAnimator *)animateTapEndWithDuration:(NSTimeInterval)duration
                                    pressOutDuration:(NSTimeInterval)pressOutDuration
                                         useHaptic:(nullable NSString *)hapticType;

- (UIViewPropertyAnimator *)animateTapEndWithDuration:(NSTimeInterval)duration
                                           useHaptic:(nullable NSString *)hapticType;

/* Utility Methods */
- (void)generateHapticFeedback:(NSString *)type;
- (void)setAnchorPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END
