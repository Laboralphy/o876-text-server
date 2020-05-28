export default {
    getCurrentScreen: state => state.screens.find(s => s.id === state.currScreen),
    getCurrentScreenId: state => state.currScreen,
    getCurrentScreenContent: (state, getters) => getters.getCurrentScreen.lines,
    getCurrentScreenCaption: (state, getters) => getters.getCurrentScreen.caption
}