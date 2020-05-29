import * as MUTATIONS from './mutation_types';

export default {
    [MUTATIONS.SET_CONNECTED]: function(state, {value}) {
        state.connected = value;
    }
}