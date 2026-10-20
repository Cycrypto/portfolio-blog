import assert from "node:assert/strict";
import test from "node:test";
import {
  seriesOrder,
  compareSeriesEntries,
} from "../theme/assets/js/series.js";

test("series order is numeric and accepts padded numbers", () => {
  assert.equal(seriesOrder("#series-order-002"), 2);
  const entries = [10, 2, 100, 1].map((order) => ({
    seriesOrder: `#series-order-${order}`,
    seriesDate: "1",
    seriesId: String(order),
  }));
  assert.deepEqual(
    entries
      .sort(compareSeriesEntries)
      .map((entry) => seriesOrder(entry.seriesOrder)),
    [1, 2, 10, 100],
  );
});

test("missing and invalid numbers cannot jump ahead of numbered posts", () => {
  for (const value of [
    "",
    "#other-1",
    "#series-order-0",
    "#series-order--1",
    "#series-order-1.5",
    "#series-order-1oops",
    "#series-order-9007199254740992",
  ]) {
    assert.equal(seriesOrder(value), Infinity, value);
  }
  assert.equal(seriesOrder("#series-order-20 #series-order-2"), 2);
  assert.ok(
    compareSeriesEntries(
      { seriesOrder: "#series-order-1", seriesDate: "20", seriesId: "a" },
      { seriesOrder: "", seriesDate: "1", seriesId: "b" },
    ) < 0,
  );
});

test("ties and unnumbered posts have a stable publication/id order", () => {
  for (const order of ["#series-order-2", ""]) {
    const entries = [
      { seriesOrder: order, seriesDate: "20", seriesId: "c" },
      { seriesOrder: order, seriesDate: "10", seriesId: "b" },
      { seriesOrder: order, seriesDate: "10", seriesId: "a" },
    ];
    assert.deepEqual(
      entries.sort(compareSeriesEntries).map((entry) => entry.seriesId),
      ["a", "b", "c"],
    );
  }
});
