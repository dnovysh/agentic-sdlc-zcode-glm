<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import BookHero from './BookHero.vue'
import { routeKey, useBook } from './book'

const { theme, site } = useData()
const route = useRoute()
const { progress, scrolled } = useBook()

const book = computed(() => theme.value.book)
// На серверной сборке маршрут приходит с base, в браузере — без.
const here = computed(() => routeKey(route.path, site.value.base))
const isHome = computed(() => here.value === '/')
const chapterFile = computed(
  () => book.value?.pages.find((item) => item.route === here.value)?.file
)

function toTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-top>
      <div class="book-progress" aria-hidden="true">
        <div class="book-progress-bar" :style="{ transform: `scaleX(${progress})` }" />
      </div>
      <button v-if="scrolled" class="book-top" type="button" aria-label="Наверх" @click="toTop">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </svg>
      </button>
    </template>

    <template #doc-before>
      <BookHero v-if="isHome && book" :book="book" />
    </template>

    <template #doc-footer-before>
      <p v-if="book" class="book-note">
        <a v-if="book.pdf" :href="book.pdf" target="_blank" rel="noopener">Открыть PDF</a>
        <template v-if="chapterFile">
          <span class="book-note-sep" aria-hidden="true">·</span>
          <a
            :href="`${book.repo}/edit/main/content/${chapterFile}`"
            target="_blank"
            rel="noopener"
          >Предложить правку</a>
        </template>
        <br />
        Текст книги распространяется по лицензии CC BY-NC 4.0, промпты, команды и примеры кода — по CC0 1.0.
        <a :href="`${book.repo}/blob/main/NOTICE.md`" target="_blank" rel="noopener">Авторы и заимствования</a>
      </p>
    </template>
  </DefaultTheme.Layout>
</template>
