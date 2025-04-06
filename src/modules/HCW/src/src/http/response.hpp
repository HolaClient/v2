#pragma once
#include <string>
#include <map>
#include "types.h"

namespace http {
    struct Response {
        Status status{Status::OK};
        std::map<std::string, std::string> headers;
        std::string body;
        
        void text(const std::string& content) {
            headers["Content-Type"] = "text/plain";
            headers["Content-Length"] = std::to_string(content.size());
            headers["Connection"] = "close";
            body = content;
        }
        
        void json(const std::string& content) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = std::to_string(content.size());
            headers["Connection"] = "close";
            body = content;
        }
    };
}