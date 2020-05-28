import Events from 'events';
import PROTO from './protocol';

class Connector {
    constructor({socket}) {
        this._socket = socket;
        this._userCache = {};
        this._chanCache = {};
        this._events = new Events();
        this._chanRegistry = [];

        /**
         * Serveur : "vous venez de rejoindre un canal"
         */
        socket.on(PROTO.MS_YOU_JOIN, async ({id, name}) => {
            let oChannel = await this.req_chan_info(id);
            if (oChannel) {
                this._events.emit('you.joined', {channel: oChannel});
                if (this._chanRegistry.indexOf(oChannel) < 0) {
                    this._chanRegistry.push(oChannel);
                }
            }
        });

        socket.on(PROTO.MS_YOU_LEAVE, async ({channel}) => {
            // remove the channel from registry
            console.log('leaving channel', channel);
            let oChannel = this
                ._chanRegistry
                .find(c => c.id === channel);
            if (!!oChannel) {
                this._events.emit('you.left', {channel: oChannel});
                this._chanRegistry.splice(this._chanRegistry.indexOf(oChannel), 1);
            } else {
                console.error('cannot find channel', channel);
            }
        });

        /**
         * Serveur : "un utilisateur a rejoin l'un des canaux auxquels vous êtes connecté"
         */
        socket.on(PROTO.MS_USER_JOINS, async ({user, channel}) => {
            let oUser = await this.req_user_info(user);
            let oChannel = await this.req_chan_info(channel);
            this._events.emit('user.joined', {
                channel: oChannel,
                user: oUser,
            });
        });

        /**
         * Serveur : "un utilisateur a quitté l'un des canaux auxquels vous êtes connecté"
         */
        socket.on(PROTO.MS_USER_LEAVES, async ({user, channel}) => {
            let oUser = await this.req_user_info(user);
            let oChannel = await this.req_chan_info(channel);
            this._events.emit('user.left', {
                channel: oChannel,
                user: oUser
            });
        });

        /**
         * Serveur : "un utilisateur a envoyé un message de discussion sur un canal"
         */
        socket.on(PROTO.MS_USER_SAYS, async ({user, channel, message}) => {
            let oUser = await this.req_user_info(user);
            let oChannel = await this.req_chan_info(channel);
            this._events.emit('message', {
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
     * list of joined channels
     * @return {[]|*[]}
     */
    get channels() {
        return this._chanRegistry;
    }


    /**
     * Requète transmise au serveur : "Quelles sont les info relative à ce canal ?"
     * On transmet l'id du canal recherché
     * @param cid {string} id du canal
     * @returns {Promise<any>}
     */
    async req_chan_info(cid) {
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
                                // il n'y a pas de registre de canaux dans le state
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
    async req_user_info(uid) {
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


    /**
     * Envoi un message de discussion sur un canal donné.
     * @param cid {String} identifiant du canal
     * @param message {string} contenu du message
     */
    send_say(cid, message) {
        this._socket.emit(PROTO.MS_SAY, {channel: cid, message});
    }

    send_leave_chan(cid) {
        this._socket.emit(PROTO.MS_LEAVE_CHAN, {channel: cid});
    }

    req_join_chan(name) {
        return new Promise(resolve => {
            this._socket.emit(PROTO.REQ_MS_JOIN_CHAN,
                {name},
                oChannel => {
                    resolve(oChannel);
                });
        });
    }
}


export default Connector;