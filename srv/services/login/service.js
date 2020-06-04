const ServiceAbstract = require('../../../libs/wsservice/service-manager/ServiceAbstract');
const logger = require('../../../libs/logger');
const STATUS = require('./consts/status');
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

        client.data.login = {
            name: '',
            status: STATUS.UNIDENTIFIED,
            connectionAttempts: 3
        };

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
            if (client.data.login.status === STATUS.CONNECTING) {
                socket.disconnect();
            }
            logger.logfmt('Incoming new user %s', name);
            // si le client est déja identifié...
            if (client.data.login.status === STATUS.IDENTIFIED) {
                ack({id: client.id});
                return;
            }
            client.data.login.status = STATUS.CONNECTING;
            client.data.login.name = name;
            client.id = socket.client.id;
            if (name !== pass) {
                logger.logfmt(name , pass, name !== pass);
                logger.logfmt('user %s (%s) access denied. %d attempt(s) left.', client.id, client.data.login.name, --client.data.login.connectionAttempts);
                if (client.data.login.connectionAttempts <= 0) {
                    ack({id: null});
                    socket.disconnect();
                } else {
                    logger.logfmt('wrong user/pass');
                    client.data.login.status = STATUS.UNIDENTIFIED;
                    ack({id: null});
                }
            } else {
                logger.logfmt('user %s (%s) access granted', client.id, client.data.login.name);
                this.serviceBroadcast('client-login', {client});
                client.data.login.status = STATUS.IDENTIFIED;
                ack({id: client.id});
            }
        });
    }
}

module.exports = ServiceLogin;