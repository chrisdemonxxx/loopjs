const webSocket = require("./../configs/ws.handler");

exports.sendScriptToClientAction = async (req, res) => {
    try {
        const { user, type, script } = req.body;
        const SEP = 'sep-x8jmjgfmr9';

        const length = webSocket.socketList.length;
        for (var i = 0; i < length; i++) {
            const socket = webSocket.socketList[i];
            if (socket.ipAddress == user.ipAddress && socket.computerName == user.computerName) {
                const message = `FROM_SERVER${SEP}${type}${SEP}${script}`;
                console.log(message)
                socket.send(message);
            }
        }

        res.status(200).json({
            status: 'success'
        })
    } catch (error) {
        res.status(500).json({
            status: "server_error",
            message: error.message
        })
    }
}