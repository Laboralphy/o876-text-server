import AbstractHandler from './AbstractHandler';
import CHAT_EVENTS from "../../../../srv/services/chat/event_types";
import ChatConnector from "../../../../srv/services/chat/connector";
import term_api from "../api/term";

class ChatHandler extends AbstractHandler {
    init () {
        this._connector = new ChatConnector({socket: this.socket});
        this._term = term_api(this.store);

        this._connector.events.on(CHAT_EVENTS.ERROR, ({error}) => {
            this._term.print(null, "*ERROR*", error);
        });

        /**
         * Un message de discussion public vient d'arriver à destination du client local
         * Affichage du message dans le terminal sur l'écran correspondant
         */
        this._connector.events.on(CHAT_EVENTS.MESSAGE, ({channel, user, message}) => {
            this._term.print(channel.id, user.name + ':', message);
        });

        /**
         * Le client local vient de rejoindre un canal de discussion
         * Création d'un nouvel écran attaché à ce canal
         * Affichage du message de bienvenue
         */
        this._connector.events.on(CHAT_EVENTS.CHANNEL_ENTER, ({id, name}) => {
            this._term.create(id, name, true);
            this._term.print(null, 'Welcome to channel', name);
        });

        /**
         * le client local vien de quitter un canal de discussion
         * Fermeture de l'écran correspondant au canal
         */
        this._connector.events.on(CHAT_EVENTS.CHANNEL_EXIT, ({channel}) => {
            this._term.destroy(channel.id);
        });

        /**
         * un client vient d'arriver sur l'un des canaux de discussion auxquels est abonné le client local
         * affichage d'un message de notification "nouvel arrivant"
         */
        this._connector.events.on(CHAT_EVENTS.USER_JOINED, ({user, channel}) => {
            this._term.print(channel.id, 'user', user.name, 'joined channel', channel.name);
        });

        /**
         * un client vient de quitter l'un des canaux de discussion auxquels est abonné le client local
         * affichage dun message de notification "utilisateur parti"
         */
        this._connector.events.on(CHAT_EVENTS.USER_LEFT, ({user, channel}) => {
            this._term.print(channel.id, 'user', user.name, 'left channel', channel.name);
        });
    }

    cmd_join(params) {
        if (this._connector.joinedChannels.has(params)) {
            this._term.select(params);
        } else {
            this._connector.join(params);
        }
    }

    cmd_say(params) {
        this._connector.say(this._term.currentScreenId, params);
    }

    cmd_leave() {
        this._connector.leave(this._term.currentScreenId);
    }
}

export default ChatHandler;