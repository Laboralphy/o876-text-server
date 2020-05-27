const ServiceAbstract = require('../../../libs/wsservice/service-manager/ServiceAbstract');
const TinyTxat = require('../../../libs/tiny-txat');
const logger = require('../../../libs/logger');
const PROTO = require('./protocol');

class Service extends ServiceAbstract {


    constructor() {
        super();
        this.txat = new TinyTxat.System();
        this.txat.on('user-joins', ({to, user, channel}) => {
            to === user ? this.send_ms_you_join(to, channel) : this.send_ms_user_joins(to, user, channel)
        });
        this.txat.on('user-leaves', ({to, user, channel}) => this.send_ms_user_leaves(to, user, channel));
        this.txat.on('user-message', ({to, user, channel, message}) => this.send_ms_user_says(to, user, channel, message));
        let c;

        c = new TinyTxat.Channel();
        c.id = 1;
        c.name = 'system';
        c.type = 'system';
        this.txat.addChannel(c);

        c = new TinyTxat.Channel();
        c.id = 2;
        c.name = 'public';
        c.type = 'public';
        this.txat.addChannel(c);


        this.events.on('client-login', ({client}) => {
            // ajouter le client au canal public
            let oTxatUser = new TinyTxat.User(client); // {id, name}
            this.txat.addUser(oTxatUser);
            let oChannel = this.txat.getChannel(2);
            oChannel.addUser(oTxatUser);
        });
    }

    disconnectClient(client) {
        this.txat.dropUser(this.txat.getUser(client.id));
    }

    /**
     * ajout d'un client
     */
    connectClient(client) {
        super.connectClient(client);
        let socket = client.socket;
        /**
         * ### REQ_CHAN_INFO
         * Un client souhaite obtenir des information sur un canal.
         * le client fournit l'identifiant, le serveur renvoie par une structure décrivant le canal
         * un coupe circuit intervient pour toute connexion non identifiée
         * @param id {string} identifiant du canal
         * @param ack {function}
         */
        socket.on(PROTO.REQ_MS_CHAN_INFO, ({cid}, ack) => {
            if (client.id) {
                let oChannel = this.txat.getChannel(cid);
                let oTxatUser = this.txat.getUser(client.id);
                if (oChannel && oChannel.userPresent(oTxatUser)) {
                    ack({
                        cid: oChannel.id(),
                        name: oChannel.name(),
                        type: oChannel.type(),
                        users: oChannel.users().map(u => ({
                            id: u.id,
                            name: u.name
                        }))
                    })
                } else {
                    ack(null);
                }
            } else {
                socket.close();
            }
        });

        /**
         * ### REQ_MS_FIND_CHAN
         * Un client recherche l'identifiant d'un canal dont il fournit le nom
         * un coupe circuit intervient pour toute connexion non identifiée
         * @param search {string} nom du canal recherché
         * @param ack {function}
         */
        socket.on(PROTO.REQ_MS_FIND_CHAN, ({search}, ack) => {
            if (client.id) {
                let oChannel = this.txat.searchChannel(search);
                if (oChannel) {
                    ack({
                        cid: oChannel.id(),
                        name: oChannel.name(),
                        type: oChannel.type()
                    });
                } else {
                    ack(null);
                }
            } else {
                socket.close();
            }
        });


        /**
         * ### REQ_USER_INFO
         * Un client souhaite obtenir des informations sur un utilisateur.
         * le client fournit l'identifiant, le serveur renvoie par une structure décrivant l'utilisateur
         * si l'identifiant ne correspind à rien, kick
         * @param id {string} identifiant du user
         * @param ack
         */
        socket.on(PROTO.REQ_MS_USER_INFO, ({uid}, ack) => {
            if (client.id) {
                let oTxatUser = this.txat.getUser(uid);
                if (oTxatUser) {
                    ack({
                        uid: oTxatUser.id(),
                        name: oTxatUser.name()
                    })
                } else {
                    ack(null);
                }
            } else {
                socket.close();
            }
        });


        /**
         * ### REQ_MS_JOIN_CHAN
         * Un client veut rejoindre un cannal, le client ne spécifie que le nom symbolique du canal
         * un coupe circuit intervient pour toute connexion non identifiée
         * @param id {string} id du canal recherché
         * @param ack {function}
         */
        socket.on(PROTO.REQ_MS_JOIN_CHAN, ({name}, ack) => {
            if (client.id) {
                let oChannel = this.txat.searchChannel(name);
                if (!oChannel) {
                    oChannel = new TinyTxat.Channel();
                    oChannel.name(name);
                    this.txat.addChannel(oChannel);
                }
                let oTxatUser = this.txat.getUser(client.id);
                oChannel.addUser(oTxatUser);
                logger.logfmt('user %s joined channel %s', oTxatUser.name(), oChannel.name());
                ack({
                    cid: oChannel.id,
                    name: oChannel.name
                });
            } else {
                socket.close();
            }
        });


        /**
         * ### MS_SAY
         * un utilisateur envoie un message de discussion
         * @param id {string} identifiant du canal
         * @param message {string} contenu du message
         */
        socket.on(PROTO.MS_SAY, ({cid, message}) => {
            if (client.id) {
                let oUser = this.txat.getUser(client.id);
                let oChannel = this.txat.getChannel(cid);
                if (!oChannel) {
                    logger.errfmt('invalid channel : %s', cid);
                } else if (oChannel.userPresent(oUser)) {
                    logger.logfmt('[%s] %s (%s) : %s',
                        cid,
                        client.name,
                        client.id,
                        message
                    );
                    oChannel.transmitMessage(oUser, message);
                } else {
                    logger.errfmt('user %s tried to say something on a channel (%s) he/she\'s not connected to.', client.id, cid);
                }
            } else {
                socket.close();
            }
        });

        /**
         * Le client veut quitter un canal auquel il est connecté
         */
        socket.on(PROTO.MS_LEAVE_CHAN, ({cid}) => {
            if (client.id) {
                const oChan = this.txat.getChannel(cid);
                if (oChan) {
                    oChan.dropUser(client.id);
                }
            } else {
                socket.close();
            }
        });
    }

