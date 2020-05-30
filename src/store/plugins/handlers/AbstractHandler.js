class AbstractHandler {
    constructor (store, socket) {
        this._store = store;
        this._socket = socket;
        this.init();
    }

    init() {
    }

    get store() {
        return this._store;
    }

    get socket() {
        return this._socket;
    }

    async command(sCommand, sParams, data = {}) {
        const sMethodName = 'cmd_' + sCommand.toLocaleString();
        if (sMethodName in this) {
            return this[sMethodName](sParams, data);
        } else {
            return null;
        }
    }
}

export default AbstractHandler;