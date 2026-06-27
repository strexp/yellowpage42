<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useSnackbar } from "~/composables/useSnackbar";
import type { PublicEntry, PaginatedResponse } from "~/types";
import { useI18n } from "vue-i18n";

const { $api } = useNuxtApp();
const { showSnackbar } = useSnackbar();
const { t } = useI18n();

const loading = ref(false);
const entries = ref<PublicEntry[]>([]);
const totalItems = ref(0);
const search = ref("");
const typeFilter = ref<string | null>(null);
const languageFilter = ref<string | null>(null);
const options = ref({ page: 1, itemsPerPage: 50 });

const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showSnackbar(t("dashboard.copied"), "success");
    } catch (err) {
        showSnackbar(t("dashboard.copyFailed"), "error");
    }
};

const loadEntries = async (opts?: any) => {
    if (opts) options.value = opts;
    loading.value = true;
    try {
        const data = await $api<PaginatedResponse<PublicEntry>>(
            "/public/phonebook",
            {
                params: {
                    page: options.value.page,
                    itemsPerPage: options.value.itemsPerPage,
                    search: search.value,
                    type: typeFilter.value || "",
                    language: languageFilter.value || "",
                },
            },
        );
        entries.value = data.items;
        totalItems.value = data.total;
    } catch (e) {
        console.error("Failed to load public phonebook", e);
    } finally {
        loading.value = false;
    }
};

let debounceTimer: ReturnType<typeof setTimeout>;
watch([search, typeFilter, languageFilter], () => {
    options.value.page = 1;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadEntries(options.value);
    }, 300);
});

