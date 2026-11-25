/**
 * Токенизация для поиска. Разбивает по пробелам и знакам препинания — так же,
 * как MiniSearch по умолчанию, — и приводит «ё» к «е», чтобы запрос «все»
 * находил «всё».
 */
export function tokenize(text: string): string[] {
  return text.split(/[\n\r\p{Z}\p{P}]+/u).filter(Boolean)
}

export function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/ё/g, 'е')
}
