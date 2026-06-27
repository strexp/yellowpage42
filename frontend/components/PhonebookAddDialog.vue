<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useSnackbar } from "~/composables/useSnackbar";
import { useI18n } from "vue-i18n";
import { getEnglishName } from "all-iso-language-codes";
import langs from "@/assets/lang.json";
import type { PhoneEntry } from "~/types";

const props = defineProps<{ modelValue: boolean; entry?: PhoneEntry | null }>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "saved"): void;
}>();

const { $api } = useNuxtApp();
const authStore = useAuthStore();
const { showSnackbar } = useSnackbar();
const { t, te } = useI18n();

const dialogFormRef = ref();
const saving = ref(false);

const isEdit = computed(() => !!props.entry);

const languageOptions = computed(() => {
    return langs.map((l) => {
        let label = l;
        if (te(`lang.${l}`)) {
            label = t(`lang.${l}`);
        } else {
            label = getEnglishName(l) || l;
        }
        return { title: `${label} (${l})`, value: l };
    });
});

const newEntry = ref({
    prefix: "",
    extension: "",
    name: "",
    type: "other",
    language: "und",
    hidden: false,
});

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            if (props.entry) {
                const matchedPrefix =
                    authStore.user?.telephony.find((p) =>
                        props.entry!.number.startsWith(p),
                    ) || "";
                const suffix = matchedPrefix
                    ? props.entry!.number.slice(matchedPrefix.length)
                    : props.entry!.number;
                newEntry.value = {
                    prefix: matchedPrefix,
                    extension: suffix,
                    name: props.entry!.name,
                    type: props.entry!.type,
                    language: props.entry!.language,
                    hidden: props.entry!.hidden,
                };
            } else {
                newEntry.value = {
                    prefix: authStore.user?.telephony[0] || "",
                    extension: "",
                    name: "",
                    type: "other",
                    language: "und",
                    hidden: false,
                };
            }
            if (dialogFormRef.value) dialogFormRef.value.resetValidation();
        }
    },
);

const close = () => {
    emit("update:modelValue", false);
};

