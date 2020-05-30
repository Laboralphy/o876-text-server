import * as TERMINAL_MUTATIONS from "../../terminal/mutation_types";

/**
 * Uses in plugin to easily access to mutations
 * @param store
 * @returns {{print, select, readonly screens: array, passwordMode, readonly currentScreenId: string, clear, create, destroy}}
 */

export default function (store) {
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
