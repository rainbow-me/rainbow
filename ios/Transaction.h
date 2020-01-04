//
//  Transaction.m
//  Rainbow
//
//  Created by Alexey Kureev on 04/01/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface Transaction : NSObject

@property (nonatomic, strong) NSString *type;
@property (nonatomic, strong) NSString *coinImage;
@property (nonatomic, strong) NSString *coinName;
@property (nonatomic, strong) NSString *nativeDisplay;
@property (nonatomic, strong) NSString *balanceDisplay;

@end
