import io from 'socket.io-client';

import LoginConnector from '../../../srv/services/login/connector';
import ChatConnector from '../../../srv/services/chat/connector';

import * as TERMINAL_ACTIONS from '../terminal/action_types';
import * as TERMINAL_MUTATIONS from '../terminal/mutation_types';


function connect() {
    return new Promise(resolve => {
        const socket = io(window.location.protocol + '//' + window.location.host);
        const login = new LoginConnector({socket});
        const chat = new ChatConnector({socket});
        console.log(window.location.protocol + '//' + window.location.host);
        socket.on('connect', () => {
            resolve({
                socket,
                login,
                chat
            });
        });
    });
}


export default function () {
    return async store => {
        let idCurrChan = '';

        console.log('x connecting')
        const {chat, login, socket} = await connect();
        console.log(chat, login, socket)
        

        function writeLine(...aLine) {
            const sLine = aLine.map(x => x.toString()).join(' ');
            store.commit('terminal/' + TERMINAL_MUTATIONS.WRITE_LINE, {content: sLine});
        }

        async function cmdJoin(sChanName) {
            const oJoinedChan = chat.channels.find(c => c.name === sChanName);
            let sCurrentChan = '';
            if (oJoinedChan) {
                // déja connecté au canal
                idCurrChan = oJoinedChan.id;
                sCurrentChan = oJoinedChan.name;
            } else {
                const {cid, name} = await chat.req_join_chan(sChanName);
                idCurrChan = cid;
                sCurrentChan = name;
            }
            writeLine('your current channel is', sCurrentChan);
        }

        function cmdLeave() {
            chat.send_leave_chan(idCurrChan);
        }

        function cmdSay(sMessage) {
            chat.send_say(idCurrChan, sMessage);
        }

        async function cmdLogin(sParam) {
            console.log('login 1');
            const o = await login.req_login(sParam, '****');
            console.log('login 2', o);
        }

        function doCommand(sCmd, sParams) {
            console.log('command', sCmd, sParams);
            switch (sCmd) {
                case 'join': // rejoindre un canal de discussion
                    cmdJoin(sParams.toLowerCase());
                    break;

                case 'leave': // quitter un canal de discussion
                    cmdLeave(sParams.toLowerCase());
                    break;

                case 'say':
                    cmdSay(sParams);
                    break;

                case 'connect':
                    cmdLogin(sParams);
                    break;

            }
        }

        chat.events.on('postline', ({cid, client = null, message}) => {
            const oChannel = chat.channels.find(c => c.id === cid);
            let s = '[' + oChannel.name + '] ';
            if (client) {
                s += client.name + ' ' + message;
            }
            store.commit('terminal/' + TERMINAL_MUTATIONS.WRITE_LINE, {
                content: s
            });
        });

        chat.events.on('newchan', oChannel => {
            writeLine('you join a new channel :', oChannel.name);
        });


        store.subscribeAction(async action => {
            switch (action.type) {
                case 'terminal/' + TERMINAL_ACTIONS.SUBMIT_COMMAND:
                    const [sInput, sCommand, sParams] = action
                        .payload
                        .command
                        .trim()
                        .match(/^\/([^ ]+) (.*)$/);
                    doCommand(sCommand, sParams);
            }
        })
    }
}
