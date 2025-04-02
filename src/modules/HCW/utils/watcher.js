const fs = require('fs');
const path = require('path');

module.exports = function(watchPath, callback) {
    let timeoutId;
    const watchers = new Map();
    
    function watchDirectory(dirPath) {
        if (watchers.has(dirPath)) return;
        
        try {
            const watcher = fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
                if (!filename) return;
                
                const fullPath = path.join(dirPath, filename);
                
                // Debounce callback
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    callback(fullPath);
                }, 100);
                
                // Watch new directories
                if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                    watchDirectory(fullPath);
                }
            });
            
            watchers.set(dirPath, watcher);
            
            // Watch subdirectories
            const entries = fs.readdirSync(dirPath);
            entries.forEach(entry => {
                const fullPath = path.join(dirPath, entry);
                if (fs.statSync(fullPath).isDirectory()) {
                    watchDirectory(fullPath);
                }
            });
        } catch (error) {
            console.error(`Watch error on ${dirPath}:`, error);
        }
    }
    
    // Start watching
    watchDirectory(watchPath);
    
    // Return cleanup function
    return function cleanup() {
        for (const [, watcher] of watchers) {
            watcher.close();
        }
        watchers.clear();
    };
};