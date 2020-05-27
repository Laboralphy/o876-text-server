import terminal from './terminal';
import ws from './plugins/ws';

export default {
    modules: {
        terminal
    },
    plugins: [ws()]
};