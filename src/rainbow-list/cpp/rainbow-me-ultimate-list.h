#ifdef __cplusplus
#include <__bit_reference>
#pragma once
#include <jsi/jsi.h>



using namespace facebook;

namespace osdnk {
namespace ultimatelist {

    std::string obtainStringValueAtIndexByKey(int index, std::string label, int id);
    std::string obtainHashValueAtIndex(int index, int id);
    std::string obtainTypeAtIndexByKey(int index, int id);
    std::vector<int> obtainNewIndices(int id);
    std::vector<int> obtainRemovedIndices(int id);
    std::vector<int> obtainMovedIndices(int id);
    int obtainCount(int id);
    void moveFromPreSet(int id);
    bool obtainIsHeaderAtIndex(int index, int id);
    void installSimple(jsi::Runtime& cruntime);
    void setNotifyNewData(std::function<void (int)> notifier);

}
}
#endif
