import * as TERMINAL_MUTATIONS from "../terminal/mutation_types";

class ChatPlugin {

    constructor() {
        this._connector = null;
        this._store = null;
    }

    writeLine(screen, ...aLine) {
        const sLine = aLine.map(x => x === undefined ? '[Undefined]' : x.toString()).join(' ');
        this._store.commit('terminal/' + TERMINAL_MUTATIONS.WRITE_LINE, {content: sLine, screen});
    }

    /**
     * Les évènement issus des connecteurs sont rattaché au store à cet endroit.
     */
    attachHandlers () {
        const chat = this._connector;
        this._connector.events.on('message', ({channel, user, message}) => {
            this.writeLine(channel.id, user.name + ':', message);
        });

        this._connector.events.on('you.joined', ({channel}) => {
            this._store.commit('terminal/' + TERMINAL_MUTATIONS.CREATE_SCREEN, {screen: channel.id, caption: channel.name, select: true});
            this.writeLine(channel.id, 'Welcome to channel ' + channel.name);
            if (this._idCurrChan < 0) {
                this._idCurrChan = channel.id;
            }
        });

        this._connector.events.on('you.left', ({channel}) => {
            this._store.commit('terminal/' + TERMINAL_MUTATIONS.DESTROY_SCREEN, {screen: channel.id});
            if (this._connector.channels.length > 0) {
                const oNewChannel = this._connector.channels[0];
                this._idCurrChan = oNewChannel.id;
            }
        });

        this._connector.events.on('user.joined', ({user, channel}) => {
            this.writeLine(channel.id, 'user', user.name, 'joined channel', channel.name);
        });

        this._connector.events.on('user.left', ({user, channel}) => {
            this.writeLine(channel.id, 'user', user.name, 'left channel', channel.name);
        });
    }

}