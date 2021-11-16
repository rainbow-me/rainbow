//
//  SafeStoreReview.m
//  Rainbow
//
//  Created by Michał Osadnik on 12/06/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <StoreKit/SKStoreReviewController.h>
#import <objc/runtime.h>



@interface UIWindow (DismissNotification)

+ (void)load;

@end

@implementation UIWindow (DismissNotification)



static NSString* UIWindowDidBecomeVisibleReviewNotification = @"UIWindowDidBecomeVisibleNotification";
static NSString* monitorObjectKey = @"monitorKey";
static NSString* partialDescForStoreReviewWindow =  @"SKStore";
+ (void)load
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [self class];
    
    SEL originalSelector = @selector(setWindowLevel:);
    SEL swizzledSelector = @selector(setWindowLevel_notify:);
    
    Method originalMethod = class_getInstanceMethod(class, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
    
    BOOL didAddMethod =
    class_addMethod(class,
                    originalSelector,
                    method_getImplementation(swizzledMethod),
                    method_getTypeEncoding(swizzledMethod));
    
    if (didAddMethod) {
      class_replaceMethod(class,
                          swizzledSelector,
                          method_getImplementation(originalMethod),
                          method_getTypeEncoding(originalMethod));
    } else {
      method_exchangeImplementations(originalMethod, swizzledMethod);
    }
  });
}


#pragma mark - Method Swizzling

- (void)setWindowLevel_notify:(int)level{
  [self setWindowLevel_notify:level];
  
  if([self.description containsString:partialDescForStoreReviewWindow])
  {
    [[NSNotificationCenter defaultCenter] postNotificationName:UIWindowDidBecomeVisibleReviewNotification object:self];
  }
}

@end


@interface RainbowRequestReviewManager : NSObject <RCTBridgeModule>
@end

@implementation RainbowRequestReviewManager {
  RCTResponseSenderBlock _callback;
}

+ (BOOL)requiresMainQueueSetup
{
      return NO;
}


- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(windowDidBecomeVisibleNotification:)
                                                 name:UIWindowDidBecomeVisibleReviewNotification
                                               object:nil];
  }
  return self;
}

- (void)windowDidBecomeVisibleNotification:(NSNotification *)notification
{
  if (_callback != nil) {
    _callback(@[[[NSNumber alloc] initWithBool:YES]]);
    _callback = nil;
  }
}


RCT_EXPORT_MODULE(RainbowRequestReview);

RCT_EXPORT_METHOD(requestReview:(RCTResponseSenderBlock)callback) {
  [SKStoreReviewController requestReview];
  _callback = callback;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.01 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    if (_callback != nil) {
      _callback(@[[[NSNumber alloc] initWithBool:NO]]);
      _callback = nil;
    }
  });
}

@end
