import AbstractHandler from './AbstractHandler';
import LoginConnector from "../../../../srv/services/login/connector";
import term_api from "../api/term";

class LoginHandler extends AbstractHandler {
    init () {
        this._connector = new LoginConnector({socket: this.socket});
        this._term = term_api(this.store);
    }

    async cmd_login (params, data) {
        if ('password' in data) {
            this._term.print(null, 'Sending log in...');
            const id = await this._connector.reqLogin(params, String(data.password));
            if (id === null) {
                this._term.print(null, 'Wrong login / password.');
            } else {
                this._term.print(null, 'Welcome to Text Server,', params, '!');
            }
        } else {
            this._term.print(null, 'Enter password for user', params);
            this._term.passwordMode = true;
        }
    }
}

export default LoginHandler;