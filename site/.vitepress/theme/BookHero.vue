<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'
import type { BookSiteData, BookSitePage } from '../lib/site-data'

const props = defineProps<{ book: BookSiteData }>()

const contents = computed(() => props.book.pages.filter((page) => page.route !== '/'))

/** «Глава 1. Название» раскладывается на номер и название; у остальных частей номера нет. */
function split(page: BookSitePage): { badge: string; title: string } {
  const match = /^(?:Глава (\d+)|Приложение ([А-ЯA-Z]))\.\s+(.+)$/.exec(page.title)
  return match ? { badge: match[1] ?? match[2], title: match[3] } : { badge: '', title: page.title }
}

/** 1 промпт, 2 промпта, 5 промптов. */
function plural(count: number, forms: [string, string, string]): string {
  const [one, few, many] = forms
  const tail = Math.abs(count) % 10
  const hundreds = Math.abs(count) % 100
  if (tail === 1 && hundreds !== 11) return `${count} ${one}`
  if (tail >= 2 && tail <= 4 && (hundreds < 12 || hundreds > 14)) return `${count} ${few}`
  return `${count} ${many}`
}
</script>

<template>
  <header class="book-hero">
    <p class="book-hero-eyebrow">ZCode 4.0 · GLM 5.x</p>
    <p class="book-hero-title">{{ book.title }}</p>
    <p class="book-hero-lead">
      Как подготовить репозиторий, чтобы агент работал по правилам команды и сам проверял свою
      работу.
    </p>

    <ul class="book-hero-stats">
      <li>{{ plural(book.chapters, ['глава', 'главы', 'глав']) }}</li>
      <li>{{ plural(book.appendices, ['приложение', 'приложения', 'приложений']) }}</li>
      <li>{{ plural(book.prompts, ['промпт', 'промпта', 'промптов']) }}</li>
    </ul>

    <p class="book-hero-actions">
      <a class="book-button is-brand" :href="withBase(book.start)">Начать читать</a>
      <a v-if="book.promptsPage" class="book-button" :href="withBase(book.promptsPage)">Все промпты</a>
      <a v-if="book.pdf" class="book-button" :href="book.pdf" target="_blank" rel="noopener">Открыть PDF</a>
    </p>

    <nav class="book-toc" aria-label="Оглавление">
      <p class="book-toc-title">Оглавление</p>
      <ol class="book-toc-list">
        <li v-for="page in contents" :key="page.route" class="book-toc-item">
          <a class="book-toc-link" :href="withBase(page.route)">
            <span v-if="split(page).badge" class="book-toc-badge">{{ split(page).badge }}</span>
            <span class="book-toc-text">{{ split(page).title }}</span>
            <span v-if="page.prompts" class="book-toc-meta">
              {{ plural(page.prompts, ['промпт', 'промпта', 'промптов']) }}
            </span>
          </a>
        </li>
      </ol>
    </nav>

    <p class="book-hero-note">
      Адаптация книги Тёмы Пулявина «Как построить Agentic SDLC в своём репозитории».
      Автор адаптации — Denis Novysh.
    </p>
  </header>
</template>
