/** Ключи localStorage и обозначения оболочек: общие для сборки и клиентских скриптов. */
export const SHELL_KEY = 'book:shell'
export const TASKS_KEY = 'book:tasks'

export type Shell = 'bash' | 'powershell'

export function isShell(value: unknown): value is Shell {
  return value === 'bash' || value === 'powershell'
}

/** Скрипт в <head>: выбирает оболочку до первой отрисовки, чтобы вкладки не мигали. */
export const shellScript = `;(() => {
  const root = document.documentElement
  root.classList.add('js')
  let shell = ''
  try {
    shell = localStorage.getItem(${JSON.stringify(SHELL_KEY)}) || ''
  } catch {}
  if (shell !== 'bash' && shell !== 'powershell') {
    const source = navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform
    shell = /win/i.test(source || '') ? 'powershell' : 'bash'
  }
  root.dataset.shell = shell
})()`
