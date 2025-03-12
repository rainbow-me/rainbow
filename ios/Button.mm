//
//  Button.mm
//  Rainbow
//
//  Created by Christian Baroni on 11/16/24.
//  Copyright © 2024 Rainbow. All rights reserved.
//

#import "Button.h"

#import <react/renderer/components/ButtonSpecs/ComponentDescriptors.h>
#import <react/renderer/components/ButtonSpecs/EventEmitters.h>
#import <react/renderer/components/ButtonSpecs/Props.h>
#import <react/renderer/components/ButtonSpecs/RCTComponentViewHelpers.h>

#import <objc/runtime.h>
#import <React/RCTFabricComponentsPlugins.h>

using namespace facebook::react;

@interface Button () <RCTButtonViewProtocol>

@property (nonatomic, assign) BOOL blocked;
@property (nonatomic, assign) BOOL invalidated;
@property (nonatomic, strong) UILongPressGestureRecognizer *longPress;
@property (nonatomic, assign) CGPoint tapLocation;
@property (nonatomic, strong) UIViewPropertyAnimator *animator;
@property (nonatomic, assign) CGFloat touchMoveTolerance;

@end

@implementation Button {
    ButtonEventEmitter::Shared _eventEmitter;
}

@synthesize duration = _duration;
@synthesize pressOutDuration = _pressOutDuration;
@synthesize enableHapticFeedback = _enableHapticFeedback;
@synthesize hapticType = _hapticType;
@synthesize transformOrigin = _transformOrigin;
@synthesize minLongPressDuration = _minLongPressDuration;
@synthesize scaleTo = _scaleTo;
@synthesize useLateHaptic = _useLateHaptic;
@synthesize throttle = _throttle;
@synthesize shouldLongPressHoldPress = _shouldLongPressHoldPress;

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ButtonComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const ButtonProps>();
        _props = defaultProps;
        
        // Initialize default values
        _touchMoveTolerance = 80.0;
        _duration = 0.16;
        _pressOutDuration = -1;
        _scaleTo = 0.97;
        _transformOrigin = CGPointMake(0.5, 0.5);
        _enableHapticFeedback = YES;
        _hapticType = @"selection";
        _useLateHaptic = YES;
        _throttle = NO;
        _shouldLongPressHoldPress = NO;
        _minLongPressDuration = 0.5;

        self.isAccessibilityElement = YES;
        self.userInteractionEnabled = YES;

        _longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(onLongPressHandler:)];
        _longPress.minimumPressDuration = _minLongPressDuration;
        [self addGestureRecognizer:_longPress];

        [self setAnchorPoint:_transformOrigin];
    }
    return self;
}

- (void)updateEventEmitter:(const facebook::react::EventEmitter::Shared &)eventEmitter
{
    [super updateEventEmitter:eventEmitter];
    _eventEmitter = std::static_pointer_cast<const ButtonEventEmitter>(eventEmitter);
}

#pragma mark - Property Setters

- (void)setDisabled:(BOOL)disabled {
    _disabled = disabled;
    self.userInteractionEnabled = !disabled;
}

- (void)setTransformOrigin:(CGPoint)transformOrigin {
    _transformOrigin = transformOrigin;
    [self setAnchorPoint:transformOrigin];
}

- (void)setMinLongPressDuration:(NSTimeInterval)minLongPressDuration {
    _minLongPressDuration = minLongPressDuration;
    if (_longPress) {
        _longPress.minimumPressDuration = minLongPressDuration;
    }
}

#pragma mark - Props Handling

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<ButtonProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<ButtonProps const>(props);
    
    if (oldViewProps.disabled != newViewProps.disabled) {
        self.disabled = newViewProps.disabled;
    }
    
    if (oldViewProps.scaleTo != newViewProps.scaleTo) {
        self.scaleTo = newViewProps.scaleTo;
    }
    
    if (oldViewProps.duration != newViewProps.duration) {
        self.duration = newViewProps.duration;
    }
    
    if (oldViewProps.pressOutDuration != newViewProps.pressOutDuration) {
        self.pressOutDuration = newViewProps.pressOutDuration;
    }
    
    if (oldViewProps.enableHapticFeedback != newViewProps.enableHapticFeedback) {
        self.enableHapticFeedback = newViewProps.enableHapticFeedback;
    }
    
    if (oldViewProps.hapticType != newViewProps.hapticType) {
        self.hapticType = [NSString stringWithUTF8String:newViewProps.hapticType.c_str()];
    }
    
    if (oldViewProps.transformOrigin.x != newViewProps.transformOrigin.x ||
        oldViewProps.transformOrigin.y != newViewProps.transformOrigin.y) {
        self.transformOrigin = CGPointMake(newViewProps.transformOrigin.x, newViewProps.transformOrigin.y);
    }
    
    if (oldViewProps.minLongPressDuration != newViewProps.minLongPressDuration) {
        self.minLongPressDuration = newViewProps.minLongPressDuration;
    }
    
    if (oldViewProps.useLateHaptic != newViewProps.useLateHaptic) {
        self.useLateHaptic = newViewProps.useLateHaptic;
    }
    
    if (oldViewProps.throttle != newViewProps.throttle) {
        self.throttle = newViewProps.throttle;
    }
    
    if (oldViewProps.shouldLongPressHoldPress != newViewProps.shouldLongPressHoldPress) {
        self.shouldLongPressHoldPress = newViewProps.shouldLongPressHoldPress;
    }

    [super updateProps:props oldProps:oldProps];
}

