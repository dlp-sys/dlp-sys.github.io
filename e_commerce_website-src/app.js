/* 极客选品 · 首页交互
 * 说明：当前运行环境未开启云服务，商品数据、用户、购物车与优惠券统一保存在浏览器 localStorage。
 * 数据结构与读写都集中在 Store 层，后续切换到云端数据库时只需替换这一层。
 */

(function () {
  'use strict';

  // ---------- 工具 ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const money = (n) => '¥' + Number(n).toLocaleString('zh-CN');

  const Store = {
    keys: {
      products: 'geekselect_products_v1',
      users: 'geekselect_users_v1',
      session: 'geekselect_session_v1',
      cart: 'geekselect_cart_v1',
      coupons: 'geekselect_coupons_v1',
      flashEnd: 'geekselect_flash_end_v1'
    },
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 隐私模式下静默降级 */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* noop */ }
    }
  };

  function hashPassword(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- 数据 ----------
  const categoryIcons = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 18.5h4"/></svg>',
    audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2.5" y="13" width="4" height="7" rx="2"/><rect x="17.5" y="13" width="4" height="7" rx="2"/></svg>',
    computer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 19h20M8 20h8"/></svg>',
    wearable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6V3h6v3M9 18v3h6v-3M12 10v3l2 1"/></svg>',
    accessory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h4l1.5-2h7L17 8h4v11H3z"/><circle cx="12" cy="13" r="4"/></svg>'
  };

  const CATEGORIES = [
    { id: 'phone', name: '手机通讯', desc: '旗舰 · 5G 新品', color: '#eef4ff', ink: '#2563eb' },
    { id: 'audio', name: '影音耳机', desc: '降噪 · 沉浸音质', color: '#fff1e8', ink: '#ea580c' },
    { id: 'computer', name: '电脑办公', desc: '轻薄 · 高效生产力', color: '#ecfdf5', ink: '#059669' },
    { id: 'wearable', name: '智能穿戴', desc: '运动 · 健康管理', color: '#f5f0ff', ink: '#7c3aed' },
    { id: 'accessory', name: '键鼠配件', desc: '手感 · 桌面美学', color: '#fffbeb', ink: '#d97706' },
    { id: 'camera', name: '摄影摄像', desc: '影像 · 记录生活', color: '#f1f5f9', ink: '#334155' }
  ];

  const SEED_PRODUCTS = [
    { id: 'p1', name: '星曜 X7 Pro 智能手机', desc: '2K 高刷屏 · 旗舰三摄 · 5000mAh 大电池', price: 3299, oldPrice: 3699, image: 'assets/product-phone.png', category: 'phone', badge: '热卖', badgeType: 'hot', sales: 2841 },
    { id: 'p2', name: '静界 ANC 头戴式降噪耳机', desc: '主动降噪 · 40 小时续航 · 空间音频', price: 899, oldPrice: 1099, image: 'assets/product-headphones.png', category: 'audio', badge: '直降 200', badgeType: '', sales: 5320 },
    { id: 'p3', name: '轻翼 Air 14 超薄笔记本', desc: '1.2kg 轻薄机身 · 2.8K 屏 · 全天续航', price: 5699, oldPrice: 6299, image: 'assets/product-laptop.png', category: 'computer', badge: '新品', badgeType: 'new', sales: 1260 },
    { id: 'p4', name: '脉动 S2 智能运动手表', desc: '血氧心率监测 · 100+ 运动模式 · 防水', price: 799, oldPrice: 999, image: 'assets/product-watch.png', category: 'wearable', badge: '热卖', badgeType: 'hot', sales: 3672 },
    { id: 'p5', name: '机械师 K87 无线机械键盘', desc: '客制化轴体 · 三模连接 · RGB 背光', price: 429, oldPrice: 559, image: 'assets/product-keyboard.png', category: 'accessory', badge: '限时价', badgeType: '', sales: 4180 },
    { id: 'p6', name: '光影 M1 微单相机', desc: '2400 万像素 · 4K 视频 · 五轴防抖', price: 4299, oldPrice: 4699, image: 'assets/product-camera.png', category: 'camera', badge: '新品', badgeType: 'new', sales: 856 },
    { id: 'p7', name: '星曜 X7 标准版 智能手机', desc: '6.7 英寸护眼屏 · 大电池 · 影像增强', price: 2699, oldPrice: 2999, image: 'assets/product-phone.png', category: 'phone', badge: '直降 300', badgeType: '', sales: 1905 },
    { id: 'p8', name: '静界 Lite 真无线蓝牙耳机', desc: '轻盈入耳 · 低延迟 · 通话降噪', price: 399, oldPrice: 499, image: 'assets/product-headphones.png', category: 'audio', badge: '新人价', badgeType: '', sales: 6210 }
  ];

  const FLASH_ITEMS = [
    { id: 'p2', progress: 78 },
    { id: 'p5', progress: 64 },
    { id: 'p8', progress: 86 }
  ];

  // 初始化「云端数据表」的本地镜像
  if (!Store.read(Store.keys.products, null)) Store.write(Store.keys.products, SEED_PRODUCTS);
  if (!Store.read(Store.keys.users, null)) {
    Store.write(Store.keys.users, [{
      id: 'u_demo', account: 'demo', name: '体验用户', phone: '13800000000',
      password: hashPassword('123456'), createdAt: Date.now()
    }]);
  }
  if (!Store.read(Store.keys.cart, null)) Store.write(Store.keys.cart, []);
  if (!Store.read(Store.keys.coupons, null)) Store.write(Store.keys.coupons, []);
  if (!Store.read(Store.keys.flashEnd, null)) Store.write(Store.keys.flashEnd, Date.now() + 8 * 3600 * 1000);

  const getProducts = () => Store.read(Store.keys.products, SEED_PRODUCTS);
  const getProduct = (id) => getProducts().find((p) => p.id === id);
  const getSession = () => Store.read(Store.keys.session, null);
  const getCart = () => Store.read(Store.keys.cart, []);
  const saveCart = (cart) => Store.write(Store.keys.cart, cart);

  let currentCategory = 'all';
  let currentQuery = '';

  // ---------- 分类 ----------
  function renderCategories() {
    $('#categoryGrid').innerHTML = CATEGORIES.map((c) => `
      <button class="category-card" data-category="${c.id}">
        <span class="category-icon" style="background:${c.color};color:${c.ink}">${categoryIcons[c.id]}</span>
        <strong>${c.name}</strong>
        <small>${c.desc}</small>
      </button>`).join('');
  }

  // ---------- 商品列表 ----------
  function getVisibleProducts() {
    const q = currentQuery.trim().toLowerCase();
    return getProducts().filter((p) => {
      const categoryOk = currentCategory === 'all' || p.category === currentCategory;
      const catName = (CATEGORIES.find((c) => c.id === p.category) || {}).name || '';
      const queryOk = !q || (p.name + p.desc + catName).toLowerCase().includes(q);
      return categoryOk && queryOk;
    });
  }

  function renderProducts() {
    const list = getVisibleProducts();
    const grid = $('#productGrid');
    grid.innerHTML = list.map((p) => `
      <article class="product-card">
        <div class="product-media">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${p.badge ? `<span class="product-badge ${p.badgeType || ''}">${p.badge}</span>` : ''}
        </div>
        <div class="product-body">
          <span class="product-cat">${(CATEGORIES.find((c) => c.id === p.category) || {}).name || '数码好物'}</span>
          <h3 class="product-name" title="${p.name}">${p.name}</h3>
          <p class="product-desc" title="${p.desc}">${p.desc}</p>
          <div class="product-meta">
            <div><span class="price"><small>¥</small>${Number(p.price).toLocaleString('zh-CN')}</span><span class="price-old">${money(p.oldPrice)}</span></div>
            <span class="product-sales">已售 ${p.sales}</span>
          </div>
          <button class="add-cart" data-id="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 3h2.2l2.2 12.2a2 2 0 0 0 2 1.7h8.6a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>
            加入购物车
          </button>
        </div>
      </article>`).join('');
    $('#emptyState').classList.toggle('hidden', list.length > 0);
  }

  function setCategory(id) {
    currentCategory = id;
    $$('.filter-chip').forEach((btn) => btn.classList.toggle('active', btn.dataset.category === id));
    renderProducts();
    $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- 轮播 ----------
  function initHero() {
    const slides = $$('.hero-slide');
    const dotsBox = $('#heroDots');
    let index = 0;
    let timer;

    dotsBox.innerHTML = slides.map((_, i) => `<button type="button" aria-label="第 ${i + 1} 张" data-index="${i}" class="${i === 0 ? 'active' : ''}"></button>`).join('');
    const dots = $$('#heroDots button');

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('active', n === index));
      dots.forEach((d, n) => d.classList.toggle('active', n === index));
    }
    function start() { stop(); timer = setInterval(() => show(index + 1), 5200); }
    function stop() { clearInterval(timer); }

    $('#heroPrev').addEventListener('click', () => { show(index - 1); start(); });
    $('#heroNext').addEventListener('click', () => { show(index + 1); start(); });
    dotsBox.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-index]');
      if (btn) { show(Number(btn.dataset.index)); start(); }
    });
    const hero = $('#hero');
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    start();
  }

  // ---------- 抢购倒计时 ----------
  function initCountdown() {
    const $h = $('#cdHour'), $m = $('#cdMin'), $s = $('#cdSec');
    function tick() {
      let end = Store.read(Store.keys.flashEnd, Date.now() + 8 * 3600 * 1000);
      if (end <= Date.now()) { end = Date.now() + 8 * 3600 * 1000; Store.write(Store.keys.flashEnd, end); }
      const left = Math.max(0, end - Date.now());
      const pad = (n) => String(n).padStart(2, '0');
      $h.textContent = pad(Math.floor(left / 3600000));
      $m.textContent = pad(Math.floor((left % 3600000) / 60000));
      $s.textContent = pad(Math.floor((left % 60000) / 1000));
    }
    tick();
    setInterval(tick, 1000);
  }

  function renderFlash() {
    $('#flashGrid').innerHTML = FLASH_ITEMS.map((f) => {
      const p = getProduct(f.id);
      if (!p) return '';
      return `<div class="flash-item">
        <div class="flash-media"><img src="${p.image}" alt="${p.name}"></div>
        <div class="flash-info">
          <h4 title="${p.name}">${p.name}</h4>
          <span class="price"><small>¥</small>${Number(p.price).toLocaleString('zh-CN')}</span>
          <div class="progress"><i style="width:${f.progress}%"></i></div>
          <small>已抢 ${f.progress}% · 限量出售</small>
        </div>
      </div>`;
    }).join('');
  }

  // ---------- 购物车 ----------
  function updateCartBadge() {
    const count = getCart().reduce((sum, i) => sum + i.qty, 0);
    $('#cartCount').textContent = count;
    $('#drawerCount').textContent = '(' + count + ')';
  }

  function addToCart(id) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else cart.push({ id, qty: 1 });
    saveCart(cart);
    updateCartBadge();
    renderCart();
    toast('已加入购物车');
    openDrawer();
  }

  function renderCart() {
    const cart = getCart();
    const box = $('#cartItems');
    if (!cart.length) {
      box.innerHTML = `<div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3h2.2l2.2 12.2a2 2 0 0 0 2 1.7h8.6a2 2 0 0 0 2-1.6L21 7H6"/></svg>
        <p>购物车还是空的，去挑选几件好物吧</p>
        <a href="#products" class="btn btn-outline" id="goShoppingBtn">去逛逛</a>
      </div>`;
      $('#cartTotal').textContent = money(0);
      return;
    }
    box.innerHTML = cart.map((item) => {
      const p = getProduct(item.id);
      if (!p) return '';
      return `<div class="cart-item">
        <img src="${p.image}" alt="${p.name}">
        <div class="cart-item-info">
          <h4 title="${p.name}">${p.name}</h4>
          <span class="price"><small>¥</small>${Number(p.price).toLocaleString('zh-CN')}</span>
          <div class="qty-row">
            <button class="qty-btn" data-act="minus" data-id="${p.id}" aria-label="减少数量">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-act="plus" data-id="${p.id}" aria-label="增加数量">+</button>
            <button class="remove-btn" data-act="remove" data-id="${p.id}">移除</button>
          </div>
        </div>
      </div>`;
    }).join('');
    const total = cart.reduce((sum, item) => {
      const p = getProduct(item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
    $('#cartTotal').textContent = money(total);
  }

  function openDrawer() {
    renderCart();
    $('#drawerOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    $('#drawerOverlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ---------- 登录 / 注册 ----------
  let authMode = 'login';

  function openAuth(mode) {
    authMode = mode || 'login';
    $$('.auth-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.mode === authMode));
    $('#authTitle').textContent = authMode === 'login' ? '欢迎回来' : '创建账号';
    $('#authSubtitle').textContent = authMode === 'login' ? '登录后即可享受专属优惠与购物车同步' : '注册即可领取新人专享 100 元礼包';
    $('#authSubmit').textContent = authMode === 'login' ? '登录' : '注册并登录';
    $('#authError').classList.add('hidden');
    $('#authOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#authAccount').focus(), 80);
  }
  function closeAuth() {
    $('#authOverlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function updateAuthUI() {
    const session = getSession();
    $('#loginBtn').classList.toggle('hidden', !!session);
    $('#userMenu').classList.toggle('hidden', !session);
    if (session) {
      const initial = (session.name || session.account || 'G').slice(0, 1).toUpperCase();
      $('#userAvatar').textContent = initial;
      $('#userName').textContent = session.name || session.account;
      $('#dropdownName').textContent = '你好，' + (session.name || session.account);
      $('#dropdownPhone').textContent = session.phone || '已登录';
    }
  }

  function submitAuth(e) {
    e.preventDefault();
    const account = $('#authAccount').value.trim();
    const password = $('#authPassword').value;
    const err = $('#authError');
    const fail = (msg) => { err.textContent = msg; err.classList.remove('hidden'); };

    if (!account || password.length < 6) return fail('请输入账号与至少 6 位密码');
    const users = Store.read(Store.keys.users, []);

    if (authMode === 'register') {
      if (users.some((u) => u.account.toLowerCase() === account.toLowerCase())) return fail('该账号已存在，请直接登录');
      const user = {
        id: 'u_' + Date.now(), account, name: account,
        phone: /^1\d{10}$/.test(account) ? account : '',
        password: hashPassword(password), createdAt: Date.now()
      };
      users.push(user);
      Store.write(Store.keys.users, users);
      Store.write(Store.keys.session, { id: user.id, account: user.account, name: user.name, phone: user.phone, loginAt: Date.now() });
      closeAuth();
      updateAuthUI();
      $('#authForm').reset();
      toast('注册成功，新人礼包已发放');
      return;
    }

    const user = users.find((u) => u.account.toLowerCase() === account.toLowerCase() && u.password === hashPassword(password));
    if (!user) return fail('账号或密码不正确');
    Store.write(Store.keys.session, { id: user.id, account: user.account, name: user.name, phone: user.phone, loginAt: Date.now() });
    closeAuth();
    updateAuthUI();
    $('#authForm').reset();
    toast('登录成功，欢迎回来');
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    // 分类卡片
    $('#categoryGrid').addEventListener('click', (e) => {
      const card = e.target.closest('[data-category]');
      if (card) setCategory(card.dataset.category);
    });
    // 筛选标签
    $('#filterBar').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-category]');
      if (chip) setCategory(chip.dataset.category);
    });
    // 商品加购
    $('#productGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('.add-cart');
      if (btn) addToCart(btn.dataset.id);
    });
    // 搜索
    $('#searchInput').addEventListener('input', (e) => {
      currentQuery = e.target.value;
      renderProducts();
      if (currentQuery.trim()) $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#resetFilterBtn').addEventListener('click', () => {
      currentQuery = '';
      $('#searchInput').value = '';
      setCategory('all');
    });

    // 优惠券
    $('#couponGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('.coupon-btn');
      if (!btn || btn.classList.contains('claimed')) return;
      if (!getSession()) { toast('请先登录后再领取优惠券'); openAuth('login'); return; }
      const coupons = Store.read(Store.keys.coupons, []);
      const name = btn.dataset.coupon;
      if (coupons.includes(name)) { btn.textContent = '已领取'; btn.classList.add('claimed'); return; }
      coupons.push(name);
      Store.write(Store.keys.coupons, coupons);
      btn.textContent = '已领取';
      btn.classList.add('claimed');
      toast('领取成功，已放入我的优惠券');
    });
    (function markClaimed() {
      const coupons = Store.read(Store.keys.coupons, []);
      $$('.coupon-btn').forEach((btn) => {
        if (coupons.includes(btn.dataset.coupon)) { btn.textContent = '已领取'; btn.classList.add('claimed'); }
      });
    })();

    // 购物车
    $('#cartBtn').addEventListener('click', openDrawer);
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#drawerOverlay').addEventListener('click', (e) => { if (e.target === $('#drawerOverlay')) closeDrawer(); });
    $('#cartItems').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      if (btn.dataset.act === 'remove') {
        saveCart(getCart().filter((i) => i.id !== btn.dataset.id));
      } else {
        const cart = getCart();
        const item = cart.find((i) => i.id === btn.dataset.id);
        if (!item) return;
        item.qty += btn.dataset.act === 'plus' ? 1 : -1;
        if (item.qty <= 0) saveCart(cart.filter((i) => i.id !== btn.dataset.id));
        else saveCart(cart);
      }
      updateCartBadge();
      renderCart();
    });
    $('#cartItems').addEventListener('click', (e) => {
      if (e.target.closest('#goShoppingBtn')) closeDrawer();
    });
    $('#checkoutBtn').addEventListener('click', () => {
      if (!getCart().length) return toast('购物车还是空的');
      if (!getSession()) { closeDrawer(); toast('请先登录后再结算'); openAuth('login'); return; }
      toast('演示站点暂不支持真实支付');
    });

    // 登录注册
    $('#loginBtn').addEventListener('click', () => openAuth('login'));
    $('#authClose').addEventListener('click', closeAuth);
    $('#authOverlay').addEventListener('click', (e) => { if (e.target === $('#authOverlay')) closeAuth(); });
    $$('.auth-tabs button').forEach((b) => b.addEventListener('click', () => openAuth(b.dataset.mode)));
    $('#authForm').addEventListener('submit', submitAuth);

    // 用户菜单
    $('#userTrigger').addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = $('#userMenu');
      menu.classList.toggle('open');
      $('#userTrigger').setAttribute('aria-expanded', String(menu.classList.contains('open')));
    });
    document.addEventListener('click', () => $('#userMenu').classList.remove('open'));
    $('#userDropdown').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'logout') {
        Store.remove(Store.keys.session);
        updateAuthUI();
        toast('已退出登录');
      } else if (btn.dataset.action === 'coupons') {
        toast('已领取 ' + Store.read(Store.keys.coupons, []).length + ' 张优惠券');
      } else {
        toast('演示站点暂无订单数据');
      }
      $('#userMenu').classList.remove('open');
    });

    // 移动端菜单
    $('#mobileMenuBtn').addEventListener('click', () => $('#mainNav').classList.toggle('open'));
    $$('.main-nav a').forEach((a) => a.addEventListener('click', () => $('#mainNav').classList.remove('open')));

    // 导航栏滚动阴影 + 高亮
    const sections = ['products', 'categories', 'promotions'];
    window.addEventListener('scroll', () => {
      $('#siteHeader').classList.toggle('scrolled', window.scrollY > 12);
      let active = '';
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 180) active = id;
      });
      $$('.main-nav a').forEach((a) => {
        const target = a.getAttribute('href').replace('#', '');
        a.classList.toggle('active', target === active || (!active && target === 'top'));
      });
    }, { passive: true });

    // Esc 关闭弹层
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeAuth();
      closeDrawer();
      $('#userMenu').classList.remove('open');
    });
  }

  // ---------- 启动 ----------
  renderCategories();
  renderProducts();
  renderFlash();
  initHero();
  initCountdown();
  updateCartBadge();
  updateAuthUI();
  bindEvents();
})();
