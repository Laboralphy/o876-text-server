import terminal from './terminal';
import tech from './tech';
import ws from './plugins/ws';

export default {
    modules: {
        terminal,
        tech
    },
    plugins: [ws]
};