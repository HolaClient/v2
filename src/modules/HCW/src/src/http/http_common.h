#pragma once

#include <string>
#include <map>
#include <optional>
#include <vector>
#include <functional>

namespace http {

class Request {
public:
    enum class Method {
        GET,
        POST
    };

    Method method;
    std::string path;
    std::string version;
    std::map<std::string, std::string> headers;
    std::vector<uint8_t> body;
    std::map<std::string, std::string> params;
};

class Response {
public:
    int status{200};
    std::map<std::string, std::string> headers;
    std::vector<uint8_t> body;

    void send(const std::string& data) {
        body = std::vector<uint8_t>(data.begin(), data.end());
    }

    void setStatus(int code) {
        status = code;
    }

    void setHeader(const std::string& name, const std::string& value) {
        headers[name] = value;
    }
};

}