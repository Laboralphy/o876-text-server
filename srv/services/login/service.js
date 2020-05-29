const ServiceAbstract = require('../../../libs/wsservice/service-manager/ServiceAbstract');
const logger = require('../../../libs/logger');
const STATUS = require('../../consts/status');
const PROTO = require('./protocol');

class ServiceLogin extends ServiceAbstract {
    constructor() {
        super();
        this._connectedUser = new Set();
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
            // clinet déja en cours d'indentification -> dehors
            if (client.status === STATUS.CONNECTING) {
                socket.disconnect();
            }
            logger.logfmt('Incoming new user %s', name);
            // si le client est déja identifié...
            if (client.status === STATUS.IDENTIFIED) {
                ack({id: client.id});
                return;
            }
            client.status = STATUS.CONNECTING;
            client.name = name;
            client.id = socket.client.id;
            if (name !== pass) {
                logger.logfmt(name , pass, name !== pass);
                logger.logfmt('user %s (%s) access denied. %d attempt(s) left.', client.id, client.name, --client.connectionAttempts);
                if (client.connectionAttempts <= 0) {
                    ack({id: null});
                    socket.disconnect();
                } else {
                    logger.logfmt('wrong user/pass');
                    client.status = STATUS.UNIDENTIFIED;
                    ack({id: null});
                }
            } else {
                logger.logfmt('user %s (%s) access granted', client.id, client.name);
                this._broadcast('client-login', {client});
                client.status = STATUS.IDENTIFIED;
                ack({id: client.id});
            }
        });
    }
}

module.exports = ServiceLogin;