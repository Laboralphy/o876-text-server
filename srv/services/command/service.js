const ServiceAbstract = require('../../../libs/wsservice/service-manager/ServiceAbstract');
const PROTO = require('./protocol');

class Service extends ServiceAbstract {
    constructor() {
        super();
    }

    connectClient(client) {
        super.connectClient(client);
        let socket = client.socket;
        socket.on(PROTO.COMMAND, ({command, parameters}) => {

        });
    }
}

module.exports = Service;