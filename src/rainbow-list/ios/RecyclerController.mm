//
//  RecyclerController.m
//  react-native-multithreading
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import "RecyclerController.h"
#import <React/RCTView.h>
#import "rainbow-me-ultimate-list.h"
#import <objc/runtime.h>
#import "RecyclerRowWrapper.h"
//@class StickyGridCollectionViewLayout;
//@protocol StickyGridCollectionViewLayout;
//
//@interface StickyGridCollectionViewLayout : UICollectionViewFlowLayout
//
//@end

#define REUSABLE_CELL "ReusableCell"


@implementation ReusableCell {
  BOOL _enqueued;
  RecyclerRow *_row;
}

- (void)reparentIfNeeded {
  if (self.subviews.count == 0) {
    CellStorage* storage = [self.controller.cellStorages valueForKey:self.type];
    RecyclerRow* row = [storage getFirstAvailableRow];
    if (row != nil) {
      ((RecyclerRowWrapper*)row.superview).reparented = YES;
      row.config = (SizeableView*)self.controller.view;
      [row removeFromSuperview];
      [self addSubview:row];
      
      [storage dequeueView:self];
      _row = row;
    } else {
      if (!_enqueued) {
        [storage notifyNeedMoreCells];
        [storage enqueueForView:self];
        _enqueued = YES;
      }
    }
  }
}


- (void)recycle:(NSInteger)index {
  [self reparentIfNeeded];
  _index = index;
  if (_row != nil) {
    [_row recycle:index];
  }
}

- (void)notifyNewViewAvailable {
   [self reparentIfNeeded];
   if (_row != nil) {
     [_row recycle:_index];
   }
}

- (instancetype)initWithFrame:(CGRect)rect
{
  self = [super initWithFrame: rect];
  if (self) {
    NSString * classNameWrapper = NSStringFromClass([self class]);
    NSString * className = [classNameWrapper substringWithRange:NSMakeRange(0, classNameWrapper.length - sizeof(REUSABLE_CELL) + 1)];
    _type = className;
    _enqueued = NO;
  }
  return self;
}

@end


@implementation SizeableView

- (void)setBounds:(CGRect)bounds {
  if (self.subviews.count != 0) {
    [((UICollectionView *)self.subviews.firstObject) setFrame:bounds];
  }
  [super setBounds:bounds];
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  // TODO osdnk check retaining
  [RecyclerController.lists setObject:self.controller forKey:self.identifier];
}

-(void)setOnRefresh:(RCTDirectEventBlock)onRefresh {
  _onRefresh = onRefresh;
  [_controller.refreshControl setEnabled:(onRefresh != nil)];
}

- (void)setIsRefreshing:(BOOL)isRefreshing {
  if (isRefreshing) {
    [_controller.refreshControl beginRefreshing];
  } else {
    [_controller.refreshControl endRefreshing];
  }
}

@end

static NSMutableDictionary<NSNumber *,RecyclerController *> * _lists;

@implementation RecyclerController {
  SizeableView *_config;
}



+ (NSMutableDictionary<NSNumber *,RecyclerController *> *)lists {
  return _lists;
}
+ (void)setLists:(NSMutableDictionary<NSNumber *,RecyclerController *> *)lists {
  _lists = lists;
}


+ (void)notifyNewData:(int)listId {
  RecyclerController* controller = [RecyclerController.lists objectForKey:[NSNumber numberWithInt:listId]];
  if (controller != nil) {
    [controller notifyNewData];
  }
}


- (void)notifyNewData {
  [[NSOperationQueue mainQueue] addOperationWithBlock:^{
    osdnk::ultimatelist::moveFromPreSet(self->_config.identifier.intValue);
    std::vector<int> added = osdnk::ultimatelist::obtainNewIndices(self->_config.identifier.intValue);
    NSMutableArray<NSIndexPath*>* addedPaths = [NSMutableArray new];
    for (int i = 0; i < added.size(); i++) {
      [addedPaths addObject:[NSIndexPath indexPathForRow:added[i] inSection:0]];
    }
    [self->_collectionView insertItemsAtIndexPaths:addedPaths];
    
    std::vector<int> removed = osdnk::ultimatelist::obtainRemovedIndices(self->_config.identifier.intValue);
    NSMutableArray<NSIndexPath*>* removedPaths = [NSMutableArray new];
    for (int i = 0; i < removed.size(); i++) {
      [removedPaths addObject:[NSIndexPath indexPathForRow:removed[i] inSection:0]];
    }
    [self->_collectionView deleteItemsAtIndexPaths:removedPaths];
    
    std::vector<int> moved = osdnk::ultimatelist::obtainMovedIndices(self->_config.identifier.intValue);
    for (int i = 0; i < moved.size(); i+=2) {
      [self->_collectionView moveItemAtIndexPath:[NSIndexPath indexPathForRow:moved[i] inSection:0] toIndexPath:[NSIndexPath indexPathForRow:moved[i+1] inSection:0]];
    }
    [self tryUpdating];
  }];
}

