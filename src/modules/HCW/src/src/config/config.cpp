#include "config.h"
#include <fstream>
#include <sstream>

bool Config::load(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        return false;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string content = buffer.str();

    size_t pos = 0;
    while ((pos = content.find("\"", pos)) != std::string::npos) {
        size_t key_end = content.find("\"", pos + 1);
        std::string key = content.substr(pos + 1, key_end - pos - 1);
        
        size_t value_start = content.find(":", key_end) + 1;
        while (value_start < content.length() && std::isspace(content[value_start])) {
            value_start++;
        }

        size_t value_end;
        std::string value;

        if (content[value_start] == '\"') {
            value_start++;
            value_end = content.find("\"", value_start);
            value = content.substr(value_start, value_end - value_start);
        } else {
            value_end = content.find_first_of(",}", value_start);
            value = content.substr(value_start, value_end - value_start);
            value.erase(0, value.find_first_not_of(" \t\n\r"));
            value.erase(value.find_last_not_of(" \t\n\r") + 1);
        }

        settings[key] = value;
        pos = value_end + 1;
    }
    return true;
}