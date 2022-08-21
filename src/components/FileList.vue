<script setup lang="ts">
import OpenButton from './OpenButton.vue';
import { useStore } from '../stores/files'
const fileStore = useStore()
// TODO: Better method for auto-opening files for debugging.
// fileStore.openFile("C:\\code\\otdr\\otdr-examples\\darren-otdr\\Fiber1_1310.sor");
// fileStore.openFile("C:\\code\\otdr\\otdr-examples\\darren-otdr\\se-angfr cdc e7 to fanout 06-15.sor");
// fileStore.openFile("C:\\code\\otdr\\otdr-examples\\darren-otdr\\se-angfr cdc f6 to fanout 12-18.sor");
// // fileStore.setCurrentFile("C:\\code\\otdr\\otdr-examples\\darren-otdr\\Fiber1_1310.sor")

</script>

<template>
  <OpenButton></OpenButton>
  <table class="table">
    <thead>
      <tr>
        <th scope="col">Filename</th>
      </tr>
    </thead>
    <tbody>
      <tr v-on:click="fileStore.setCurrentFile(file)" v-for="[file, data] in fileStore.files">
        <td>{{ file }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
</style>
