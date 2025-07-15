/*
Dear programmer,
When I wrote this code, only God and I understood what I did.
Now, only God knows.
You are welcome to contribute to this project.
May the force be with you.
If you have any questions, please don't contact me.
Do not try to optimize or refactor this code, it'll surely fail.
I'm sorry for the mess.
Good luck.

Total hours wasted: 17,534 hours
*/

let fs = require('fs');
let path = require('path');
let os = require('os');
let hc = {
    crypt: require("./src/modules/HCU/secrets")
};
global.System = { out: { println: console.log, flush: console.clear }, err: { println: console.error } };
let chalk = require("./src/modules/HCU/colors")
let { execSync } = require('child_process');
let appInitTime = Date.now();
let appLastTime = appInitTime;

System.out.flush();
System.out.println(chalk.gray(`Platform: ${chalk.white(process.platform)}\n${chalk.gray("Architecture:")} ${chalk.white(process.arch)}\n${chalk.gray("NodeJS:")} ${chalk.white(process.versions.node)}`))
System.out.println(" ");
System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Initializing...`));

if (!fs.existsSync('.env')) {
    fs.copyFile(path.join(__dirname, 'app', 'config', '.env'), path.join(__dirname, '.env'), (err) => {
        System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Generating environment file... [${getTime()}ms]`))
        if (err) {
            System.out.println('Error creating .env file:', err);
        }
    });
}

System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Loading environment file... [${getTime()}ms]`));
process.loadEnvFile('.env');

function getTime() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - appLastTime;
    appLastTime = currentTime;
    return elapsedTime;
}

System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Checking environment flags... [${getTime()}ms]`))
let args = process.argv.slice(2);
let dev = args.includes("--dev")
let prod = args.includes("--prod")
if (dev) {
    process.env.APP_ENV = 'development';
} else if (prod) {
    process.env.APP_ENV = 'production';
} else if (dev && prod) {
    System.out.println("Error: You can't use both --dev and --prod flags at the same time, defaulting to production mode!");
    process.env.APP_ENV = 'production'
} else {
    System.out.println("Error: No app env mode selected, defaulting to production mode!");
    process.env.APP_ENV = 'production'
}
/**
 *--------------------------------------------------------------------------
 * Generating secrets
 *--------------------------------------------------------------------------
*/
System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Loading and refreshing secrets... [${getTime()}ms]`))
const a = path.resolve(__dirname, ".env");
const b = () => fs.readFileSync(a, "utf-8").split(os.EOL);
const c = (key, value) => {
    const d = b();
    const e = d.find((e) => e.split("=")[0] == key);
    if (e !== undefined) {
        const f = d.indexOf(e);
        d.splice(f, 1, `${key}=${value}`);
    } else {
        d.push(`${key}=${value}`);
    }
    fs.writeFileSync(a, d.join(os.EOL));
};
if (!process.env.APP_KEY || process.env.APP_KEY == "random") { c('APP_KEY', hc.crypt.base64(64)) };
if (!process.env.APP_HMAC || process.env.APP_HMAC == "random") { c('APP_HMAC', hc.crypt.base64(64)) };
if (!process.env.APP_SECRET || process.env.APP_SECRET == "random") { c('APP_SECRET', hc.crypt.base64(64)) };
if (!process.env.APP_CODE || process.env.APP_CODE == "random") { c('APP_CODE', hc.crypt.gen(62, 12)) };
if (process.env.APP_ENV == "production") { c('APP_CODE', hc.crypt.gen(62, 12)) };
/**
 *--------------------------------------------------------------------------
 * Creating directories if doesn't exists
 *--------------------------------------------------------------------------
*/
System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Checking directories... [${getTime()}ms]`))
const d = [
    "storage",
    "storage/backups",
    "storage/cache",
    "storage/config",
    "storage/database",
    "storage/logs",
    "storage/logs/api",
    "storage/logs/app",
    "storage/logs/http",
    "storage/static",
    "storage/updates"
];
d.forEach(i => {
    const e = path.resolve(__dirname, i);
    if (!fs.existsSync(e)) {
        fs.mkdirSync(e, { recursive: true });
    }
});
/**
 *--------------------------------------------------------------------------
 * Killing all processes running on the designated port for this application
 *--------------------------------------------------------------------------
*/
async function terminateExistingInstances(g) {
    try {
        let f = os.platform();
        if (f === 'linux') {
            const h = execSync(`lsof -i :${g} -t`).toString();
            const j = [...new Set(h.split('\n').filter(Boolean))];
            if (j.length > 0) {
                execSync(`kill -9 ${j.join(' ')}`);
            }
        } else if (f === 'win32') {
            const h = execSync(`netstat -ano | findstr :${g}`).toString();
            const j = [...new Set(h.split('\n')
                .filter(i => i.includes(`:${g}`))
                .map(i => i.trim().split(/\s+/).pop())
                .filter(Boolean))];

            if (j.length > 0) {
                j.forEach(i => {
                    if (parseInt(i) !== 0) {
                        execSync(`taskkill /F /PID ${i}`);
                    }
                });
            }
        }
    } catch (error) {

    }
}
/**
 *--------------------------------------------------------------------------
 * Starting the application loader...
 *--------------------------------------------------------------------------
*/
async function main() {
    try {
        //await require("./app/scripts/prequisites")();
        terminateExistingInstances(process.env.APP_PORT);
        System.out.println(chalk.brightCyan("+ ") + chalk.gray(`Loading application... [${getTime()}ms]`))
        require("./src/app")
        if (process.env.APP_ENV == "development") {
            let { spawn } = require('child_process');
            const twBuild = spawn('npx concurrently "npm run build:tw:dev"', {
                stdio: 'inherit',
                shell: true
            });
            twBuild.on('error', (err) => {
                console.error('Failed to start subprocess.', err);
            });
            twBuild.on('close', (code) => {
                console.log(`Child process exited with code ${code}`);
            });
        }
    } catch (error) {
        System.err.println(error)
    }
};
main()
/**
 *--------------------------------------------------------------------------
 * End of the file
 *--------------------------------------------------------------------------
*/
