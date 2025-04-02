async function JSON(req, res, a, b, c, d) {
    try {
        if (c && a == true) {
            return res.json({ success: a, code: d ?? 200, message: alert(b, req, res), data: c });
        } else if (c) {
            return res.json({ success: a, code: d ?? 200, message: alert(b, req, res) + c });
        } else { return res.json({ success: a, code: d ?? 200, message: alert(b, req, res) }) };
    } catch (error) {
        System.err.println(error)
    }
};

let internal = {
    "success": function (a) {
        return { success: true, code: 200, data: a }
    },
    "error": function (a) {
        return { success: false, code: 500, error: a }
    },
    "unauthorized": function (a) {
        return { success: false, code: 401 }
    },
    "forbidden": function () {
        return { success: false, code: 403 }
    },
    "notfound": function () {
        return { success: false, code: 404 }
    },
    "settingsSaved": function (message) {
        return { success: true, code: 200, message: message || "Settings saved successfully" }
    },
    "settingsError": function (message) {
        return { success: false, code: 400, message: message || "Error saving settings" }
    }
}

module.exports = {
    JSON, internal
}