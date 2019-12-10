#include "V8PointerValue.h"

namespace facebook {

V8PointerValue::V8PointerValue(
    v8::Isolate *isolate,
    const v8::Local<v8::Value> &value)
    : value_(isolate, value) {
}

V8PointerValue::~V8PointerValue() {
  value_.Reset();
}

v8::Local<v8::Value> V8PointerValue::Get(v8::Isolate *isolate) const {
  v8::EscapableHandleScope scopedIsolate(isolate);
  return scopedIsolate.Escape(value_.Get(isolate));
}

// static
V8PointerValue *V8PointerValue::createFromOneByte(
    v8::Isolate *isolate,
    const char *str,
    size_t length) {
  v8::HandleScope scopedIsolate(isolate);
  v8::Local<v8::String> v8String;
  if (!v8::String::NewFromOneByte(
           isolate,
           reinterpret_cast<const uint8_t *>(str),
           v8::NewStringType::kNormal,
           static_cast<int>(length))
           .ToLocal(&v8String)) {
    return nullptr;
  }
  return new V8PointerValue(isolate, v8String);
}

// static
V8PointerValue *V8PointerValue::createFromUtf8(
    v8::Isolate *isolate,
    const uint8_t *str,
    size_t length) {
  v8::HandleScope scopedIsolate(isolate);
  v8::Local<v8::String> v8String;
  if (!v8::String::NewFromUtf8(
           isolate,
           reinterpret_cast<const char *>(str),
           v8::NewStringType::kNormal,
           static_cast<int>(length))
           .ToLocal(&v8String)) {
    return nullptr;
  }
  return new V8PointerValue(isolate, v8String);
}

void V8PointerValue::invalidate() {
  delete this;
}

} // namespace facebook
