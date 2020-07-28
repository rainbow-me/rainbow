//
//  TestFlight.m
//  Rainbow
//
//  Created by Michał Osadnik on 24/07/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

#import <React/RCTBridgeModule.h>

@interface RNTestFlight : NSObject <RCTBridgeModule>

@end

@implementation RNTestFlight

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

RCT_EXPORT_MODULE()

- (NSDictionary *)constantsToExport
{
    NSURL *receiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
    NSString *receiptURLString = [receiptURL path];
    BOOL isRunningTestFlightBeta =  ([receiptURLString rangeOfString:@"sandboxReceipt"].location != NSNotFound);

    return @{ @"isTestFlight" : @(isRunningTestFlightBeta) };
};

@end