    /**
     * Avertir un client qu'il rejoin sur un canal
     * @param uid {string} identifiant du client à prévenir
     * @param cid {string} information du canal concerné {id, name, type}
     */
    send_ms_you_join(uid, cid) {
        let oChannel = this.txat.getChannel(cid);
        this._emit(uid, PROTO.MS_YOU_JOIN, {
            cid: oChannel.id(),
            name: oChannel.name(),
            type: oChannel.type()
        });
    }

    /**
     * avertir un client de l'arrivée d'un utilisateur sur un canal
     * @param uid {string} identifiant du client à prévenir
     * @param auid {string} identifiant du client arrivant
     * @param cid {string} identifiant du canal concerné
     */
    send_ms_user_joins(uid, auid, cid) {
        let oChannel = this.txat.getChannel(cid);
        let oArriving = this.txat.getUser(auid);
        if (oChannel.userPresent(oClient)) {
            // le client appartient au canal
            this._emit(uid, PROTO.MS_USER_JOINS, {uid: oArriving.id, cid: oChannel.id});
        }
    }

    /**
     * Avertir un client du départ d'un autre client d'un canal
     * @param client {string} identifiant du client à prévenir
     * @param uid {string} identifiant du client partant
     * @param cid {string} identifiant du canal concerné
     */
    send_ms_user_leaves(client, uid, cid) {
        this._emit(client, PROTO.MS_USER_LEAVES, {uid, cid});
    }

    /**
     * Transmettre le message d'un client à un autre
     * @param client {string} identifiant du client destinataire
     * @param uid {string} identifiant du client expéditeur
     * @param cid {string} identifiant du canal concerné / null si c'est un message privé
     * @param message {string} contenu du message
     */
    send_ms_user_says(client, uid, cid, message) {
        this._emit(client, PROTO.MS_USER_SAYS, {uid, cid, message});
    }
}

module.exports = Service;