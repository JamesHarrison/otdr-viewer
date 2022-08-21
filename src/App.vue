<script setup lang="ts">


import { RouterLink, RouterView } from "vue-router";
</script>

<template>
<div class="container-fluid">
  <div class="row">
    <div class="col">
      <h1>OTDR Viewer</h1>
    </div>
  </div>
  <div class="row">
    <div class="col">
      <router-view></router-view>
    </div>
  </div>
  
</div>

</template>

<style scoped>
</style>
