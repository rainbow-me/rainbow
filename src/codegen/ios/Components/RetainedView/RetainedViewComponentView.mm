#import <React/RCTViewComponentView.h>
#import <react/renderer/components/rainbow/ComponentDescriptors.h>
#import <react/renderer/components/rainbow/RCTComponentViewHelpers.h>

using namespace facebook::react;

namespace facebook::react {

class RetainedViewHostShadowNode final
    : public ConcreteViewShadowNode<
          RetainedViewComponentName,
          RetainedViewProps,
          RetainedViewEventEmitter,
          RetainedViewState> {
 public:
  using BaseShadowNode = ConcreteViewShadowNode<
      RetainedViewComponentName,
      RetainedViewProps,
      RetainedViewEventEmitter,
      RetainedViewState>;

  RetainedViewHostShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, family, traits) {
    retainWhenHidden();
  }

  RetainedViewHostShadowNode(
      const ShadowNode &sourceShadowNode,
      const ShadowNodeFragment &fragment)
      : BaseShadowNode(sourceShadowNode, fragment) {
    retainWhenHidden();
  }

 private:
  void retainWhenHidden() noexcept {
    BaseShadowNode::traits_.unset(ShadowNodeTraits::Trait::Hidden);
  }
};

using RetainedViewRetainingComponentDescriptor = ConcreteComponentDescriptor<RetainedViewHostShadowNode>;

} // namespace facebook::react

@interface RetainedViewComponentView : RCTViewComponentView <RCTRetainedViewViewProtocol>
@end

@implementation RetainedViewComponentView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RetainedViewRetainingComponentDescriptor>();
}

@end
