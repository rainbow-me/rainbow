#import <React/RCTBridgeModule.h>

@interface SlackBottomSheet : NSObject <RCTBridgeModule>

@end

@class DiscoverSheetViewController;

@interface HelperView : UIView
- (void)setSpecialBounds:(CGRect)bounds;
@property (nonatomic, nullable, weak) DiscoverSheetViewController *controller;
@end

@interface InvisibleView: RCTView
- (void)jumpTo:(NSNumber*)longForm;
@property (nonatomic, nonnull) NSNumber *topOffset;
@property (nonatomic) BOOL isShortFormEnabled;
@property (nonatomic, nullable) NSNumber *longFormHeight;
@property (nonatomic, nonnull) NSNumber *cornerRadius;
@property (nonatomic, nonnull) NSNumber *springDamping;
@property (nonatomic, nonnull) NSNumber *transitionDuration;
@property (nonatomic, nonnull) UIColor *backgroundColor;
@property (nonatomic, nonnull) NSNumber *backgroundOpacity;
@property (nonatomic) BOOL anchorModalToLongForm;
@property (nonatomic) BOOL allowsDragToDismiss;
@property (nonatomic) BOOL allowsTapToDismiss;
@property (nonatomic) BOOL isUserInteractionEnabled;
@property (nonatomic) BOOL isHapticFeedbackEnabled;
@property (nonatomic) BOOL shouldRoundTopCorners;
@property (nonatomic) BOOL showDragIndicator;
@property (nonatomic) BOOL gestureEnabled;
@property (nonatomic) BOOL blocksBackgroundTouches;
@property (nonatomic) BOOL interactsWithOuterScrollView;
@property (nonatomic) BOOL presentGlobally;
@property (nonatomic) BOOL initialAnimation;
@property (nonatomic) BOOL unmountAnimation;
@property (nonatomic, nonnull) NSNumber *headerHeight;
@property (nonatomic, nonnull) NSNumber *shortFormHeight;
@property (nonatomic) BOOL startFromShortForm;
@property (nonatomic) BOOL scrollsToTop;
@property (nonatomic, nullable) UIViewController *contoller;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onWillTransition;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onWillDismiss;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onDidDismiss;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onCrossMagicBorder;
@end
