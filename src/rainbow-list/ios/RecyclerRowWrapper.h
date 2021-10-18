//
//  RecyclerRowWrapper.h
//  Pods
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import <React/RCTViewManager.h>
#import <React/RCTView.h>

@interface RecyclerRowWrapper : RCTView
@property(nonatomic) BOOL reparented;
@end


@interface RecyclerRowWrapperManager : RCTViewManager
@end

