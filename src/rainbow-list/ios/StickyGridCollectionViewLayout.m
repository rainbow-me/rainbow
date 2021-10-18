//////
//////  StickyGridCollectionViewLayout.swift
//////  react-native-multithreading
//////
//////  Created by Michał Osadnik on 11/10/2021.
//////
////// TODO osdnk Unify languages
//////
//////  StickyGridCollectionViewLayout.swift
//////  TangramUI
//////
//////  Created by xiAo_Ju on 2019/1/2.
//////  Copyright © 2019 黄伯驹. All rights reserved.
////

#import "StickyGridCollectionViewLayout.h"


@implementation StickyGridCollectionViewLayout
{
    NSMutableDictionary<NSNumber *, UICollectionViewLayoutAttributes *> *_stickyCellsAttributes;
}

- (NSArray *)layoutAttributesForElementsInRect:(CGRect)rect
{
    NSArray *cellAttributes = [super layoutAttributesForElementsInRect:rect];
    NSMutableDictionary *lastCellsAttributes = [NSMutableDictionary dictionary];
    
    __block NSInteger currentStickyIndex = -1;
    [cellAttributes enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        UICollectionViewLayoutAttributes *attributes = obj;
        NSIndexPath *indexPath = attributes.indexPath;
        if ([self.delegate collectionView:self.collectionView layout:self isNeedStickyForIndexPath:indexPath]) {
            if (!_stickyCellsAttributes) {
                _stickyCellsAttributes = [NSMutableDictionary dictionary];
            }
            
            currentStickyIndex = indexPath.item;
            [_stickyCellsAttributes setObject:attributes forKey:@(indexPath.item)];
        } else {
            [_stickyCellsAttributes removeObjectForKey:@(indexPath.item)];
            
            // bottom cell above sticky cell
            UICollectionViewLayoutAttributes *currentLastCell = [lastCellsAttributes objectForKey:@(currentStickyIndex)];
            if (!currentLastCell || indexPath.item > currentLastCell.indexPath.item) {
                [lastCellsAttributes setObject:obj forKey:@(currentStickyIndex)];
            }
        }
        
        attributes.zIndex = 1;
    }];
    
    NSMutableArray *newCellAttributes = [cellAttributes mutableCopy];
    [lastCellsAttributes enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
        UICollectionViewLayoutAttributes *attributes = obj;
        
        UICollectionViewLayoutAttributes *stickyCell = _stickyCellsAttributes[key];
        if (!stickyCell) {
            NSInteger item = attributes.indexPath.item;
            while (item >= 0) {
                if (_stickyCellsAttributes[@(item)]) {
                    stickyCell = [self.collectionView layoutAttributesForItemAtIndexPath:[NSIndexPath indexPathForItem:item inSection:0]];
                    break;
                } else {
                    item --;
                }
            }
        }
        
        if (stickyCell) {
            [newCellAttributes addObject:stickyCell];
            [self _adjustStickyForCellAttributes:stickyCell lastCellAttributes:attributes];
        }
    }];
    
    return newCellAttributes;
}

- (void)_adjustStickyForCellAttributes:(UICollectionViewLayoutAttributes *)cell
                    lastCellAttributes:(UICollectionViewLayoutAttributes *)lastCell
{
    cell.zIndex = 99;
    cell.hidden = NO;
    
    CGFloat maxY = CGRectGetMaxY(lastCell.frame) - cell.frame.size.height;
    CGFloat minY = CGRectGetMinY(self.collectionView.bounds) + self.collectionView.contentInset.top;
    CGFloat y = MIN(MAX(minY, cell.frame.origin.y), maxY);

//    NSLog(@"%zi : %zi, %.1f, %.1f, %.1f, %.1f", cell.indexPath.item, lastCell.indexPath.item, maxY, minY, cell.frame.origin.y, y);
    
    CGPoint origin = cell.frame.origin;
    origin.y = y;
    
    cell.frame = (CGRect){
        origin,
        cell.frame.size
    };
}

