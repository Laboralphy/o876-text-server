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
        c.type = 'permanent';
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
        if (this.txat.isUserExist(client.id)) {
            this.txat.dropUser(this.txat.getUser(client.id));
        }
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
        socket.on(PROTO.REQ_MS_CHAN_INFO, ({channel}, ack) => {
            try {
                let oChannel = this.txat.getChannel(channel);
                let oTxatUser = this.txat.getUser(client.id);
                if (oChannel && oChannel.userPresent(oTxatUser)) {
                    ack(oChannel.export())
                } else {
                    ack(null);
                }
            } catch (e) {
                console.error(e);
                socket.disconnect();
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
            try {
                let oChannel = this.txat.searchChannel(search);
                if (oChannel) {
                    ack(oChannel.export());
                } else {
                    ack(null);
                }
            } catch (e) {
                console.error(e);
                socket.disconnect();
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
        socket.on(PROTO.REQ_MS_USER_INFO, ({user}, ack) => {
            try {
                let oTxatUser = this.txat.getUser(user);
                if (oTxatUser) {
                    ack({
                        id: oTxatUser.id,
                        name: oTxatUser.name
                    })
                } else {
                    ack(null);
                }
            } catch (e) {
                console.error(e);
                socket.disconnect();
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
            try {
                let oChannel = this.txat.searchChannel(name);
                if (!oChannel) {
                    oChannel = new TinyTxat.Channel();
                    oChannel.name = name;
                    this.txat.addChannel(oChannel);
                }
                let oTxatUser = this.txat.getUser(client.id);
                oChannel.addUser(oTxatUser);
                logger.logfmt('user %s joined channel %s', oTxatUser.name, oChannel.name);
                ack(oChannel.export());
            } catch (e) {
                console.error(e);
                socket.disconnect();
            }
        });


        /**
         * ### MS_SAY
         * un utilisateur envoie un message de discussion
         * @param id {string} identifiant du canal
         * @param message {string} contenu du message
         */
        socket.on(PROTO.MS_SAY, ({channel, message}) => {
            try {
                let oUser = this.txat.getUser(client.id);
                let oChannel = this.txat.getChannel(channel);
                if (!oChannel) {
                    logger.errfmt('invalid channel : %s', channel);
                } else if (oChannel.userPresent(oUser)) {
                    logger.logfmt('[%s] %s (%s) : %s',
                        channel,
                        client.name,
                        client.id,
                        message
                    );
                    oChannel.transmitMessage(oUser, message);
                } else {
                    logger.errfmt('user %s tried to say something on a channel (%s) he/she\'s not connected to.', client.id, channel);
                }
            } catch (e) {
                console.error(e);
                socket.disconnect();
            }
        });

        /**
         * Le client veut quitter un canal auquel il est connecté
         */
        socket.on(PROTO.MS_LEAVE_CHAN, ({channel}) => {
            try {
                const oChan = this.txat.getChannel(channel);
                const oUser = this.txat.getUser(client.id);
                logger.logfmt('user %s leaves channel %s', oUser.name, oChan.name);
                oChan.dropUser(oUser);
            } catch (e) {
                console.error(e);
                socket.disconnect();
            }
        });
    }

    /**
     * Avertir un client qu'il rejoin sur un canal
     * @param client {string} identifiant du client à prévenir
     * @param channel {string} information du canal concerné {id, name, type}
     */
    send_ms_you_join(client, channel) {
        let oChannel = this.txat.getChannel(channel);
        this._emit(client, PROTO.MS_YOU_JOIN, oChannel.export());
    }

    /**
     * avertir un client de l'arrivée d'un utilisateur sur un canal
     * @param client {string} identifiant du client à prévenir
     * @param user {string} identifiant du client arrivant
     * @param channel {string} identifiant du canal concerné
     */
    send_ms_user_joins(client, user, channel) {
        let oChannel = this.txat.getChannel(channel);
        let oArriving = this.txat.getUser(user);
        if (oChannel.userPresent(oArriving)) {
            // le client appartient au canal
            this._emit(client, PROTO.MS_USER_JOINS, {user: oArriving.id, channel: oChannel.id});
        }
    }

    /**
     * Avertir un client du départ d'un autre client d'un canal
     * @param client {string} identifiant du client à prévenir
     * @param user {string} identifiant du client partant
     * @param channel {string} identifiant du canal concerné
     */
    send_ms_user_leaves(client, user, channel) {
        if (client === user) {
            this._emit(client, PROTO.MS_YOU_LEAVE, {channel});
        } else {
            this._emit(client, PROTO.MS_USER_LEAVES, {user, channel});
        }
    }

    /**
     * Transmettre le message d'un client à un autre
     * @param client {string} identifiant du client destinataire
     * @param user {string} identifiant du client expéditeur
     * @param channel {string} identifiant du canal concerné / null si c'est un message privé
     * @param message {string} contenu du message
     */
    send_ms_user_says(client, user, channel, message) {
        this._emit(client, PROTO.MS_USER_SAYS, {user, channel, message});
    }
}

module.exports = Service;