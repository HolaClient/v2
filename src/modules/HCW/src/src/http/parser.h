#pragma once
#include "types.h"
#include "request.hpp"
#include <string>
#include <cctype>
#include <cstdint>
#include <cstddef>

extern "C" {
    int64_t parse_http(int socket, const char* buffer, int length);
    int64_t build_res(const char* buffer, int length, char* response);
    int64_t accept(int socket);
    int64_t send_res(int socket, const char* buffer, int length);
    int64_t recv_res(int socket, char* buffer, int length);
}

namespace http {
    constexpr const char* HTTP_NEWLINE = "\r\n";
    constexpr const char* HTTP_HEADER_END = "\r\n\r\n";
    constexpr const char* HTTP_VERSION = "HTTP/1.1";

    ParseResult parse_request(const char* buffer, size_t len, Request& req);
    bool parse_headers(const char* start, const char* end, Request& req);
    bool parse_request_line(const char* start, const char* end, Request& req);

bool parse_request_simd(const char* buffer, size_t len, Request& req);

inline ParseResult parse_request(const char* data, size_t length, Request& req) {
    std::string request(data, length);
    
    size_t pos = request.find(" ");
    if (pos == std::string::npos) return {false, "Invalid request format"};
    
    std::string method_str = request.substr(0, pos);
    req.set_method(method_str);
    
    size_t space = request.find(" ", pos + 1);
    if (space == std::string::npos) return {false, "Invalid request format"};
    
    req.set_path(request.substr(pos + 1, space - pos - 1));
    
    pos = space + 1;
    size_t end_line = request.find("\r\n", pos);
    if (end_line == std::string::npos) {
        return {false, "Invalid request format"};
    }

    std::string version = request.substr(pos, end_line - pos);
    if (version != "HTTP/1.1" && version != "HTTP/1.0") {
        return {false, "Unsupported HTTP version"};
    }

    pos = end_line + 2;
    while (pos < request.length()) {
        end_line = request.find("\r\n", pos);
        if (end_line == std::string::npos) break;

        if (pos == end_line) {
            pos += 2;
            break;
        }

        std::string line = request.substr(pos, end_line - pos);
        size_t colon = line.find(':');
        if (colon != std::string::npos) {
            std::string key = line.substr(0, colon);
            std::string value = line.substr(colon + 1);
            
            while (!value.empty() && value[0] == ' ') value.erase(0, 1);
            while (!value.empty() && value.back() == ' ') value.pop_back();
            
            req.set_header(key, value);
        }
        pos = end_line + 2;
    }

    if (pos < request.length()) {
        req.set_body(request.substr(pos));
    }

    return {true, ""};
}

}
