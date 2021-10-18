//
//  RecyclerRow.m
//  CocoaAsyncSocket
//
//  Created by Michał Osadnik on 06/10/2021.
//

#import "UltraFastTextWrapper.h"
#import <React/RCTView.h>
#import <React/RCTTextView.h>
#import "rainbow-me-ultimate-list.h"
#import "RecyclerController.h"
#import <React/RCTSinglelineTextInputView.h>

@implementation UltraFastTextWrapper

- (void)notifyNewData:(NSInteger)index {
  [[NSOperationQueue mainQueue] addOperationWithBlock:^{
    UIView* maybeTextView = self.subviews.firstObject;
    if ([maybeTextView isKindOfClass:RCTTextView.class]) {
      RCTTextView *textView = ((RCTTextView*) maybeTextView);
      
      NSNumber* identifier = self.boundRow.config.identifier;;
      if (identifier != nil) {
        int listId = identifier.intValue;
        std::string newText = osdnk::ultimatelist::obtainStringValueAtIndexByKey((int)index, self.binding.UTF8String, listId);
        NSString* newTextWrapped = [NSMutableString stringWithUTF8String:newText.c_str()];
        NSTextStorage *textStorage = [textView valueForKey:@"textStorage"];
        CGRect *contentFrame = (__bridge CGRect*)[textView valueForKey:@"contentFrame"];
        NSArray<UIView *> *descendantViews = [textView valueForKey:@"descendantViews"];
        NSString * newString = [NSString stringWithFormat:@"%@/%li", newTextWrapped, (long)index];
        [textStorage beginEditing];
        [textStorage replaceCharactersInRange:NSMakeRange(0, textStorage.string.length) withString:newString];
        [textStorage endEditing];
        [textView setTextStorage:textStorage contentFrame:*contentFrame descendantViews:descendantViews];
      }
    }
  }];
}

@end

@implementation UltraFastTextWrapperManager

RCT_EXPORT_MODULE(UltraFastTextWrapper)
RCT_EXPORT_VIEW_PROPERTY(binding, NSString)

- (RCTView *)view
{
  return [[UltraFastTextWrapper alloc] init];
}

@end
