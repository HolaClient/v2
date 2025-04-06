#pragma once
#include <string>

namespace http {

enum class Method {
    UNKNOWN,
    GET,
    POST,
    PUT,
    DELETE
};

std::string method_to_string(Method method);
Method string_to_method(const std::string& method);

}