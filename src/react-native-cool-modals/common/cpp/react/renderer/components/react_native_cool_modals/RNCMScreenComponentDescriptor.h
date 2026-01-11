#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/react_native_cool_modals/Props.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

#include "RNCMScreenShadowNode.h"

namespace facebook {
namespace react {

class RNCMScreenComponentDescriptor final
    : public ConcreteComponentDescriptor<RNCMScreenShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override {
    react_native_assert(
        dynamic_cast<YogaLayoutableShadowNode *>(&shadowNode));
    auto &layoutableShadowNode =
        static_cast<YogaLayoutableShadowNode &>(shadowNode);

    auto state =
        std::static_pointer_cast<const RNCMScreenShadowNode::ConcreteState>(
            shadowNode.getState());
    auto stateData = state->getData();
    if (stateData.frameSize.width != 0 && stateData.frameSize.height != 0) {
      layoutableShadowNode.setSize(
          Size{stateData.frameSize.width, stateData.frameSize.height});
    }
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace react
} // namespace facebook
