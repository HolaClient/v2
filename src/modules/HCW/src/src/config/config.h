#pragma once
#include <string>
#include <map>
#include <mutex>
#include <shared_mutex>

class Config {
public:
    static Config& instance() {
        static Config config;
        return config;
    }

    bool load(const std::string& path);
    
    std::string get_string(const std::string& key, const std::string& default_value = "") const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        auto it = settings.find(key);
        return it != settings.end() ? it->second : default_value;
    }

    int get_int(const std::string& key, int default_value = 0) const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        auto it = settings.find(key);
        return it != settings.end() ? std::stoi(it->second) : default_value;
    }

    bool get_bool(const std::string& key, bool default_value = false) const {
        std::shared_lock<std::shared_mutex> lock(mutex);
        auto it = settings.find(key);
        if (it == settings.end()) return default_value;
        return it->second == "true" || it->second == "1";
    }

private:
    Config() = default;
    std::map<std::string, std::string> settings;
    mutable std::shared_mutex mutex;
};
