(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const svg = (body) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICONS = {
    copy: svg(
      '<rect width="13" height="13" x="8" y="8" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
    ),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
  };

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    if (!copied) throw new Error("Copy failed");
  }

  function enhanceCodeBlocks() {
    $$(".gh-content pre").forEach((pre) => {
      if (pre.closest(".code-block")) return;
      const code = $("code", pre);
      const figure = pre.closest("figure.kg-code-card");
      const caption = figure ? $("figcaption", figure) : null;
      const languageClass = code
        ? Array.from(code.classList).find((name) =>
            name.startsWith("language-"),
          )
        : "";
      const label =
        (caption && caption.textContent.trim()) ||
        (languageClass ? languageClass.slice(9) : "");

      const block = document.createElement("div");
      block.className = "code-block";
      const bar = document.createElement("div");
      bar.className = "code-block__bar";
      const name = document.createElement("span");
      name.textContent = label;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.setAttribute("aria-label", "코드 복사");
      button.innerHTML = ICONS.copy;
      button.addEventListener("click", async () => {
        try {
          await copyText((code || pre).textContent.replace(/\n$/, ""));
          button.innerHTML = ICONS.check;
          button.setAttribute("aria-label", "코드를 복사했습니다");
          window.setTimeout(() => {
            button.innerHTML = ICONS.copy;
            button.setAttribute("aria-label", "코드 복사");
          }, 1600);
        } catch {
          button.setAttribute("aria-label", "코드를 복사하지 못했습니다");
        }
      });

      bar.append(name, button);
      pre.before(block);
      block.append(bar, pre);
      if (caption) caption.remove();
    });
  }

  function buildToc() {
    const layout = $("[data-article-layout]");
    const content = $(".gh-content", layout || document);
    if (!layout || !content) return;

    const headings = $$(":scope > h2", content).filter((heading) =>
      heading.textContent.trim(),
    );
    if (headings.length < 2) return;

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
    });

    const containers = [
      $("[data-toc-desktop]", layout),
      $("[data-toc-mobile]", layout),
    ].filter(Boolean);
    const links = [];
    containers.forEach((container) => {
      const list = $("[data-toc-list]", container);
      headings.forEach((heading) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.className = "toc__link";
        // Ghost already percent-encodes non-ASCII heading ids.
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent.trim();
        link.dataset.target = heading.id;
        item.append(link);
        list.append(item);
        links.push(link);
      });
      container.hidden = false;
    });

    const mobile = $("[data-toc-mobile]", layout);
    if (mobile) {
      mobile.addEventListener("click", (event) => {
        if (event.target.closest(".toc__link")) mobile.open = false;
      });
    }

    let activeId = "";
    const setActive = (id) => {
      if (id === activeId) return;
      activeId = id;
      links.forEach((link) => {
        if (link.dataset.target === id)
          link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    let frame = 0;
    let clickedId = "";
    links.forEach((link) => {
      link.addEventListener("click", () => {
        clickedId = link.dataset.target;
        setActive(clickedId);
      });
    });
    ["wheel", "touchstart", "keydown"].forEach((type) => {
      window.addEventListener(
        type,
        () => {
          clickedId = "";
        },
        { passive: true },
      );
    });

    const update = () => {
      frame = 0;
      // Headings near the end cannot reach the top, so keep the clicked one while it is visible.
      const clicked = clickedId && document.getElementById(clickedId);
      if (clicked) {
        const top = clicked.getBoundingClientRect().top;
        if (top >= 0 && top < window.innerHeight) {
          setActive(clickedId);
          return;
        }
        clickedId = "";
      }
      const atBottom =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(headings[headings.length - 1].id);
        return;
      }
      const offset = 120;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - offset <= 0)
          current = heading;
        else break;
      }
      setActive(current.id);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }

  function initSearch() {
    const dialog = $("[data-search-dialog]");
    const openers = $$("[data-search-open]");
    if (
      !dialog ||
      typeof dialog.showModal !== "function" ||
      !dialog.dataset.apiKey
    ) {
      openers.forEach((opener) => {
        opener.hidden = true;
      });
      return;
    }

    const input = $("[data-search-input]", dialog);
    const clear = $("[data-search-clear]", dialog);
    const results = $("[data-search-results]", dialog);
    const close = $("[data-search-close]", dialog);
    const apiUrl = dialog.dataset.apiUrl;
    const apiKey = dialog.dataset.apiKey;
    const normalize = (value) =>
      String(value || "")
        .normalize("NFC")
        .toLocaleLowerCase("ko-KR");

    let formatter;
    try {
      formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: dialog.dataset.timezone || undefined,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      formatter = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
    const formatDate = (value) => {
      const parts = Object.fromEntries(
        formatter
          .formatToParts(new Date(value))
          .map((part) => [part.type, part.value]),
      );
      return `${parts.year}. ${parts.month}. ${parts.day}`;
    };

    const thumbnailUrl = (value) => {
      try {
        const url = new URL(value, window.location.href);
        if (
          url.origin === window.location.origin &&
          url.pathname.includes("/content/images/") &&
          !url.pathname.includes("/content/images/size/")
        ) {
          url.pathname = url.pathname.replace(
            "/content/images/",
            "/content/images/size/w320/",
          );
        }
        return url.href;
      } catch {
        return value;
      }
    };

    let postsPromise = null;
    async function fetchPosts() {
      const posts = [];
      let page = 1;
      while (page) {
        const url = new URL("posts/", apiUrl);
        url.searchParams.set("key", apiKey);
        url.searchParams.set("limit", "100");
        url.searchParams.set("page", String(page));
        url.searchParams.set(
          "fields",
          "id,title,url,excerpt,custom_excerpt,published_at,feature_image",
        );
        url.searchParams.set("include", "tags");
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok)
          throw new Error(`Search request failed: ${response.status}`);
        const data = await response.json();
        posts.push(...data.posts);
        page =
          data.meta && data.meta.pagination ? data.meta.pagination.next : null;
      }
      return posts.map((post) => {
        const tags = (post.tags || []).filter(
          (tag) => tag.visibility !== "internal",
        );
        return {
          ...post,
          tag: tags[0] ? tags[0].name : "",
          titleKey: normalize(post.title),
          searchKey: normalize(
            [
              post.title,
              post.custom_excerpt || post.excerpt,
              ...tags.map((tag) => tag.name),
            ].join(" "),
          ),
        };
      });
    }
    const loadPosts = () => {
      if (!postsPromise) {
        postsPromise = fetchPosts().catch((error) => {
          postsPromise = null;
          throw error;
        });
      }
      return postsPromise;
    };

    const element = (tag, className, textContent) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (textContent !== undefined) node.textContent = textContent;
      return node;
    };

    const emptyState = (title, body) => {
      const box = element("div", "search-empty");
      box.append(
        element("p", "search-empty__title", title),
        element("p", "search-empty__text", body),
      );
      return box;
    };

    function renderMatches(matches) {
      if (!matches.length) {
        results.replaceChildren(
          emptyState("검색 결과가 없습니다", "다른 검색어로 찾아보세요."),
        );
        return;
      }
      const list = element("ul", "search-list");
      matches.forEach((post) => {
        const item = element("li");
        const link = element(
          "a",
          `search-result${post.feature_image ? " has-image" : ""}`,
        );
        link.href = post.url;
        link.append(element("span", "search-result__title", post.title));
        link.append(
          element(
            "span",
            "search-result__meta",
            [formatDate(post.published_at), post.tag]
              .filter(Boolean)
              .join(" · "),
          ),
        );
        if (post.feature_image) {
          const image = element("img", "search-result__thumb");
          image.src = thumbnailUrl(post.feature_image);
          image.alt = "";
          image.loading = "lazy";
          image.decoding = "async";
          link.append(image);
        }
        item.append(link);
        list.append(item);
      });
      results.replaceChildren(
        element("p", "search-count", `검색 결과 ${matches.length}개`),
        list,
      );
    }

    let requestId = 0;
    async function search(query) {
      const id = ++requestId;
      const terms = normalize(query).split(/\s+/).filter(Boolean);
      clear.hidden = !query;
      if (!terms.length) {
        results.replaceChildren();
        return;
      }
      try {
        const posts = await loadPosts();
        if (id !== requestId) return;
        const matches = posts
          .filter((post) =>
            terms.every((term) => post.searchKey.includes(term)),
          )
          .map((post, index) => ({
            post,
            index,
            score: terms.every((term) => post.titleKey.includes(term)) ? 0 : 1,
          }))
          .sort((a, b) => a.score - b.score || a.index - b.index)
          .slice(0, 30)
          .map(({ post }) => post);
        renderMatches(matches);
      } catch {
        if (id !== requestId) return;
        results.replaceChildren(
          emptyState(
            "검색을 불러오지 못했습니다",
            "잠시 후 다시 시도해 주세요.",
          ),
        );
      }
    }

    let debounce = 0;
    input.addEventListener("input", () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => search(input.value), 80);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      const first = $(".search-result", results);
      if (first) {
        event.preventDefault();
        window.location.href = first.href;
      }
    });
    clear.addEventListener("click", () => {
      input.value = "";
      search("");
      input.focus();
    });
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
      // Search inputs use the first Escape to clear text; close the dialog right away instead.
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      dialog.close();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    let returnFocus = null;
    const open = (trigger) => {
      if (dialog.open) return;
      returnFocus = trigger || document.activeElement;
      dialog.showModal();
      input.focus();
      input.select();
      loadPosts().catch(() => {});
    };
    dialog.addEventListener("close", () => {
      if (returnFocus && typeof returnFocus.focus === "function")
        returnFocus.focus();
    });
    openers.forEach((opener) =>
      opener.addEventListener("click", () => open(opener)),
    );

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(input|textarea|select)$/i.test(target.tagName));
      const shortcut =
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing);
      if (!shortcut || dialog.open) return;
      event.preventDefault();
      open();
    });
  }

  enhanceCodeBlocks();
  buildToc();
  initSearch();
})();
