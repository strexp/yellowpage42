<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { PhoneEntry } from "~/types";
import { useAuthStore } from "~/stores/auth";
import { useSnackbar } from "~/composables/useSnackbar";
import { useI18n } from "vue-i18n";

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const deleting = ref(false);

const entries = ref<PhoneEntry[]>([]);
const deletingEntry = ref<PhoneEntry | null>(null);

const loadEntries = async () => {
    loading.value = true;
    try {
        entries.value = await $api<PhoneEntry[]>("/phonebook/me");
    } catch (e) {
        console.error("Failed to load phonebook", e);
    } finally {
        loading.value = false;
    }
};

const confirmDelete = (entry: PhoneEntry) => {
    deletingEntry.value = entry;
    deleteDialog.value = true;
};

const deleteEntry = async () => {
    if (!deletingEntry.value) return;
    deleting.value = true;
    try {
        await $api(`/phonebook/me/${deletingEntry.value.id}`, {
            method: "DELETE",
        });
        showSnackbar(t("phonebook.personal.deleteSuccess"), "success");
        deleteDialog.value = false;
        await loadEntries();
    } catch (e: unknown) {
        const errorMsg = (e as { data?: { error?: string } })?.data?.error;
        showSnackbar(errorMsg || t("phonebook.personal.deleteFailed"), "error");
    } finally {
        deleting.value = false;
    }
};

const toggleVisibility = async (item: PhoneEntry) => {
    const original = item.hidden;
    item.hidden = !original;
    try {
        await $api(`/phonebook/me/${item.id}/hidden`, {
            method: "PATCH",
            body: { hidden: item.hidden },
        });
        showSnackbar(
            t("phonebook.personal.visibilityToggleSuccess"),
            "success",
        );
    } catch (e) {
        item.hidden = original;
        showSnackbar(t("phonebook.p ersonal.visibilityToggleFailed"), "error");
    }
};

onMounted(() => {
    loadEntries();
});

const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        phone: "primary",
        fax: "orange",
        ivr: "purple",
        "number-readout": "blue",
        music: "pink",
        sip: "green",
        other: "grey",
        modem: "brown",
        mobile: "teal",
        voicemail: "indigo",
        gateway: "cyan",
        conference: "deep-purple",
        emergency: "red",
    };
    return colors[type] || "grey";
};

const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
        phone: "mdi-phone",
        fax: "mdi-fax",
        ivr: "mdi-robot-outline",
        "number-readout": "mdi-numeric",
        music: "mdi-music",
        sip: "mdi-lan",
        other: "mdi-help-circle-outline",
        modem: "mdi-modem",
        mobile: "mdi-cellphone",
        voicemail: "mdi-voicemail",
        gateway: "mdi-router-network",
        conference: "mdi-account-group",
        emergency: "mdi-alert-circle",
    };
    return icons[type] || "mdi-help-circle-outline";
};

type aligntype = "center" | "end" | "start" | undefined;

const headers = computed(() => {
    const cols = [
        {
            title: t("phonebook.personal.headers.number"),
            key: "number",
            sortable: false,
            width: "20%" as const,
            align: "start" as aligntype,
        },
        {
            title: t("phonebook.personal.headers.type"),
            key: "type",
            sortable: false,
            width: "15%" as const,
            align: "start" as aligntype,
        },
        {
            title: t("phonebook.personal.headers.language"),
            key: "language",
            sortable: false,
            width: "15%" as const,
            align: "start" as aligntype,
        },
        {
            title: t("phonebook.personal.headers.visibility"),
            key: "hidden",
            sortable: false,
            width: "10%" as const,
            align: "start" as aligntype,
        },
        {
            title: t("phonebook.personal.headers.name"),
            key: "name",
            sortable: false,
            width: "20%" as const,
            align: "start" as aligntype,
        },
    ];
    if (authStore.canWrite) {
        cols.push({
            title: t("phonebook.personal.headers.actions"),
            key: "actions",
            sortable: false,
            width: "20%" as const,
            align: "end" as aligntype,
        });
    }
    return cols;
});
</script>

