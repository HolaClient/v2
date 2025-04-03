const hc = require('./utils/hc');

(async () => {
    let appInitTime = Date.now();
    global.db = require('./modules/HCD');
    await db.init({
        path: "./storage/database",
        type: "tkv",
        compress: true
    });

    process.loadEnvFile('.env');
    global.hc = require("./utils/hc");

    let roles = db.get("permissions", "roles");;
    if (!roles) {
        roles = require("../app/seeds/roles").seed(db, hc);
    }

    await require("./lib/core/seedSettings")();
    await hc.settings.load();
    await app.sessions.load()
    app.static('/', path.join(__dirname, "../public/root"));
    app.static('/assets', path.join(__dirname, "../public"));
    app.use(app.sessions);

    hc.modules.HCF(app);

    await hc.ptl.init({
        domain: process.env.PTERODACTYL_DOMAIN,
        app: process.env.PTERODACTYL_APP_KEY,
        acc: process.env.PTERODACTYL_ACC_KEY,
    });

    async function load(route) {
        try {
            return new Promise((resolve, reject) => {
                const a = path.join(path.join(__dirname, 'routes'), route);
                fs.readdir(a, async (err, files) => {
                    if (err) {
                        System.err.println(err);
                        return reject(err);
                    }
                    for (const i of files) {
                        const b = path.join(a, i);
                        if (fs.statSync(b).isDirectory()) {
                            await load(path.join(route, i));
                        } else if (i.endsWith('.js')) {
                            const c = require(b);
                            if (typeof c === 'function') {
                                c();
                            }
                        }
                    }
                    resolve();
                });
            });
        } catch (error) {
            System.err.println(error);
            return;
        }
    }
    await load('');

    app.listen(parseInt(process.env.APP_PORT), () => {
        System.out.println(" ");
        System.out.println(chalk.gray("+") + "-".repeat(70) + chalk.gray("+"));
        let a = os.networkInterfaces();
        let b = Object.values(a)
            .flat()
            .filter(i => !i.internal && (i.family === 'IPv4' || i.family === 'IPv6'))
            .sort((a, b) => a.family === 'IPv4' ? -1 : 1)[0];

        let c = [
            ["OS", os.platform()],
            ["Memory", `v2: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}-${Math.round(os.totalmem() / 1024 / 1024 / 1024) - Math.round(os.freemem() / 1024 / 1024 / 1024)}=${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`],
            ["Node", process.version],
            ["vCPU", os.cpus()[0].model],
            ["Uptime", `${Math.floor(process.uptime())}s`],
            ["Hostname", os.hostname()],
            ["IP", b?.address],
            ["Arch", os.arch()],
            ["vCores", os.cpus().length],
            ["Network", Object.keys(a).join(", ")],
        ];
        for (let i = 0; i < c.length; i += 2) {
            let d = c[i];
            let e = c[i + 1];
            let f = 30;
            if (!d[1]) d[1] = `Offline`
            if (!e[1]) e[1] = ""
            let k = chalk.gray("|") + " ";
            let g = chalk.white("[") + chalk.cyan(d[0].padEnd(7)) + chalk.white("] ") +
                chalk.white(d[1].toString().slice(0, f - 10).padEnd(f - 10));
            let h = e ?
                chalk.white("[") + chalk.cyan(e[0].padEnd(8)) + chalk.white("] ") +
                chalk.white(e[1].toString().slice(0, f - 10).padEnd(f - 10)) : "";
            let j = (g + h).replace(/\u001b\[.*?m/g, '').length;
            k += g + h + " ".repeat(70 - j - 1) + chalk.gray("|");

            System.out.println(k);
        }
        System.out.println(chalk.gray("+") + "-".repeat(70) + chalk.gray("+"));
        fs.readFileSync("./resources/private/holaclientv2.ascii.txt", 'utf8').split(/\r?\n/).forEach((k) => {
            System.out.println(chalk.gray("|") + " ".repeat(Math.floor((70 - k.length) / 2)) + chalk.white(k) + " ".repeat(70 - k.length - Math.floor((70 - k.length) / 2)) + chalk.gray("|"));
        });
        System.out.println(chalk.gray("|") + " ".repeat(70) + chalk.gray("|"));
        System.out.println(chalk.gray("+") + "-".repeat(70) + chalk.gray("+"));
        System.out.println(`${chalk.gray("|")} ${chalk.white("[")}${chalk.cyan("Authors")}${chalk.white("]")}${chalk.white(" https://holaclient.dev/team           ")}` + " ".repeat(21) + chalk.gray("|"));
        System.out.println(`${chalk.gray("|")} ${chalk.white("[")}${chalk.cyan("Console")}${chalk.white("]")}${chalk.white(" https://console.holaclient.dev        ")}` + " ".repeat(21) + chalk.gray("|"));
        System.out.println(`${chalk.gray("|")} ${chalk.white("[")}${chalk.cyan("Discord")}${chalk.white("]")}${chalk.white(" https://discord.gg/CvqRH9TrYK         ")}` + " ".repeat(21) + chalk.gray("|"));
        System.out.println(`${chalk.gray("|")} ${chalk.white("[")}${chalk.cyan("Github ")}${chalk.white("]")}${chalk.white(" https://github.com/HolaClient/v2-mini ")}` + " ".repeat(21) + chalk.gray("|"));
        System.out.println(`${chalk.gray("|")} ${chalk.white("[")}${chalk.cyan("Website")}${chalk.white("]")}${chalk.white(" https://holaclient.dev/v2-mini        ")}` + " ".repeat(21) + chalk.gray("|"));
        System.out.println(chalk.gray("+") + "-".repeat(70) + chalk.gray("+"));
        System.out.println(" ");
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.white(" Application loaded successfully in ") + chalk.cyan(`${Date.now() - appInitTime}ms`));
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.white(" Authentication code for this session is ") + chalk.cyan(process.env.APP_CODE));
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.white(" Access application at ") + chalk.cyan(process.env.APP_URL + "/"));
    });

    let signals = ["SIGINT", "SIGTERM", "SIGUSR2", "SIGHUP", "SIGQUIT", "SIGABRT", "beforeExit", "exit"]
    signals.forEach(i => {
        process.on(i, flush);
    });

    process.on('uncaughtException', async (err) => {
        console.log(err)
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.red(` Fatal error: ${err.message}`));
        await flush();
    });

    async function flush() {
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.white(` Stopping the application...`));
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.white(` Flushing database...`));
        await db.flush();
        System.out.println(chalk.gray("{/}") + chalk.cyan(" [") + chalk.white("HC") + chalk.cyan("]") + chalk.white(` Application stopped.`));
        process.exit(0);
    }

    if (global.gc) {
        setInterval(() => { global.gc() }, 60000 * 7);
    }
})();

