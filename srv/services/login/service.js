const ServiceAbstract = require('../../../libs/wsservice/service-manager/ServiceAbstract');
const logger = require('../../../libs/logger');
const STATUS = require('../../consts/status');
const PROTO = require('./protocol');

class ServiceLogin extends ServiceAbstract {
    constructor() {
        super();
    }

    /**
     *
     * @param client {Client}
     */
    connectClient(client) {
        super.connectClient(client);
        let socket = client.socket;

        /**
         * ### REQ_LOGIN
         * Un client souhaite s'identifier après s'etre connecté.
         * Il doit transmettre son nom et son mot de passe.
         * Le serveur retransmet immédiatement un identifiant client si l'identification réussit
         * si l'identification échoue, le serveur renvoie {id: null}
         * @param name {string} nom du client
         * @param pass {string} mot de passe du client
         * @param ack {Function}
         */
        socket.on(PROTO.REQ_LOGIN, ({name, pass}, ack) => {
            // si le client est déja identifié...
            if (client.status !== STATUS.UNIDENTIFIED) {
                throw new Error('Invalid login request : client "' + client.id + '" (name "' + client.name + '") is already identified !');
            }
            if (name.length > 2) {
                client.name = name;
                client.id = socket.client.id;
                logger.logfmt('user %s (%s) access granted', client.id, client.name);
                this._broadcast('client-login', {client});
                ack({id: client.id});
            } else {
                logger.logfmt('user %s (%s) access denied', client.id, client.name);
                client.id = null;
                ack({id: null});
            }
        });
    }
}

module.exports = ServiceLogin;