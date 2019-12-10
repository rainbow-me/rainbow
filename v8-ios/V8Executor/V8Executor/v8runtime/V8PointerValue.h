#pragma once

#include "V8Runtime.h"
#include "jsi/jsi.h"
#include "v8.h"

namespace facebook {

class V8PointerValue final : public V8Runtime::PointerValue {
 public:
  V8PointerValue(v8::Isolate *isolate, const v8::Local<v8::Value> &value);
  ~V8PointerValue();

  v8::Local<v8::Value> Get(v8::Isolate *isolate) const;

 public:
  static V8PointerValue *
  createFromOneByte(v8::Isolate *isolate, const char *str, size_t length);

  static V8PointerValue *
  createFromUtf8(v8::Isolate *isolate, const uint8_t *str, size_t length);

 private:
  void invalidate() override;

 private:
  friend class JSIV8ValueConverter;
  friend class V8Runtime;
  v8::Global<v8::Value> value_;
};

} // namespace facebook
