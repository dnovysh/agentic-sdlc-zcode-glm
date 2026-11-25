import { inBrowser, onContentUpdated } from 'vitepress'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { normalizeTerm } from '../lib/search'
import { SHELL_KEY, TASKS_KEY, type Shell } from '../lib/storage'

type Tasks = Record<string, boolean>

/**
 * Приводит адрес страницы к маршруту книги: без base, «.html» и «index».
 * На серверной сборке маршрут приходит с base, в браузере — без.
 */
export function routeKey(path: string, base = '/'): string {
  const prefix = base !== '/' && path.startsWith(base) ? base.slice(0, -1) : ''
  const normalized = path.slice(prefix.length).replace(/\.html$/, '').replace(/\/index$/, '')
  return normalized || '/'
}

function readTasks(): Tasks {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TASKS_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? (parsed as Tasks) : {}
  } catch {
    return {}
  }
}

function writeTasks(tasks: Tasks): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  } catch {
    // Хранилище недоступно: отметки живут до перезагрузки страницы.
  }
}

function setShell(shell: Shell): void {
  document.documentElement.dataset.shell = shell
  try {
    localStorage.setItem(SHELL_KEY, shell)
  } catch {
    // Без хранилища выбор действует, пока открыта вкладка.
  }
  syncTabs()
}

/** Атрибуты вкладок следуют за выбором; видимость панелей задаёт CSS по html[data-shell]. */
function syncTabs(): void {
  const shell = document.documentElement.dataset.shell
  for (const tab of document.querySelectorAll<HTMLElement>('[data-shell-tab]')) {
    const active = tab.dataset.shellTab === shell
    tab.setAttribute('aria-selected', String(active))
    tab.tabIndex = active ? 0 : -1
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return legacyCopy(text)
  }
}

/** Запасной путь для контекстов без clipboard API. */
function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const copied = document.execCommand('copy')
  area.remove()
  return copied
}

function showCopied(button: HTMLElement, copied: boolean): void {
  button.classList.add('copied')
  button.textContent = copied ? 'Скопировано' : 'Не удалось скопировать'
  window.setTimeout(() => {
    button.classList.remove('copied')
    button.textContent = 'Копировать'
  }, 1600)
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

function onClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null
  if (!target) return

  const tab = target.closest<HTMLElement>('[data-shell-tab]')
  if (tab?.dataset.shellTab) {
    setShell(tab.dataset.shellTab as Shell)
    return
  }

  const copy = target.closest<HTMLButtonElement>('.prompt-copy')
  if (copy && !copy.classList.contains('copied')) {
    void copyText(copy.dataset.copy ?? '').then((copied) => showCopied(copy, copied))
  }
}

function onKeydown(event: KeyboardEvent): void {
  // У локального поиска VitePress 1.6 нет горячих клавиш. Сверяемся с кодом клавиши,
  // чтобы Ctrl+K работал и в русской раскладке, где на месте «k» приходит «л».
  const search =
    ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.code === 'KeyK') ||
    (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(event.target))

  if (search && !document.querySelector('.VPLocalSearchBox')) {
    event.preventDefault()
    document.querySelector<HTMLButtonElement>('#local-search button')?.click()
  }

  const tab = event.target instanceof Element ? event.target.closest('[data-shell-tab]') : null
  if (tab && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    event.preventDefault()
    const sibling =
      event.key === 'ArrowRight' ? tab.nextElementSibling : tab.previousElementSibling
    if (sibling instanceof HTMLElement) {
      sibling.click()
      sibling.focus()
    }
  }
}

function updateProgress(list: Element | null): void {
  const label = list?.previousElementSibling
  if (!label?.classList.contains('task-progress')) return

  const boxes = list.querySelectorAll<HTMLInputElement>('.task-checkbox')
  const done = Array.from(boxes).filter((box) => box.checked).length
  const text = label.querySelector('.task-progress-text')
  const bar = label.querySelector<HTMLElement>('.task-progress-bar > i')
  if (text) text.textContent = `Отмечено ${done} из ${boxes.length}`
  if (bar) bar.style.width = `${(100 * done) / boxes.length}%`
}

function onChange(event: Event): void {
  const box = event.target
  if (!(box instanceof HTMLInputElement) || !box.matches('.task-checkbox')) return

  const key = box.dataset.key
  if (!key) return
  const tasks = readTasks()
  tasks[key] = box.checked
  writeTasks(tasks)
  updateProgress(box.closest('.contains-task-list'))
}

function onInput(event: Event): void {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.matches('.prompt-index-filter')) return

  const root = input.closest('.prompt-index')
  if (!root) return
  const query = normalizeTerm(input.value.trim())
  let shown = 0
  for (const row of root.querySelectorAll<HTMLElement>('tbody tr')) {
    const match = !query || normalizeTerm(row.dataset.search ?? '').includes(query)
    row.hidden = !match
    if (match) shown++
  }
  const empty = root.querySelector<HTMLElement>('.prompt-index-empty')
  if (empty) empty.hidden = shown > 0
}

/** Выполняется после отрисовки каждой страницы. */
function refreshPage(): void {
  const tasks = readTasks()
  for (const box of document.querySelectorAll<HTMLInputElement>('.task-checkbox')) {
    box.checked = tasks[box.dataset.key ?? ''] === true
  }

  for (const list of document.querySelectorAll<HTMLElement>('.vp-doc .contains-task-list')) {
    let label = list.previousElementSibling
    if (!label?.classList.contains('task-progress')) {
      label = document.createElement('p')
      label.className = 'task-progress'
      label.innerHTML =
        '<span class="task-progress-text"></span>' +
        '<span class="task-progress-bar" aria-hidden="true"><i></i></span>'
      list.before(label)
    }
    updateProgress(list)
  }

  syncTabs()
}

/** Всё интерактивное в книге: вкладки, чек-листы, копирование, поиск, прогресс чтения. */
export function useBook() {
  const progress = ref(0)
  const scrolled = ref(false)

  function measure(): void {
    if (!inBrowser) return
    const root = document.documentElement
    const max = root.scrollHeight - root.clientHeight
    progress.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
    scrolled.value = window.scrollY > window.innerHeight
  }

  const listeners = [
    ['click', onClick],
    ['keydown', onKeydown],
    ['change', onChange],
    ['input', onInput],
    ['scroll', measure],
    ['resize', measure]
  ] as const

  onMounted(() => {
    for (const [type, handler] of listeners) document.addEventListener(type, handler, { passive: type !== 'click' && type !== 'keydown' })
  })

  onBeforeUnmount(() => {
    for (const [type, handler] of listeners) document.removeEventListener(type, handler)
  })

  onContentUpdated(() => {
    refreshPage()
    measure()
  })

  return { progress, scrolled }
}
