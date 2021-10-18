//
//  OnRecycle.h
//  Pods
//
//  Created by Michał Osadnik on 10/10/2021.
//
#import <React/RCTEventDispatcher.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>


@interface RCTOnRecycleEvent : NSObject <RCTEvent>

- (instancetype)initWithReactTag:(NSNumber *)reactTag
                        position:(NSInteger)position
                    prevPosition:(NSInteger)prevPosition;

- (instancetype)initWithReactTag:(NSNumber *)reactTag
                           cells:(NSInteger)cells;;

@end
