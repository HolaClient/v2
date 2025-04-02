module.exports = function (a, b) {
    if (typeof b !== "object") return { success: false, code: 400, error: `No input has been received!` };

    for (let i of a) {
        function error(message = '') {
            return { success: false, code: 400, error: `Error in ${i.pointer} ${message}` };
        }

        let c = b[i.pointer];

        function checkRequiredPattern(c, pattern) {
            if (!pattern) return { success: true, code: 200 };
        
            let g = pattern.split('.');
            let patterns = {
                "a-z": /[a-z]/g,
                "A-Z": /[A-Z]/g,
                "0-9": /[0-9]/g,
                "!!!": /[!@#$%^&*(){}`~;:?\/><.,\-_=+\[\]\|\\]/g
            };
        
            for (let j of g) {
                let k = j.match(/(\d+)\*\(([^)]+)\)/);
                if (!k) {
                    return { success: false, code: 400, error: `Invalid pattern format: ${j}` };
                }
        
                let l = parseInt(k[1], 10);
                let m = k[2];
                let o = patterns[m];
                
                if (o) {
                    let p = c.match(o);
                    let q = p ? p.length : 0;
                    if (q < l) {
                        return { success: false, code: 400, error: `Pattern ${m == "!!!" ? "secret characters" : m} must appear at least ${l} times in ${c}` };
                    }
                } else {
                    return { success: false, code: 400, error: `Unknown pattern key: ${m}` };
                }
            }
            return { success: true, code: 200 };
        }                
        
        function checkRejectPattern(c, pattern) {
            if (!pattern) return { success: true, code: 200 };
            let h = pattern.split('.');
            let patterns = {
                "a-z": /[a-z]/g,
                "A-Z": /[A-Z]/g,
                "0-9": /[0-9]/g,
                "!!!": /[!@#$%^&*(){}`~;:?\/><.,\-_=+\[\]\|\\]/g
            };
        
            for (let j of h) {
                let k = j.match(/\(([^)]+)\)/);
                if (!k) {
                    return { success: false, code: 400, error: `Invalid reject pattern format: ${j}` };
                }
        
                let m = k[1];
                let o = patterns[m];
        
                if (o && c.match(o)) {
                    return { success: false, code: 400, error: `Pattern ${m} should not appear in ${c}` };
                } else if (!o) {
                    return { success: false, code: 400, error: `Unknown reject pattern key: ${m}` };
                }
            }
            return { success: true, code: 200 };
        }
        
        function checkPatterns(c, requiredPattern = "", rejectPattern = "") {
            let d = checkRequiredPattern(c, requiredPattern);
            if (!d.success) return d;
            
            let e = checkRejectPattern(c, rejectPattern);
            if (!e.success) return e;
            
            return { success: true, code: 200 };
        }

        if (i.required === true && c !== undefined && c !== null) {
            if (i.type == "number") {
                c = parseFloat(c);
                if (isNaN(c)) return error();
                if (i.min !== undefined && c.length < i.min) return error(`String must be at least ${i.min} characters long!`);
                if (i.max !== undefined && c.length > i.max) return error(`String must not exceed ${i.max} characters long!`);
                if (c > 999999999999999) return error();
                let d = checkPatterns(c.toString(), i.requiredPattern, i.rejectPattern);
                if (!d.success) return d;

            } else if (i.type == "boolean") {
                if (typeof c !== 'boolean') {
                    if (c === "true" || c === "1") {
                        c = true;
                    } else if (c === "false" || c === "0") {
                        c = false;
                    } else {
                        return error();
                    }
                }

            } else if (i.type == "string") {
                if (typeof c !== 'string') return error();
                if (i.min !== undefined && c.length < i.min) return error(`String must be at least ${i.min} characters long!`);
                if (i.max !== undefined && c.length > i.max) return error(`String must not exceed ${i.max} characters long!`);
                if (c.length > 999999999999999) return error();
                let d = checkPatterns(c, i.requiredPattern, i.rejectPattern);
                if (!d.success) return d;

            } else if (i.type == "array") {
                if (!Array.isArray(c)) return error();
                if (i.min !== undefined && c.length < i.min) return error();
                if (i.max !== undefined && c.length > i.max) return error();
                let d = checkPatterns(c.join(''), i.requiredPattern, i.rejectPattern);
                if (!d.success) return d;

            } else if (i.type == "object") {
                if (typeof c !== 'object' || Array.isArray(c)) return error();
                if (i.keys !== undefined) {
                    for (let key of i.keys) {
                        if (!(key in c)) return error();
                    }
                }
                let d = checkPatterns(JSON.stringify(c), i.requiredPattern, i.rejectPattern);
                if (!d.success) return d;
            }
            b[i.pointer] = c;
        } else {
            return error(`This field is required!`);
        }
    }
    return { success: true, code: 200, data: b };
}