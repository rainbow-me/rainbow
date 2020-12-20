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
#import <React/RCTTextView.h>

@interface AnimatedNumbersManager : RCTViewManager<RCTBridgeModule>

@end

@interface AnimatedNumbersNativeComponent:UILabel

@end

@implementation AnimatedNumbersNativeComponent

@end


@implementation AnimatedNumbersManager

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return RCTGetUIManagerQueue();
}

- (UIView *)view
{

  return [[AnimatedNumbersNativeComponent alloc] init];
}


RCT_EXPORT_METHOD(animate:(nonnull NSNumber*) reactTag config: (NSDictionary*) config)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
    RCTBaseTextInputView *view = (RCTBaseTextInputView*) viewRegistry[reactTag];
    NSLog(@"123");
  }];
  
}

@end
