
#pragma once
#include "request.hpp"
#include <string>

namespace http {

class Parser {
public:
    static bool parse(const std::string& data, Request& req);
};

}