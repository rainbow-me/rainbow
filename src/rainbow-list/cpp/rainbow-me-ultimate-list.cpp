#include "rainbow-me-ultimate-list.h"
#include <memory>
#include "ShareableNativeValue.h"
#include <exception>



#ifdef ON_ANDROID
#include <fbjni/fbjni.h>
#endif

using namespace facebook;


namespace osdnk {
namespace ultimatelist {

//    std::mutex // mtx;
    std::unordered_map<int, std::shared_ptr<ShareableNativeValue>> valueMap;
    std::unordered_map<int, std::shared_ptr<ShareableNativeValue>> preValueMap;
    std::unordered_map<int, std::shared_ptr<ShareableNativeValue>> recentChanges;
    std::shared_ptr<std::function<void (int)>> notifyNewData;
    std::string obtainStringValueAtIndexByKey(int index, std::string label, int id) {
       // // mtx.lock();
        auto dataValue3 = valueMap[id];
        if (dataValue3 == nullptr) {
           // // mtx.unlock();
            return "XXXX";
        }


        if (dataValue3->isArray()) {
            auto valueAtIndex = ((ArrayNativeWrapper*) dataValue3->valueContainer.get())->getValueAtIndex(index);
            if (valueAtIndex->isObject()) {
                auto givenData = ((ObjectNativeWrapper *)(valueAtIndex->valueContainer.get()))->getProperty("data");
                size_t pos;
                std::string token;
                while ((pos = label.find('.')) != std::string::npos) {
                    token = label.substr(0, pos);
                    givenData = ((ObjectNativeWrapper *)(givenData->valueContainer.get()))->getProperty(token);
                    label.erase(0, pos + 1);
                }
                auto property = ((ObjectNativeWrapper*) givenData->valueContainer.get())->getProperty(label);
                if (property->isString()) {
                    // mtx.unlock();
                    return ((StringNativeWrapper*) property->valueContainer.get())->getValue();
                }
            }
        }
       // // mtx.unlock();
        return "VVV";

    }

        void moveFromPreSet(int id) {
            valueMap[id] = preValueMap[id];
            preValueMap.erase(id);
        }


        std::string obtainTypeAtIndexByKey(int index, int id) {
        // mtx.lock();
        auto dataValue3 = valueMap[id];
        if (dataValue3 == nullptr) {
            // mtx.unlock();
            return "XXXX";
        }


        if (dataValue3->isArray()) {
            auto valueAtIndex = ((ArrayNativeWrapper*) dataValue3->valueContainer.get())->getValueAtIndex(index);
            if (valueAtIndex->isObject()) {
                auto givenData = ((ObjectNativeWrapper *)(valueAtIndex->valueContainer.get()))->getProperty("type");
                if (givenData->isString()) {
                    // mtx.unlock();
                    return ((StringNativeWrapper*)(givenData.get()->valueContainer.get()))->getValue();
                }
            }
        }
        // mtx.unlock();
        return "VVV";

    }

    std::vector<int> obtainNewIndices(int id) {
        // mtx.lock();
        std::vector<int> res;
        auto dataValue3 = recentChanges[id];


        if (dataValue3->isObject()) {
            auto valueAtIndex = ((ObjectNativeWrapper*) dataValue3->valueContainer.get())->getProperty("newIndices");
            if (valueAtIndex->isArray()) {
                auto givenData = ((ArrayNativeWrapper *)(valueAtIndex->valueContainer.get()))->value;
                //res.push_back(1);
                for (auto & i : givenData) {
                    auto value = ((NumberNativeWrapper *)(i->valueContainer.get()))->getValue();
                    res.push_back((int) value);
                }
//                std::transform(givenData.begin(), givenData.end(), res.begin(), [](ShareableNativeValue d) -> int {
//                    return 1;
//
////                    return ((NumberNativeWrapper *)(d->valueContainer.get()))->getValue();
//                });
            }
        }
        // mtx.unlock();
        return res;
    }

    std::vector<int> obtainRemovedIndices(int id) {
        // mtx.lock();
        std::vector<int> res;
        auto dataValue3 = recentChanges[id];


        if (dataValue3->isObject()) {
            auto valueAtIndex = ((ObjectNativeWrapper*) dataValue3->valueContainer.get())->getProperty("removedIndices");
            if (valueAtIndex->isArray()) {
                auto givenData = ((ArrayNativeWrapper *)(valueAtIndex->valueContainer.get()))->value;
                for (auto & i : givenData) {
                    auto value = ((NumberNativeWrapper *)(i->valueContainer.get()))->getValue();
                    res.push_back((int) value);
                }
            }
        }
        // mtx.unlock();
        return res;
    }


