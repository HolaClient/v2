module.exports.seed = function (db, hc) {
    let roles = [
        {
            "id": hc.secrets.gen(10, 8),
            "name": "Guest",
            "intents": [
                "hc.pages.landing.*",
                "hc.pages.auth.*"
            ],
            "level": 0
        },
        {
            "id": hc.secrets.gen(10, 8),
            "name": "User",
            "intents": require("./intents").get("user"),
            "level": 1
        },
        {
            "id": hc.secrets.gen(10, 8),
            "name": "Mod",
            "intents": require("./intents").get("mod"),
            "level": 100
        },
        {
            "id": hc.secrets.gen(10, 8),
            "name": "Admin",
            "intents": require("./intents").get("admin"),
            "level": 200
        },
        {
            "id": hc.secrets.gen(10, 8),
            "name": "Owner",
            "intents": ["hc.*"],
            "level": 1000
        }
    ]
    db.set("permissions", "roles", roles)
    return
}