<template>
    <div class="terminal" @click="$refs.commandLine.focus()">
        <div class="row header"><span class="menu">≡</span><span class="caption">{{ getCurrentScreenCaption }}</span></div>
        <div class="row content">
            <div v-for="l in getCurrentScreenContent">{{ l }}</div>
            <label ref="commandLine">
                <input v-if="isPasswordMode" :disabled="!isConnected" type="password" v-model="passwordString" class="command" @keypress.enter="enterPassword"/>
                <input v-else type="text" :disabled="!isConnected" v-model="inputString" class="command" @keypress.enter="enterCommand"/>
            </label><br ref="lastItem" />
        </div>
    </div>
</template>

<script>
    import { markdown } from 'markdown';
    import { createNamespacedHelpers } from 'vuex';
    import * as ACTIONS from '../store/terminal/action_types';
    const { mapGetters: terminalGetters, mapActions: terminalActions } = createNamespacedHelpers('terminal');
    const { mapGetters: techGetters } = createNamespacedHelpers('tech');
    export default {
        name: "Terminal",

        data: function() {
            return {
                inputString: '',
                passwordString: ''
            }
        },

        computed: {
            ...terminalGetters([
                'getCurrentScreenContent',
                'getCurrentScreenCaption',
                'isPasswordMode'
            ]),
            ...techGetters([
                'isConnected'
            ])
        },

        methods: {
            ...terminalActions({
                submitCommand: ACTIONS.SUBMIT_COMMAND,
                submitPassword: ACTIONS.SUBMIT_PASSWORD
            }),
            enterCommand() {
                this.submitCommand({command: this.inputString});
                this.inputString = '';
            },
            enterPassword() {
                this.submitPassword({password: this.passwordString});
                this.passwordString = '';
            }
        },

        updated() {
            this.$refs.lastItem.scrollIntoView();
        }
    }
</script>

<style scoped>
    .terminal {
        display: flex;
        flex-flow: column;
        height: 100%;
        width: 100%;
    }

    .command, .terminal {
        color: #0F0;
        text-shadow: 0 0 10px;
    }

    .terminal .row.header {
        flex-grow: 0;
        flex-shrink: 1;
        flex-basis: auto;
        color: #0F4;
        background-color: #040;
        text-shadow: 0 0 10px;
    }

    .terminal .row.content {
        flex: 1 1 auto;
        overflow: auto;
    }

    .menu {
        padding-left: 0.5em;
        padding-right: 0.5em;
        cursor: pointer;
    }
</style>