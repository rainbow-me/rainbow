//
//  RecyclerRow.h
//  Pods
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import <React/RCTViewManager.h>
#import <React/RCTView.h>
#import <React/RCTBridge.h>


@interface RecyclerRowManager : RCTViewManager
@end

@class UltraFastAbstractComponentWrapper;
@class SizeableView;

@interface RecyclerRow : RCTView
@property(nonatomic, copy) RCTDirectEventBlock onRecycle;
@property(nonatomic) SizeableView* config;
-(void)recycle:(NSInteger)index;
-(instancetype)initWithBridge:(RCTBridge*)bridge;
-(void)registerUltraFastComponent:(UltraFastAbstractComponentWrapper*)component;
@end
