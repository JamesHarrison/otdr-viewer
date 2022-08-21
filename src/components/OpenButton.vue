<script setup lang="ts">

import { ref } from 'vue'
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { useStore } from '../stores/files'
const fileStore = useStore()


async function openFile(event: any) {
    const selected = await open({
        multiple: false,
        filters: [{
            name: 'Bellcore OTDR SOR File',
            extensions: ['sor']
        }]
    });
    if (selected === null) {
        // user cancelled the selection
    } else if (typeof selected === "string") {
        fileStore.openFile(selected)
    }
}

</script>

<template>
    <button type="button" class="btn btn-primary" v-on:click="openFile">Open</button>
</template>

<style scoped>
</style>
