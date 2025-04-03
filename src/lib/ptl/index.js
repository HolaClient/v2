const servers = require('./app/servers')
const nodes = require('./app/nodes')
const eggs = require('./app/eggs')
const locations = require('./app/locations')
const users = require('./app/users')
let settings

module.exports = {
    "servers": {
        "get": async function (a) {
            let c = await servers.servers(settings)
            let b;
            if (typeof a == "number") {
                b = c.find(i => i.attributes.id === parseInt(a))
            } else {
                b = c.find(i => i.attributes.identifier === a)
            }
            return b ?? ""
        },
        "getAll": async function () {
            let a = await servers.servers(settings)
                await db.set("pterodactyl-servers", a)
            return a || []
        },
        "suspend": async function (a, b) {
            return await servers.suspend(settings, a, b) || { success: false, error: 0 }
        },
        "assign": async function (a, b) {
            return await servers.assign(settings, a, b) || { success: false, error: 0 }
        },
        "files": {
            "get": async function (a) {
                let b = await servers.files(settings)
                let c = b[a]
                return c ?? []
            },
            "getAll": async function () {
                let c = await servers.files(settings)
                return c || {}
            },
        },
        "console": servers.consoleWS,
        "changeState": async function (a, b) {
            return await servers.changeState(settings, a, b) || { success: false, error: 0 }
        },
        "sendCommand": async function (a, b) {
            return await servers.sendCommand(settings, a, b) || { success: false, error: 0 }
        },
        "create": async function (a, b) {
            return await servers.createServer(settings, a, b) || { success: false, error: 0 }
        },
        "delete": async function (a, b) {
            return await servers.deleteServer(settings, a, b) || { success: false, error: 0 }
        },
        "update": async function (a, b) {
            return await servers.updateServer(settings, a, b) || { success: false, error: 0 }
        }
    },
    "nodes": {
        "get": async function (a) {
            let c = await nodes.nodes(settings)
            let b = c.find(i => i.attributes.id === parseInt(a))
            return b ?? ""
        },
        "getAll": async function () {
            let a = await nodes.nodes(settings)
            return a || []
        },
        "getConfig": async function (a) {
            let c = await nodes.nodes(settings)
            let b = c.find(i => i.attributes.id === parseInt(a))
            return b.attributes.configuration ?? ""
        },
        "getSystemInfo": async function (a) {
            let c = await nodes.nodes(settings)
            let b = c.find(i => i.attributes.id === parseInt(a))
            return b.attributes.system ?? ""
        },
        "changeLocation": async function (a, b) {
            let c = await nodes.changeLocation(settings, a, b)
            return c
        },
    },
    "nests": {
        "get": async function (a) {
            let c = await eggs.eggs(settings)
            let b = c.find(i => i.attributes.id === parseInt(a))
            return b ?? ""
        },
        "getAll": async function () {
            let a = await eggs.eggs(settings)
            return a || []
        }
    },
    "eggs": {
        "get": async function (a) {
            let b = await eggs.eggs(settings)
            let d;
            b.forEach(i => {
                let c = i.attributes.relationships.eggs.data.find(j => j.attributes.id === parseInt(a))
                if (c) {
                    d = c
                    return c
                }
            });
            return d
        },
        "getAll": async function () {
            try {
                let a = await eggs.eggs(settings)
                let b = []
                for (let i of a) {
                    for (let j of i.attributes.relationships.eggs.data) {
                        b.push(j)
                    }
                }
                return b || []
            } catch (error) {
                return []
            }
        }
    },
    "nests": {
        "get": async function (a) {
            let b = await eggs.eggs(settings)
            let c = await b.find(i => i.attributes.id == a)
            return c
        },
        "getAll": async function () {
            let a = await eggs.eggs(settings)
            return a
        }
    },
    "locations": {
        "get": async function (a) {
            let b = await locations.locations()
            let c = b.find(i => i.attributes.id === parseInt(a))
            return c || ""
        },
        "getAll": async function (b) {
            let a = await locations.locations()
            let c = a.find(i => i.attributes.id === parseInt(b))
            return c.attributes.relationships.eggs.data || []
        },
        "modify": locations.modifySettings,
        "create": locations.createLocation,
        "delete": locations.deleteLocation
    },
    "users": {
        "get": async function (a) {
            let c = await users.users(settings)
            let b;
            if (typeof a == "number") {
                b = c.find(i => i.attributes.id === parseInt(a))
            } else {
                b = c.find(i => i.attributes.uuid === a)
            }
            return b ?? ""
        },
        "getAll": async function () {
            let a = await users.users(settings)
            return a || []
        },
        "create": async function (a) {
            return await users.create(settings, a) || { success: false, error: 0 }
        },
        "modify": async function (a, b) {
            return await users.modify(settings, a, b) || { success: false, error: 0 }
        },
        "delete": async function (a) {
            return await users.delete(settings, a) || { success: false, error: 0 }
        },
        "servers": async function (a) {
            let c = await users.users(settings)
            let b;
            if (typeof a == "number") {
                b = c.find(i => i.attributes.id === parseInt(a))
            } else {
                b = c.find(i => i.attributes.uuid === a)
            }
            return b.attributes.relationships.servers.data ?? ""
        },
    },
    "refresh": {
        "all": function () {
            servers.servers(settings),
                locations.locations(settings),
                users.users(settings),
                nodes.nodes(settings),
                eggs.eggs(settings)
        },
        "servers": servers.servers(settings),
        "locations": locations.locations(settings),
        "users": users.users(settings),
        "nodes": nodes.nodes(settings),
        "eggs": eggs.eggs(settings),
    },
    "config": {
        "get": settings || {},
        "set": function (a) {
            settings = a
            return { success: true, code: 200 }
        }
    },
    "manifest": require('./manifest.json')
}