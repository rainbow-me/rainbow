#pragma once

#include "WorkletsCache.h"
#include "SharedParent.h"
#include <jsi/jsi.h>

using namespace facebook;

namespace reanimated {

class FrozenObject : public jsi::HostObject {
  friend WorkletsCache;
  friend void extractMutables(jsi::Runtime &rt,
                              std::shared_ptr<ShareableValue> sv,
                              std::vector<std::shared_ptr<MutableValue>> &res);
  friend jsi::Value createFrozenWrapper(ShareableValue *sv,
                                        jsi::Runtime &rt,
                                        std::shared_ptr<FrozenObject> frozenObject);
  
  private:
  std::unordered_map<std::string, std::shared_ptr<ShareableValue>> map;

  public:

  FrozenObject(jsi::Runtime &rt, const jsi::Object &object, NativeReanimatedModule *module);
  jsi::Object shallowClone(jsi::Runtime &rt);
};

}
