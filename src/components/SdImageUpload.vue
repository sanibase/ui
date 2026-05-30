<script setup lang="ts">
import { computed, ref } from 'vue';
import { PhImage, PhTrash, PhUploadSimple } from '@phosphor-icons/vue';
import SdButton from './SdButton.vue';
import SdSpinner from './SdSpinner.vue';

export type ImageUploadSize = 'sm' | 'md' | 'touch';

export interface SdImageUploadProps {
  /** Current image URL (v-model) */
  modelValue?: string | null;
  /** Placeholder text */
  placeholder?: string;
  /** Accepted file types */
  accept?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Size variant */
  size?: ImageUploadSize;
  /** Show loading state */
  loading?: boolean;
  /** Disabled */
  disabled?: boolean;
  /** Aspect ratio for preview (e.g. '1/1', '16/9', '4/3') */
  aspectRatio?: string;
  /** Inline mode: compact square with hover-X delete, no button below */
  inline?: boolean;
}

const props = withDefaults(defineProps<SdImageUploadProps>(), {
  modelValue: null,
  placeholder: 'Click or drag to upload',
  accept: 'image/jpeg,image/png,image/webp',
  maxSize: 5 * 1024 * 1024,
  size: 'md',
  loading: false,
  disabled: false,
  aspectRatio: '1/1',
  inline: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'file-selected': [file: File];
  'error': [message: string];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const localPreview = ref<string | null>(null);

const previewUrl = computed(() => localPreview.value || props.modelValue);

function openPicker() {
  if (props.disabled || props.loading) return;
  fileInput.value?.click();
}

function handleFile(file: File) {
  if (!file.type.match(/^image\//)) {
    emit('error', 'File must be an image.');
    return;
  }
  if (file.size > props.maxSize) {
    const maxMB = Math.round(props.maxSize / 1024 / 1024);
    emit('error', `File must be under ${maxMB}MB.`);
    return;
  }

  // Show local preview immediately
  const reader = new FileReader();
  reader.onload = (e) => {
    localPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);

  emit('file-selected', file);
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) handleFile(file);
  input.value = '';
}

function onDrop(event: DragEvent) {
  isDragOver.value = false;
  if (props.disabled || props.loading) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) handleFile(file);
}

function remove() {
  localPreview.value = null;
  emit('update:modelValue', null);
}

const containerSize: Record<ImageUploadSize, string> = {
  sm: 'w-28 h-28',
  md: 'w-40 h-40',
  touch: 'w-48 h-48',
};

const inlineContainerSize: Record<ImageUploadSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  touch: 'w-12 h-12',
};

const iconSize: Record<ImageUploadSize, number> = {
  sm: 24,
  md: 32,
  touch: 40,
};

const textSize: Record<ImageUploadSize, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
  touch: 'text-sm',
};
</script>

<template>
  <div class="inline-flex flex-col gap-2">
    <!-- Upload area / Preview -->
    <div
      class="relative overflow-hidden transition-all duration-150"
      :class="[
        inline ? inlineContainerSize[size] : containerSize[size],
        inline ? 'rounded-sd-sm border' : 'rounded-sd-md border-2 border-dashed',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        isDragOver ? 'border-sd-orange bg-sd-orange/5' : previewUrl ? (inline ? 'border-sd-border' : 'border-transparent') : 'border-sd-border hover:border-sd-orange hover:bg-sd-orange/5',
      ]"
      :style="{ aspectRatio }"
      @click="openPicker"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <!-- Preview image -->
      <template v-if="previewUrl && !loading">
        <img
          :src="previewUrl"
          alt="Preview"
          class="w-full h-full object-cover"
        >
        <!-- Inline: hover X to delete -->
        <div
          v-if="inline && !disabled"
          class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          @click.stop="remove"
        >
          <PhTrash
            :size="inline ? 14 : iconSize[size]"
            weight="bold"
            class="text-white"
          />
        </div>
        <!-- Standard: hover overlay to re-upload -->
        <div
          v-else-if="!disabled"
          class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <PhUploadSimple
            :size="iconSize[size]"
            weight="bold"
            class="text-white"
          />
        </div>
      </template>

      <!-- Loading -->
      <template v-else-if="loading">
        <div class="w-full h-full flex items-center justify-center bg-sd-bg-alt">
          <SdSpinner :size="inline ? 'sm' : 'md'" />
        </div>
      </template>

      <!-- Empty state -->
      <template v-else>
        <div class="w-full h-full flex flex-col items-center justify-center gap-1.5 px-2">
          <PhImage
            :size="inline ? 16 : iconSize[size]"
            weight="light"
            class="text-sd-text-muted"
          />
          <span
            v-if="!inline"
            class="text-sd-text-muted text-center leading-tight"
            :class="textSize[size]"
          >{{ placeholder }}</span>
        </div>
      </template>

      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        class="hidden"
        @change="onFileChange"
      >
    </div>

    <!-- Remove button (standard mode only) -->
    <SdButton
      v-if="!inline && previewUrl && !disabled && !loading"
      label="Remove"
      variant="ghost"
      :size="size === 'touch' ? 'md' : 'sm'"
      @click="remove"
    >
      <template #icon-left>
        <PhTrash
          :size="14"
          weight="regular"
        />
      </template>
    </SdButton>
  </div>
</template>