- (BOOL)shouldInvalidateLayoutForBoundsChange:(CGRect)newBounds
{
    if (_stickyCellsAttributes.count > 0) {
        // always return yes to trigger resetting sticky header's frame.
        return YES;
    }
    
    return [super shouldInvalidateLayoutForBoundsChange:newBounds];
}

@end
//
//@implementation MyCustomCollectionViewFlowLayout {
//    NSOrderedSet<NSIndexPath *> *_stickyIndexes;
//}
//#pragma mark - Overrides
//- (instancetype)init {
//    if (self = [super init]) {
//        _stickyIndexes = [NSOrderedSet new];
//        _stickyIndexes = [self stickyCellIndexes];
//    }
//    return self;
//}
//- (nullable NSArray<__kindof UICollectionViewLayoutAttributes *> *)layoutAttributesForElementsInRect:(CGRect)rect
//{
//// Get the area we care about in our collection view
//   CGRect collectionViewArea = CGRectMake(0.0, 0.0, self.collectionView.contentSize.width, self.collectionView.contentSize.height);
//// Grab the attributes of the elements in the current rect
//     NSMutableArray *attributesForElementsInRect = [[super layoutAttributesForElementsInRect:collectionViewArea] mutableCopy];
//// Loop through all the elements, check if they match the index of any of our sticky indexes.
//     for (NSUInteger idx=0; idx<[attributesForElementsInRect count]; idx++) {
//         UICollectionViewLayoutAttributes *const layoutAttributes = attributesForElementsInRect[idx];
//         if ([_stickyIndexes containsObject:layoutAttributes.indexPath]) {
//// If they match the sticky index, let's change the attributes
//             UICollectionViewLayoutAttributes *const stickyAttributes = [self _stickyAttributeIfNeeded:layoutAttributes];
//             attributesForElementsInRect[idx] = stickyAttributes;
//         }
//     }
//     return attributesForElementsInRect;
//}
//- (UICollectionViewLayoutAttributes *)_stickyAttributeIfNeeded:(UICollectionViewLayoutAttributes *)attributes {
//// Get the top of the collection view
//    const CGFloat collectionViewTop = self.collectionView.contentOffset.y + self.collectionView.contentInset.top;
//// Get the height and Y value of the origin of the current cell
//
//    const CGFloat attributesHeight = CGRectGetHeight(attributes.frame);
//    const CGFloat attributesY = attributes.frame.origin.y;
//// If the cell has scrolled up close enough to the top, start modifying it's attributes because it's a valid sticky cell.
//  const NSUInteger attributesIndex = [_stickyIndexes indexOfObject:attributes.indexPath];
//    if (collectionViewTop + attributesHeight > attributesY) {
//        // grab the next sticky index's attributes
//        if (attributesIndex < _stickyIndexes.count - 1) {
//            UICollectionViewLayoutAttributes *const nextAttributesIndex =  [[super layoutAttributesForItemAtIndexPath:_stickyIndexes[attributesIndex + 1]] copy];
//
//            const CGFloat nextAttributesIndexY = CGRectGetMinY(nextAttributesIndex.frame);
//            // if the next attribute's index is still towards the bottom, just pin our current sticky index to the top like normal
//if (nextAttributesIndexY >= collectionViewTop + attributesHeight) {
//                CGRect frame = attributes.frame;
//                frame.origin.y = MAX(collectionViewTop, attributesY);
//                attributes.frame = frame;
//                attributes.zIndex = 1.0f;
//            }
//            // otherwise, start sliding up our current sticky index to make room for the next one -- see image in next section
//            else {
//                 CGRect frame = attributes.frame;
//                 frame.origin.y = MIN(collectionViewTop, nextAttributesIndexY - attributesHeight);
//                 attributes.frame = frame;
//                 attributes.zIndex = 1.0f;
//            }
//        }
//    } else if (attributesIndex == _stickyIndexes.count - 1) {
//      // handle the last sticky index edge case
//      CGRect frame = attributes.frame;
//                frame.origin.y = MAX(collectionViewTop, attributesY);
//                attributes.frame = frame;
//                attributes.zIndex = 1.0f;
//    }
//    return attributes;
//}
//- (BOOL)shouldInvalidateLayoutForBoundsChange:(CGRect)newBounds {
//    return YES;
//}
//-(NSArray<NSIndexPath *> *)stickyCellIndexes {
//     return @[[NSIndexPath indexPathForRow:0 inSection:0], [NSIndexPath indexPathForRow:0 inSection:4],
//[NSIndexPath indexPathForRow:0 inSection:8],
//[NSIndexPath indexPathForRow:0 inSection:12]];
//}
//
//
//@end


