import * as ACTIONS from './action_types';
import * as MUTATIONS from './mutation_types';

export default {
    [ACTIONS.SUBMIT_COMMAND]: function({ commit, dispatch, getters }, {command, password = null}) {
        commit(MUTATIONS.SUBMIT_COMMAND, {command, password});
    },

    [ACTIONS.SUBMIT_PASSWORD]: function({ commit, dispatch, getters }, {password}) {
        commit(MUTATIONS.SET_PASSWORD_MODE, {value: false});
        dispatch(ACTIONS.SUBMIT_COMMAND, {command: getters.getLastCommand, password});
    },

    [ACTIONS.SET_PASSWORD_MODE]: function({ commit }, { value }) {
        commit(MUTATIONS.SET_PASSWORD_MODE, {value});
    }
};