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
                
                const fullPath = path.posix.join(dirPath, filename);
                
                if (!fs.existsSync(fullPath)) {
                    if (eventType === 'rename') {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            callback(fullPath, 'deleted');
                        }, 100);
                    }
                    return;
                }
                
                if (filename.startsWith('.') || filename.startsWith('~')) return;
                
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    try {
                        const stat = fs.statSync(fullPath);
                        
                        if (stat.isFile()) {
                            callback(fullPath, eventType);
                        }
                        else if (stat.isDirectory() && !watchers.has(fullPath)) {
                            watchDirectory(fullPath);
                        }
                    } catch (err) {
                        if (err.code !== 'ENOENT') {
                            console.error(`Watch error on ${fullPath}:`, err);
                        }
                    }
                }, 100);
            });
            
            watchers.set(dirPath, watcher);
            
            try {
                const entries = fs.readdirSync(dirPath);
                entries.forEach(entry => {
                    const fullPath = path.posix.join(dirPath, entry);
                    try {
                        if (fs.statSync(fullPath).isDirectory()) {
                            watchDirectory(fullPath);
                        }
                    } catch (err) {
                        if (err.code !== 'ENOENT') {
                            console.error(`Error accessing ${fullPath}:`, err);
                        }
                    }
                });
            } catch (err) {
                console.error(`Error reading directory ${dirPath}:`, err);
            }
        } catch (error) {
            console.error(`Watch error on ${dirPath}:`, error);
        }
    }
    
    watchDirectory(watchPath);
    
    return function cleanup() {
        for (const [, watcher] of watchers) {
            watcher.close();
        }
        watchers.clear();
    };
};