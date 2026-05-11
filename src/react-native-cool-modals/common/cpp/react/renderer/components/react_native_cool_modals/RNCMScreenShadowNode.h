#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/react_native_cool_modals/EventEmitters.h>
#include <react/renderer/components/react_native_cool_modals/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include "RNCMScreenState.h"

namespace facebook {
namespace react {

JSI_EXPORT extern const char RNCMScreenComponentName[];

class JSI_EXPORT RNCMScreenShadowNode final : public ConcreteViewShadowNode<
                                                 RNCMScreenComponentName,
                                                 RNCMScreenProps,
                                                 RNCMScreenEventEmitter,
                                                 RNCMScreenState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
  using StateData = ConcreteViewShadowNode::ConcreteStateData;

  Point getContentOriginOffset(bool includeTransform) const override;
};

} // namespace react
} // namespace facebook
