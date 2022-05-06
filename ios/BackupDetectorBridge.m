//
//  BackupDetectorBridge.m
//  Rainbow
//
//  Created by Tomasz Czajęcki on 06/05/2022.
//  Copyright © 2022 Rainbow. All rights reserved.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BackupDetector, NSObject)

RCT_EXTERN_METHOD(checkBackupMarker:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createBackupMarker:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