#pragma mark - Gesture Handlers

- (void)onLongPressHandler:(UILongPressGestureRecognizer *)sender {
    if (!sender) return;
    
    switch (sender.state) {
        case UIGestureRecognizerStateBegan:
            if (self.onLongPress) {
                self.onLongPress(@{});
            }
            break;
        case UIGestureRecognizerStateEnded:
            if (self.shouldLongPressHoldPress) {
                if (self.onLongPressEnded) {
                    self.onLongPressEnded(@{});
                }
                self.animator = [self animateTapEndWithDuration:self.pressOutDuration == -1 ? self.duration : self.pressOutDuration
                                              pressOutDuration:-1
                                                   useHaptic:nil];
            }
            break;
        default:
            break;
    }
}

#pragma mark - Animation Methods

- (UIViewPropertyAnimator *)animateTapStartWithDuration:(NSTimeInterval)duration
                                                scale:(CGFloat)scale
                                           useHaptic:(nullable NSString *)hapticType {
    if (hapticType) {
        [self generateHapticFeedback:hapticType];
    }
    
    UIViewPropertyAnimator *animator = [[UIViewPropertyAnimator alloc] initWithDuration:duration
                                                                          controlPoint1:CGPointMake(0.25, 0.46)
                                                                          controlPoint2:CGPointMake(0.45, 0.94)
                                                                           animations:^{
        self.transform = CGAffineTransformMakeScale(scale, scale);
    }];
    
    [animator startAnimation];
    return animator;
}

- (UIViewPropertyAnimator *)animateTapEndWithDuration:(NSTimeInterval)duration
                                    pressOutDuration:(NSTimeInterval)pressOutDuration
                                         useHaptic:(nullable NSString *)hapticType {
    NSTimeInterval finalDuration = pressOutDuration == -1 ? duration : pressOutDuration;
    return [self animateTapEndWithDuration:finalDuration useHaptic:hapticType];
}

- (UIViewPropertyAnimator *)animateTapEndWithDuration:(NSTimeInterval)duration
                                           useHaptic:(nullable NSString *)hapticType {
    if (hapticType) {
        [self generateHapticFeedback:hapticType];
    }
    
    UIViewPropertyAnimator *animator = [[UIViewPropertyAnimator alloc] initWithDuration:duration
                                                                          controlPoint1:CGPointMake(0.25, 0.46)
                                                                          controlPoint2:CGPointMake(0.45, 0.94)
                                                                           animations:^{
        self.transform = CGAffineTransformIdentity;
    }];
    
    [animator startAnimation];
    return animator;
}

