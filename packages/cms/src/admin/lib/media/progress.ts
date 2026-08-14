export function overallProgress(done: number, total: number, currentPercent: number): number {
  if (total <= 0) return 0;
  return ((done + currentPercent / 100) / total) * 100;
}
