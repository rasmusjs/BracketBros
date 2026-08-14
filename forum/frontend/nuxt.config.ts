import vuetify from 'vite-plugin-vuetify';

export default defineNuxtConfig({
    vite: {
        ssr: {
            noExternal: ['vuetify'],
        },
        optimizeDeps: {
            include: [
                'punycode',
                'vuetify/components/VOverlay',
                'vuetify/components/VDialog',
                'vuetify/components/VMenu',
                'vuetify/components/VSelect',
                'vuetify/components/VTooltip',
            ],
        },
    },
    modules: [
        async (options, nuxt) => {
            nuxt.hooks.hook('vite:extendConfig', (config) =>
                // @ts-ignore
                config.plugins.push(vuetify({autoImport: true})),
            );
        },
        [
            '@nuxtjs/google-fonts',
            {
                families: {
                    Roboto: true,
                    'Roboto+Mono': true,
                },
            },
        ],
    ],
    css: ['~/assets/style/main.scss'],
});