#pragma mark - Touch Handling

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    if (touch) {
        self.tapLocation = [touch locationInView:self];
    }
    
    if (self.blocked) {
        self.invalidated = YES;
        return;
    }
    
    self.invalidated = NO;
    self.animator = [self animateTapStartWithDuration:self.duration
                                              scale:self.scaleTo
                                         useHaptic:self.useLateHaptic ? nil : self.hapticType];
    
    if (self.shouldLongPressHoldPress) {
        if (self.onPress) {
            self.onPress(@{});
        }
    } else if (self.onPressStart) {
        self.onPressStart(@{});
    }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    if (self.invalidated) return;
    
    UITouch *touch = [touches anyObject];
    if (touch) {
        CGPoint location = [touch locationInView:self];
        if (self.animator.isRunning) return;
        
        if (![self touchInRange:location tolerance:self.touchMoveTolerance]) {
            self.animator = [self animateTapEndWithDuration:self.duration
                                          pressOutDuration:-1
                                               useHaptic:nil];
        } else if ([self touchInRange:location tolerance:self.touchMoveTolerance * 0.8]) {
            self.animator = [self animateTapStartWithDuration:self.duration
                                                      scale:self.scaleTo
                                                 useHaptic:nil];
        }
    }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    if (self.invalidated) return;
    
    UITouch *touch = [touches anyObject];
    if (touch) {
        CGPoint location = [touch locationInView:self];
        if ([self touchInRange:location tolerance:self.touchMoveTolerance * 0.8]) {
            NSString *useHaptic = self.useLateHaptic && self.enableHapticFeedback ? self.hapticType : nil;
            self.animator = [self animateTapEndWithDuration:self.pressOutDuration == -1 ? self.duration : self.pressOutDuration
                                          pressOutDuration:-1
                                               useHaptic:useHaptic];
            
            if (!self.shouldLongPressHoldPress && self.onPress) {
                self.onPress(@{});
            }
            
            if (self.throttle) {
                self.blocked = YES;
                dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                    self.blocked = NO;
                });
            }
        } else {
            [self touchesCancelled:touches withEvent:event];
        }
    }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    if (self.invalidated) return;
    
    UITouch *touch = [touches anyObject];
    if (touch && self.onCancel) {
        CGPoint location = [touch locationInView:self];
        BOOL isClose = [Button isCloseWithLocationA:location locationB:self.tapLocation];
        self.onCancel(isClose, self.longPress.state);
    }
    
    if (!self.shouldLongPressHoldPress) {
        self.animator = [self animateTapEndWithDuration:self.pressOutDuration == -1 ? self.duration : self.pressOutDuration
                                      pressOutDuration:-1
                                           useHaptic:nil];
    }
    
    if (self.throttle) {
        self.blocked = YES;
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            self.blocked = NO;
        });
    }
}

- (void)generateHapticFeedback:(NSString *)type {
    if (@available(iOS 10.0, *)) {
        if ([type isEqualToString:@"selection"]) {
            UISelectionFeedbackGenerator *generator = [[UISelectionFeedbackGenerator alloc] init];
            [generator prepare];
            [generator selectionChanged];
        } else if ([type isEqualToString:@"impact"]) {
            UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
            [generator prepare];
            [generator impactOccurred];
        } else if ([type isEqualToString:@"notification"]) {
            UINotificationFeedbackGenerator *generator = [[UINotificationFeedbackGenerator alloc] init];
            [generator prepare];
            [generator notificationOccurred:UINotificationFeedbackTypeSuccess];
        }
    }
}

#pragma mark - Helper Methods

+ (BOOL)isCloseWithLocationA:(CGPoint)locationA locationB:(CGPoint)locationB {
    if (fabs(locationA.x - locationB.x) > 5) {
        return NO;
    }
    if (fabs(locationA.y - locationB.y) > 5) {
        return NO;
    }
    return YES;
}

- (BOOL)touchInRange:(CGPoint)location tolerance:(CGFloat)tolerance {
    if (CGPointEqualToPoint(self.tapLocation, CGPointZero)) {
        return NO;
    }
    
    return (location.x >= (self.tapLocation.x - tolerance) &&
            location.x <= (self.tapLocation.x + tolerance) &&
            location.y >= (self.tapLocation.y - tolerance) &&
            location.y <= (self.tapLocation.y + tolerance));
}

- (void)setAnchorPoint:(CGPoint)point {
    CGPoint newPoint = CGPointMake(self.bounds.size.width * point.x,
                                  self.bounds.size.height * point.y);
    CGPoint oldPoint = CGPointMake(self.bounds.size.width * self.layer.anchorPoint.x,
                                  self.bounds.size.height * self.layer.anchorPoint.y);
    
    newPoint = CGPointApplyAffineTransform(newPoint, self.transform);
    oldPoint = CGPointApplyAffineTransform(oldPoint, self.transform);
    
    CGPoint position = self.layer.position;
    position.x -= oldPoint.x;
    position.x += newPoint.x;
    position.y -= oldPoint.y;
    position.y += newPoint.y;
    
    self.layer.position = position;
    self.layer.anchorPoint = point;
}

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class targetClass = [UIView class];
        
        SEL originalSelector = @selector(canBecomeFirstResponder);
        SEL swizzledSelector = @selector(nb_canBecomeFirstResponder);
        
        Method originalMethod = class_getInstanceMethod(targetClass, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(targetClass, swizzledSelector);

        if (originalMethod && swizzledMethod) {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        } else {
            NSLog(@"Error: Failed to swizzle canBecomeFirstResponder.");
        }
    });
}

- (BOOL)nb_canBecomeFirstResponder {
    return YES;
}

@end

Class<RCTComponentViewProtocol> ButtonCls(void)
{
  return Button.class;
}
