const http = require('http');
const socket_io = require('socket.io');

const ServiceManager = require('./service-manager');

class MPService {

	constructor() {
		this._serviceManager = new ServiceManager();
		this._serviceRun = false;
	}

	get serviceManager() {
		return this._serviceManager;
	}

	attach(httpServer) {
		this.http = http.Server(httpServer);
		this.io = socket_io(http);
	}

	runService(aServices) {
		if (this._serviceRun) {
			throw new Error('service may be run only once');
		}
		for (let oService of aServices) {
			this._serviceManager.plugin(oService);
		}
        this.io.on('connection', socket => {
        	console.log('connection dun client')
        	this._serviceManager.run(socket)
		});
		this._serviceRun = true;
	}
}

module.exports = MPService;
