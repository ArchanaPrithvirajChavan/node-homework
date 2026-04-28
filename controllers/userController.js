const { StatusCodes } = require("http-status-codes");

function register(req, res) {
    if (!global.users) global.users = [];

    const newUser = { ...req.body };

    global.users.push(newUser);
    global.user_id = newUser.email;
    console.log(newUser); // debug
    return res.status(StatusCodes.CREATED).json({
        message: "User registered successfully",
        user: newUser
    });
}

function logon(req, res) {
    const users = global.users || [];

    const user = users.find(
        u => u.email === req.body.email && u.password === req.body.password
    );

    if (user) {
        global.user_id = user.email;

        return res.status(StatusCodes.OK).json({
            name: user.name
        });
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "wrong userid or password"
    });
}

function logoff(req, res) {
    global.user_id = null;

    return res.status(200).json({
        message: "Logged off successfully"
    });
}

module.exports = { register, logon, logoff };