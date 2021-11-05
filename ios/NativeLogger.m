//
//  SafeStoreReview.m
//  Rainbow
//
//  Created by Michał Osadnik on 12/06/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <React/RCTBridgeModule.h>


@interface NativeLogger : NSObject <RCTBridgeModule>
@end

@implementation NativeLogger

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_MODULE(NativeLogger);

RCT_EXPORT_METHOD(log:(NSString*)text) {
  NSLog(text);
}

@end
