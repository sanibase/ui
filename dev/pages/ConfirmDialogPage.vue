<script setup lang="ts">
import { ref } from 'vue';
import { SdConfirmDialog, SdButton } from '@sanibase/ui';

const defaultOpen = ref(false);
const dangerOpen = ref(false);
const loadingOpen = ref(false);
const customOpen = ref(false);
const isDeleting = ref(false);

function simulateDelete() {
  isDeleting.value = true;
  setTimeout(() => {
    isDeleting.value = false;
    loadingOpen.value = false;
  }, 1500);
}
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdConfirmDialog</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Simple confirmation dialog for destructive or important actions. Wraps SdModal with pre-built cancel/confirm buttons.</p>

    <!-- ── DEFAULT ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Default</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Save Changes" variant="primary" @click="defaultOpen = true" />
        <SdConfirmDialog
          v-model:open="defaultOpen"
          title="Save changes?"
          message="Your changes to the menu will be published immediately. Customers will see the updated prices."
          confirm-label="Save"
          @confirm="defaultOpen = false"
        />
      </div>
    </section>

    <!-- ── DANGER ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Danger Variant</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Delete Item" variant="danger" @click="dangerOpen = true" />
        <SdConfirmDialog
          v-model:open="dangerOpen"
          title="Delete menu item?"
          message="This will permanently remove 'Margherita Pizza' from your menu. This action cannot be undone."
          variant="danger"
          confirm-label="Delete"
          @confirm="dangerOpen = false"
        />
      </div>
    </section>

    <!-- ── WITH LOADING ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">With Loading State</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Delete Category" variant="danger" @click="loadingOpen = true" />
        <p class="text-xs text-sd-text-muted mt-2">Confirm button shows spinner during async operation.</p>
        <SdConfirmDialog
          v-model:open="loadingOpen"
          title="Delete category?"
          message="This will remove the 'Desserts' category and unassign all 6 items. Items will not be deleted."
          variant="danger"
          confirm-label="Delete"
          :loading="isDeleting"
          @confirm="simulateDelete"
        />
      </div>
    </section>

    <!-- ── CUSTOM BODY ── -->
    <h2 class="font-heading text-xl font-bold text-sd-text mb-6 border-b border-sd-border pb-2">Custom Body Content</h2>
    <section class="mb-10">
      <div class="bg-white rounded-sd-md border border-sd-border p-6">
        <SdButton label="Cancel Order" variant="outline" @click="customOpen = true" />
        <SdConfirmDialog
          v-model:open="customOpen"
          title="Cancel order #1042?"
          variant="danger"
          confirm-label="Cancel Order"
          @confirm="customOpen = false"
        >
          <div class="space-y-3">
            <p class="text-sm text-sd-text-secondary">This order is currently being prepared. Cancelling will:</p>
            <ul class="text-sm text-sd-text-secondary list-disc pl-5 space-y-1">
              <li>Notify the kitchen to stop preparation</li>
              <li>Refund CHF 45.50 to the customer</li>
              <li>Send a cancellation email</li>
            </ul>
          </div>
        </SdConfirmDialog>
      </div>
    </section>
  </div>
</template>
