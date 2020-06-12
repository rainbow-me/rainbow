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

@interface RainbowRequestReviewManager : NSObject <RCTBridgeModule>
@end

@implementation RainbowRequestReviewManager

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE(RainbowRequestReview);

RCT_EXPORT_METHOD(requestReview:(RCTResponseSenderBlock)callback) {
  NSUInteger windowCount = [UIApplication sharedApplication].windows.count;
  [SKStoreReviewController requestReview];
  NSUInteger noSecondsToWait = 1; // TODO verify on devices
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, noSecondsToWait * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    NSUInteger newWindowCount = [UIApplication sharedApplication].windows.count;
    callback(@[[[NSNumber alloc] initWithBool:newWindowCount != windowCount]]);
  });
}

@end
