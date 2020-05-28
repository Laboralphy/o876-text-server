import io from 'socket.io-client';

import * as TERMINAL_ACTIONS from '../terminal/action_types';
import * as TERMINAL_MUTATIONS from '../terminal/mutation_types';

export default function () {
    return async store => {

        let socket;

        function connect () {
            return new Promise((resolve, reject) => {
                this.writeLine(0, 'connecting...');
                socket = io(window.location.protocol + '//' + window.location.host);
                socket.on('connect', () => {
                    this.writeLine(0, 'connected.');
                    resolve(true);
                });
                socket.on('connect_error', err => {
                    this.writeLine(0, 'ws connection error:', err);
                    reject(err);
                });
                socket.on('WRITE_LINE', ({screen, content}) => {
                    store.commit('terminal/' + TERMINAL_MUTATIONS.WRITE_LINE, {content, screen});
                });
                socket.on('CREATE_SCREEN', ({screen, caption, select}) => {
                    store.commit('terminal/' + TERMINAL_MUTATIONS.CREATE_SCREEN, {screen, caption, select});
                });
                socket.on('DESTROY_SCREEN', ({screen}) => {
                    store.commit('terminal/' + TERMINAL_MUTATIONS.DESTROY_SCREEN, {screen});
                });
                socket.on('CLEAR_SCREEN', ({screen}) => {
                    store.commit('terminal/' + TERMINAL_MUTATIONS.CLEAR_SCREEN, {screen});
                });
                socket.on('SELECT_SCREEN', ({screen}) => {
                    store.commit('terminal/' + TERMINAL_MUTATIONS.SELECT_SCREEN, {screen});
                });
            });
        }

        function disconnect() {
            socket.disconnect();
        }


        store.subscribeAction(async action => {
            switch (action.type) {
                case 'terminal/' + TERMINAL_ACTIONS.SUBMIT_COMMAND:
                    const r = action
                        .payload
                        .command
                        .trim()
                        .match(/^\/([^ ]+)( (.*))?$/);
                    if (!!r) {
                        const [sInput, command, sDummy, parameters] = r;
                        socket.emit('COMMAND', {command, parameters});
                    }
                    break;
            }
        })
    }
}
