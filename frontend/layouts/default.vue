<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
const authStore = useAuthStore();
</script>

<template>
    <v-app class="bg-background min-h-screen">
        <AppNavigation />

        <v-main>
            <div class="d-flex flex-column min-h-100">
                <v-container
                    class="py-6 py-md-12 px-4 flex-grow-1"
                    max-width="1200"
                >
                    <NuxtPage />
                </v-container>
                <AppFooter />
            </div>
        </v-main>

        <GlobalSnackbar />
    </v-app>
</template>

<style>
html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
.bg-background {
    background-color: rgb(var(--v-theme-background)) !important;
}
.z-index-1 {
    z-index: 1;
}
.pointer-events-none {
    pointer-events: none;
}
.bg-gradient {
    background: linear-gradient(
        135deg,
        rgb(var(--v-theme-primary)) 0%,
        rgba(var(--v-theme-primary), 0.85) 100%
    );
}
.hero-bg-pattern {
    background-image: radial-gradient(
        rgba(255, 255, 255, 0.15) 2px,
        transparent 2px
    );
    background-size: 24px 24px;
}
.hover-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
}
.cursor-pointer {
    cursor: pointer;
}
.lh-1 {
    line-height: 1.2;
}
.shadow-sm {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04) !important;
}
.shadow-top {
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04) !important;
}
.min-h-100 {
    min-height: 100%;
}
</style>
