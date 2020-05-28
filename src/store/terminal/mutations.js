import * as MUTATIONS from './mutation_types';

export default {
    [MUTATIONS.WRITE_LINE]: function(state, {content, screen = null}) {
        if (screen === null) {
            screen = state.currScreen;
        }
        const oScreen = state.screens.find(s => s.id === screen);
        if (oScreen) {
            oScreen.lines.push(content);
            while (oScreen.lines.length > state.maxLines) {
                oScreen.lines.shift();
            }
        } else {
            throw new Error('invalid screen ' + screen);
        }
    },

    [MUTATIONS.SELECT_SCREEN]: function(state, {screen}) {
        if (state.screens.find(s => s.id === screen)) {
            state.history.push(state.currScreen);
            state.currScreen = screen;
        } else {
            throw new Error('invalid screen ' + screen);
        }
    },

    [MUTATIONS.CLEAR_SCREEN]: function(state, {screen}) {
        if (screen === null) {
            screen = state.currScreen;
        }
        const oScreen = state.screens.find(s => s.id === screen);
        if (oScreen) {
            oScreen.lines.splice(0, oScreen.lines.length);
        } else {
            throw new Error('invalid screen ' + screen);
        }
    },

    [MUTATIONS.CREATE_SCREEN]: function(state, {screen, caption = '', select = false}) {
        const oScreen = state.screens.find(s => s.id === screen);
        if (caption === '') {
            caption = 'screen ' + screen;
        }
        if (oScreen) {
            throw new Error('screen id ' + screen + ' already defined');
        } else {
            state.screens.push({
                id: screen,
                lines: [],
                caption
            });
            if (select) {
                state.history.push(state.currScreen);
                state.currScreen = screen;
            }
        }
    },

    [MUTATIONS.DESTROY_SCREEN]: function(state, {screen}) {
        if (screen === null) {
            screen = state.currScreen;
        }
        const iScreen = state.screens.findIndex(s => s.id === screen);
        if (iScreen < 0) {
            throw new Error('invalid screen ' + screen);
        } else {
            state.screens.splice(iScreen, 1);
            if (state.screens.length === 0) {
                state.screens.push({
                    id: 0,
                    lines: [],
                    caption: 'screen 0'
                });
            }
            state.currScreen = state.history.length > 0 ? state.history.pop() : state.screens[0].id;
        }
    },

};