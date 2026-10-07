(() => {
  // ===================== НАСТРОЙКИ =====================
  const CHANNEL_URL = "https://t.me/+DrMMZhotkmEzODcx";
  // Адрес твоего бэкенда, который проверяет подписку (см. api_check.py).
  // Пока пусто — работает демо-режим без реальной проверки.
  const CHECK_URL = "";
  // =====================================================

  const tg = window.Telegram?.WebApp;
  const $ = (id) => document.getElementById(id);
  const card = $("card"), title = $("title"), text = $("text"), hint = $("hint");
  const btnSub = $("btnSub"), btnCheck = $("btnCheck");

  let opened = false; // пользователь уже нажимал «Подписаться»

  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.setHeaderColor("#070b14"); tg.setBackgroundColor("#070b14"); } catch (_) {}
    try { tg.disableVerticalSwipes?.(); } catch (_) {}
  }

  const haptic = (type) => {
    try {
      if (type === "ok") tg?.HapticFeedback?.notificationOccurred("success");
      else if (type === "err") tg?.HapticFeedback?.notificationOccurred("error");
      else tg?.HapticFeedback?.impactOccurred("light");
    } catch (_) {}
  };

  const setState = (s) => { card.dataset.state = s; };

  // ---------- открыть канал ----------
  btnSub.addEventListener("click", () => {
    haptic();
    opened = true;
    hint.textContent = "Вернитесь сюда и нажмите «Я подписался»";
    setState("subscribed");
    if (tg?.openTelegramLink) tg.openTelegramLink(CHANNEL_URL);
    else window.open(CHANNEL_URL, "_blank");
  });

  // ---------- проверка подписки ----------
  async function checkSubscription() {
    if (!CHECK_URL) {
      // демо: без бэкенда подписку проверить нельзя
      await new Promise((r) => setTimeout(r, 1200));
      return opened;
    }
    const res = await fetch(CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg?.initData || "" }),
    });
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    return !!data.subscribed;
  }

  btnCheck.addEventListener("click", async () => {
    haptic();
    setState("checking");
    hint.textContent = "";
    try {
      const ok = await checkSubscription();
      if (ok) return success();
      fail("Подписка не найдена. Нажмите «Подписаться на канал» и попробуйте снова.");
    } catch (e) {
      fail("Не удалось проверить. Попробуйте ещё раз через пару секунд.");
    }
  });

  function fail(msg) {
    setState("error");
    hint.textContent = msg;
    haptic("err");
    setTimeout(() => card.dataset.state === "error" && setState(opened ? "subscribed" : "idle"), 700);
  }

  function success() {
    setState("done");
    haptic("ok");
    title.textContent = "Доступ открыт";
    text.textContent = "Спасибо за подписку. Возвращаемся в бота…";
    hint.textContent = "";
    setTimeout(() => (tg ? tg.close() : null), 1800);
  }

  // ---------- стеклянный блик и наклон ----------
  const root = document.documentElement;
  function glow(x, y) {
    const r = card.getBoundingClientRect();
    const px = Math.min(Math.max((x - r.left) / r.width, 0), 1);
    const py = Math.min(Math.max((y - r.top) / r.height, 0), 1);
    card.style.setProperty("--mx", px * 100 + "%");
    card.style.setProperty("--my", py * 100 + "%");
    card.style.setProperty("--rx", (px - 0.5) * 8 + "deg");
    card.style.setProperty("--ry", (0.5 - py) * 8 + "deg");
  }
  const rest = () => {
    ["--mx", "--my", "--rx", "--ry"].forEach((v) => card.style.removeProperty(v));
  };

  window.addEventListener("pointermove", (e) => glow(e.clientX, e.clientY));
  window.addEventListener("pointerleave", rest);
  window.addEventListener("pointerup", () => setTimeout(rest, 400));

  // наклон телефона двигает блик
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    const r = card.getBoundingClientRect();
    const x = r.left + r.width * (0.5 + Math.max(-30, Math.min(30, e.gamma)) / 60);
    const y = r.top + r.height * (0.5 + Math.max(-30, Math.min(30, e.beta - 45)) / 60);
    glow(x, y);
  });

  // если Mini App открыт не из Telegram
  if (!tg || !tg.initData) hint.textContent = "Откройте приложение через бота в Telegram";
})();