<template>
    <div class="animate-fade-in">
        <div
            class="mb-6 mb-md-8 d-flex align-center justify-space-between flex-wrap ga-4"
        >
            <div>
                <h1
                    class="text-h4 text-md-h3 font-weight-bold text-primary mb-2"
                >
                    {{ $t("phonebook.personal.title") }}
                    <span class="text-h5 text-medium-emphasis"
                        >({{ entries.length }})</span
                    >
                </h1>
                <p class="text-body-1 text-medium-emphasis">
                    {{ $t("phonebook.personal.description") }}
                </p>
            </div>
            <v-btn
                v-if="authStore.canWrite && !$vuetify.display.smAndDown"
                color="primary"
                variant="flat"
                size="large"
                @click="dialog = true"
                prepend-icon="mdi-plus"
            >
                {{ $t("phonebook.personal.addBtn") }}
            </v-btn>
        </div>

        <NonDN42Alert v-if="!authStore.canWrite" class="mb-6" />

        <v-card class="border shadow-sm" elevation="0">
            <v-data-table
                :headers="headers"
                :items="entries"
                :loading="loading"
                hide-default-footer
                hover
                class="bg-transparent"
                :mobile-breakpoint="0"
            >
                <template #loading>
                    <v-skeleton-loader type="table-row@3"></v-skeleton-loader>
                </template>
                <template #no-data>
                    <div class="py-12 text-center text-medium-emphasis">
                        <v-icon size="64" class="mb-4" color="grey-lighten-2"
                            >mdi-phone-outline</v-icon
                        >
                        <div class="text-h6">
                            {{ $t("phonebook.personal.noData") }}
                        </div>
                        <div class="text-body-2" v-if="authStore.canWrite">
                            {{ $t("phonebook.personal.noDataHint") }}
                        </div>
                    </div>
                </template>
                <template #item.number="{ item }">
                    <span class="text-primary font-weight-medium">
                        {{ item.number }}
                    </span>
                </template>
                <template #item.type="{ item }">
                    <v-chip
                        size="small"
                        variant="tonal"
                        :color="getTypeColor(item.type)"
                    >
                        <v-icon start size="small">{{
                            getTypeIcon(item.type)
                        }}</v-icon>
                        {{
                            $t(
                                `phonebook.add.types.${(item.type || "phone").replace("-", "_")}`,
                            )
                        }}
                    </v-chip>
                </template>
                <template #item.language="{ item }">
                    <v-chip size="small" variant="tonal" color="secondary">
                        {{
                            $t(
                                `phonebook.add.languages.${item.language || "unknown"}`,
                            )
                        }}
                    </v-chip>
                </template>
                <template #item.hidden="{ item }">
                    <v-chip
                        size="small"
                        variant="tonal"
                        :color="item.hidden ? 'warning' : 'success'"
                    >
                        <v-icon start size="small">{{
                            item.hidden ? "mdi-eye-off" : "mdi-eye"
                        }}</v-icon>
                        {{
                            item.hidden
                                ? $t("phonebook.personal.hidden")
                                : $t("phonebook.personal.visible")
                        }}
                    </v-chip>
                </template>
                <template #item.name="{ item }">
                    <span class="font-weight-medium">{{ item.name }}</span>
                </template>
                <template #item.actions="{ item }">
                    <v-btn
                        :icon="
                            item.hidden
                                ? 'mdi-eye-outline'
                                : 'mdi-eye-off-outline'
                        "
                        size="small"
                        variant="tonal"
                        :color="item.hidden ? 'success' : 'warning'"
                        class="mr-2"
                        @click="toggleVisibility(item)"
                        :title="
                            item.hidden
                                ? $t('phonebook.personal.makeVisible')
                                : $t('phonebook.personal.makeHidden')
                        "
                    ></v-btn>
                    <v-btn
                        icon="mdi-phone-forward"
                        size="small"
                        variant="tonal"
                        color="success"
                        class="mr-2"
                        :href="`tel:${item.number}`"
                        :title="$t('phonebook.public.call')"
                    ></v-btn>
                    <v-btn
                        icon="mdi-message-text"
                        size="small"
                        variant="tonal"
                        color="info"
                        class="mr-2"
                        :href="`sms:${item.number}`"
                        :title="$t('phonebook.public.sms')"
                    ></v-btn>
                    <v-btn
                        icon="mdi-delete-outline"
                        size="small"
                        variant="tonal"
                        color="error"
                        @click="confirmDelete(item)"
                    ></v-btn>
                </template>
            </v-data-table>
        </v-card>

        <PhonebookAddDialog v-model="dialog" @saved="loadEntries" />

        <ConfirmDialog
            v-model="deleteDialog"
            :title="$t('phonebook.personal.deleteConfirmTitle')"
            :confirmText="$t('phonebook.personal.deleteConfirmBtn')"
            :loading="deleting"
            @confirm="deleteEntry"
        >
            <span
                v-html="
                    $t('phonebook.personal.deleteConfirmText', {
                        number: deletingEntry?.number,
                        name: deletingEntry?.name,
                    })
                "
            ></span>
        </ConfirmDialog>

        <v-btn
            v-if="authStore.canWrite && $vuetify.display.smAndDown"
            icon="mdi-plus"
            color="primary"
            size="x-large"
            elevation="8"
            position="fixed"
            style="bottom: 80px; right: 24px; z-index: 99"
            @click="dialog = true"
        ></v-btn>
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