- (void) tryUpdating {
  for (UICollectionViewCell* cell in _collectionView.visibleCells) {
    NSIndexPath* path = [_collectionView indexPathForCell:cell];
    [((ReusableCell*) cell) recycle:path.item];
  }
}


- (instancetype)init {
  self = [super init];
  if (self) {
    self.cellStorages = [NSMutableDictionary new];
    
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  _config = [[SizeableView alloc] init];
  self.view = _config;
  
  StickyGridCollectionViewLayout *layout=[[StickyGridCollectionViewLayout alloc] init];
  layout.delegate = self;
  _collectionView=[[UICollectionView alloc] initWithFrame:self.view.frame collectionViewLayout:layout];
  [_collectionView setDataSource:self];
  [_collectionView setDelegate:self];
  [_collectionView setBackgroundColor:[UIColor redColor]];
  _refreshControl = [[UIRefreshControl alloc] init];
  _refreshControl.tintColor = [UIColor grayColor];
  [_refreshControl setEnabled:NO];
  [_refreshControl addTarget:self action:@selector(refershControlAction) forControlEvents:UIControlEventValueChanged];
  [_collectionView addSubview:_refreshControl];
  _collectionView.alwaysBounceVertical = YES;
  [self.view addSubview:_collectionView];
  
  // Do any additional setup after loading the view, typically from a nib.
}

- (NSInteger)collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(NSInteger)section
{
  return osdnk::ultimatelist::obtainCount(_config.identifier.intValue);
}



// The cell that is returned must be retrieved from a call to -dequeueReusableCellWithReuseIdentifier:forIndexPath:
- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath
{
  std::string type = osdnk::ultimatelist::obtainTypeAtIndexByKey((int)indexPath.item, _config.identifier.intValue);
  NSString* wrappedType = [NSString stringWithCString:type.c_str()
                                             encoding:[NSString defaultCStringEncoding]];
  
  
  NSInteger idx = indexPath.item;
  ReusableCell *cell=[collectionView dequeueReusableCellWithReuseIdentifier:wrappedType forIndexPath:indexPath];
  cell.controller = self;
  
  
  cell.backgroundColor=[UIColor greenColor];
  [cell recycle:idx];
  
  return cell;
}

- (CGFloat)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout *)collectionViewLayout minimumInteritemSpacingForSectionAtIndex:(NSInteger)section {
  return 0.0;
}

- (CGFloat)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout *)collectionViewLayout minimumLineSpacingForSectionAtIndex:(NSInteger)section {
  return 0.0;
}

- (CGSize)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout*)collectionViewLayout sizeForItemAtIndexPath:(NSIndexPath *)indexPath
{
  std::string type = osdnk::ultimatelist::obtainTypeAtIndexByKey((int)indexPath.item, _config.identifier.intValue);
  NSString* wrappedType = [NSString stringWithCString:type.c_str()
                                             encoding:[NSString defaultCStringEncoding]];
  
  if ([self.cellStorages valueForKey:wrappedType] == nil) {
    NSArray<UIView *> * cellStorages = self.view.reactSuperview.reactSubviews;
    for (UIView* maybeCellStorage: cellStorages) {
      if ([maybeCellStorage isKindOfClass:CellStorage.class] && [((CellStorage *) maybeCellStorage).type isEqualToString: wrappedType]) {
        [self.cellStorages setValue:(CellStorage *) maybeCellStorage forKey:wrappedType];
        char typeChars[type.length()];
        strcpy(typeChars, type.c_str());
        char* result;
        result=(char*)malloc(sizeof(typeChars) + sizeof(REUSABLE_CELL) );
        memcpy(result, typeChars, sizeof(typeChars));
        memcpy(result+sizeof(typeChars), REUSABLE_CELL, sizeof(REUSABLE_CELL));
        Class newClass = objc_allocateClassPair(objc_getClass(REUSABLE_CELL), result, 0);
        [_collectionView registerClass:newClass forCellWithReuseIdentifier:wrappedType];
      }
    }
  }
  
  CGRect rect = [self.cellStorages valueForKey:wrappedType].initialRect;
  
  
  // TODO osdnk
  return CGSizeMake(rect.size.width, rect.size.height);
}

-(void)refershControlAction {
  if (_config.onRefresh) {
    _config.onRefresh(nil);
  }
  [_refreshControl endRefreshing];
}


  - (BOOL)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout *)collectionViewLayout isNeedStickyForIndexPath:(NSIndexPath *)indexPath {
    return osdnk::ultimatelist::obtainIsHeaderAtIndex((int)indexPath.item, _config.identifier.intValue);
  }
  
  @end
