<script setup lang="ts">
import { ref } from 'vue';
import { SdModal, SdButton, SdInput, SdSelect, SdToggle } from '@sanibase/ui';

const basicOpen = ref(false);
const formOpen = ref(false);
const lgOpen = ref(false);
const persistentOpen = ref(false);

const name = ref('');
const email = ref('');
const role = ref<string | null>(null);
const active = ref(true);

const roles = [
  { label: 'Tenant Owner', value: 'owner' },
  { label: 'Manager', value: 'manager' },
  { label: 'Staff', value: 'staff' },
];
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdModal</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Dialog overlay with backdrop, sizes, scrollable body, footer slot.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Basic</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Open Modal" @click="basicOpen = true" />
        <SdModal v-model:open="basicOpen" title="Basic Modal">
          <p class="text-sm text-sd-text-secondary">This is a basic modal with a title and close button. Click the X or press Escape to close.</p>
        </SdModal>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Form Modal</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Add Staff Member" variant="secondary" @click="formOpen = true" />
        <SdModal v-model:open="formOpen" title="Add Staff Member">
          <div class="space-y-4">
            <SdInput v-model="name" label="Full Name" placeholder="Enter name..." required />
            <SdInput v-model="email" label="Email" placeholder="staff@example.com" type="email" />
            <SdSelect v-model="role" :options="roles" label="Role" placeholder="Assign role..." />
            <SdToggle v-model="active" label="Active" />
          </div>
          <template #footer>
            <SdButton label="Cancel" variant="ghost" @click="formOpen = false" />
            <SdButton label="Add Member" variant="primary" @click="formOpen = false" />
          </template>
        </SdModal>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6 flex flex-wrap gap-2">
        <SdButton label="Large (720px)" variant="secondary-outline" @click="lgOpen = true" />
        <SdModal v-model:open="lgOpen" title="Large Modal" size="lg">
          <p class="text-sm text-sd-text-secondary mb-4">This is a large modal (max-width 720px). Good for detail views, complex forms, or side-by-side layouts.</p>
          <div class="grid grid-cols-2 gap-4">
            <SdInput label="First Name" placeholder="..." />
            <SdInput label="Last Name" placeholder="..." />
            <SdInput label="Email" placeholder="..." />
            <SdInput label="Phone" placeholder="..." />
          </div>
          <template #footer>
            <SdButton label="Cancel" variant="ghost" @click="lgOpen = false" />
            <SdButton label="Save" variant="primary" @click="lgOpen = false" />
          </template>
        </SdModal>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Persistent (no backdrop close)</h2>
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Confirm Delete" variant="danger" @click="persistentOpen = true" />
        <SdModal v-model:open="persistentOpen" title="Delete Item?" size="sm" persistent>
          <p class="text-sm text-sd-text-secondary">Are you sure you want to delete this item? This action cannot be undone.</p>
          <template #footer>
            <SdButton label="Cancel" variant="ghost" @click="persistentOpen = false" />
            <SdButton label="Delete" variant="danger" @click="persistentOpen = false" />
          </template>
        </SdModal>
      </div>
    </section>
  </div>
</template>
