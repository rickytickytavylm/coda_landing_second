/* Обычный JavaScript. Работает из файла и на статическом хостинге. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const config = {
    enrollmentUrl: 'https://t.me/zhanna8310',
    supportUrl: 'https://t.me/rickytickytavylm',
    paymentWidgetHash: '',
    paymentWidgetSrc: '',
    price: null,
    priceNote: '',
    canonicalUrl: '',
    showKira: true,
    ...window.SHUROV_CONFIG,
  };

  // Настройки применяются к уже существующей HTML-разметке.
  function webUrl(value, fallback = '') {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return fallback;
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  }

  function externalLink(anchor, href) {
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }

  const enrollmentUrl = webUrl(config.enrollmentUrl, 'https://t.me/zhanna8310');
  const supportUrl = webUrl(config.supportUrl, 'https://t.me/rickytickytavylm');
  $$('[data-admin-link]').forEach((anchor) => externalLink(anchor, enrollmentUrl));
  $$('[data-support-link]').forEach((anchor) => externalLink(anchor, supportUrl));
  if (typeof config.price === 'number' && Number.isFinite(config.price) && config.price > 0) {
    const price = new Intl.NumberFormat('ru-RU', {
      style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
    }).format(config.price);
    $('[data-price-value]').textContent = price;
    $('[data-sticky-price]').textContent = price;
    $('[data-price-block]').hidden = false;
    if (typeof config.priceNote === 'string' && config.priceNote.trim()) {
      $('[data-price-note]').textContent = config.priceNote;
      $('[data-price-note]').hidden = false;
    }
  }
  if (config.showKira === false) {
    $$('[data-kira]').forEach((node) => { node.hidden = true; });
  }
  const canonicalUrl = webUrl(config.canonicalUrl);
  if (canonicalUrl) {
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = canonicalUrl;
    document.head.appendChild(canonical);
  }
  $('[data-copyright]').textContent = `© ${new Date().getFullYear()} Школа Шурова`;

  const header = $('.header');
  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const backdrop = $('.menu-backdrop');
  const main = $('main');
  const sticky = $('.mobile-cta');
  const paymentModal = $('#payment-modal');
  const desktop = window.matchMedia('(min-width: 901px)');
  const mobile = window.matchMedia('(max-width: 767px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let menuOpen = false;
  let paymentOpen = false;
  let heroVisible = true;
  let joinVisible = false;
  let overflowBeforeMenu = '';

  function updateSticky() {
    const visible = mobile.matches && !heroVisible && !joinVisible && !menuOpen && !paymentOpen;
    sticky.classList.toggle('mobile-cta--visible', visible);
    sticky.setAttribute('aria-hidden', String(!visible));
    sticky.toggleAttribute('inert', !visible);
  }

  // Меню: блокировка фона, Escape и ограничение перемещения фокуса.
  function setMenu(open, restoreFocus = false) {
    if (open === menuOpen) return;
    menuOpen = open;
    header.classList.toggle('header--open', open);
    menu.hidden = !open;
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    $('[data-menu-icon="open"]', toggle).hidden = open;
    $('[data-menu-icon="close"]', toggle).hidden = !open;
    main.toggleAttribute('inert', open);
    if (open) {
      overflowBeforeMenu = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      $('a', menu).focus({ preventScroll: true });
    } else {
      document.body.style.overflow = overflowBeforeMenu;
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
    updateSticky();
  }

  toggle.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
  backdrop.addEventListener('click', () => setMenu(false, true));
  $$('a', header).forEach((anchor) => anchor.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (!menuOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = $$('a[href], button', header).filter((node) => node.getClientRects().length);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function watchMedia(media, listener) {
    if (media.addEventListener) media.addEventListener('change', listener);
    else media.addListener(listener);
  }
  watchMedia(desktop, () => { if (desktop.matches) setMenu(false); });
  watchMedia(mobile, updateSticky);

  // Вкладки: клик, стрелки, Home и End. Все панели уже находятся в HTML.
  const tabs = $$('[role="tab"]', $('.format-tabs')).filter((tab) => !tab.hidden);
  const panels = $$('.format-panel');
  function activateTab(selected, moveFocus = false) {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== selected.getAttribute('aria-controls'); });
    if (moveFocus) selected.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activateTab(tabs[next], true);
      }
    });
  });

  // Оплата: виджет GetCourse загружается только при первом открытии формы.
  const paymentMount = $('#gc-mount');
  let paymentOpener = null;
  let overflowBeforePayment = '';

  function mountPaymentWidget() {
    if (!paymentMount || paymentMount.querySelector('iframe')) return;
    const hash = String(config.paymentWidgetHash || '').trim();
    const src = webUrl(config.paymentWidgetSrc);
    if (!hash || !src) {
      paymentMount.innerHTML = '<p class="payment-mount__error">Форма оплаты временно недоступна. Напишите администратору — он поможет оформить участие.</p>';
      return;
    }
    const existing = document.getElementById(hash);
    if (existing) {
      document.dispatchEvent(new Event(`StartWidget${hash}`));
      return;
    }
    const script = document.createElement('script');
    script.id = hash;
    script.src = src;
    script.onload = () => document.dispatchEvent(new Event(`StartWidget${hash}`));
    script.onerror = () => {
      paymentMount.innerHTML = '<p class="payment-mount__error">Не удалось загрузить форму. Проверьте интернет-соединение или напишите администратору.</p>';
    };
    paymentMount.appendChild(script);
  }

  function closePayment() {
    if (!paymentOpen) return;
    paymentOpen = false;
    paymentModal.hidden = true;
    paymentModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = overflowBeforePayment;
    updateSticky();
    paymentOpener?.focus({ preventScroll: true });
  }

  function openPayment(opener) {
    if (paymentOpen) return;
    setMenu(false);
    paymentOpen = true;
    paymentOpener = opener;
    overflowBeforePayment = document.body.style.overflow;
    paymentModal.hidden = false;
    paymentModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    mountPaymentWidget();
    $('.payment-modal__close', paymentModal)?.focus({ preventScroll: true });
    updateSticky();
  }

  $$('[data-open-payment]').forEach((button) => {
    button.addEventListener('click', () => openPayment(button));
  });
  $$('[data-close-payment]', paymentModal).forEach((button) => {
    button.addEventListener('click', closePayment);
  });
  document.addEventListener('keydown', (event) => {
    if (paymentOpen && event.key === 'Escape') {
      event.preventDefault();
      closePayment();
    }
  });

  // Нативные details; поддержка одной открытой FAQ-группы во всех браузерах.
  const questions = $$('.faq-item');
  questions.forEach((item) => item.addEventListener('toggle', () => {
    if (item.open) questions.forEach((other) => { if (other !== item) other.open = false; });
  }));

  // Анимации включаются только при поддержке наблюдателя.
  // Без JavaScript основной текст и вся программа остаются видимыми.
  if ('IntersectionObserver' in window) {
    if (!reducedMotion.matches) {
      const reveal = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
      $$('.reveal').forEach((node) => {
        node.classList.add('will-reveal');
        reveal.observe(node);
      });
    }
    const hero = $('.hero');
    const join = $('#join');
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === join) joinVisible = entry.isIntersecting;
      });
      updateSticky();
    }, { threshold: 0 });
    sections.observe(hero);
    sections.observe(join);
  }
  updateSticky();
})();
