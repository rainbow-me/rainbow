//
//  Transaction.m
//  Rainbow
//
//  Created by Alexey Kureev on 04/01/2020.
//

#import <Foundation/Foundation.h>

@interface Transaction : NSObject

@property (nonatomic, strong) NSString *status;
@property (nonatomic, strong) NSString *symbol;
@property (nonatomic, strong) NSString *coinImage;
@property (nonatomic, strong) NSString *coinName;
@property (nonatomic, strong) NSString *nativeDisplay;
@property (nonatomic, strong) NSString *balanceDisplay;
@property (nonatomic, strong) NSString *tHash;
@property (nonatomic, strong) NSDate *minedAt;

@end
