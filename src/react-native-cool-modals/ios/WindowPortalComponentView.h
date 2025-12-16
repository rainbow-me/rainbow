//
//  WindowPortalComponentView.h
//  React Native Cool Modals
//

#import <React/RCTViewComponentView.h>

@interface WindowPortalComponentView : RCTViewComponentView

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic) BOOL blockTouches;

@end
