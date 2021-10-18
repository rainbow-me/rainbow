//
//  StickyGridCollectionViewLayout.h
//  Pods
//
//  Created by Michał Osadnik on 11/10/2021.
//


#import <UIKit/UIKit.h>

@protocol StickyGridCollectionViewLayoutDelegate

- (BOOL)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout *)collectionViewLayout isNeedStickyForIndexPath:(NSIndexPath *)indexPath;

@end

@interface StickyGridCollectionViewLayout : UICollectionViewFlowLayout

@property (nonatomic, weak) id<StickyGridCollectionViewLayoutDelegate> delegate;

@end
