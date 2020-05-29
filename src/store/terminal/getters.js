export default {
    getCurrentScreen: state => state.screens.find(s => s.id === state.currScreen),
    getCurrentScreenId: state => state.currScreen,
    getScreens: state => state.screens,
    getCurrentScreenContent: (state, getters) => getters.getCurrentScreen.lines,
    getCurrentScreenCaption: (state, getters) => getters.getCurrentScreen.caption,
    isPasswordMode: state => state.passwordMode,
    getLastCommand: state => state.command
}