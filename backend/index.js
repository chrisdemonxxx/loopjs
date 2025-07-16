const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const compression = require('compression');
const appRoute = require("./routes");
const webSocket = require('./configs/ws.handler');

// Initialize dotenv
dotenv.config();
const port = process.env.APP_PORT || 8080;

// Initialize express
const app = express();

app.use(morgan('tiny'));
app.use(
    cors({
        origin: '*',
        credentials: true,
    })
);
app.options('*', cors());
const server = http.createServer(app);
webSocket.initWebSocketServer(server);

// Setup body parsers
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Windows System Management & Deployment Tool',
    });
});

app.use('/api/v1', appRoute);

// Start the server
server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});