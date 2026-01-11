#import <UIKit/UIKit.h>

@class RNCMScreenComponentView;

@interface RNCMScreenViewController : UIViewController

@property (nonatomic, strong) id<UIViewControllerTransitioningDelegate> transDelegate;

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;
- (UIViewController*) parentVC;
- (void)setViewToSnapshot;
- (RNCMScreenComponentView *)screenView;

@end
