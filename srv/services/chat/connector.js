import Events from 'events';
import PROTO from './protocol';
import EVENTS from './event_types';

class Connector {
    constructor({socket}) {
        this._socket = socket;
        this._userCache = {};
        this._chanCache = {};
        this._events = new Events();
        this._joinedChannels = new Set();

        /**
         * Serveur : "vous venez de rejoindre un canal"
         */
        socket.on(PROTO.MS_YOU_JOIN, channel => {
            this._events.emit(EVENTS.CHANNEL_ENTER, channel);
            this._joinedChannels.add(channel.id);
        });

        socket.on(PROTO.MS_YOU_LEAVE, async ({channel}) => {
            // remove the channel from registry
            this._joinedChannels.remove(channel);
            this._events.emit(EVENTS.CHANNEL_EXIT, {channel});
        });

        /**
         * Serveur : "un utilisateur a rejoin l'un des canaux auxquels vous êtes connecté"
         */
        socket.on(PROTO.MS_USER_JOINS, async ({user, channel}) => {
            let oUser = await this.reqUserInfo(user);
            let oChannel = await this.reqChannelInfo(channel);
            this._events.emit(EVENTS.USER_JOINED, {
                channel: oChannel,
                user: oUser,
            });
        });

        /**
         * Serveur : "un utilisateur a quitté l'un des canaux auxquels vous êtes connecté"
         */
        socket.on(PROTO.MS_USER_LEAVES, async ({user, channel}) => {
            let oUser = await this.reqUserInfo(user);
            let oChannel = await this.reqChannelInfo(channel);
            this._events.emit(EVENTS.USER_LEFT, {
                channel: oChannel,
                user: oUser
            });
        });

        /**
         * Serveur : "un utilisateur a envoyé un message de discussion sur un canal"
         */
        socket.on(PROTO.MS_USER_SAYS, async ({user, channel, message}) => {
            let oUser = await this.reqUserInfo(user);
            let oChannel = await this.reqChannelInfo(channel);
            this._events.emit(EVENTS.MESSAGE, {
                channel: oChannel,
                user: oUser,
                message
            });
        });
    }

    get events() {
        return this._events;
    }


    /**
     * Requète transmise au serveur : "Quelles sont les info relative à ce canal ?"
     * On transmet l'id du canal recherché
     * @param cid {string} id du canal
     * @returns {Promise<any>}
     */
    async reqChannelInfo(cid) {
        return new Promise(
            resolve => {
                if (cid in this._chanCache) {
                    resolve(this._chanCache[cid]);
                } else {
                    this._socket.emit(
                        PROTO.REQ_MS_CHAN_INFO,
                        {channel: cid},
                        oChannel => {
                            if (oChannel) {
                                this._chanCache[cid] = oChannel;
                            }
                            resolve(oChannel);
                        }
                    );
                }
            }
        );
    }

    /**
     * Requète transmise au serveur : "Quelles sont les info relative à cet utilisateur ?"
     * On transmet l'id de l'utilisateur recherché
     * @param uid {string} id de l'utilisateur
     * @returns {Promise<any>}
     */
    async reqUserInfo(uid) {
        return new Promise(
            resolve => {
                if (uid in this._userCache) {
                    resolve(this._userCache[uid]);
                } else {
                    this._socket.emit(
                        PROTO.REQ_MS_USER_INFO,
                        {user: uid},
                        data => {
                            if (data) {
                                this._userCache[uid] = data;
                            }
                            resolve(data);
                        }
                    );
                }
            }
        );
    }

    get joinedChannels() {
        return this._joinedChannels;
    }

    /**
     * Envoi un message de discussion sur un canal donné.
     * @param channel {String} identifiant du canal
     * @param message {string} contenu du message
     */
    say(channel, message) {
        if (this._joinedChannels.has(channel)) {
            this._socket.emit(PROTO.MS_SAY, {channel, message});
        } else {
            this.events.emit(EVENTS.ERROR, {error: "Messages can't be sent on a channel you have not joined yet. Join channel first."})
        }
    }

    leave(channel) {
        if (this._joinedChannels.has(channel)) {
            this._socket.emit(PROTO.MS_LEAVE_CHAN, {channel});
        } else {
            this.events.emit(EVENTS.ERROR, {error: "You can't leave a channel you have not joined yet"});
        }
    }

    join(channel) {
        if (!this._joinedChannels.has(channel)) {
            this._socket.emit(PROTO.MS_JOIN_CHAN, {name: channel});
        } else {
            this.events.emit(EVENTS.ERROR, {error: "You already have joined this channel"});
        }
    }
}


export default Connector;