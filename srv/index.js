const express = require('express');
const path = require('path');

const WSService = require('../libs/wsservice');
const logger = require('../libs/logger');

const ServiceLogin = require('./services/login/service');
const ServiceChat = require('./services/chat/service');
// const ServiceCommand = require('./services/command/service');

const ROOT_PATH = path.resolve(__dirname, '..');
const PUBLIC_PATH = path.join(ROOT_PATH, 'public');
const DIST_PATH = path.join(ROOT_PATH, 'dist');

logger.log('creating server instance');
const wss = new WSService();

/**
 * inits the dist sub service
 * provides access to all packed scripts inside the DIST folder
 */
function initRoutes() {
    logger.log('defining routes');
    wss.express.use('/dist', express.static(path.join(DIST_PATH)));
    wss.express.use('/', express.static(PUBLIC_PATH));
}

function runService() {
    initRoutes();
    wss.service(new ServiceLogin());
    wss.service(new ServiceChat());
    // wss.service(new ServiceCommand());
    return wss.listen(8080);
}

runService().then(() => logger.log('listening on port 8080'));
