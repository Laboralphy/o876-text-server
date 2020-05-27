import * as ACTIONS from './action_types';
import * as MUTATIONS from './mutation_types';

export default {
    [ACTIONS.SUBMIT_COMMAND]: function({ commit }, {command}) {
        // commit(MUTATIONS.WRITE_LINE, {content: command});
    }
};