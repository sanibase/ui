<script setup lang="ts">
export interface SdWordmarkProps {
  suffix?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  dark?: boolean;
}

withDefaults(defineProps<SdWordmarkProps>(), {
  suffix: 'Desk',
  size: 'md',
  showIcon: false,
  dark: false,
});

const sizeClasses: Record<string, { text: string; icon: string; gap: string }> = {
  sm: { text: 'text-lg', icon: 'w-5 h-6', gap: 'gap-1.5' },
  md: { text: 'text-xl', icon: 'w-6 h-7', gap: 'gap-2' },
  lg: { text: 'text-3xl', icon: 'w-8 h-10', gap: 'gap-2.5' },
  xl: { text: 'text-5xl', icon: 'w-12 h-14', gap: 'gap-3' },
};
</script>

<template>
  <span
    class="inline-flex items-center font-heading font-medium tracking-tight"
    :class="[sizeClasses[size].text, sizeClasses[size].gap]"
  >
    <svg
      v-if="showIcon"
      :class="sizeClasses[size].icon"
      viewBox="267.3 246 95.4 121.8"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="wm-grad"
          gradientUnits="userSpaceOnUse"
          x1="267.3"
          y1="0"
          x2="362.7"
          y2="0"
        >
          <stop
            offset="0%"
            stop-color="#FF8C42"
          />
          <stop
            offset="50%"
            stop-color="#FF6B6B"
          />
          <stop
            offset="100%"
            stop-color="#D65D7A"
          />
        </linearGradient>
      </defs>
      <path
        fill="url(#wm-grad)"
        d="M282.1,311l1,1.5l1.1,1.5c7.1,9.4,17.9,15.1,29.7,15.6l1.8,0l0.8,0c5.5-0.6,8.7-6.3,6.3-11.3l-0.4-0.7l-0.5-0.6l-0.5-0.6l-0.6-0.6l-0.6-0.5l-0.7-0.4l-0.7-0.3c-2.3-1.1-4.7-0.4-7.3-1l-1.4-0.3l-1.4-0.4c-3.6-1.1-6.9-3-9.6-5.7l-1-1l-0.9-1.1l-0.9-1.1c-5.3-7.4-5.9-17.2-1.5-25.2l0.7-1.2l0.8-1.2l0.9-1.1l0.9-1.1l1-1c2.3-2.3,5.2-4.1,8.2-5.2l1.3-0.4l1.4-0.4l1.4-0.3l1.4-0.2l1.4-0.1l1.4,0l0.8-0.1l0.8-0.1l0.8-0.2l0.8-0.3l0.7-0.4l0.7-0.4l0.6-0.5c4.4-3.8,3.3-10.9-2-13.2l-0.8-0.3l-0.8-0.2l-0.8-0.1l-0.8,0l-1.8,0L312,251l-1.8,0.2c-27.5,4-42.4,33.9-29,58.3L282.1,311z"
      />
      <path
        fill="url(#wm-grad)"
        d="M314.8,282.4l-0.8,0.1l-0.8,0.2c-4.6,1.4-6.9,6.7-4.7,11l0.4,0.7l0.4,0.7l0.5,0.6c1.3,1.4,3.1,2.3,4.9,2.4l0.8,0.1l1.4,0c3.2,0.1,6.6,1.1,9.4,2.5l1.3,0.7l1.2,0.8l1.1,0.8l1.1,0.9l1.1,0.9c6.2,6.1,8.7,14.9,6.4,23.3l-0.4,1.3l-0.5,1.3c-3.3,8-10.6,13.6-19.3,14.6l-1.4,0.1l-1.4,0l-0.8,0.1l-0.8,0.1l-0.8,0.2l-0.8,0.3c-4.8,2.1-6.3,8-3.1,12.1l0.5,0.6l0.6,0.6l0.6,0.5c2,1.4,3.9,1.5,6.3,1.4l1.8-0.1l1.8-0.2c4.3-0.6,8.2-1.8,12.1-3.8l1.6-0.8l1.6-0.9l1.5-1l1.5-1.1l1.4-1.1c8.5-7.1,13.6-17.4,14.1-28.5l0.1-1.8v-23.7c0.1-6.9-4.5-13.2-11.2-15.1l-1.1-0.3l-1.1-0.2l-1.1-0.1l-1.1,0h-23.6L314.8,282.4z"
      />
    </svg>
    <span>
      <span :class="dark ? 'text-white' : 'text-sd-text'">Sani</span><span class="sd-wordmark-gradient">{{ suffix }}</span>
    </span>
  </span>
</template>

<style>
.sd-wordmark-gradient {
  background: var(--sd-gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}
</style>
