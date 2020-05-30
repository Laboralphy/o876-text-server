import * as TERMINAL_ACTIONS from '../terminal/action_types';
import wsconnector from '../../../libs/wsconnector';

import ChatHandler from './handlers/chat';
import LoginHandler from './handlers/login';

import termAPI from './api/term';
import techAPI from './api/tech';

export default async function (store) {

    const term = termAPI(store);
    const tech = techAPI(store);


    // connection
    term.print(0, 'Connecting to host :', wsconnector.address, '...');
    let socket = await wsconnector.connect();
    term.print(0, 'Connected.');
    tech.connected = true;

    // handling disconnection
    socket.on('disconnect', () => {
        term.screens.forEach(screen => term.print(screen.id, 'Disconnected from server'));
        tech.connected = false;
    });

    // creating handlers
    const chatHandler = new ChatHandler(store, socket);
    const loginHandler = new LoginHandler(store, socket);

    /**
     * passes commands to each handler that have a "command" method
     * @param sCommand {string} the first command line keyword
     * @param sParams {string} the command line trailing characters
     * @param data {*} an extra plain object
     * @returns {Promise<void>}
     */
    async function doCommand(sCommand, sParams, data = {}) {
        await loginHandler.command(sCommand, sParams, data);
        await chatHandler.command(sCommand, sParams, data);
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
                    const data = {};
                    if ('password' in payload) {
                        data.password = payload.password;
                    }
                    doCommand(command, parameters, data);
                } else {
                    // the default command : say
                    doCommand('say', payload.command);
                }
                break;
        }
    });
}
