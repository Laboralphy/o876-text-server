import io from 'socket.io-client';

let socket = null;

export default {

    get address () {
        return window.location.protocol + '//' + window.location.host
    },

    connect: function () {
        return new Promise((resolve, reject) => {
            if (socket === null) {
                socket = io(this.address);
                socket.on('connect', () => {
                    resolve(socket);
                });
                socket.on('connect_error', err => {
                    reject(err);
                });
            } else {
                resolve(socket);
            }
        });
    },

    disconnect: function () {
        socket.disconnect();
        socket = null;
    },

    get socket() {
        return socket;
    }
};