const webSocket = require("./../configs/ws.handler");

exports.getUserListAction = async(req, res) => {
    try {
        const userList = [];
        const length = webSocket.socketList.length;

        for(var i = 0; i < length; i++) {
            const socket = webSocket.socketList[i];
            if(socket.ipAddress && socket.computerName) {
                userList.push({
                    computerName: socket.computerName,
                    ipAddress: socket.ipAddress,
                    country: socket.country,
                    status: 'Active',
                    lastActiveTime: socket.lastActiveTime,
                    additionalSystemDetails: 'N/A',
                })
            }
        }
        res.status(200).json({
            status: 'success',
            userList,
            length
        })
    } catch (error) {
        res.status(500).json({
            status: "server_error",
            message: error.message
        })
    }
}