//
//  ButtonManager.m
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(ButtonManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end 
