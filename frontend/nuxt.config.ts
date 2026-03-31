import { md3 } from "vuetify/blueprints";

export default defineNuxtConfig({
  compatibilityDate: "2025-04-07",
  devtools: { enabled: true },
  ssr: false,
  modules: ["@nuxtjs/i18n", "vuetify-nuxt-module", "@pinia/nuxt"],
  i18n: {
    defaultLocale: "en",
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "lang",
    },
    compilation: { strictMessage: false },
    locales: [
      { code: "en", name: "English" },
      { code: "zhs", name: "简体中文" },
    ],
  },
  vuetify: {
    vuetifyOptions: {
      blueprint: md3,
      defaults: {
        VCard: { rounded: "xl", variant: "flat", border: true },
        VBtn: { rounded: "xl", class: "text-none font-weight-bold" },
        VTextField: { variant: "outlined", color: "primary", rounded: "xl" },
        VSelect: { variant: "outlined", color: "primary", rounded: "xl" },
        VChip: { rounded: "xl" },
        VMenu: { rounded: "xl" },
        VDialog: { rounded: "xl" },
        VSnackbar: { rounded: "xl" },
        VAlert: { rounded: "xl" },
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBase: "https://yp.dn42/api",
    },
  },
  app: {
    head: {
      title: "YellowPage42 - DN42 Yellowpage",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "96x96",
          href: "/favicon-96x96.png",
        },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
      ],
    },
  },
  typescript: { strict: true, typeCheck: true },
  vite: {
    css: {
      preprocessorOptions: { scss: { silenceDeprecations: ["legacy-js-api"] } },
    },
  },
});
