<template>
  <div class="mermaid-block">
    <div
      :key="theme"
      ref="diagramElement"
      class="mermaid-diagram"
      :class="{ rendered: hasRendered }"
      :style="{ minHeight }"
      aria-label="Mermaid diagram"
      role="img"
    >
      {{ code }}
    </div>

    <div v-if="renderError" class="mermaid-error" role="alert">
      <strong>Mermaid 图表渲染失败</strong>
      <pre>{{ code }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
  code: string
}>()

const { isDark } = useData()
const theme = computed(() => isDark.value ? 'dark' : 'default')
const diagramElement = ref<HTMLElement | null>(null)
const hasRendered = ref(false)
const minHeight = ref('8rem')
const renderError = ref(false)
let renderVersion = 0

watch(
  [diagramElement, theme, () => props.code],
  async ([element]) => {
    if (!element) return

    const version = ++renderVersion
    hasRendered.value = false
    renderError.value = false

    await nextTick()
    element.textContent = props.code
    element.removeAttribute('data-processed')

    const { default: mermaid } = await import('mermaid')
    if (version !== renderVersion) return

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: theme.value
    })

    try {
      await mermaid.run({ nodes: [element] })
      if (version !== renderVersion) return

      hasRendered.value = true
      const height = element.getBoundingClientRect().height
      if (height > 0) minHeight.value = `${Math.ceil(height)}px`
    } catch (error) {
      if (version !== renderVersion) return

      element.replaceChildren()
      minHeight.value = '0'
      renderError.value = true
      console.error('Mermaid rendering error:', error)
    }
  },
  { immediate: true, flush: 'post' }
)
</script>

<style scoped>
.mermaid-block {
  margin: 1.5rem 0;
  overflow-x: auto;
}

.mermaid-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: max-content;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mermaid-diagram.rendered {
  min-width: 0;
  opacity: 1;
}

.mermaid-diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}

.mermaid-error {
  padding: 1rem;
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  border-radius: 8px;
}

.mermaid-error pre {
  margin: 0.75rem 0 0;
  overflow-x: auto;
  color: var(--vp-c-text-1);
  white-space: pre;
}
</style>
