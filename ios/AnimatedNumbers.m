//
//  NSObject+AnimatedNumbers.m
//  Rainbow
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

@end

@implementation AnimatedNumbersConfig

- (instancetype)init {
  if (self = [super init]) {
    _prefix = @"";
    _suffix = @"";
    _pad = @"right";
    _maxDigitsAfterDot = @3;
    _maxSignsTotally = @6;
  }
  return self;
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
  NSDate* startTime = ((NSDictionary*) timer.userInfo)[@"startTime"];
  NSString* deltaString = [[NSNumber numberWithDouble:NSDate.date.timeIntervalSince1970 - startTime.timeIntervalSince1970] stringValue];
  RCTUITextField* view = _textFields[reactTag];
  AnimatedNumbersConfig* config = _configs[reactTag];
  long positionOfDot = [deltaString componentsSeparatedByString:@"."].firstObject.length + 1;
  
  NSString* resultText =  [NSString stringWithFormat:@"%@%@%@",
                           config.prefix,
                           [deltaString substringToIndex:
                            MIN(deltaString.length,
                                MIN(config.maxSignsTotally.longValue,
                                    positionOfDot + config.maxDigitsAfterDot.longValue)
                                )
                            ],
                           config.suffix];
  
  if (view != nil) {
    NSMutableAttributedString* copy = view.attributedText.mutableCopy;
    [copy replaceCharactersInRange:NSMakeRange(0, copy.mutableString.length) withString:resultText];
    view.attributedText = copy;
  }
}


RCT_EXPORT_METHOD(animate:(nonnull NSNumber*) reactTag config: (NSDictionary*) config)
{
  
  RCTExecuteOnUIManagerQueue(^{
    RCTBaseTextInputShadowView *shadowView = (RCTBaseTextInputShadowView *)[self.bridge.uiManager shadowViewForReactTag:reactTag];
    [shadowView setText:@"SAMOLA"];
    [self.bridge.uiManager setNeedsLayout];
  });
  _timers[reactTag] = [NSTimer scheduledTimerWithTimeInterval:0.05 target:self selector:@selector(performAnimationFrame:) userInfo:@{ @"reactTag": reactTag, @"startTime": NSDate.date  } repeats:YES];
  RCTExecuteOnUIManagerQueue(^{
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
      RCTBaseTextInputView *view = (RCTBaseTextInputView *) viewRegistry[reactTag];
      AnimatedNumbersConfig* config = (AnimatedNumbersConfig *)view.reactSubviews.firstObject;
      _textFields[reactTag] = [view valueForKey:@"_backedTextInputView"];
      _configs[reactTag] = config;
      [view setValue:nil forKey:@"_backedTextInputView"];
    }];
  });
  
}

RCT_EXPORT_METHOD(stop:(nonnull NSNumber*) reactTag)
{
  [_timers[reactTag] invalidate];
  _timers[reactTag] = nil;
}

@end
