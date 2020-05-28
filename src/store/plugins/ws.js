import io from 'socket.io-client';

import LoginConnector from '../../../srv/services/login/connector';
import ChatConnector from '../../../srv/services/chat/connector';

import * as TERMINAL_ACTIONS from '../terminal/action_types';
import * as TERMINAL_MUTATIONS from '../terminal/mutation_types';



class WSStore {
    constructor (store) {
        this._connectors = {};
        this._socket = null;
        this._store = store;
        this._idCurrChan = -1;
    }

    connect () {
        return new Promise((resolve, reject) => {
            this.writeLine('connecting...');
            this._socket = io(window.location.protocol + '//' + window.location.host);
            this._connectors.login = new LoginConnector({socket: this._socket});
            this._connectors.chat = new ChatConnector({socket: this._socket});
            this.attachHandlers();
            this._socket.on('connect', () => {
                this.writeLine('connected.');
                resolve(true);
            });
            this._socket.on('connect_error', err => {
                this.writeLine('ws connection error:', err);
                reject(err);
            });
        });
    }

    disconnect() {
        this._socket.disconnect();
    }

    /**
     * Les évènement issus des connecteurs sont rattaché au store à cet endroit.
     */
    attachHandlers () {
        const chat = this._connectors.chat;
        chat.events.on('message', ({channel, user, message}) => {
            this._store.commit('terminal/' + TERMINAL_MUTATIONS.WRITE_LINE, {
                content: '[' + channel.name + '] ' + user.name + ': ' + message
            });
        });

        chat.events.on('you.joined', ({channel}) => {
            this.writeLine('you join a new channel :', channel.name);
            if (this._idCurrChan < 0) {
                this._idCurrChan = channel.id;
                this.writeLine('your current channel is', channel.name);
            }
        });

        chat.events.on('you.left', ({channel}) => {
            this.writeLine('you leave channel :', channel.name);
            if (chat.channels.length > 0) {
                const oNewChannel = chat.channels[0];
                this._idCurrChan = oNewChannel.id;
                this.writeLine('your current channel is', oNewChannel.name);
            }
        });

        chat.events.on('user.joined', ({user, channel}) => {
            this.writeLine('user', user.name, 'joined channel', channel.name);
        });

        chat.events.on('user.left', ({user, channel}) => {
            this.writeLine('user', user.name, 'left channel', channel.name);
        });
    }

    writeLine(...aLine) {
        const sLine = aLine.map(x => x === undefined ? '[Undefined]' : x.toString()).join(' ');
        this._store.commit('terminal/' + TERMINAL_MUTATIONS.WRITE_LINE, {content: sLine});
    }

    async cmdJoin(sChanName) {
        const oJoinedChan = this._connectors.chat.channels.find(c => c.name === sChanName);
        let sCurrentChan = '';
        if (oJoinedChan) {
            // déja connecté au canal
            this._idCurrChan = oJoinedChan.id;
            sCurrentChan = oJoinedChan.name;
        } else {
            const {id, name, type} = await this._connectors.chat.req_join_chan(sChanName);
            this._idCurrChan = id;
            sCurrentChan = name;
        }
        this.writeLine('your current channel is', sCurrentChan);
    }

    cmdLeave() {
        this._connectors.chat.send_leave_chan(this._idCurrChan);
    }

    cmdSay(sMessage) {
        this._connectors.chat.send_say(this._idCurrChan, sMessage);
    }

    cmdLogin(sParam) {
        return this._connectors.login.req_login(sParam, '****');
    }

    doCommand(sCmd, sParams) {
        console.log('command', sCmd, sParams);
        switch (sCmd) {
            case 'join': // rejoindre un canal de discussion
                this.cmdJoin(sParams.toLowerCase());
                break;

            case 'leave': // quitter un canal de discussion
                this.cmdLeave();
                break;

            case 'say':
                this.cmdSay(sParams);
                break;

            case 'login':
                this.cmdLogin(sParams);
                break;

        }
    }
}




export default function () {
    return async store => {

        const wsStore = new WSStore(store);
        await wsStore.connect();

        store.subscribeAction(async action => {
            switch (action.type) {
                case 'terminal/' + TERMINAL_ACTIONS.SUBMIT_COMMAND:
                    const r = action
                        .payload
                        .command
                        .trim()
                        .match(/^\/([^ ]+)( (.*))?$/);
                    if (!!r) {
                        const [sInput, sCommand, sDummy, sParams] = r;
                        wsStore.doCommand(sCommand, sParams);
                    } else {
                        wsStore.writeLine('command parse error');
                    }
                    break;
            }
        })
    }
}
