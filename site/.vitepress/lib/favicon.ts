/**
 * Иконка сайта. VitePress берёт статические файлы из `content/public`, а в
 * `content/` ничего складывать нельзя, — поэтому иконка встроена в <head>.
 */
export const favicon =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="14" fill="#3451b2"/>' +
      '<path d="M32 20c-4-3.5-9.5-5-16-5v30c6.5 0 12 1.5 16 5 4-3.5 9.5-5 16-5V15c-6.5 0-12 1.5-16 5z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M32 20v30" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>'
  )
