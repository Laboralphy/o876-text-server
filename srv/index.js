const express = require('express');
const path = require('path');
const httpServer = express();

const WSService = require('../libs/wsservice');
const logger = require('../libs/logger');

const ServiceLogin = require('./services/login/service');
const ServiceChat = require('./services/chat/service');

const ROOT_PATH = path.resolve(__dirname, '..');
const PUBLIC_PATH = path.join(ROOT_PATH, 'public');
const DIST_PATH = path.join(ROOT_PATH, 'dist');

const wss = new WSService();

/**
 * inits the dist sub service
 * provides access to all packed scripts inside the DIST folder
 */
function initRoutes() {
    httpServer.use('/dist', express.static(path.join(DIST_PATH)));
    httpServer.use('/styles', express.static(path.join(PUBLIC_PATH, 'styles')));
    httpServer.use('/webfonts', express.static(path.join(PUBLIC_PATH, 'webfonts')));
    httpServer.get('/', (req, res) => {
        res.redirect(301, '/index.html');
    });
    httpServer.get('/index.html', (req, res) => {
        res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
    });
}

function runService() {
    initRoutes();
    wss.attach(httpServer);
    wss.runService([
        new ServiceLogin(),
        new ServiceChat(),
    ]);
    httpServer.listen(8080);
    logger.log('listening on port 8080');
}

runService();