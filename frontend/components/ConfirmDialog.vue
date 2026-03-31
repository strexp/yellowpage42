<script setup lang="ts">
defineProps<{
    modelValue: boolean;
    title: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "confirm"): void;
}>();
</script>

<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        max-width="400"
    >
        <v-card elevation="10">
            <v-card-text class="pa-8 text-center">
                <v-avatar color="error" variant="tonal" size="72" class="mb-5">
                    <v-icon size="36">mdi-alert-outline</v-icon>
                </v-avatar>
                <h3 class="text-h5 font-weight-bold mb-3">{{ title }}</h3>
                <p class="text-body-1 text-medium-emphasis mb-8 px-2">
                    <slot></slot>
                </p>
                <v-row dense>
                    <v-col cols="12" sm="6" class="pb-2 pb-sm-0">
                        <v-btn
                            block
                            variant="tonal"
                            size="large"
                            color="medium-emphasis"
                            @click="emit('update:modelValue', false)"
                        >
                            {{ cancelText || $t("dialog.cancel") }}
                        </v-btn>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-btn
                            block
                            color="error"
                            size="large"
                            variant="flat"
                            :loading="loading"
                            @click="emit('confirm')"
                        >
                            {{ confirmText || $t("dialog.confirm") }}
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
