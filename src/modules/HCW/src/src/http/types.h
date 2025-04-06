#pragma once

#ifdef DELETE
#undef DELETE
#endif

#include <string>
#include <unordered_map>
#include <memory>
#include <functional>
#include "methods.hpp"

namespace http {

class Request;
class Response;
class Router;

struct ParseResult {
    bool success;
    std::string error;
    ParseResult(bool s = false, const std::string& e = "") 
        : success(s), error(e) {}
    
    operator bool() const { return success; }
};

enum class Status {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    TooManyRequests = 429,
    InternalError = 500
};

using RequestHandler = std::function<bool(Request&, Response&)>;
using Middleware = std::function<bool(Request&, Response&)>;
using RouteCallback = RequestHandler;

}