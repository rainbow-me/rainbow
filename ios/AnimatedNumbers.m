//
//  Created by Michał Osadnik on 20/12/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import <React/RCTComponent.h>
#import <React/RCTBaseTextInputView.h>
#import <React/RCTBaseTextInputShadowView.h>
#import <React/RCTTextView.h>
#import <React/RCTUITextField.h>

@interface AnimatedNumbersManager : RCTViewManager<RCTBridgeModule>

@end

@interface AnimatedNumbersConfigManager : RCTViewManager<RCTBridgeModule>

@end

@interface AnimatedNumbersNativeComponent:UILabel

@end

@interface AnimatedNumbersConfig:RCTView

@property (nonatomic) NSString* prefix;
@property (nonatomic) NSString* suffix;
@property (nonatomic) NSString* pad;
@property (nonatomic) NSNumber* maxDigitsAfterDot;
@property (nonatomic) NSNumber* maxSignsTotally;
@property (nonatomic) NSNumber* stepPerSecond;
@property (nonatomic) NSNumber* value;
@property (nonatomic) NSNumber* framesPerSecond;

@end

@implementation AnimatedNumbersConfig

- (instancetype)init {
  if (self = [super init]) {
    _prefix = @"";
    _suffix = @"";
    _pad = @"none";
    _maxDigitsAfterDot = @10;
    _maxSignsTotally = @10;
    _value = @0;
  }
  return self;
}

- (void)didMoveToSuperview {
  
  [super didMoveToSuperview];
}

- (void)willMoveToSuperview:(UIView *)newSuperview {
  [super willMoveToSuperview:newSuperview];
}

- (void) willMoveToWindow:(UIWindow *)newWindow {
  [super willMoveToWindow:newWindow];
}

- (void) layoutSubviews {
  [super layoutSubviews];
}

- (void) setValue:(NSNumber *)value {
  _value = value;
}

@end

@implementation AnimatedNumbersNativeComponent

- (void)didMoveToSuperview
{
  [self setText:@"123"];
  [super didMoveToSuperview];
}

@end



@implementation AnimatedNumbersConfigManager
RCT_EXPORT_VIEW_PROPERTY(prefix, NSString)
RCT_EXPORT_VIEW_PROPERTY(suffix, NSString)
RCT_EXPORT_VIEW_PROPERTY(maxDigitsAfterDot, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(maxSignsTotally, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(pad, NSString)
RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[AnimatedNumbersConfig alloc] init];
}


@end;

