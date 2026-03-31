<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useSnackbar } from "~/composables/useSnackbar";
import { useI18n } from "vue-i18n";

const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showSnackbar(t("dashboard.copied"), "success");
    } catch (err) {
        showSnackbar(t("dashboard.copyFailed"), "error");
    }
};
</script>

<template>
    <div class="animate-fade-in">
        <v-card class="mb-8 overflow-hidden border-0 shadow-sm">
            <div class="bg-gradient pa-6 pa-md-10 text-white position-relative">
                <div class="position-relative z-index-1">
                    <h1
                        class="text-h4 text-md-h3 font-weight-black mb-2"
                        style="letter-spacing: -0.5px"
                    >
                        {{
                            $t("dashboard.welcome", {
                                name: authStore.user?.name,
                                mnt: authStore.user?.mnt,
                            })
                        }}
                    </h1>
                    <p
                        class="text-body-1 text-md-h6 opacity-90 max-w-md font-weight-regular mt-2"
                    >
                        {{ $t("dashboard.description") }}
                    </p>
                </div>
                <div
                    class="hero-bg-pattern position-absolute w-100 h-100 top-0 left-0"
                ></div>
                <div
                    class="position-absolute top-0 right-0 h-100 pa-6 d-none d-md-flex align-center justify-center opacity-20 pointer-events-none"
                >
                    <v-icon size="160" color="white"
                        >mdi-card-account-phone</v-icon
                    >
                </div>
            </div>
        </v-card>

        <NonDN42Alert v-if="!authStore.canWrite" class="mb-8" />

        <v-row>
            <v-col cols="12" md="6">
                <v-card class="h-100 border bg-surface">
                    <v-card-text class="pa-6">
                        <div class="d-flex align-center mb-6">
                            <v-avatar
                                color="primary"
                                variant="tonal"
                                rounded="lg"
                                size="48"
                                class="mr-4"
                            >
                                <v-icon size="28">mdi-pound</v-icon>
                            </v-avatar>
                            <div class="text-h6 font-weight-bold">
                                {{ $t("dashboard.yourPrefixes") }}
                            </div>
                        </div>

                        <v-divider class="mb-6"></v-divider>

                        <div
                            v-if="authStore.user?.telephony.length"
                            class="d-flex flex-wrap ga-3"
                        >
                            <v-chip
                                v-for="prefix in authStore.user?.telephony"
                                :key="prefix"
                                color="primary"
                                size="x-large"
                                variant="tonal"
                                class="font-weight-black text-mono px-5 py-3 rounded-lg cursor-pointer"
                                @click="copyToClipboard(prefix)"
                            >
                                <v-icon start size="small" class="opacity-70"
                                    >mdi-content-copy</v-icon
                                >
                                {{ prefix }}
                            </v-chip>
                        </div>
                        <div
                            v-else
                            class="d-flex flex-column align-center justify-center py-6 text-medium-emphasis"
                        >
                            <v-icon size="48" class="mb-3 opacity-50"
                                >mdi-server-network-off</v-icon
                            >
                            <div class="text-body-1">
                                {{ $t("dashboard.noPrefix") }}
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="6">
                <v-card
                    to="/phonebook/private"
                    class="h-100 border bg-surface d-flex flex-column"
                >
                    <v-card-text class="pa-6 flex-grow-1 d-flex flex-column">
                        <div class="d-flex align-center mb-6">
                            <v-avatar
                                color="success"
                                variant="tonal"
                                rounded="lg"
                                size="48"
                                class="mr-4"
                            >
                                <v-icon size="28">mdi-contacts</v-icon>
                            </v-avatar>
                            <div>
                                <div class="text-h6 font-weight-bold lh-1">
                                    {{ $t("dashboard.manageExtensions") }}
                                </div>
                            </div>
                            <v-spacer></v-spacer>
                            <v-btn
                                icon="mdi-arrow-right"
                                variant="tonal"
                                color="success"
                                size="small"
                            ></v-btn>
                        </div>

                        <v-divider class="mb-6"></v-divider>

                        <p class="text-body-1 text-medium-emphasis flex-grow-1">
                            {{ $t("dashboard.manageExtensionsDesc") }}
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
