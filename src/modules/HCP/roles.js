async function get(a) {
    let b = db.get("permissions", "roles")
    return b.find(i => parseInt(i.id) === parseInt(a))
}

async function getByName(a) {
    let b = db.get("permissions", "roles")
    return b.find(i => i.name.toLowerCase() == a.toLowerCase()) || { intents: [] }
}

async function set(a) {
    let b = db.get("permissions", "roles")
    b.push(a)
}

module.exports = {
    get, getByName, set
}