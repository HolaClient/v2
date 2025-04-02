function get(email) {
    let users = db.get("permissions", "users");
    let user = users.find(u => u.email === email);
    if (user) {
        return user;
    } else {
        return null;
    }
}

module.exports = {
    get
}