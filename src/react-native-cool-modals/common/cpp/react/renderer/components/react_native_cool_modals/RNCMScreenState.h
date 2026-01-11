#pragma once

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>

namespace facebook {
namespace react {

class JSI_EXPORT RNCMScreenState final {
 public:
  using Shared = std::shared_ptr<const RNCMScreenState>;

  RNCMScreenState() {};
  RNCMScreenState(Size frameSize_, Point contentOffset_)
      : frameSize(frameSize_), contentOffset(contentOffset_) {};

  Size frameSize{};
  Point contentOffset;
};

} // namespace react
} // namespace facebook
