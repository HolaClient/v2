const fs = require("fs"),
crypto = require('crypto');
    path = require("path");

let hashes = [
    "67DC8DA2A8E1F3777643C547D2C01967",
    "2A604DF425E838F383A9024FB46586AD",
    "85DD5BC9EC399C15E8EA2617F7D91702",
    "1DDDB75BE530B1AB9D578D8C8150421B"
]
module.exports = async () => {
    const e = `${process.platform}_${process.arch}_${process.versions.modules}.node`,
        s = path.resolve(`./src/modules/HCW/bin/${e}`);
        console.log(e)
    if (fs.existsSync(s)) return;
    const r = `https://cdn.holaclient.dev/binaries/ws/${e}`;
    try {
        const e = await fetch(r, {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            },
        });
        if (!e.ok)
            throw new Error(
                `Error downloading the file: ${e.status} ${e.statusText}`
            );
        const t = path.dirname(s);
        fs.existsSync(t) || fs.mkdirSync(t, { recursive: !0 });
        const o = await e.arrayBuffer();
        const buffer = Buffer.from(o);
        const MD5 = crypto.createHash('md5').update(buffer).digest('hex').toUpperCase();
        if (!hashes.includes(MD5)) {
            throw new Error(`File integrity check failed. MD5 hash: ${md5Hash} not in allowed list.`);
        }
        fs.writeFileSync(s, buffer);
    } catch (e) { }
};