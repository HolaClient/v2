#include "parser.hpp"

namespace http {

bool Parser::parse(const std::string& data, Request& req) {
    req.set_raw_data(data);
    return true;
}

}