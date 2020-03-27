//
//  NotificationManager.m
//  Rainbow
//
//  Created by Bruno Andres Barbieri on 3/26/20.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import "NotificationManager.h"

#import <React/RCTEventEmitter.h>
@implementation NotificationManager

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(postNotification:(NSString *)name) {
  [[NSNotificationCenter defaultCenter] postNotificationName:name object:nil userInfo:nil];
}

@end
