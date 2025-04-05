let intents = {
    "user": [
        "hc.roles.guest"
    ],
    "mod": [
        "hc.roles.user"
    ],
    "admin": [
        "hc.roles.mod"
    ]
}
let status = false
function seed() {
    return
}

function get(a) {
    if (status === false) build()
    return intents[a]
}

function build() {
    let user = {
        pages: ["home", "dashboard", "servers.*", "economy.*", "account.*", "notifications.*", "requests.*", "market.*", "chat.*", "deploy.*"]
    }
    let mod = {
        pages: ["home", "statistics.*", "servers.*", "users.*", "posts.*", "alerts.*", "locales.*"]
    }
    let admin = {
        pages: ["logs.*", "console.*", "wcli.*", "settings.*", "templates.*"]
    }
    for (let i of user.pages) {
        intents.user.push(`hc.pages.${i}`)
    }
    for (let i of mod.pages) {
        intents.mod.push(`hc.pages.admin.${i}`)
    }
    for (let i of admin.pages) {
        intents.admin.push(`hc.pages.admin.${i}`)
    }
    status = true
}

module.exports = { seed, get }