@implementation AnimatedNumbersManager {
  NSMutableDictionary<NSNumber *, NSTimer *>* _timers;
  NSMutableDictionary<NSNumber *, RCTUITextField *>* _textFields;
  NSMutableDictionary<NSNumber *, AnimatedNumbersConfig *>* _configs;
  NSTimer *_timer;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init {
  if (self = [super init]) {
    _timers = [NSMutableDictionary new];
    _textFields = [NSMutableDictionary new];
    _configs = [NSMutableDictionary new];
  }
  return self;
}

- (UIView *)view
{
  return [[AnimatedNumbersNativeComponent alloc] init];
}

- (void)performAnimationFrame:(NSTimer*)timer
{
  NSNumber* reactTag = ((NSDictionary*) timer.userInfo)[@"reactTag"];
  NSNumber* stepPerSecond = ((NSDictionary*) timer.userInfo)[@"stepPerSecond"];
  BOOL isToValueANumber = [((NSDictionary*) timer.userInfo)[@"toValue"] isKindOfClass:NSNumber.class];
  if (isToValueANumber) {
    if (((NSNumber *)((NSDictionary*) timer.userInfo)[@"toValue"]).doubleValue < ((NSNumber *)((NSDictionary*) timer.userInfo)[@"initialValue"]).doubleValue) {
      stepPerSecond = [NSNumber numberWithDouble:-stepPerSecond.doubleValue];
    }
  }
  NSDate* startTime = ((NSDictionary*) timer.userInfo)[@"startTime"];
  AnimatedNumbersConfig* config = _configs[reactTag];
  double value = ((NSNumber *)((NSDictionary*) timer.userInfo)[@"initialValue"]).doubleValue
  + (NSDate.date.timeIntervalSince1970 - startTime.timeIntervalSince1970)
  * stepPerSecond.doubleValue;
  
  
  if (isToValueANumber) {
    double toValue = ((NSNumber *)((NSDictionary*) timer.userInfo)[@"toValue"]).doubleValue;
    value = stepPerSecond.doubleValue > 0 ? MIN(value, toValue) : MAX(value, toValue);
  }
  
  config.value = [NSNumber numberWithDouble:value];
  NSMutableString* deltaString = [config.value stringValue].mutableCopy;
  
  if ([config.pad isEqualToString:@"right"]) {
    BOOL isDot = [deltaString componentsSeparatedByString:@"."].firstObject.length != deltaString.length;
    if (!isDot) {
      [deltaString appendString:@"."];
    }
    deltaString = [
                   deltaString
                   stringByPaddingToLength:MIN(
                                               config.maxSignsTotally.longValue,
                                               config.maxDigitsAfterDot.longValue + [deltaString componentsSeparatedByString:@"."].firstObject.length)
                   withString:@"0"
                   startingAtIndex:0
                   ]
    .mutableCopy;
  }
  
  RCTUITextField* view = _textFields[reactTag];
  NSString* resultText =  [NSString stringWithFormat:@"%@%@%@",
                           config.prefix,
                           [deltaString substringToIndex:
                            MIN(deltaString.length,
                                MIN(config.maxSignsTotally.longValue,
                                    [deltaString componentsSeparatedByString:@"."].firstObject.length + 1 + config.maxDigitsAfterDot.longValue)
                                )
                            ],
                           config.suffix];
  
  if (view != nil) {
    NSMutableAttributedString* copy = view.attributedText.mutableCopy;
    [copy replaceCharactersInRange:NSMakeRange(0, copy.mutableString.length) withString:resultText];
    view.attributedText = copy;
  }
  if ([((NSDictionary*) timer.userInfo)[@"toValue"] isKindOfClass:NSNumber.class] && value == ((NSNumber *)((NSDictionary*) timer.userInfo)[@"toValue"]).doubleValue) {
    [self invalidateTimer: reactTag];
  }
}


RCT_EXPORT_METHOD(animate:(nonnull NSNumber*) reactTag configTag:(nonnull NSNumber*) configTag config: (NSDictionary*) animationConfig)
{
  [self invalidateTimer: reactTag];
  RCTExecuteOnUIManagerQueue(^{
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
      RCTBaseTextInputView *view = (RCTBaseTextInputView *) viewRegistry[reactTag];
      AnimatedNumbersConfig* configView = (AnimatedNumbersConfig *)viewRegistry[configTag];
      _textFields[reactTag] = [view valueForKey:@"_backedTextInputView"];
      _configs[reactTag] = configView;
      double framesPerSecond = animationConfig[@"framesPerSecond"] == nil ? 20 : ((NSNumber *)animationConfig[@"framesPerSecond"]).doubleValue;
      dispatch_async(dispatch_get_main_queue(), ^{
        _timers[reactTag] =[
                            NSTimer scheduledTimerWithTimeInterval:(1 / framesPerSecond)
                            target:self
                            selector:@selector(performAnimationFrame:)
                            userInfo:@{
                              @"reactTag": reactTag,
                              @"startTime": NSDate.date,
                              @"stepPerSecond": animationConfig[@"stepPerSecond"],
                              @"initialValue": configView.value.copy,
                              @"toValue": animationConfig[@"toValue"] == nil ? [NSNull null] : animationConfig[@"toValue"],
                            } repeats:YES];
      });
    }];
    [self.bridge.uiManager setNeedsLayout];
  });
  
}

- (void) invalidateTimer:(nonnull NSNumber*) reactTag
{
  [_timers[reactTag] invalidate];
  _timers[reactTag] = nil;
  _textFields[reactTag] = nil;
  _configs[reactTag] = nil;
}

RCT_EXPORT_METHOD(stop:(nonnull NSNumber*) reactTag)
{
  [self invalidateTimer: reactTag];
}

@end
