import * as MUTATIONS from '../../tech/mutation_types';

export default function (store) {
    const NS = 'tech/';
    return {
        get connected () {
            return store.getters[NS + 'isConnected'];
        },

        set connected (value) {
            return store.commit(NS + MUTATIONS.SET_CONNECTED, {value});
        }
    };
}