//
//#import <UIKit/UIKit.h>
//
//@interface StickyGridCollectionViewLayout: UICollectionViewFlowLayout
//@property (nonatomic) long stickyRowsCount;
//@property (nonatomic) long stickyColumnsCount;
//@end
//
//@implementation StickyGridCollectionViewLayout {
//  NSMutableArray<NSMutableArray<UICollectionViewLayoutAttributes*>*>* _allAttributes;
//  CGSize _contentSize;
//}
//
//- (void)setStickyRowsCount:(long)stickyRowsCount {
//  self.stickyColumnsCount = stickyRowsCount;
//}
//
//-(void) setStickyColumnsCount:(long)stickyColumnsCount {
//  self.stickyColumnsCount = stickyColumnsCount;
//}
//
//- (instancetype)init
//{
//  self = [super init];
//  if (self) {
//    _allAttributes = [NSMutableArray new];
//  }
//  return self;
//}
//
//-(BOOL)isItemSticky:(NSIndexPath*)indexPath {
//  return indexPath.item < self.stickyColumnsCount || indexPath.section < self.stickyRowsCount;
//}
//
//- (CGSize)collectionViewContentSize {
//  return _contentSize;
//}
//
//- (void) prepare {
//  
//}
//
//- (NSNumber*) rowsCount {
//  return self.collectionView.numberOfSections;
//}
//
//- (void) setupAttributes {
//  _allAttributes = [NSMutableArray new];
//
//  CGFloat xOffset = 0;
//  CGFloat yOffset = 0;
//  for (int i = 0; i < [self rowsCount]; i++) {
//    NSMutableArray<UICollectionViewLayoutAttributes*>
//  }
////
////    for row in 0..<rowsCount {
////      var rowAttrs: [UICollectionViewLayoutAttributes] = []
////      xOffset = 0
////
////      for col in 0..<columnsCount(in: row) {
////        let itemSize = size(forRow: row, column: col)
////        let indexPath = IndexPath(row: row, column: col)
////        let attributes = UICollectionViewLayoutAttributes(forCellWith: indexPath)
////        attributes.frame = CGRect(x: xOffset, y: yOffset, width: itemSize.width, height: itemSize.height).integral
////
////        rowAttrs.append(attributes)
////
////        xOffset += itemSize.width
////      }
////
////      yOffset += rowAttrs.last?.frame.height ?? 0.0
////      allAttributes.append(rowAttrs)
////    }
//  }
//
////  override func prepare() {
////    setupAttributes()
////    updateStickyItemsPositions()
////
////    let lastItemFrame = allAttributes.last?.last?.frame ?? .zero
////    contentSize = CGSize(width: lastItemFrame.maxX, height: lastItemFrame.maxY)
////  }
//
//
//
//@end
////@objc class StickyGridCollectionViewLayout: UICollectionViewFlowLayout {
////
////  var stickyRowsCount = 0 {
////    didSet {
////      invalidateLayout()
////    }
////  }
////
////  var stickyColumnsCount = 0 {
////    didSet {
////      invalidateLayout()
////    }
////  }
////
////  private var allAttributes: [[UICollectionViewLayoutAttributes]] = []
////  private var contentSize = CGSize.zero
////
////  func isItemSticky(at indexPath: IndexPath) -> Bool {
////    return indexPath.item < stickyColumnsCount || indexPath.section < stickyRowsCount
////  }
////
////  // MARK: - Collection view flow layout methods
////  override var collectionViewContentSize: CGSize {
////    return contentSize
////  }
////
////  override func prepare() {
////    setupAttributes()
////    updateStickyItemsPositions()
////
////    let lastItemFrame = allAttributes.last?.last?.frame ?? .zero
////    contentSize = CGSize(width: lastItemFrame.maxX, height: lastItemFrame.maxY)
////  }
////
////  override func layoutAttributesForElements(in rect: CGRect) -> [UICollectionViewLayoutAttributes]? {
////    var layoutAttributes = [UICollectionViewLayoutAttributes]()
////
////    for rowAttrs in allAttributes {
////      for itemAttrs in rowAttrs where rect.intersects(itemAttrs.frame) {
////        layoutAttributes.append(itemAttrs)
////      }
////    }
////
////    return layoutAttributes
////  }
////
////  override func shouldInvalidateLayout(forBoundsChange newBounds: CGRect) -> Bool {
////    return true
////  }
////
////  // MARK: - Helpers
////  private func setupAttributes() {
////    allAttributes = []
////
////    var xOffset: CGFloat = 0
////    var yOffset: CGFloat = 0
////
////    for row in 0..<rowsCount {
////      var rowAttrs: [UICollectionViewLayoutAttributes] = []
////      xOffset = 0
////
////      for col in 0..<columnsCount(in: row) {
////        let itemSize = size(forRow: row, column: col)
////        let indexPath = IndexPath(row: row, column: col)
////        let attributes = UICollectionViewLayoutAttributes(forCellWith: indexPath)
////        attributes.frame = CGRect(x: xOffset, y: yOffset, width: itemSize.width, height: itemSize.height).integral
////
////        rowAttrs.append(attributes)
////
////        xOffset += itemSize.width
////      }
////
////      yOffset += rowAttrs.last?.frame.height ?? 0.0
////      allAttributes.append(rowAttrs)
////    }
////  }
////
////  private func updateStickyItemsPositions() {
////    for row in 0..<rowsCount {
////      for col in 0..<columnsCount(in: row) {
////        let attributes = allAttributes[row][col]
////
////        if row < stickyRowsCount {
////          var frame = attributes.frame
////          frame.origin.y += collectionView!.contentOffset.y
////          attributes.frame = frame
////        }
////
////        if col < stickyColumnsCount {
////          var frame = attributes.frame
////          frame.origin.x += collectionView!.contentOffset.x
////          attributes.frame = frame
////        }
////
////        attributes.zIndex = zIndex(forRow: row, column: col)
////      }
////    }
////  }
////
////  private func zIndex(forRow row: Int, column col: Int) -> Int {
////    if row < stickyRowsCount && col < stickyColumnsCount {
////      return ZOrder.staticStickyItem
////    } else if row < stickyRowsCount || col < stickyColumnsCount {
////      return ZOrder.stickyItem
////    } else {
////      return ZOrder.commonItem
////    }
////  }
////
////  // MARK: - Sizing
////  private var rowsCount: Int {
////    return collectionView!.numberOfSections
////  }
////
////  private func columnsCount(in row: Int) -> Int {
////    return collectionView!.numberOfItems(inSection: row)
////  }
////
////  private func size(forRow row: Int, column: Int) -> CGSize {
////    guard let delegate = collectionView?.delegate as? UICollectionViewDelegateFlowLayout,
////      let size = delegate.collectionView?(collectionView!, layout: self, sizeForItemAt: IndexPath(row: row, column: column)) else {
////      assertionFailure("Implement collectionView(_,layout:,sizeForItemAt: in UICollectionViewDelegateFlowLayout")
////      return .zero
////    }
////
////    return size
////  }
////}
////
////// MARK: - IndexPath
////private extension IndexPath {
////  init(row: Int, column: Int) {
////    self = IndexPath(item: column, section: row)
////  }
////}
////
////// MARK: - ZOrder
////private enum ZOrder {
////  static let commonItem = 0
////  static let stickyItem = 1
////  static let staticStickyItem = 2
////}
