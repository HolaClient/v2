#include "methods.hpp"
#include <string>

namespace http {

std::string method_to_string(Method method) {
    switch (method) {
        case Method::GET:    return "GET";
        case Method::POST:   return "POST";
        case Method::PUT:    return "PUT";
        case Method::DELETE: return "DELETE";
        case Method::UNKNOWN:
        default:            return "UNKNOWN";
    }
}

Method string_to_method(const std::string& method) {
    if (method == "GET")    return Method::GET;
    if (method == "POST")   return Method::POST;
    if (method == "PUT")    return Method::PUT;
    if (method == "DELETE") return Method::DELETE;
    return Method::UNKNOWN;
}

}