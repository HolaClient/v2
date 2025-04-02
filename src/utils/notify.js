async function send(a, b, c, d) {
    let notifications = db.get("notifications", a) || []
    notifications.push({
        id: hc.crypt.gen(62, 8),
        title: b,
        body: c,
        date: parseInt(d) ?? Date.now()
    });
    return { success: true, code: 200 }
}

module.exports = send