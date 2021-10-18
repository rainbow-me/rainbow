//
// Created by Michał Osadnik on 24/09/2021.
//

#ifdef __cplusplus
#include <memory>
#include <jsi/jsi.h>
#include <unordered_map>

enum class ValueType {
    BoolType,
    NumberType,
    StringType,
    ArrayType,
    ObjectType,
};

class ValueNativeWrapper {};

using namespace facebook;


class ShareableNativeValue {
public:
    static std::shared_ptr<ShareableNativeValue> adapt(jsi::Runtime &rt, const jsi::Value &value);
    std::shared_ptr<ValueNativeWrapper> valueContainer;
    ValueType type;
    inline bool isString() {
        return type == ValueType::StringType;
    }
    inline bool isArray() {
        return type == ValueType::ArrayType;
    }

    inline bool isNumber() {
        return type == ValueType::NumberType;
    }

    inline bool isObject() {
        return type == ValueType::ObjectType;
    }

    inline bool isBool() {
        return type == ValueType::BoolType;
    }
};

class ObjectNativeWrapper : ValueNativeWrapper {
public:
    std::shared_ptr<ShareableNativeValue> getProperty(std::string name);
    static std::shared_ptr<ValueNativeWrapper> create(jsi::Runtime &rt, const jsi::Object value);
private:
    std::unordered_map<std::string, std::shared_ptr<ShareableNativeValue>> value;
private:


};

class ArrayNativeWrapper : ValueNativeWrapper {
public:
    std::shared_ptr<ShareableNativeValue> getValueAtIndex(long i);
    inline int length() {
        return this->value.size();
    };
    static std::shared_ptr<ValueNativeWrapper> create(jsi::Runtime &rt, jsi::Array value);
    std::vector<std::shared_ptr<ShareableNativeValue>> value;
};


class StringNativeWrapper : ValueNativeWrapper {
public:
    std::string getValue();
    static std::shared_ptr<ValueNativeWrapper> create(jsi::Runtime &rt, jsi::String value);
private:
    std::string value;

};

class BooleanNativeWrapper : ValueNativeWrapper {
public:
    bool getValue();
    static std::shared_ptr<ValueNativeWrapper> create(jsi::Runtime &rt, bool value);
private:
    bool value;

};

class NumberNativeWrapper : ValueNativeWrapper {
public:
    double getValue();
    static std::shared_ptr<ValueNativeWrapper> create(jsi::Runtime &rt, double value);
private:
    double value;

};





#endif
