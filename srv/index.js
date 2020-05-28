const express = require('express');
const path = require('path');

const WSService = require('../libs/wsservice');
const logger = require('../libs/logger');

const ServiceLogin = require('./services/login/service');
const ServiceChat = require('./services/chat/service');

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
    /*
    wss.express.use('/dist', express.static(path.join(DIST_PATH)));
    wss.express.use('/styles', express.static(path.join(PUBLIC_PATH, 'styles')));
    wss.express.use('/webfonts', express.static(path.join(PUBLIC_PATH, 'webfonts')));
    wss.express.get('/', (req, res) => {
        res.redirect('/index.htmlx', 301);
    });
    wss.express.get('/index.html', (req, res) => {
        res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
    });*/
    wss.express.use('/dist', express.static(path.join(DIST_PATH)));
    wss.express.use('/public', express.static(PUBLIC_PATH));
}

function runService() {
    initRoutes();
    wss.service(new ServiceLogin());
    wss.service(new ServiceChat());
    return wss.listen(8080);
}

runService().then(() => logger.log('listening on port 8080'));