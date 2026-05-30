<script setup lang="ts">
import { SdModuleLocked, SdStatCard } from '@sanibase/ui';

function onUpgrade() {
  alert('Navigate to upgrade page');
}
</script>

<template>
  <div>
    <h1 class="font-heading text-2xl font-bold text-sd-text mb-2">SdModuleLocked</h1>
    <p class="text-sd-text-secondary text-sm mb-8">Greyed-out overlay for disabled or unpurchased modules.</p>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Default (over placeholder)</h2>
      <div class="max-w-md">
        <SdModuleLocked @action="onUpgrade" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Over Real Content</h2>
      <div class="max-w-lg">
        <SdModuleLocked
          title="Delivery Module"
          description="Track deliveries, assign drivers, and manage routes. Available on Business plan."
          action-label="See Plans"
          @action="onUpgrade"
        >
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <SdStatCard label="Active" value="12" variant="success" />
              <SdStatCard label="Pending" value="5" variant="warning" />
              <SdStatCard label="Completed" value="89" variant="purple" />
            </div>
            <div class="space-y-2">
              <div class="h-10 bg-sd-bg-alt rounded-sd-sm" />
              <div class="h-10 bg-sd-bg-alt rounded-sd-sm" />
              <div class="h-10 bg-sd-bg-alt rounded-sd-sm" />
            </div>
          </div>
        </SdModuleLocked>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">Sizes</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">sm</h3>
          <SdModuleLocked size="sm" title="Reports" description="Not in your plan." action-label="Upgrade" />
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">md (default)</h3>
          <SdModuleLocked size="md" />
        </div>
        <div>
          <h3 class="text-xs font-semibold text-sd-text-muted uppercase tracking-wide mb-3">touch</h3>
          <SdModuleLocked size="touch" />
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="font-heading text-lg font-semibold text-sd-text mb-4">No Action Button</h2>
      <div class="max-w-sm">
        <SdModuleLocked
          title="Coming Soon"
          description="This feature is under development."
          action-label=""
        />
      </div>
    </section>
  </div>
</template>