    std::vector<int> obtainMovedIndices(int id) {
        // mtx.lock();
        std::vector<int> res;
        auto dataValue3 = recentChanges[id];


        if (dataValue3->isObject()) {
            auto valueAtIndex = ((ObjectNativeWrapper*) dataValue3->valueContainer.get())->getProperty("movesIndices");
            if (valueAtIndex->isArray()) {
                auto givenData = ((ArrayNativeWrapper *)(valueAtIndex->valueContainer.get()))->value;
                for (auto & i : givenData) {
                    auto value = ((NumberNativeWrapper *)(i->valueContainer.get()))->getValue();
                    res.push_back((int) value);
                }
            }
        }
        // mtx.unlock();
        return res;
    }

    std::string obtainHashValueAtIndex(int index, int id) {
        // mtx.lock();
        auto dataValue3 = valueMap[id];
        if (dataValue3 == nullptr) {
            // mtx.unlock();
            return "XXXX";
        }


        if (dataValue3->isArray()) {
            auto valueAtIndex = ((ArrayNativeWrapper*) dataValue3->valueContainer.get())->getValueAtIndex(index);
            if (valueAtIndex->isObject()) {
                auto givenData = ((ObjectNativeWrapper *)(valueAtIndex->valueContainer.get()))->getProperty("hash");
                if (givenData->isString()) {
                    // mtx.unlock();
                    return ((StringNativeWrapper*)(givenData.get()->valueContainer.get()))->getValue();
                }
            }
        }
        // mtx.unlock();
        return "VVV";

    }

    int obtainCount(int id) {
        // mtx.lock();
        auto dataValue3 = valueMap[id];
        if (dataValue3 == nullptr) {
            // mtx.unlock();
            return 0;
        }


        if (dataValue3->isArray()) {
            // mtx.unlock();
            return ((ArrayNativeWrapper*) dataValue3->valueContainer.get())->length();
        }
        // mtx.unlock();
        return 0;

    }

    bool obtainIsHeaderAtIndex(int index, int id) {
        // mtx.lock();
        auto dataValue3 = valueMap[id];
        if (dataValue3 == nullptr) {
            // mtx.unlock();
            return false;
        }


        if (dataValue3->isArray()) {
            auto valueAtIndex = ((ArrayNativeWrapper*) dataValue3->valueContainer.get())->getValueAtIndex(index);
            if (valueAtIndex->isObject()) {
                auto givenData = ((ObjectNativeWrapper *)(valueAtIndex->valueContainer.get()))->getProperty("sticky");
                if (givenData->isBool()) {
                    // mtx.unlock();
                    return ((BooleanNativeWrapper*)(givenData.get()->valueContainer.get()))->getValue();
                }
            }
        }
        // mtx.unlock();
        return false;

    }

    void setNotifyNewData(std::function<void (int)> notifier) {
        notifyNewData = std::make_shared<std::function<void (int)>>(notifier);

    }



    void installSimple(jsi::Runtime& runtime) {


        auto setData = jsi::Function::createFromHostFunction(runtime,
                                                              jsi::PropNameID::forAscii(runtime, "_list___setData"),
                                                              3,  // run
                                                              [](jsi::Runtime& cruntime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
                                                                  // mtx.lock();
                                                                  auto dataValue2 = ShareableNativeValue::adapt(cruntime, arguments[0]);
                                                                  int id = arguments[1].asNumber();
                                                                  if (arguments[2].isObject()) {
                                                                      preValueMap[id] = dataValue2;
                                                                      recentChanges[id] = ShareableNativeValue::adapt(cruntime, arguments[2]);
                                                                      // mtx.unlock();
                                                                      auto notify = notifyNewData.get();
                                                                      if (notify != nullptr) {
                                                                          notify->operator()(id);
                                                                      }
                                                                  } else {
                                                                      valueMap[id] = dataValue2;
                                                                      // mtx.unlock();
                                                                  }




                                                                  return jsi::Value();
                                                              });
        runtime.global().setProperty(runtime, "_list___setData", std::move(setData));

        auto removeData = jsi::Function::createFromHostFunction(runtime,
                                                              jsi::PropNameID::forAscii(runtime, "_list___removeData"),
                                                              1,   // run
                                                              [](jsi::Runtime& cruntime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
                                                                  // mtx.lock();
                                                                  int id = arguments[0].asNumber();
                                                                  valueMap.erase(id);
                                                                  recentChanges.erase(id);
                                                                  // mtx.unlock();
                                                                  return jsi::Value();
                                                              });
        runtime.global().setProperty(runtime, "_list___removeData", std::move(removeData));

    }





} // namespace com.ultimatelist
} // namespace osdnk
