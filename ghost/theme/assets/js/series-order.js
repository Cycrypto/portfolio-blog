// Shared by the public theme and the series manager. Old order tags still work.
export function seriesOrder(value = "", scope = "") {
  const tags = String(value).trim().split(/\s+/);
  const prefix = `#series-order-${scope}-`;
  const scoped = scope ? tags.filter((tag) => tag.startsWith(prefix)) : [];
  const values = scoped.length
    ? scoped.map((tag) => tag.slice(prefix.length))
    : tags.flatMap((tag) => {
        const match = /^#series-order-(\d+)$/.exec(tag);
        return match ? [match[1]] : [];
      });
  return Math.min(
    Infinity,
    ...values.map((value) => {
      const order = /^\d+$/.test(value) ? Number(value) : NaN;
      return Number.isSafeInteger(order) && order > 0 ? order : Infinity;
    }),
  );
}

export function compareSeriesEntries(a, b, scope = "") {
  const first = seriesOrder(a.seriesOrder, scope);
  const second = seriesOrder(b.seriesOrder, scope);
  if (first !== second) return first - second;
  return (
    Number(a.seriesDate) - Number(b.seriesDate) ||
    a.seriesId.localeCompare(b.seriesId)
  );
}
