#include "http/server.hpp"
#include "http/response.hpp"
#include "config/config.h"
#include <iostream>

int main() {
    http::HTTPServer server;
    
    server.get("/", [](http::Request& req, http::Response& res) {
        res.headers["Content-Type"] = "text/plain";
        res.body = "Hello World!";
        return true;
    });

    server.get("/debug", [](http::Request& req, http::Response& res) {
        res.headers["Content-Type"] = "application/json";
        res.body = "{\"status\":\"ok\"}";
        return true;
    });

    std::cout << "Server starting on port 2080...\n";
    if (!server.start(2080)) {
        std::cerr << "Failed to start server\n";
        return 1;
    }

    return 0;
}