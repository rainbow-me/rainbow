#include "V8RuntimeFactory.h"

#include "V8Runtime.h"

namespace facebook {

std::unique_ptr<jsi::Runtime> createV8Runtime() {
  return std::make_unique<V8Runtime>();
}

} // namespace facebook
