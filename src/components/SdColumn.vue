<script setup lang="ts">
import Column from 'primevue/column';

export interface SdColumnProps {
  field?: string;
  header?: string;
  sortable?: boolean;
  frozen?: boolean;
  alignFrozen?: 'left' | 'right';
  style?: string | Record<string, string>;
  headerStyle?: string | Record<string, string>;
  bodyStyle?: string | Record<string, string>;
}

defineProps<SdColumnProps>();
</script>

<template>
  <Column
    :field="field"
    :header="header"
    :sortable="sortable"
    :frozen="frozen"
    :align-frozen="alignFrozen"
    :style="style"
    :header-style="headerStyle"
    :body-style="bodyStyle"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData ?? {}"
      />
    </template>
  </Column>
</template>
