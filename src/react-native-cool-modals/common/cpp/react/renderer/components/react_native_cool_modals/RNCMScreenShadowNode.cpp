#include "RNCMScreenShadowNode.h"

namespace facebook {
namespace react {

extern const char RNCMScreenComponentName[] = "RNCMScreen";

Point RNCMScreenShadowNode::getContentOriginOffset(
    bool /*includeTransform*/) const {
  auto stateData = getStateData();
  return stateData.contentOffset;
}

} // namespace react
} // namespace facebook