const saveEntry = async () => {
    const { valid } = await dialogFormRef.value.validate();
    if (!valid) return;

    saving.value = true;
    try {
        const fullNumber = `${newEntry.value.prefix}${newEntry.value.extension}`;
        const data = {
            number: fullNumber,
            name: newEntry.value.name,
            type: newEntry.value.type,
            language: newEntry.value.language,
            hidden: newEntry.value.hidden,
        };
        if (isEdit.value && props.entry) {
            await $api(`/phonebook/me/${props.entry.id}`, {
                method: "PUT",
                body: data,
            });
            showSnackbar(t("phonebook.add.editSuccess"), "success");
        } else {
            await $api("/phonebook/me", { method: "POST", body: data });
            showSnackbar(t("phonebook.add.success"), "success");
        }
        emit("saved");
        close();
    } catch (e: unknown) {
        const errorMsg = (e as { data?: { error?: string } })?.data?.error;
        showSnackbar(
            errorMsg ||
                (isEdit.value
                    ? t("phonebook.add.editFailed")
                    : t("phonebook.add.failed")),
            "error",
        );
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        max-width="550"
        :fullscreen="$vuetify.display.smAndDown"
        :transition="
            $vuetify.display.smAndDown
                ? 'dialog-bottom-transition'
                : 'dialog-transition'
        "
        persistent
    >
        <v-card
            :rounded="$vuetify.display.smAndDown ? '0' : 'xl'"
            class="d-flex flex-column h-100"
        >
            <v-toolbar
                v-if="$vuetify.display.smAndDown"
                color="surface"
                class="border-b"
                elevation="0"
            >
                <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
                <v-toolbar-title class="font-weight-bold text-body-1">{{
                    isEdit
                        ? $t("phonebook.add.editTitle")
                        : $t("phonebook.add.title")
                }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    variant="text"
                    :loading="saving"
                    @click="saveEntry"
                    class="font-weight-bold"
                    >{{ $t("phonebook.add.save") }}</v-btn
                >
            </v-toolbar>

            <v-card-title
                v-else
                class="pa-6 pb-2 text-h5 font-weight-bold d-flex align-center justify-space-between"
            >
                {{
                    isEdit
                        ? $t("phonebook.add.editTitle")
                        : $t("phonebook.add.title")
                }}
                <v-btn
                    icon="mdi-close"
                    variant="text"
                    density="comfortable"
                    @click="close"
                ></v-btn>
            </v-card-title>

            <v-card-text
                :class="
                    $vuetify.display.smAndDown
                        ? 'pa-4 flex-grow-1 overflow-y-auto'
                        : 'px-6 pt-2 pb-6'
                "
            >
                <v-form ref="dialogFormRef" @submit.prevent="saveEntry">
                    <div class="text-body-2 text-medium-emphasis mb-6">
                        {{ $t("phonebook.add.description") }}
                    </div>

                    <v-select
                        v-if="authStore.user?.telephony.length"
                        v-model="newEntry.prefix"
                        :items="authStore.user.telephony"
                        :label="$t('phonebook.add.prefixLabel')"
                        variant="outlined"
                        bg-color="surface"
                        class="mb-4"
                    ></v-select>

                    <v-text-field
                        v-model="newEntry.extension"
                        :prefix="newEntry.prefix"
                        :label="$t('phonebook.add.suffixLabel')"
                        :placeholder="$t('phonebook.add.suffixPlaceholder')"
                        variant="outlined"
                        bg-color="surface"
                        class="mb-4"
                        :maxlength="15 - newEntry.prefix.length"
                        :rules="[
                            (v) =>
                                !!v || $t('phonebook.add.rules.suffixRequired'),
                            (v) =>
                                /^\d+$/.test(v) ||
                                $t('phonebook.add.rules.suffixDigits'),
                        ]"
                    ></v-text-field>

                    <v-row dense class="mb-2">
                        <v-col cols="12" sm="6">
                            <v-select
                                v-model="newEntry.type"
                                :items="[
                                    {
                                        title: $t('phonebook.add.types.phone'),
                                        value: 'phone',
                                    },
                                    {
                                        title: $t('phonebook.add.types.fax'),
                                        value: 'fax',
                                    },
                                    {
                                        title: $t('phonebook.add.types.ivr'),
                                        value: 'ivr',
                                    },
                                    {
                                        title: $t(
                                            'phonebook.add.types.number_readout',
                                        ),
                                        value: 'number-readout',
                                    },
                                    {
                                        title: $t('phonebook.add.types.music'),
                                        value: 'music',
                                    },
                                    {
                                        title: t('phonebook.add.types.sip'),
                                        value: 'sip',
                                    },
                                    {
                                        title: $t('phonebook.add.types.modem'),
                                        value: 'modem',
                                    },
                                    {
                                        title: $t('phonebook.add.types.mobile'),
                                        value: 'mobile',
                                    },
                                    {
                                        title: $t(
                                            'phonebook.add.types.voicemail',
                                        ),
                                        value: 'voicemail',
                                    },
                                    {
                                        title: $t(
                                            'phonebook.add.types.gateway',
                                        ),
                                        value: 'gateway',
                                    },
                                    {
                                        title: $t(
                                            'phonebook.add.types.conference',
                                        ),
                                        value: 'conference',
                                    },
                                    {
                                        title: $t(
                                            'phonebook.add.types.emergency',
                                        ),
                                        value: 'emergency',
                                    },
                                    {
                                        title: $t('phonebook.add.types.other'),
                                        value: 'other',
                                    },
                                ]"
                                :label="$t('phonebook.add.typeLabel')"
                                variant="outlined"
                                bg-color="surface"
                            ></v-select>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-autocomplete
                                v-model="newEntry.language"
                                :items="languageOptions"
                                item-title="title"
                                item-value="value"
                                :label="$t('phonebook.add.languageLabel')"
                                variant="outlined"
                                bg-color="surface"
                            ></v-autocomplete>
                        </v-col>
                    </v-row>

                    <v-text-field
                        v-model="newEntry.name"
                        :label="$t('phonebook.add.nameLabel')"
                        :placeholder="$t('phonebook.add.namePlaceholder')"
                        variant="outlined"
                        bg-color="surface"
                        class="mb-2"
                        :maxlength="50"
                        :rules="[
                            (v) =>
                                !!v || $t('phonebook.add.rules.nameRequired'),
                            (v) =>
                                v.length <= 50 ||
                                $t('phonebook.add.rules.nameMax'),
                        ]"
                    ></v-text-field>

                    <v-switch
                        v-model="newEntry.hidden"
                        :label="$t('phonebook.add.hiddenLabel')"
                        color="primary"
                        inset
                        hide-details
                        class="mb-4"
                    ></v-switch>
                </v-form>
            </v-card-text>

            <v-card-actions
                v-if="!$vuetify.display.smAndDown"
                class="pa-6 pt-0"
            >
                <v-spacer></v-spacer>
                <v-btn
                    variant="text"
                    color="medium-emphasis"
                    @click="close"
                    class="px-4"
                    size="large"
                    >{{ $t("phonebook.add.cancel") }}</v-btn
                >
                <v-btn
                    color="primary"
                    variant="flat"
                    :loading="saving"
                    @click="saveEntry"
                    class="px-6"
                    size="large"
                    >{{ $t("phonebook.add.save") }}</v-btn
                >
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
