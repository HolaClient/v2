#pragma once
#include <string>
#include <map>
#include "types.h"

namespace http {
    class Response {
    public:
        Status status = Status::OK;
        std::map<std::string, std::string> headers;
        std::string body;

        void json(const std::string& json_str) {
            headers["Content-Type"] = "application/json";
            body = json_str;
        }

        void text(const std::string& text_str) {
            headers["Content-Type"] = "text/plain";
            body = text_str;
        }
    };
}
