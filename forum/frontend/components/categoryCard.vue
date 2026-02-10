<script lang="ts" setup>
defineProps<{
  category: category;
}>();
</script>

<template>
  <v-hover>
    <template v-slot:default="{ isHovering, props }">
      <v-card
          :class="isHovering ? 'hover' : ''"
          :color="category.color"
          :to="`/posts?categoryId=${category.categoryId}`"
          class="category-card w-100 px-2 pb-2 rounded-lg"
          v-bind="props"
      >
        <v-card-item class="text-center">
          <v-card-title>{{ category.name }}</v-card-title>
        </v-card-item>
        <v-img :src="category.url" class="category-image rounded-lg"></v-img>
      </v-card>
    </template>
  </v-hover>
</template>

<style lang="scss" scoped>
.category-card {
  transition: transform 200ms ease;

  &.hover {
    transform: scale(1.05);
  }
}
</style>
