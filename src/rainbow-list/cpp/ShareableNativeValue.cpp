//
// Created by Michał Osadnik on 24/09/2021.
//

#include "ShareableNativeValue.h"
#include <memory>
#include <exception>

std::shared_ptr <ShareableNativeValue> ObjectNativeWrapper::getProperty(std::string name) {
    return this->value.at(name);
}

std::shared_ptr <ValueNativeWrapper>
ObjectNativeWrapper::create(jsi::Runtime &rt, const jsi::Object value) {
    auto snv = new ObjectNativeWrapper();
    snv->value = {};
    auto propertyNames = value.getPropertyNames(rt);
    for (size_t i = 0, count = propertyNames.size(rt); i < count; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt);
        std::string nameStr = propertyName.utf8(rt);
        snv->value[nameStr] = ShareableNativeValue::adapt(
                rt, value.getProperty(rt, propertyName));
    }
    return std::shared_ptr<ValueNativeWrapper>((ValueNativeWrapper *)snv);
}

std::shared_ptr <ShareableNativeValue> ArrayNativeWrapper::getValueAtIndex(long i) {
    return this->value.at(i);
}

std::shared_ptr <ValueNativeWrapper>
ArrayNativeWrapper::create(jsi::Runtime &rt, jsi::Array value) {
    auto snv = new ArrayNativeWrapper();
    for (size_t i = 0, size = value.size(rt); i < size; i++) {
        auto sv = ShareableNativeValue::adapt(rt, value.getValueAtIndex(rt, i));
        snv->value.push_back(sv);
    }
    return std::shared_ptr<ValueNativeWrapper>((ValueNativeWrapper *)snv);
}

std::string StringNativeWrapper::getValue() {
    return this->value;
}

std::shared_ptr <ValueNativeWrapper> StringNativeWrapper::create(jsi::Runtime &rt, jsi::String value) {
    auto snv = new StringNativeWrapper();
    snv->value = value.utf8(rt);
    return std::shared_ptr<ValueNativeWrapper>((ValueNativeWrapper *)snv);
}

bool BooleanNativeWrapper::getValue() {
    return this->value;
}

std::shared_ptr <ValueNativeWrapper> BooleanNativeWrapper::create(jsi::Runtime &rt, bool value) {
    auto snv = new BooleanNativeWrapper();
    snv->value = value;
    return std::shared_ptr<ValueNativeWrapper>((ValueNativeWrapper *)snv);
}


double NumberNativeWrapper::getValue() {
    return this->value;
}

std::shared_ptr <ValueNativeWrapper> NumberNativeWrapper::create(jsi::Runtime &rt, double value) {
    auto snv = new NumberNativeWrapper();
    snv->value = value;
    return std::shared_ptr<ValueNativeWrapper>((ValueNativeWrapper *)snv);
}

std::shared_ptr <ShareableNativeValue>
ShareableNativeValue::adapt(jsi::Runtime &rt, const jsi::Value &value) {
    auto svn = std::shared_ptr<ShareableNativeValue>(
            new ShareableNativeValue());
    if (value.isString()) {
        svn->type = ValueType::StringType;
        svn->valueContainer = std::shared_ptr<ValueNativeWrapper>(StringNativeWrapper::create(rt, value.asString(rt)));
    } else if (value.isBool()) {
        svn->type = ValueType::BoolType;
        svn->valueContainer = std::shared_ptr<ValueNativeWrapper>(BooleanNativeWrapper::create(rt, value.getBool()));
    } else if (value.isNumber()) {
        svn->type = ValueType::NumberType;
        svn->valueContainer = std::shared_ptr<ValueNativeWrapper>(NumberNativeWrapper::create(rt, value.asNumber()));
    } else if (value.isObject()) {
        if (value.asObject(rt).isArray(rt)) {
            svn->type = ValueType::ArrayType;
            svn->valueContainer = std::shared_ptr<ValueNativeWrapper>(ArrayNativeWrapper::create(rt, value.asObject(rt).asArray(rt)));
        } else {
            svn->type = ValueType::ObjectType;
            svn->valueContainer = std::shared_ptr<ValueNativeWrapper>(ObjectNativeWrapper::create(rt, value.asObject(rt)));
        }
    }
    return svn;
}
