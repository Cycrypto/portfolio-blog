// Internal order tags stay out of the public tag list and never change post URLs.
export function seriesOrder(value = "") {
  const orders = String(value)
    .trim()
    .split(/\s+/)
    .map((tag) => {
      const match = /^#series-order-(\d+)$/.exec(tag);
      const order = match ? Number(match[1]) : NaN;
      return Number.isSafeInteger(order) && order > 0 ? order : Infinity;
    });
  return Math.min(...orders);
}

export function compareSeriesEntries(a, b) {
  const first = seriesOrder(a.seriesOrder);
  const second = seriesOrder(b.seriesOrder);
  if (first !== second) return first - second;
  return (
    Number(a.seriesDate) - Number(b.seriesDate) ||
    a.seriesId.localeCompare(b.seriesId)
  );
}

function sortEntries(list) {
  const items = Array.from(list.children).filter((item) =>
    item.hasAttribute("data-series-item"),
  );
  items.sort((a, b) => compareSeriesEntries(a.dataset, b.dataset));
  items.forEach((item, index) => {
    list.append(item);
    const number = item.querySelector("[data-series-number]");
    if (number) number.textContent = `${index + 1}.`;
  });
  return items;
}

function adjacentLink(item, direction) {
  const source = item.querySelector("a");
  const link = document.createElement("a");
  link.className = `series-navigation__link series-navigation__link--${direction}`;
  link.setAttribute("href", source.getAttribute("href"));
  link.rel = direction;
  const label = document.createElement("span");
  label.className = "series-navigation__label";
  label.textContent = direction === "prev" ? "← 이전 편" : "다음 편 →";
  const title = document.createElement("span");
  title.className = "series-navigation__title";
  title.textContent = source.textContent;
  link.append(label, title);
  return link;
}

function initSeries() {
  document.querySelectorAll("[data-series-feed]").forEach(sortEntries);
  let hasNavigation = false;
  document.querySelectorAll("[data-series]").forEach((panel) => {
    const list = panel.querySelector("[data-series-list]");
    if (!list) return;
    const items = sortEntries(list);
    const current = items.findIndex(
      (item) => item.dataset.seriesId === panel.dataset.seriesCurrent,
    );
    if (current < 0) return; // A draft preview is not part of the published series yet.

    items[current].querySelector("a").setAttribute("aria-current", "page");
    const progress = panel.querySelector("[data-series-progress]");
    progress.textContent = `${current + 1} / ${items.length}`;
    progress.setAttribute(
      "aria-label",
      `${items.length}편 중 ${current + 1}편`,
    );
    if (window.matchMedia("(max-width: 720px)").matches) panel.open = false;

    // A post can carry multiple series tags. The first one controls the bottom links.
    if (hasNavigation) return;
    const navigation = document.querySelector("[data-series-navigation]");
    if (!navigation) return;
    hasNavigation = true;
    if (current > 0)
      navigation.append(adjacentLink(items[current - 1], "prev"));
    if (current < items.length - 1)
      navigation.append(adjacentLink(items[current + 1], "next"));
    navigation.hidden = navigation.children.length === 0;
    const generalNext = document.querySelector("[data-general-next]");
    if (generalNext) generalNext.hidden = true;
  });
}

if (typeof document !== "undefined") initSeries();
