const path = require('path')

const info = {
    "name": "Validator",
    "src": "./src/utils/validate.js",
    "type": "module"
}
async function test() {
    try {
        const a = require(path.resolve(info.src))
        const b = [
            {
                "schema": [
                    {
                        "pointer": "test",
                        "required": true,
                        "type": "string",
                        "format": "password",
                        "min": 8,
                        "requiredPattern": "1*(a-z).1*(A-Z).1*(!!!).1*(0-9)",
                    }
                ],
                "datasets": [
                    { "test": "12345678", "expected": 400, "expectedError": "Pattern a-z must appear at least 1 times in 12345678", "index": 0 },
                    { "test": "12345678a", "expected": 400, "expectedError": "Pattern a-Z must appear at least 1 times in 12345678a", "index": 0 },
                    { "test": "12345678aA", "expected": 400, "expectedError": "Pattern secret characters must appear at least 1 times in 12345678A", "index": 0 },
                    { "test": "12345678Aa!", "expected": 200, "index": 1 }
                ]
            },
            {
                "schema": [
                    {
                        "pointer": "test",
                        "required": true,
                        "type": "string",
                        "format": "username",
                        "min": 8,
                        "rejectPattern": "(!!!)",
                    }
                ],
                "datasets": [
                    { "test": "12345678Aa!", "expected": 400, "expectedError": "Pattern !!! should not appear in 12345678Aa!", "index": 1 },
                    { "test": "crazymath072", "expected": 200, "index": 0 }
                ]
            },
            {
                "schema": [
                    {
                        "pointer": "test",
                        "required": true,
                        "type": "string",
                        "format": "email",
                        "min": 8
                    }
                ],
                "datasets": [
                    { "test": "test", "expected": 400, "expectedError": "Pattern !!! should not appear in 12345678Aa!", "index": 1 },
                    { "test": "test@test.com", "expected": 200, "index": 0 },
                    { "test": "test@test", "expected": 400, "expectedError": "Invalid email format!", "index": 2 },
                    { "test": "!@#$%^&*()lp@test.com", "expected": 400, "index": 3 }
                ]
            }
        ]
        for (let k in b) {
            i = b[k]
            for (let j of i.datasets) {
                let c = a(i.schema, j)
                if (c.code !== j.expected) {
                    let d = `Expected status ${j.expected} but received ${c.code} in [${k}]datasets[${j.index}]`
                    console.warn(d)
                    return { success: false, code: 500, error: d }
                }
            }
        }
        return { success: true, code: 200 }
    } catch (error) {
        return { success: false, code: 500, error: error }
    }
}

module.exports = {
    info, test
}