const download = async (format: "vcf" | "csv" | "json") => {
    try {
        const data = await $api(`/public/phonebook/download`, {
            params: {
                format,
                type: typeFilter.value || "",
                language: languageFilter.value || "",
            },
            responseType: "blob",
        });

        const typeMap = {
            vcf: "text/vcard",
            csv: "text/csv",
            json: "application/json",
        };
        const blob = new Blob([data as Blob], { type: typeMap[format] });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `yellowpage42_phonebook.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const formatName = format === "vcf" ? "vCard" : format.toUpperCase();
        showSnackbar(
            t("phonebook.public.downloadSuccess", { format: formatName }),
            "success",
        );
    } catch (e) {
        showSnackbar(t("phonebook.public.downloadFailed"), "error");
    }
};

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

const headers = computed(() => [
    {
        title: t("phonebook.public.headers.number"),
        key: "number",
        sortable: false,
        width: "20%",
    },
    {
        title: t("phonebook.public.headers.type"),
        key: "type",
        sortable: false,
        width: "15%",
    },
    {
        title: t("phonebook.public.headers.language"),
        key: "language",
        sortable: false,
        width: "15%",
    },
    {
        title: t("phonebook.public.headers.name"),
        key: "name",
        sortable: false,
        width: "30%",
    },
    {
        title: t("phonebook.public.headers.actions"),
        key: "actions",
        sortable: false,
        align: "end" as aligntype,
        width: "20%",
    },
]);

const typeOptions = computed(() => [
    { title: t("phonebook.add.types.phone"), value: "phone" },
    { title: t("phonebook.add.types.fax"), value: "fax" },
    { title: t("phonebook.add.types.ivr"), value: "ivr" },
    { title: t("phonebook.add.types.number_readout"), value: "number-readout" },
    { title: t("phonebook.add.types.music"), value: "music" },
    { title: t("phonebook.add.types.sip"), value: "sip" },
    { title: t("phonebook.add.types.modem"), value: "modem" },
    { title: t("phonebook.add.types.mobile"), value: "mobile" },
    { title: t("phonebook.add.types.voicemail"), value: "voicemail" },
    { title: t("phonebook.add.types.gateway"), value: "gateway" },
    { title: t("phonebook.add.types.conference"), value: "conference" },
    { title: t("phonebook.add.types.emergency"), value: "emergency" },
    { title: t("phonebook.add.types.other"), value: "other" },
]);

const languageOptions = computed(() => [
    { title: t("phonebook.add.languages.en"), value: "en" },
    { title: t("phonebook.add.languages.zhs"), value: "zhs" },
    { title: t("phonebook.add.languages.de"), value: "de" },
    { title: t("phonebook.add.languages.fr"), value: "fr" },
    { title: t("phonebook.add.languages.ru"), value: "ru" },
    { title: t("phonebook.add.languages.multi"), value: "multi" },
    { title: t("phonebook.add.languages.other"), value: "other" },
    { title: t("phonebook.add.languages.unknown"), value: "unknown" },
]);
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
                    {{ $t("phonebook.public.title") }}
                </h1>
                <p class="text-body-1 text-medium-emphasis">
                    {{ $t("phonebook.public.description") }}
                </p>
            </div>
            <div class="hidden-sm-and-down">
                <v-btn
                    class="mx-2"
                    color="primary"
                    variant="tonal"
                    @click="download('vcf')"
                    prepend-icon="mdi-card-account-details-outline"
                >
                    {{ $t("phonebook.public.downloadVcf") }}
                </v-btn>
                <v-btn
                    class="mx-2"
                    color="primary"
                    variant="tonal"
                    @click="download('csv')"
                    prepend-icon="mdi-file-delimited-outline"
                >
                    {{ $t("phonebook.public.downloadCsv") }}
                </v-btn>
                <v-btn
                    class="mx-2"
                    color="primary"
                    variant="tonal"
                    @click="download('json')"
                    prepend-icon="mdi-code-json"
                >
                    {{ $t("phonebook.public.downloadJson") }}
                </v-btn>
            </div>
        </div>

        <v-alert
            type="info"
            variant="tonal"
            icon="mdi-information-outline"
            border="start"
            class="mb-6 rounded-xl border-0 shadow-sm"
        >
            {{ $t("phonebook.public.info") }}
        </v-alert>

        <v-card class="border shadow-sm mb-6" elevation="0">
            <div class="pa-4 pa-md-6 bg-surface border-b">
                <v-row dense>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="search"
                            :label="$t('phonebook.public.search')"
                            prepend-inner-icon="mdi-magnify"
                            variant="outlined"
                            hide-details
                            density="comfortable"
                            bg-color="surface"
                            rounded="lg"
                            clearable
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="typeFilter"
                            :items="typeOptions"
                            :label="$t('phonebook.public.typeFilter')"
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            bg-color="surface"
                            rounded="lg"
                            clearable
                        ></v-select>
                    </v-col>
                    <v-col cols="12" sm="6" md="4">
                        <v-select
                            v-model="languageFilter"
                            :items="languageOptions"
                            :label="$t('phonebook.public.languageFilter')"
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            bg-color="surface"
                            rounded="lg"
                            clearable
                        ></v-select>
                    </v-col>
                </v-row>

                <div
                    class="d-flex ga-3 mt-4 justify-end flex-wrap align-center"
                    v-if="$vuetify.display.smAndDown"
                >
                    <v-menu location="bottom end">
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                color="primary"
                                variant="tonal"
                                prepend-icon="mdi-download"
                                class="flex-grow-1"
                            >
                                {{ $t("phonebook.public.download") }}
                            </v-btn>
                        </template>
                        <v-list rounded="lg">
                            <v-list-item
                                @click="download('vcf')"
                                prepend-icon="mdi-card-account-details-outline"
                                >{{
                                    $t("phonebook.public.downloadVcf")
                                }}</v-list-item
                            >
                            <v-list-item
                                @click="download('csv')"
                                prepend-icon="mdi-file-delimited-outline"
                                >{{
                                    $t("phonebook.public.downloadCsv")
                                }}</v-list-item
                            >
                            <v-list-item
                                @click="download('json')"
                                prepend-icon="mdi-code-json"
                                >{{
                                    $t("phonebook.public.downloadJson")
                                }}</v-list-item
                            >
                        </v-list>
                    </v-menu>
                </div>
            </div>

            <v-data-table-server
                v-model:items-per-page="options.itemsPerPage"
                v-model:page="options.page"
                :headers="headers"
                :items="entries"
                :items-length="totalItems"
                :loading="loading"
                hover
                class="bg-transparent px-2"
                :mobile-breakpoint="0"
                @update:options="loadEntries"
            >
                <template #item.number="{ item }">
                    <v-chip
                        color="primary"
                        class="font-weight-medium"
                        @click="copyToClipboard(item.number)"
                    >
                        {{ item.number }}
                    </v-chip>
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
                <template #item.name="{ item }">
                    <span class="font-weight-medium">{{ item.name }}</span>
                </template>
                <template #item.actions="{ item }">
                    <v-btn
                        icon="mdi-phone-forward"
                        variant="tonal"
                        color="success"
                        size="small"
                        class="mr-2"
                        :href="`tel:${item.number}`"
                        :title="$t('phonebook.public.call')"
                    ></v-btn>
                    <v-btn
                        icon="mdi-message-text"
                        variant="tonal"
                        color="info"
                        size="small"
                        class="mr-2"
                        :href="`sms:${item.number}`"
                        :title="$t('phonebook.public.sms')"
                    ></v-btn>
                </template>
            </v-data-table-server>
        </v-card>
    </div>
</template>

<style scoped>
.gap-4 {
    gap: 16px;
}
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
