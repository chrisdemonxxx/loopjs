const pty = require('node-pty');
const os = require('os');

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

module.exports = function terminalWsHandler(ws, uuid) {
    console.log(`Terminal WebSocket connection established for client ${uuid}`);

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME || process.cwd(), // Fallback to process.cwd()
        env: process.env
    });

    // Pipe data from pty to WebSocket
    ptyProcess.onData(data => {
        try {
            // Send as a message with type 'data'
            ws.send(JSON.stringify({ type: 'data', data }));
        } catch (e) {
            console.error("Error sending data to WebSocket:", e);
        }
    });

    // Pipe data from WebSocket to pty
    ws.on('message', message => {
        let parsedMessage;
        try {
            // All incoming messages should be JSON
            parsedMessage = JSON.parse(message);
        } catch (e) {
            console.error("Failed to parse incoming WebSocket message:", message);
            return;
        }

        if (parsedMessage.type === 'resize' && parsedMessage.cols && parsedMessage.rows) {
            // Handle terminal resize
            console.log(`Resizing terminal for ${uuid} to ${parsedMessage.cols}x${parsedMessage.rows}`);
            ptyProcess.resize(parsedMessage.cols, parsedMessage.rows);
        } else if (parsedMessage.type === 'data') {
            // Handle incoming data (user input)
            ptyProcess.write(parsedMessage.data);
        }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`PTY process for ${uuid} exited with code ${exitCode}, signal ${signal}`);
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'exit', message: 'Terminal session ended.' }));
            ws.close();
        }
    });

    ws.on('close', () => {
        console.log(`Terminal WebSocket connection closed for client ${uuid}`);
        ptyProcess.kill();
    });

    ws.on('error', (err) => {
        console.error(`WebSocket error for ${uuid}:`, err);
        ptyProcess.kill();
    });
};
