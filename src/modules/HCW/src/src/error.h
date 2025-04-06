#pragma once
#include <string>

enum class ErrorCode {
    SUCCESS = 0,
    SOCKET_ERROR,
    BIND_ERROR,
    LISTEN_ERROR,
    ACCEPT_ERROR,
    SEND_ERROR,
    RECV_ERROR,
    PARSE_ERROR,
    RATE_LIMIT_EXCEEDED,
    CONFIG_ERROR,
    RESOURCE_ERROR
};

struct Error {
    ErrorCode code;
    std::string message;
    int system_error;
    
    static Error success() { return {ErrorCode::SUCCESS, "", 0}; }
    bool is_success() const { return code == ErrorCode::SUCCESS; }
};
