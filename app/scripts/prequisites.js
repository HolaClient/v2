const fs = require("fs"),
    path = require("path");
module.exports = async () => {
    const e = `${process.platform}_${process.arch}_${process.versions.modules}.node`,
        s = path.resolve(`./src/modules/HCW/bin/${e}`);
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
        fs.writeFileSync(s, Buffer.from(o));
    } catch (e) { }
};
