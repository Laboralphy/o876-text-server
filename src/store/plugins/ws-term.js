import * as TERMINAL_ACTIONS from '../terminal/action_types';
import * as TERMINAL_MUTATIONS from '../terminal/mutation_types';
import * as TECH_MUTATIONS from '../tech/mutation_types';
import wsconnector from '../../../libs/wsconnector';
import ChatConnector from '../../../srv/services/chat/connector';
import LoginConnector from '../../../srv/services/login/connector';

import CHAT_EVENTS from '../../../srv/services/chat/event_types';

function buildTerminalAPI(store) {
    const NS = 'terminal/';
    return {

        get currentScreenId () {
            return store.getters[NS + 'getCurrentScreenId'];
        },

        get passwordMode () {
            return store.getters[NS + 'isPasswordMode'];
        },

        get screens () {
            return store.getters[NS + 'getScreens'];
        },

        set passwordMode (value) {
            store.dispatch(NS + TERMINAL_MUTATIONS.SET_PASSWORD_MODE, {value});
        },

        print: function (screen, ...args) {
            store.commit(NS + TERMINAL_MUTATIONS.WRITE_LINE, {screen, content: args.map(x => x === undefined ? '[undefined]' : x.toString()).join(' ')});
        },
        create: function (screen, caption, select = false) {
            store.commit(NS + TERMINAL_MUTATIONS.CREATE_SCREEN, {screen, caption, select});
        },
        destroy: function (screen) {
            store.commit(NS + TERMINAL_MUTATIONS.DESTROY_SCREEN, {screen});
        },
        select: function (screen) {
            store.commit(NS + TERMINAL_MUTATIONS.SELECT_SCREEN, {screen});
        },
        clear: function (screen) {
            store.commit(NS + TERMINAL_MUTATIONS.CLEAR_SCREEN, {screen});
        }
    };
}

async function plugin (store) {

    const term = buildTerminalAPI(store);

    term.print(0, 'Connecting to host :', wsconnector.address, '...');
    let socket = await wsconnector.connect();
    term.print(0, 'Connected.');
    store.commit('tech/' + TECH_MUTATIONS.SET_CONNECTED, {value: true});

    const chat = new ChatConnector({socket});
    const login = new LoginConnector({socket});


    socket.on('disconnect', () => {
        term.screens.forEach(screen => term.print(screen.id, 'Disconnected from server'));
        store.commit('tech/' + TECH_MUTATIONS.SET_CONNECTED, {value: false});
    })


//          _           _
//      ___| |__   __ _| |_
//     / __| '_ \ / _` | __|
//    | (__| | | | (_| | |_
//     \___|_| |_|\__,_|\__|

    chat.events.on(CHAT_EVENTS.ERROR, ({error}) => {
        term.print(null, "*ERROR*", error);
    });

    /**
     * Un message de discussion public vient d'arriver à destination du client local
     * Affichage du message dans le terminal sur l'écran correspondant
     */
    chat.events.on(CHAT_EVENTS.MESSAGE, ({channel, user, message}) => {
        term.print(channel.id, user.name + ':', message);
    });

    /**
     * Le client local vient de rejoindre un canal de discussion
     * Création d'un nouvel écran attaché à ce canal
     * Affichage du message de bienvenue
     */
    chat.events.on(CHAT_EVENTS.CHANNEL_ENTER, ({id, name}) => {
        term.create(id, name, true);
        term.print(null, 'Welcome to channel', name);
    });

    /**
     * le client local vien de quitter un canal de discussion
     * Fermeture de l'écran correspondant au canal
     */
    chat.events.on(CHAT_EVENTS.CHANNEL_EXIT, ({channel}) => {
        term.destroy(channel.id);
    });

    /**
     * un client vient d'arriver sur l'un des canaux de discussion auxquels est abonné le client local
     * affichage d'un message de notification "nouvel arrivant"
     */
    chat.events.on(CHAT_EVENTS.USER_JOINED, ({user, channel}) => {
        term.print(channel.id, 'user', user.name, 'joined channel', channel.name);
    });

    /**
     * un client vient de quitter l'un des canaux de discussion auxquels est abonné le client local
     * affichage dun message de notification "utilisateur parti"
     */
    chat.events.on(CHAT_EVENTS.USER_LEFT, ({user, channel}) => {
        term.print(channel.id, 'user', user.name, 'left channel', channel.name);
    });


    async function doCommand(sCommand, sParams, sPassword = null) {
        switch (sCommand.toLowerCase()) {
            case 'join':
                if (chat.joinedChannels.has(sParams)) {
                    term.select(sParams);
                } else {
                    chat.join(sParams);
                }
                break;

            case 'say':
                chat.say(term.currentScreenId, sParams);
                break;

            case 'leave':
                chat.leave(term.currentScreenId);
                break;

            case 'login':
                if (sPassword === null) {
                    term.print(null, 'Enter password for user', sParams);
                    term.passwordMode = true;
                } else {
                    term.print(null, 'Sending log in...');
                    const id = await login.reqLogin(sParams, String(sPassword));
                    if (id === null) {
                        term.print(null, 'Wrong login / password.');
                    } else {
                        term.print(null, 'Welcome to Text Server,', sParams, '!');
                    }
                }
                break;
        }
    }



    store.subscribeAction(async ({type, payload}) => {
        let r;
        const regCommand = /^\/([^ ]+)( (.*))?$/;
        switch (type) {
            case 'terminal/' + TERMINAL_ACTIONS.SUBMIT_COMMAND:
                r = payload
                    .command
                    .trim()
                    .match(regCommand);
                if (!!r) {
                    const [sInput, command, sDummy, parameters] = r;
                    doCommand(command, parameters, payload.password);
                } else {
                    // the default command : say
                    doCommand('say', payload.command);
                }
                break;
        }
    });
}

export default plugin;

