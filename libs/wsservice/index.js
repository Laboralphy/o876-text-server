const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const ServiceManager = require('./service-manager');

class MPService {

	constructor() {
		this._serviceManager = new ServiceManager();
		this._expressInstance = express();
		this._httpServer = http.createServer(this._expressInstance);
	}

	get serviceManager() {
		return this._serviceManager;
	}

	service(oService) {
		this._serviceManager.service(oService);
	}

	get express() {
		return this._expressInstance;
	}

	listen(nPort) {
		return new Promise(resolve => {
			this._io = socket_io(this._httpServer);
			this._io.on('connection', socket => {
				this._serviceManager.run(socket);
			});
			this._httpServer.listen(nPort, () => {
				resolve();
			});
		})
	}
}

module.exports = MPService;
