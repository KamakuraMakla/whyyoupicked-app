const CATEGORY_LABELS = {
  technology: 'テクノロジー',
  business: 'ビジネス',
  science: 'サイエンス',
  politics: '政治',
  sports: 'スポーツ',
  culture: 'カルチャー',
  general: '一般',
}

export function toCategoryLabel(category) {
  return CATEGORY_LABELS[category] || '一般'
}
