//
//  RecyclerController.h
//  react-native-multithreading
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import <Foundation/Foundation.h>
#import <React/RCTView.h>
#import "CellStorage.h"
#import "StickyGridCollectionViewLayout.h"

@interface RecyclerController : UIViewController<UICollectionViewDataSource,UICollectionViewDelegateFlowLayout, StickyGridCollectionViewLayoutDelegate>
{
    UICollectionView *_collectionView;
}
@property (nonatomic) NSMutableDictionary<NSString*, CellStorage *> *cellStorages;
@property (nonatomic) UIRefreshControl* refreshControl;
@property (class, nonatomic) NSMutableDictionary<NSNumber*, RecyclerController*>* lists;
+ (void)notifyNewData:(int)listId;
- (void)notifyNewData;

@end

@interface SizeableView: RCTView

@property(nonatomic, copy) RCTDirectEventBlock onRefresh;
@property(nonatomic) BOOL isRefreshing;
@property (nonatomic) NSNumber* identifier;
// TODO osdnk dealloc
@property (nonatomic, strong) RecyclerController* controller;

@end

@interface ReusableCell: UICollectionViewCell
@property (nonatomic) NSString* type;
@property (nonatomic) NSInteger index;
@property (nonatomic) RecyclerController* controller;
- (void)recycle:(NSInteger)index;
- (void)notifyNewViewAvailable;
@end
