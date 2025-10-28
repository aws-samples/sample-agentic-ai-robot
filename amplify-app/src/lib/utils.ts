// MUI에서는 sx prop을 사용하므로 별도의 유틸리티 함수가 필요하지 않습니다.
// 필요시 MUI의 styled나 sx prop을 활용하세요.

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}
