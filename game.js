/* ============================================================
   灯街便利店 · 店员模拟器
   ------------------------------------------------------------
   模块划分：
     0. 工具函数
     1. 数据层（商品 / 分类 / 角色 / 关卡 / 升级 / 场景）
     2. 全局状态
     3. 音效系统
     4. 角色立绘（SVG）
     5. 剧情系统
     6. 场景渲染
     7. 关卡 & 任务系统
     8. 打扫任务
     9. 顾客 & 结账系统
    10. 上架系统
    11. 时间 / 满意度
    12. 结算 & 奖励
    13. 升级系统
    14. 界面切换 & 启动
   ============================================================ */

/* ==================== 0. 工具 ==================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmtTime = s => {
  s = Math.max(0, Math.ceil(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
function shadeColor(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ==================== 1. 数据层 ==================== */

/* ---- 1.1 角色（可自由追加：style / extra / glasses） ---- */
const CHARACTERS = {
  player:    { name: '小春（你）',      skin: '#ffe3cd', hair: '#6b4b3e', style: 'bob',      outfit: '#ffffff', accent: '#8fc9e8', extra: 'apron' },
  manager:   { name: '店长·阿和',        skin: '#ffdfc4', hair: '#4a3b34', style: 'part',     outfit: '#f7e4c4', accent: '#e59a5c', extra: 'vest', glasses: true },
  obaachan:  { name: '常客·花子奶奶',    skin: '#ffe2d2', hair: '#ded7d0', style: 'bun',      outfit: '#f6d9e4', accent: '#d98cae', extra: 'shawl', glasses: true },
  salaryman: { name: '上班族·健太',      skin: '#ffdfc6', hair: '#39323d', style: 'short',    outfit: '#a6c6e6', accent: '#4a5568', extra: 'tie' },
  student:   { name: '小学生·小葵',      skin: '#ffe6d4', hair: '#5b4136', style: 'ponytail', outfit: '#fff0b4', accent: '#e8a54a', extra: 'backpack' },
  night:     { name: '夜班客·沉默先生',  skin: '#f5dccb', hair: '#3b3945', style: 'beanie',   outfit: '#5d6779', accent: '#8b96ad', extra: 'beanie' }
};

/* ---- 1.2 货架分类 ---- */
const CATS = {
  onigiri:  { name: '饭团',   icon: '🍙' },
  bento:    { name: '便当',   icon: '🍱' },
  drink:    { name: '饮料',   icon: '🥤' },
  snack:    { name: '零食',   icon: '🍫' },
  magazine: { name: '杂志',   icon: '📖' },
  oden:     { name: '关东煮', icon: '🍢' }
};
const SHELF_CATS = ['drink', 'onigiri', 'bento', 'snack', 'magazine'];

/* ---- 1.3 商品 ---- */
const PRODUCTS = {
  onigiri:   { name: '金枪鱼饭团', short: '饭团',   cat: 'onigiri',  price: 120, cost: 65,  icon: '🍙', love: 3 },
  salmon:    { name: '鲑鱼饭团',   short: '鲑鱼团', cat: 'onigiri',  price: 140, cost: 75,  icon: '🍙', love: 2 },
  bento:     { name: '幕之内便当', short: '便当',   cat: 'bento',    price: 480, cost: 300, icon: '🍱', love: 3 },
  karaage:   { name: '炸鸡便当',   short: '炸鸡',   cat: 'bento',    price: 520, cost: 330, icon: '🍱', love: 3 },
  tea:       { name: '乌龙茶',     short: '乌龙茶', cat: 'drink',    price: 140, cost: 80,  icon: '🍵', love: 2 },
  cola:      { name: '汽水',       short: '汽水',   cat: 'drink',    price: 160, cost: 90,  icon: '🥤', love: 3 },
  milk:      { name: '牛奶',       short: '牛奶',   cat: 'drink',    price: 130, cost: 70,  icon: '🥛', love: 2 },
  chips:     { name: '薯片',       short: '薯片',   cat: 'snack',    price: 100, cost: 55,  icon: '🍟', love: 3 },
  choco:     { name: '巧克力',     short: '巧克力', cat: 'snack',    price: 150, cost: 85,  icon: '🍫', love: 2 },
  magazine:  { name: '漫画周刊',   short: '周刊',   cat: 'magazine', price: 280, cost: 160, icon: '📖', love: 2 },
  umbrella:  { name: '透明雨伞',   short: '雨伞',   cat: 'magazine', price: 500, cost: 300, icon: '☂️', love: 1 },
  odenEgg:   { name: '关东煮·鸡蛋', short: '鸡蛋',  cat: 'oden',     price: 90,  cost: 40,  icon: '🥚', love: 3 },
  odenRadish:{ name: '关东煮·萝卜', short: '萝卜',  cat: 'oden',     price: 100, cost: 45,  icon: '🍢', love: 2 }
};

/* ---- 1.4 货架容量（与货架层数视觉一致） ---- */
const SHELF_CAPS = { drink: 14, onigiri: 11, bento: 11, snack: 14, magazine: 14, oden: 6 };

/* ---- 1.4 升级项 ---- */
const UPGRADES = [
  { id: 'vacuum',   name: '小吸尘器',    icon: 'assets/i_up_vacuum.svg', max: 2, costs: [25, 45],
    desc: lv => `每天开工时，自动清理 ${lv} 处垃圾` },
  { id: 'scanner',  name: '高速扫码枪',  icon: 'assets/i_up_scanner.svg', max: 2, costs: [30, 55],
    desc: lv => `结账时自动帮你扫好 ${lv} 件商品` },
  { id: 'shelf',    name: '加宽货架',    icon: 'assets/i_up_shelf.svg', max: 2, costs: [30, 55],
    desc: lv => `每天开工时，自动上架 ${lv} 件商品` },
  { id: 'hint',     name: '等待提示牌',  icon: 'assets/i_up_hint.svg', max: 1, costs: [35],
    desc: () => '结账时直接显示找零答案' },
  { id: 'autosort', name: '自动理货机',  icon: 'assets/i_up_autosort.svg', max: 1, costs: [40],
    desc: () => '开工时自动整理 1 处放错的商品' },
  { id: 'patience', name: '微笑服务',    icon: 'assets/i_up_smile.svg?v=2', max: 1, costs: [45],
    desc: () => '顾客耐心 +50%' }
];

/* ---- 1.5 场景（累计通关解锁） ---- */
const SCENES = {
  day:     { name: '灯街便利店',  icon: '🏪', need: 0 },
  station: { name: '车站便利店',  icon: '🚉', need: 2 },
  night:   { name: '深夜便利店',  icon: '🌙', need: 3 },
  beach:   { name: '海边便利店',  icon: '🌊', need: 5 }
};

/* ---- 1.6 关卡（新增关卡只需往这里追加对象） ---- */
const LEVELS = [
  {
    id: 1, title: '第 1 天 · 初次见面', scene: 'day',
    timeLimit: 240, patience: 55,
    clean: { trash: 3, stain: 1, sort: 2 },
    customers: [
      { who: 'obaachan',  items: ['onigiri', 'tea'] },
      { who: 'salaryman', items: ['bento'] }
    ],
    stock: ['onigiri', 'tea', 'chips'],
    promo: null,
    intro: [
      { who: 'manager', mood: 'happy',  text: '小春，欢迎来到「灯街便利店」！今天，是你第一天上班哦～' },
      { who: 'player',  mood: 'happy',  text: '店长好！我、我会努力不让货架倒下来的！' },
      { who: 'manager', mood: 'happy',  text: '哈哈，货架不会倒的啦。今天只有三件事：打扫店面、帮客人结账、把新到的货摆上货架。' },
      { who: 'player',  mood: 'worried',text: '听起来……好像不太简单呢。' },
      { who: 'manager', mood: 'happy',  text: '慢慢来就好。便利店最重要的一件事，是笑容哦。' }
    ],
    outro: [
      { who: 'manager', mood: 'happy',  text: '第一天顺利完成啦！客人们都说，新来的店员笑起来很可爱呢。' },
      { who: 'player',  mood: 'thanks', text: '嘿嘿……其实我有点手忙脚乱的，不过很开心！' },
      { who: 'manager', mood: 'happy',  text: '那就好。明天会有更多客人哦，加油，小春。' }
    ]
  },
  {
    id: 2, title: '第 2 天 · 熟客们', scene: 'day',
    timeLimit: 235, patience: 50,
    clean: { trash: 4, stain: 1, sort: 2 },
    customers: [
      { who: 'obaachan',  items: ['onigiri', 'tea'] },
      { who: 'salaryman', items: ['bento', 'cola'] },
      { who: 'student',   items: ['choco', 'milk'] }
    ],
    stock: ['onigiri', 'salmon', 'tea', 'chips'],
    promo: null,
    intro: [
      { who: 'manager',  mood: 'happy',  text: '小春，今天客人会比昨天多一点。花子奶奶和健太先生都是老熟人了。' },
      { who: 'obaachan', mood: 'happy',  text: '小春酱，早上好呀。奶奶今天也要买饭团哦～' },
      { who: 'player',   mood: 'happy',  text: '欢迎光临！奶奶今天气色很好呢！' },
      { who: 'salaryman',mood: 'worried',text: '不好意思我赶时间！快、快一点哦！' },
      { who: 'player',   mood: 'worried',text: '好、好的！马上就好！' }
    ],
    outro: [
      { who: 'salaryman',mood: 'thanks', text: '……谢谢。今天居然赶上了电车，你手脚挺快的嘛。' },
      { who: 'obaachan', mood: 'happy',  text: '奶奶下次还来哦，记得给我留一个金枪鱼饭团。' },
      { who: 'player',   mood: 'thanks', text: '好的！我记住了！' },
      { who: 'manager',  mood: 'happy',  text: '看吧？熟客就是这么一点点攒起来的。' }
    ]
  },
  {
    id: 3, title: '第 3 天 · 补货日', scene: 'station',
    timeLimit: 240, patience: 48,
    clean: { trash: 4, stain: 1, sort: 3 },
    customers: [
      { who: 'student',   items: ['onigiri', 'milk'] },
      { who: 'salaryman', items: ['karaage', 'cola', 'magazine'] },
      { who: 'obaachan',  items: ['bento', 'tea', 'choco'] }
    ],
    stock: ['onigiri', 'bento', 'tea', 'chips', 'magazine', 'salmon'],
    promo: null,
    intro: [
      { who: 'manager', mood: 'happy',  text: '今天调你来车站店帮忙，顺便进了一大批货。饭团、便当、饮料、零食……千万别放错货架哦。' },
      { who: 'student', mood: 'worried',text: '那个……姐姐，我好像迷路了。这里是不是车站旁边呀？' },
      { who: 'player',  mood: 'happy',  text: '是哦，出门右转就是车站。别担心，先喝口热牛奶暖暖身子吧。' },
      { who: 'student', mood: 'thanks', text: '谢谢姐姐！你真好～' }
    ],
    outro: [
      { who: 'manager', mood: 'happy',  text: '货架摆得很整齐嘛，连杂志的封面都朝外了。' },
      { who: 'player',  mood: 'happy',  text: '因为……这样客人一眼就能找到想要的东西呀。' },
      { who: 'manager', mood: 'happy',  text: '很好，你已经有一点店员的样子了。' }
    ]
  },
  {
    id: 4, title: '第 4 天 · 关东煮与特价', scene: 'sale',
    timeLimit: 250, patience: 48,
    clean: { trash: 5, stain: 2, sort: 3 },
    customers: [
      { who: 'obaachan',  items: ['onigiri', 'onigiri', 'odenEgg'] },
      { who: 'salaryman', items: ['bento', 'odenRadish', 'tea'] },
      { who: 'student',   items: ['onigiri', 'odenEgg', 'milk'] }
    ],
    stock: ['odenEgg', 'odenRadish', 'onigiri', 'bento', 'tea', 'cola'],
    promo: { id: 'onigiri', rate: 0.5 },
    intro: [
      { who: 'manager',  mood: 'happy',  text: '今天关东煮开锅！还有——饭团限时半价，特价牌记得摆出来。' },
      { who: 'obaachan', mood: 'happy',  text: '哎呀，饭团半价？那奶奶要买两个，划算呀。' },
      { who: 'player',   mood: 'happy',  text: '好的！特价商品结账的时候，我会仔细看价格的！' },
      { who: 'manager',  mood: 'happy',  text: '关东煮也要记得补货哦，锅里空了可不好看。' }
    ],
    outro: [
      { who: 'obaachan', mood: 'thanks', text: '热乎乎的关东煮，配半价饭团，今晚有口福啦。' },
      { who: 'player',   mood: 'thanks', text: '下次我给您多盛一点汤！' },
      { who: 'manager',  mood: 'happy',  text: '特价算得很准嘛。看来我可以放心把店交给你了。' }
    ]
  },
  {
    id: 5, title: '第 5 天 · 夜班', scene: 'night',
    timeLimit: 260, patience: 45,
    clean: { trash: 6, stain: 2, sort: 4 },
    customers: [
      { who: 'night',     items: ['onigiri', 'tea'] },
      { who: 'salaryman', items: ['bento', 'cola', 'magazine'] },
      { who: 'student',   items: ['choco', 'milk'] },
      { who: 'night',     items: ['bento', 'odenEgg', 'tea'] }
    ],
    stock: ['onigiri', 'bento', 'tea', 'cola', 'chips', 'magazine'],
    promo: null,
    intro: [
      { who: 'manager', mood: 'happy',  text: '今天你值夜班，辛苦啦。夜里来的客人，都有各自的故事呢。' },
      { who: 'night',   mood: 'neutral',text: '……一杯热茶，还有一个饭团。' },
      { who: 'player',  mood: 'happy',  text: '好的！夜深了，请慢用。' },
      { who: 'night',   mood: 'thanks', text: '谢谢。……你也辛苦了。' },
      { who: 'player',  mood: 'happy',  text: '（原来夜班的便利店，是给人一点点温暖的地方呀。）' }
    ],
    outro: [
      { who: 'night',   mood: 'happy',  text: '……今晚的饭团，格外好吃。' },
      { who: 'manager', mood: 'happy',  text: '小春，五天了。你已经能一个人撑起一家店了。' },
      { who: 'player',  mood: 'thanks', text: '都是店长和大家教我的！' },
      { who: 'manager', mood: 'happy',  text: '下个月，海边那家分店要开业了。要不要……一起去看一看？' }
    ]
  }
];

/* ---- 1.7 今日经营任务 ---- */
const TASKS = [
  { id: 'revenue',  icon: 'assets/i_coin.svg?v=2',     name: '今日营业额',   reward: { coins: 15, stars: 1 } },
  { id: 'checkout', icon: 'assets/i_checkout.svg?v=2', name: '完成顾客结账', reward: { coins: 12, stars: 1 } },
  { id: 'stock',    icon: 'assets/i_stock.svg',        name: '商品补货数量', reward: { coins: 10, stars: 0 } }
];

/* ---- 1.8 天气系统 ---- */
const WEATHERS = {
  sunny:  { name: '晴', icon: 'assets/i_sun.svg' },
  cloudy: { name: '阴', icon: 'assets/i_cloud.svg' },
  rain:   { name: '雨', icon: 'assets/i_rain.svg' },
  snow:   { name: '雪', icon: 'assets/i_snow.svg' }
};

/* ---- 1.9 店铺装修 ---- */
const DECOR = [
  { id: 'chime',   name: '风铃',       slot: '门头',   price: 40, desc: '叮铃一声，夏天就来了', icon: 'assets/d_chime.svg' },
  { id: 'standee', name: '今日推荐立牌', slot: '门口',   price: 30, desc: '路过的人也会多看一眼', icon: 'assets/d_standee.svg' },
  { id: 'vase',    name: '小花瓶',     slot: '收银台', price: 35, desc: '收银时心情会好一点',   icon: 'assets/d_vase.svg' },
  { id: 'catbed',  name: '猫咪窝',     slot: '地面',   price: 50, desc: '店猫的专属座位',       icon: 'assets/d_catbed.svg' },
  { id: 'lights',  name: '小彩灯',     slot: '墙面',   price: 60, desc: '夜里最暖的一排光',     icon: 'assets/d_lights.svg' }
];

/* ==================== 2. 全局状态 ==================== */
const G = {
  levelIndex: 0,
  coins: 20,
  totalStars: 0,
  up: { vacuum: 0, scanner: 0, shelf: 0, hint: 0, autosort: 0, patience: 0 },

  time: 0, timeLimit: 1, clockId: null, lastTick: 0,
  satisfaction: 100,
  phase: 'idle',          // idle | clean | checkout | stock | done | fail
  dialogOpen: false,
  modalOpen: false,
  muted: false,
  musicOff: false,

  clean: { total: 0, done: 0 },
  co: { idx: 0, total: 0, done: 0, current: null },
  st: { queue: [], done: 0, total: 0, sel: -1 },

  revenue: 0,
  revTarget: 0,
  claimed: {},
  inv: null,
  exp: 0,
  weather: 'sunny',
  decor: { owned: [], placed: [] },

  unlocked: ['day'],
  lastResult: null
};

/* ==================== 3. 音效 & 背景音乐（WebAudio 合成） ==================== */
let actx = null;
function ac() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume().catch(() => { });
  } catch (e) { actx = null; }
  return actx;
}
function beep(freq, dur, type, vol, delay) {
  if (G.muted) return;
  const ctx = ac();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.06 : vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.04);
  } catch (e) { /* 静默失败 */ }
}
const SFX = {
  click: () => beep(540, 0.06, 'triangle', 0.05),
  tap:   () => beep(720, 0.05, 'sine', 0.04),
  ok:    () => { beep(760, 0.08); beep(980, 0.1, 'sine', 0.06, 0.07); },
  err:   () => beep(200, 0.16, 'sawtooth', 0.04),
  wipe:  () => beep(320, 0.1, 'sine', 0.035),
  coin:  () => { beep(880, 0.06); beep(1180, 0.09, 'sine', 0.06, 0.06); },
  star:  () => { beep(880, 0.09); beep(1100, 0.1, 'sine', 0.06, 0.09); beep(1320, 0.14, 'sine', 0.06, 0.19); },
  bell:  () => { beep(1318, 0.2, 'sine', 0.045); beep(1760, 0.24, 'sine', 0.035, 0.1); },
  pop:   () => beep(660, 0.07, 'triangle', 0.045),
  scan:  () => beep(1560, 0.07, 'square', 0.028),
  tick:  () => beep(1040, 0.028, 'sine', 0.022)
};

/* ---- 音乐盒 BGM：C - G - Am - F，32 步（八分音符）循环 ---- */
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const Music = {
  on: false, timer: null, next: 0, step: 0, bpm: 82,
  lead: [
    76, 74, 72, null, 72, 74, 76, 79,
    74, 72, 71, null, 71, 72, 74, 67,
    72, 76, 79, null, 79, 76, 74, 72,
    69, 72, 74, null, 72, 74, 72, 69
  ],
  bass: [
    48, null, null, null, 48, null, null, null,
    43, null, null, null, 43, null, null, null,
    45, null, null, null, 45, null, null, null,
    41, null, null, null, 41, null, null, null
  ],
  start() {
    if (this.on || G.musicOff) return;
    const ctx = ac();
    if (!ctx) return;
    this.on = true;
    this.step = 0;
    this.next = ctx.currentTime + 0.2;
    this.tick();
    this.timer = setInterval(() => this.tick(), 200);
  },
  stop() {
    this.on = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },
  tick() {
    const ctx = actx;
    if (!ctx || !this.on) return;
    const spb = 60 / this.bpm / 2;
    while (this.next < ctx.currentTime + 0.5) {
      const i = this.step;
      const m = this.lead[i];
      if (m != null) {
        this.play(m, this.next, spb * 1.8, 0.045, 'triangle');
        this.play(m + 12, this.next, spb * 0.75, 0.01, 'sine');
      }
      const b = this.bass[i];
      if (b != null) this.play(b, this.next, spb * 3.2, 0.03, 'sine');
      this.next += spb;
      this.step = (this.step + 1) % 32;
    }
  },
  play(m, t, dur, vol, type) {
    const ctx = actx;
    if (!ctx) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.value = midi(m);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { }
  }
};
function toggleMusic() {
  G.musicOff = !G.musicOff;
  const btn = $('#btnMusic');
  if (btn) btn.classList.toggle('off', G.musicOff);
  if (G.musicOff) Music.stop(); else Music.start();
  const row = $('#uiMusic');
  if (row) {
    row.textContent = G.musicOff ? '已关闭' : '已开启';
    row.classList.toggle('owned', !G.musicOff);
  }
}

/* ---- 通用点击反馈：水波 + 轻点音 + 按压 ---- */
const FX = {
  hit(el) {
    return el && el.closest && el.closest(
      '.btn,.icon-btn,.qr-btn,.nav-btn,.task,.crate-item,.keypad button,.ui-close,.co-item,.co-change,.co-pay,.shelf,.oden-stand,.goods'
    );
  },
  press(el) {
    return el && el.closest && el.closest(
      '.btn,.icon-btn,.qr-btn,.nav-btn,.keypad button,.crate-item,.goods'
    );
  },
  init() {
    document.addEventListener('pointerdown', e => {
      const host = this.hit(e.target);
      if (!host) return;
      if (e.target.closest('.shelf,.oden-stand,.task,.goods')) SFX.tick();

      const r = host.getBoundingClientRect();
      const size = Math.min(Math.max(r.width, r.height) * 1.15, 150);
      const dot = document.createElement('span');
      dot.className = 'fx-ripple';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      dot.style.setProperty('--fx-size', size + 'px');
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 640);

      const p = this.press(e.target);
      if (p) {
        p.classList.remove('fx-press');
        void p.offsetWidth;
        p.classList.add('fx-press');
        setTimeout(() => p.classList.remove('fx-press'), 340);
      }
    }, { passive: true });
  }
};

/* ==================== 4. 角色立绘 SVG ==================== */
let __charUid = 0;
function charSVG(id, mood) {
  const c = CHARACTERS[id] || CHARACTERS.manager;
  mood = mood || 'happy';
  const happy = mood === 'happy' || mood === 'thanks';
  const worried = mood === 'worried';
  const skin = c.skin, hair = c.hair, outfit = c.outfit, accent = c.accent;
  const skinHi = shadeColor(skin, 14);
  const skinSh = shadeColor(skin, -24);
  const hairHi = shadeColor(hair, 54);
  const hairSh = shadeColor(hair, -34);
  const outfitHi = shadeColor(outfit, 10);
  const outfitSh = shadeColor(outfit, -22);
  const outfitDk = shadeColor(outfit, -42);
  const accentSh = shadeColor(accent, -30);
  const u = 'ch' + (++__charUid) + '_';
  const gSkin = `url(#${u}skin)`, gHair = `url(#${u}hair)`, gCloth = `url(#${u}cloth)`, gIris = `url(#${u}iris)`;

  // 每个实例独立渐变 ID，避免同页多个立绘互相覆盖
  const defs = `<defs>
    <radialGradient id="${u}skin" cx="36%" cy="26%" r="82%">
      <stop offset="0%" stop-color="${skinHi}"/><stop offset="58%" stop-color="${skin}"/><stop offset="100%" stop-color="${skinSh}"/>
    </radialGradient>
    <linearGradient id="${u}hair" x1="0" y1="0" x2=".28" y2="1">
      <stop offset="0%" stop-color="${hairHi}"/><stop offset="38%" stop-color="${hair}"/><stop offset="100%" stop-color="${hairSh}"/>
    </linearGradient>
    <linearGradient id="${u}cloth" x1=".1" y1="0" x2=".5" y2="1">
      <stop offset="0%" stop-color="${outfitHi}"/><stop offset="52%" stop-color="${outfit}"/><stop offset="100%" stop-color="${outfitSh}"/>
    </linearGradient>
    <linearGradient id="${u}iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a5f45"/><stop offset="55%" stop-color="#57392c"/><stop offset="100%" stop-color="#2b211d"/>
    </linearGradient>
    <radialGradient id="${u}shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(120,100,80,.26)"/><stop offset="68%" stop-color="rgba(120,100,80,.11)"/><stop offset="100%" stop-color="rgba(120,100,80,0)"/>
    </radialGradient>
  </defs>`;

  let back = '', front = '', hat = '';
  switch (c.style) {
    case 'bob':
      back = `<path d="M15,56 C15,24 30,10 50,10 C70,10 85,24 85,56 L85,94 Q50,104 15,94 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>`;
      front = `<path d="M19,52 C19,24 34,12 50,12 C66,12 81,24 81,52 C75,38 65,32 50,32 C35,32 25,38 19,52 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>`;
      break;
    case 'ponytail':
      back = `<path d="M16,54 C16,22 32,10 50,10 C68,10 84,22 84,54 L84,84 Q50,94 16,84 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>
              <ellipse cx="87" cy="66" rx="9" ry="24" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>
              <path d="M85,50 q4,16 1,30" stroke="${hairHi}" stroke-width="1.4" fill="none" opacity=".4"/>`;
      front = `<path d="M18,52 C18,23 33,12 50,12 C67,12 82,23 82,52 C75,37 65,31 50,31 C35,31 25,37 18,52 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>
               <path d="M18,52 C15,40 19,28 27,21 C24,33 24,44 26,54 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.6"/>`;
      break;
    case 'bun':
      back = `<path d="M18,56 C18,24 33,11 50,11 C67,11 82,24 82,56 L82,86 Q50,96 18,86 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>`;
      front = `<path d="M19,52 C19,23 34,12 50,12 C66,12 81,23 81,52 C75,37 65,32 50,32 C35,32 25,37 19,52 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>`;
      hat = `<circle cx="50" cy="12" r="12" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>
             <path d="M43,8 q4,-3 8,-1.4" stroke="${hairHi}" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/>
             <circle cx="46" cy="8" r="2.2" fill="rgba(255,255,255,.5)"/>`;
      break;
    case 'part':
      back = `<path d="M18,54 C18,24 33,12 50,12 C67,12 82,24 82,54 L82,74 Q50,84 18,74 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>`;
      front = `<path d="M19,50 C23,24 38,12 57,12 C72,14 80,27 82,45 C71,32 51,29 37,39 C29,44 23,47 19,50 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>`;
      break;
    case 'beanie':
      back = `<path d="M17,56 C17,25 32,12 50,12 C68,12 83,25 83,56 L83,76 Q50,86 17,76 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>`;
      front = `<path d="M20,50 C20,26 34,16 50,16 C66,16 80,26 80,50 C74,38 64,33 50,33 C36,33 26,38 20,50 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>`;
      hat = `<path d="M15,44 C15,16 31,5 50,5 C69,5 85,16 85,44 Z" fill="${accent}" stroke="${accentSh}" stroke-width="1.8"/>
             <path d="M17,40 C18,20 32,9 48,7" stroke="rgba(255,255,255,.4)" stroke-width="3" fill="none" stroke-linecap="round"/>
             <rect x="13" y="40" width="74" height="11" rx="5.5" fill="${shadeColor(accent, -22)}" stroke="${shadeColor(accent, -40)}" stroke-width="1.4"/>
             <path d="M17,44.5 h66" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>
             <circle cx="50" cy="6" r="7" fill="${shadeColor(accent, 22)}" stroke="${shadeColor(accent, -18)}" stroke-width="1.4"/>
             <circle cx="48" cy="4" r="2" fill="rgba(255,255,255,.55)"/>`;
      break;
    default:
      back = `<path d="M18,54 C18,24 33,12 50,12 C67,12 82,24 82,54 L82,72 Q50,82 18,72 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="2"/>`;
      front = `<path d="M19,52 C19,23 34,12 50,12 C66,12 81,23 81,52 C75,37 65,31 50,31 C35,31 25,37 19,52 Z" fill="${gHair}" stroke="${hairSh}" stroke-width="1.8"/>`;
  }

  const strands = `<path d="M33,38 C34,28 42,22 52,20" stroke="${hairHi}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".42"/>
    <path d="M45,32 C48,25 55,21 62,22" stroke="${hairHi}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".3"/>`;

  let eyes;
  if (happy) {
    const lw = mood === 'thanks' ? 3.6 : 3.1;
    eyes = `<path d="M34.4,56.2 q5.8,-8.6 11.6,-.4" stroke="#3d2f2a" stroke-width="${lw}" fill="none" stroke-linecap="round"/>
            <path d="M54,55.8 q5.8,-8.6 11.6,-.4" stroke="#3d2f2a" stroke-width="${lw}" fill="none" stroke-linecap="round"/>
            <path d="M35.4,58.4 q2.2,1.8 4.6,1.2" stroke="${skinSh}" stroke-width="1" fill="none" opacity=".5" stroke-linecap="round"/>
            <path d="M55,58 q2.2,1.8 4.6,1.2" stroke="${skinSh}" stroke-width="1" fill="none" opacity=".5" stroke-linecap="round"/>`;
  } else if (worried) {
    eyes = `<ellipse cx="39.5" cy="56" rx="3.9" ry="4.8" fill="#fffdfa"/>
            <ellipse cx="60.5" cy="56" rx="3.9" ry="4.8" fill="#fffdfa"/>
            <ellipse cx="39.5" cy="56.6" rx="2.9" ry="3.7" fill="${gIris}"/>
            <ellipse cx="60.5" cy="56.6" rx="2.9" ry="3.7" fill="${gIris}"/>
            <ellipse cx="39.5" cy="57.2" rx="1.4" ry="1.9" fill="#241c19"/>
            <ellipse cx="60.5" cy="57.2" rx="1.4" ry="1.9" fill="#241c19"/>
            <circle cx="38.2" cy="54.6" r="1.2" fill="#fff"/>
            <circle cx="59.2" cy="54.6" r="1.2" fill="#fff"/>
            <path d="M35.4,51.8 q4.2,-3.4 8.2,-.8" stroke="#3d2f2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            <path d="M56.4,51 q4.2,-2.6 8.2,1" stroke="#3d2f2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  } else {
    eyes = `<ellipse cx="39.5" cy="55.4" rx="4.3" ry="5.2" fill="#fffdfa"/>
            <ellipse cx="60.5" cy="55.4" rx="4.3" ry="5.2" fill="#fffdfa"/>
            <ellipse cx="39.5" cy="55.6" rx="3.3" ry="4.3" fill="${gIris}"/>
            <ellipse cx="60.5" cy="55.6" rx="3.3" ry="4.3" fill="${gIris}"/>
            <ellipse cx="39.5" cy="56.2" rx="1.6" ry="2.2" fill="#241c19"/>
            <ellipse cx="60.5" cy="56.2" rx="1.6" ry="2.2" fill="#241c19"/>
            <circle cx="38" cy="53.2" r="1.5" fill="#fff"/>
            <circle cx="41.2" cy="57.4" r=".85" fill="#fff" opacity=".8"/>
            <circle cx="59" cy="53.2" r="1.5" fill="#fff"/>
            <circle cx="62.2" cy="57.4" r=".85" fill="#fff" opacity=".8"/>
            <path d="M35.4,51.4 q4.4,-4.4 8.4,-.4" stroke="#3d2f2a" stroke-width="1.7" fill="none" stroke-linecap="round"/>
            <path d="M56.2,51 q4.4,-4 8.4,.4" stroke="#3d2f2a" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  }

  const brows = worried
    ? `<path d="M32,48 L42,45.2" stroke="${hairSh}" stroke-width="2.3" stroke-linecap="round"/>
       <path d="M68,48 L58,45.2" stroke="${hairSh}" stroke-width="2.3" stroke-linecap="round"/>`
    : `<path d="M32.6,45.4 q7,-3.4 13.6,-.2" stroke="${hairSh}" stroke-width="2.1" fill="none" stroke-linecap="round" opacity=".5"/>
       <path d="M53.8,45.2 q7,-3.2 13.6,.2" stroke="${hairSh}" stroke-width="2.1" fill="none" stroke-linecap="round" opacity=".5"/>`;

  const nose = `<path d="M49.3,58.8 q1.2,1.5 2.6,.4" stroke="${skinSh}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".6"/>`;

  const mouth = mood === 'thanks'
    ? `<path d="M42,63 Q50,78 58,63 Q50,71 42,63 Z" fill="#cf7a63"/>
       <path d="M46,66.5 Q50,70 54,66.5" stroke="#b4654f" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".45"/>
       <path d="M46.5,68.6 Q50,71 53.5,68.6" stroke="#ffd9cf" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`
    : happy
      ? `<path d="M43,64 Q50,74 57,64 Q50,69 43,64 Z" fill="#cf7a63"/>
         <path d="M46.5,68.2 Q50,70.2 53.5,68.2" stroke="#ffd9cf" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>`
      : worried
        ? `<path d="M45,69.5 q5,-4 10,0" stroke="#c9705c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
        : `<path d="M46.5,67 q3.5,3.6 7,0" stroke="#c9705c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

  const blush = worried ? '' :
    `<ellipse cx="28.5" cy="62.5" rx="6" ry="3.4" fill="#ffb3b3" opacity=".5"/>
     <ellipse cx="71.5" cy="62.5" rx="6" ry="3.4" fill="#ffb3b3" opacity=".5"/>
     <path d="M25.8,62.4 h5.6 M25.2,64.4 h5" stroke="#f79a9a" stroke-width=".9" opacity=".5" stroke-linecap="round"/>
     <path d="M68.6,62.4 h5.6 M69.8,64.4 h5" stroke="#f79a9a" stroke-width=".9" opacity=".5" stroke-linecap="round"/>`;

  const glasses = c.glasses
    ? `<circle cx="40" cy="55" r="9" fill="rgba(255,255,255,.26)" stroke="#6b5b52" stroke-width="1.9"/>
       <circle cx="60" cy="55" r="9" fill="rgba(255,255,255,.26)" stroke="#6b5b52" stroke-width="1.9"/>
       <path d="M49,55 h2" stroke="#6b5b52" stroke-width="1.9"/>
       <path d="M31,53 l-6,-2" stroke="#6b5b52" stroke-width="1.9" stroke-linecap="round"/>
       <path d="M69,53 l6,-2" stroke="#6b5b52" stroke-width="1.9" stroke-linecap="round"/>
       <path d="M34.6,51.2 q3.6,-2.6 7.4,-1.2" stroke="#fff" stroke-width="1.5" opacity=".7" fill="none" stroke-linecap="round"/>
       <path d="M54.6,51.2 q3.6,-2.6 7.4,-1.2" stroke="#fff" stroke-width="1.5" opacity=".7" fill="none" stroke-linecap="round"/>`
    : '';

  const sweat = worried
    ? `<path d="M76,38 q4,7 0,10 q-4,-3 0,-10 Z" fill="#9fd6ef"/>
       <ellipse cx="75" cy="40.6" rx="1" ry="1.8" fill="rgba(255,255,255,.7)"/>` : '';

  let extras = '';
  if (c.extra === 'apron') {
    extras = `<path d="M37,80 h26 v27 q-13,5 -26,0 Z" fill="#fffdf8" stroke="#e9dcc8" stroke-width="1"/>
              <path d="M38.5,80 q11.5,6 23,0" stroke="#f1e6d4" stroke-width="1.2" fill="none"/>
              <rect x="45" y="88" width="10" height="8" rx="2" fill="#f4f8fb" stroke="#e2eef6" stroke-width="1"/>
              <path d="M37,104 q13,5 26,0" stroke="#eee1cd" stroke-width="1" fill="none" opacity=".8"/>`;
  } else if (c.extra === 'vest') {
    extras = `<path d="M30,82 q7,-4 11,0 l0,34 q-8,1 -15,-2 Z" fill="${accent}" opacity=".82"/>
              <path d="M70,82 q-7,-4 -11,0 l0,34 q8,1 15,-2 Z" fill="${accent}" opacity=".82"/>
              <path d="M33.5,84.4 q3.6,-1.6 6.4,0" stroke="${shadeColor(accent, 24)}" stroke-width="1" fill="none" opacity=".7"/>
              <path d="M66.5,84.4 q-3.6,-1.6 -6.4,0" stroke="${shadeColor(accent, 24)}" stroke-width="1" fill="none" opacity=".7"/>`;
  } else if (c.extra === 'tie') {
    extras = `<path d="M46.6,80 h6.8 l-1.2,6.4 l-2.2,16 l-2.2,-16 Z" fill="${accent}"/>
              <path d="M47.6,81.4 h4.8" stroke="${shadeColor(accent, 28)}" stroke-width="1" opacity=".8"/>`;
  } else if (c.extra === 'shawl') {
    extras = `<path d="M28,82 q22,12 44,0 l0,9 q-22,12 -44,0 Z" fill="${accent}" opacity=".45"/>
              <path d="M30,86.4 q20,10 40,0" stroke="${accentSh}" stroke-width="1.2" fill="none" opacity=".55"/>`;
  }
  const backpack = c.extra === 'backpack'
    ? `<rect x="65" y="83" width="18" height="29" rx="9" fill="#f6a8a8" stroke="#e39090" stroke-width="1.2"/>
       <rect x="68" y="91" width="12" height="8" rx="3.4" fill="#ffd0d0"/>
       <path d="M69,94.6 h10" stroke="#eba6a6" stroke-width="1"/>` : '';

  return `<svg viewBox="0 0 100 152" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <ellipse cx="50" cy="147" rx="27" ry="5.4" fill="url(#${u}shadow)"/>
    ${backpack}
    <rect x="38" y="118" width="9" height="24" rx="4" fill="#8b7a6b"/>
    <rect x="53" y="118" width="9" height="24" rx="4" fill="#8b7a6b"/>
    <path d="M40.5,121 v17" stroke="rgba(255,255,255,.18)" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M55.5,121 v17" stroke="rgba(255,255,255,.18)" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="33" y="137" width="16" height="9" rx="4.5" fill="#5d5348"/>
    <rect x="51" y="137" width="16" height="9" rx="4.5" fill="#5d5348"/>
    <path d="M35,139.6 q4,-2 9,-.6" stroke="rgba(255,255,255,.22)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M53,139.6 q4,-2 9,-.6" stroke="rgba(255,255,255,.22)" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <rect x="27" y="78" width="46" height="44" rx="18" fill="${gCloth}" stroke="${outfitSh}" stroke-width="1.6"/>
    <path d="M31,117 q19,7 38,0" stroke="${outfitSh}" stroke-width="1.6" fill="none" opacity=".5"/>
    <path d="M67.6,83 q6.2,16 1.6,32" stroke="${outfitSh}" stroke-width="1.4" fill="none" opacity=".28"/>
    <path d="M42,79 q8,9 16,0" stroke="${outfitDk}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
    <circle cx="50" cy="97" r="1.3" fill="${outfitDk}" opacity=".45"/>
    <circle cx="50" cy="109" r="1.3" fill="${outfitDk}" opacity=".45"/>
    ${extras}
    <rect x="16" y="82" width="11" height="30" rx="5.5" fill="${gCloth}" stroke="${outfitSh}" stroke-width="1.4"/>
    <rect x="73" y="82" width="11" height="30" rx="5.5" fill="${gCloth}" stroke="${outfitSh}" stroke-width="1.4"/>
    <path d="M16.8,105 h9.4" stroke="${outfitSh}" stroke-width="1.3" opacity=".5"/>
    <path d="M73.8,105 h9.4" stroke="${outfitSh}" stroke-width="1.3" opacity=".5"/>
    <circle cx="21.5" cy="113" r="5.6" fill="${gSkin}" stroke="${skinSh}" stroke-width="1.2"/>
    <circle cx="78.5" cy="113" r="5.6" fill="${gSkin}" stroke="${skinSh}" stroke-width="1.2"/>
    <path d="M19,112.4 q2.4,-1.4 4.8,-.2" stroke="${skinSh}" stroke-width=".9" fill="none" opacity=".55"/>
    <path d="M76,112.4 q2.4,-1.4 4.8,-.2" stroke="${skinSh}" stroke-width=".9" fill="none" opacity=".55"/>
    <rect x="44" y="70" width="12" height="12" rx="3" fill="${gSkin}" stroke="${skinSh}" stroke-width="1.2"/>
    <path d="M44,74.6 q6,4 12,0 v-4.6 h-12 Z" fill="${skinSh}" opacity=".32"/>
    ${back}
    <circle cx="50" cy="52" r="30" fill="${gSkin}" stroke="${skinSh}" stroke-width="1.6"/>
    <path d="M31,64 q19,17 38,0" stroke="${skinSh}" stroke-width="2" fill="none" opacity=".16"/>
    <circle cx="20" cy="55" r="5.2" fill="${gSkin}" stroke="${skinSh}" stroke-width="1.2"/>
    <circle cx="80" cy="55" r="5.2" fill="${gSkin}" stroke="${skinSh}" stroke-width="1.2"/>
    <path d="M21,52 q1.8,3 0,5.6" stroke="${skinSh}" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>
    <path d="M79,52 q-1.8,3 0,5.6" stroke="${skinSh}" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>
    ${front}
    ${strands}
    ${brows}
    ${eyes}
    ${nose}
    ${blush}
    ${mouth}
    ${glasses}
    ${hat}
    ${sweat}
  </svg>`;
}

/* ==================== 5. 剧情系统 ==================== */
const TYPE = { timer: null, on: false, el: null, full: '' };
function typeText(el, text) {
  clearInterval(TYPE.timer);
  el.textContent = '';
  TYPE.el = el; TYPE.full = text; TYPE.on = true;
  let i = 0;
  TYPE.timer = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(TYPE.timer); TYPE.on = false; }
  }, 30);
}
function skipType() {
  if (!TYPE.on) return false;
  clearInterval(TYPE.timer);
  if (TYPE.el) TYPE.el.textContent = TYPE.full;
  TYPE.on = false;
  return true;
}

function showDialogue(lines, done) {
  if (!lines || !lines.length) { done && done(); return; }
  G.dialogOpen = true;
  const layer = $('#dialogueLayer');
  layer.innerHTML = `
    <div class="dlg-box">
      <div class="dlg-ava"><div class="dlg-avatar" id="dlgAvatar"></div></div>
      <div class="dlg-main">
        <div class="dlg-name" id="dlgName"></div>
        <div class="dlg-text" id="dlgText"></div>
      </div>
      <div class="dlg-tip">点击继续<i>▼</i></div>
    </div>`;
  let i = 0;

  const render = () => {
    const l = lines[i];
    const ch = CHARACTERS[l.who] || CHARACTERS.manager;
    $('#dlgAvatar').innerHTML = charSVG(l.who, l.mood || 'happy');
    const nm = $('#dlgName');
    nm.textContent = ch.name;
    nm.className = 'dlg-name ' + l.who;
    typeText($('#dlgText'), l.text);
  };
  const close = () => {
    layer.classList.remove('show');
    setTimeout(() => { layer.innerHTML = ''; }, 300);
    G.dialogOpen = false;
    done && done();
  };

  layer.onclick = () => {
    if (skipType()) return;
    SFX.tap();
    i++;
    if (i >= lines.length) { close(); return; }
    render();
  };

  layer.classList.add('show');
  render();
}

/* ==================== 6. 场景渲染 ==================== */
/* 商品插画：按分类生成纯 CSS 小插图（颜色变体让货架更热闹） */
const GOODS_PREFIX = { magazine: 'mag' };
const GOODS_VARIANTS = { drink: 4, snack: 4, magazine: 4, onigiri: 2, bento: 2 };
const GOODS_PER = { drink: 4, onigiri: 3, bento: 3, snack: 4, magazine: 4 };
function goodsSrc(cat, seed) {
  if (cat === 'oden') return 'assets/p_oden.svg?v=4';
  const n = GOODS_VARIANTS[cat] || 1;
  const s = Math.abs(seed || 0);
  return `assets/p_${GOODS_PREFIX[cat] || cat}_${s % n}.svg?v=4`;
}
function goodsItem(cat, seed) {
  return `<img class="goods" src="${goodsSrc(cat, seed)}" alt="">`;
}
function goodsRow(cat, n, off) {
  let s = '';
  for (let i = 0; i < n; i++) s += goodsItem(cat, (off || 0) + i);
  return s;
}

/* ---- 货架库存：数量决定货架上的商品摆放 ---- */
function initInventory() {
  if (G.inv) return;
  G.inv = {};
  Object.keys(SHELF_CAPS).forEach(cat => {
    G.inv[cat] = { stock: SHELF_CAPS[cat], cap: SHELF_CAPS[cat] };
  });
}
function invOf(cat) {
  return G.inv && G.inv[cat] ? G.inv[cat] : null;
}
function catProducts(cat) {
  return Object.keys(PRODUCTS).filter(pid => PRODUCTS[pid].cat === cat);
}
function renderShelfStock(cat, animate) {
  const inv = invOf(cat);
  if (!inv) return;
  if (cat === 'oden') {
    const pot = $('#odenPot');
    if (pot) pot.innerHTML = goodsRow('oden', Math.min(inv.stock, 4), 0);
    return;
  }
  const shelf = $('#shelf-' + cat);
  if (!shelf) return;
  const body = shelf.querySelector('.shelf-body');
  if (!body) return;
  const per = GOODS_PER[cat] || 3;
  let remain = Math.max(0, Math.min(inv.stock, inv.cap));
  const rows = [];
  for (let t = 0; t < 3; t++) {
    const n = Math.min(per, remain);
    remain -= n;
    rows.push(`<div class="shelf-tier">${n ? goodsRow(cat, n, t * 3) : ''}</div>`);
  }
  const nb = Math.min(2, remain);
  rows.push(`<div class="shelf-bottom shelf-items" id="shelf-items-${cat}">${nb ? goodsRow(cat, nb, 8) : ''}</div>`);
  body.innerHTML = rows.join('');

  const lowLine = Math.max(2, Math.ceil(inv.cap * 0.2));
  shelf.classList.toggle('empty', inv.stock <= 0);
  shelf.classList.toggle('low', inv.stock > 0 && inv.stock <= lowLine);
  const badge = shelf.querySelector('.shelf-badge') || shelf.appendChild(Object.assign(document.createElement('div'), { className: 'shelf-badge' }));
  badge.textContent = inv.stock <= 0 ? '售罄' : (inv.stock <= lowLine ? '仅剩 ' + inv.stock : '');
  shelf.dataset.stock = inv.stock;

  if (animate) {
    shelf.classList.remove('restock');
    void shelf.offsetWidth;
    shelf.classList.add('restock');
    setTimeout(() => shelf.classList.remove('restock'), 680);
  }
}
function renderAllShelves(animate) {
  SHELF_CATS.forEach(c => renderShelfStock(c, animate));
  renderShelfStock('oden', animate);
}

function buildScene(L) {
  const stage = $('#stage');
  stage.className = 'stage scene-' + (L.scene || 'day');
  $('#sSign').textContent = {
    day: '灯街便利店', station: '灯街駅前店', sale: '灯街便利店', night: '灯街便利店'
  }[L.scene] || '灯街便利店';
  $('#playerChar').innerHTML = charSVG('player', 'happy');
  $('#hudAvatar').innerHTML = charSVG('player', 'happy');

  initInventory();
  $('#shelfRow').innerHTML = SHELF_CATS.map(cat => `
    <div class="shelf${cat === 'drink' ? ' fridge' : ''}" id="shelf-${cat}" data-cat="${cat}">
      <img class="shelf-art" src="assets/${cat === 'drink' ? 'fridge.svg?v=4' : 'shelf.svg?v=5'}" alt="">
      ${cat === 'drink' ? '' : `<div class="shelf-label"><img src="${goodsSrc(cat, 0)}" alt="">${CATS[cat].name}</div>`}
      <div class="shelf-body">
        <div class="shelf-tier"></div>
        <div class="shelf-tier"></div>
        <div class="shelf-tier"></div>
        <div class="shelf-bottom shelf-items" id="shelf-items-${cat}"></div>
      </div>
      <div class="shelf-badge"></div>
    </div>`).join('');

  renderAllShelves();
  bindShelfTips();
}

/* ---- 货架悬停提示 ---- */
let shelfTipEl = null;
function bindShelfTips() {
  $$('.shelf').forEach(sh => {
    sh.addEventListener('mouseenter', () => showShelfTip(sh.dataset.cat, sh));
    sh.addEventListener('mouseleave', hideShelfTip);
  });
  const oden = $('#odenStand');
  if (oden) {
    oden.addEventListener('mouseenter', () => showShelfTip('oden', oden));
    oden.addEventListener('mouseleave', hideShelfTip);
  }
}
function showShelfTip(cat, host) {
  const inv = invOf(cat);
  if (!inv || G.modalOpen) return;
  if (!shelfTipEl) {
    shelfTipEl = document.createElement('div');
    shelfTipEl.className = 'shelf-tip';
    document.body.appendChild(shelfTipEl);
  }
  const list = catProducts(cat).slice(0, 2);
  shelfTipEl.innerHTML = `<b>${CATS[cat].name}货架</b>
    <span class="tip-stock">库存 ${inv.stock} / ${inv.cap}</span>
    ${list.map(pid => {
      const p = PRODUCTS[pid];
      return `<span class="tip-row">${p.name}<i>¥${p.price}</i></span>`;
    }).join('')}
    <span class="tip-foot">点击查看详情与补货</span>`;
  shelfTipEl.classList.add('show');
  const r = host.getBoundingClientRect();
  const w = shelfTipEl.offsetWidth || 170;
  const left = r.right + 10 + w > innerWidth ? r.left - w - 10 : r.right + 10;
  shelfTipEl.style.left = Math.max(8, left) + 'px';
  shelfTipEl.style.top = Math.min(innerHeight - 120, Math.max(70, r.top + 12)) + 'px';
}
function hideShelfTip() {
  if (shelfTipEl) shelfTipEl.classList.remove('show');
}

/* ---- 货架详情 & 补货 ---- */
function openShelfPanel(cat) {
  if (G.phase === 'stock' || G.phase === 'clean' || G.phase === 'transition') return;
  const inv = invOf(cat);
  if (!inv) return;
  const list = catProducts(cat);
  const need = Math.min(3, inv.cap - inv.stock);
  const avgCost = list.length ? list.reduce((s, pid) => s + PRODUCTS[pid].cost, 0) / list.length : 0;
  const price = Math.round(need * avgCost);
  const rows = list.map(pid => {
    const p = PRODUCTS[pid];
    return `<div class="sh-prod">
      <span class="sh-ico"><img src="${goodsSrc(cat, 0)}" alt=""></span>
      <div class="sh-main">
        <b>${p.name}</b>
        <span>售价 ¥${p.price} · 进货 ¥${p.cost} · 人气 ${'★'.repeat(p.love)}${'☆'.repeat(3 - p.love)}</span>
      </div>
      <span class="sh-profit">每件 +¥${p.price - p.cost}</span>
    </div>`;
  }).join('');
  openPanel(`
    <div class="ui-card sh-card">
      <div class="ui-head"><img src="assets/i_stock.svg" alt=""><b>${CATS[cat].name}货架</b>
        <button class="ui-close" id="uiClose"><img src="assets/i_close.svg?v=2" alt=""></button></div>
      <div class="sh-stockline"><span>当前库存</span><b>${inv.stock} / ${inv.cap}</b></div>
      <div class="sh-bar"><i style="width:${Math.round(inv.stock / inv.cap * 100)}%"></i></div>
      ${rows}
      <div class="ui-actions">
        <button class="btn" id="shBack">继续打工</button>
        <button class="btn btn-primary" id="shRestock" ${need ? '' : 'disabled'}>
          ${need ? `补货 +${need} · ¥${price}` : '库存已满'}
        </button>
      </div>
    </div>`);
  const back = $('#shBack');
  if (back) back.onclick = () => { SFX.click(); closeModal(); setNav('home'); };
  const btn = $('#shRestock');
  if (btn && need) btn.onclick = () => restockCat(cat);
}
function restockCat(cat) {
  const inv = invOf(cat);
  if (!inv) return;
  const need = Math.min(3, inv.cap - inv.stock);
  if (need <= 0) { SFX.err(); toast('货架已经摆满了～', 'bad'); return; }
  const list = catProducts(cat);
  const avgCost = list.reduce((s, pid) => s + PRODUCTS[pid].cost, 0) / list.length;
  const price = Math.round(need * avgCost);
  if (G.coins < price) {
    SFX.err();
    toast('金币不足，先多结几单吧～', 'bad');
    return;
  }
  const from = $('#shRestock');
  G.coins -= price;
  inv.stock += need;
  updateHUD();
  renderShelfStock(cat, true);
  SFX.coin();
  flyCoins(from, 5);
  toast('补货完成：' + CATS[cat].name + ' +' + need, 'good');
  closeModal();
  openShelfPanel(cat);
}

/* ==================== 7. 关卡 & 任务系统 ==================== */
function taskState(id) {
  if (id === 'revenue') return { done: Math.min(G.revenue, G.revTarget), total: G.revTarget };
  if (id === 'checkout') return { done: G.co.done, total: G.co.total };
  return { done: G.st.done, total: G.st.total };
}
function renderTaskbar() {
  $('#taskbar').innerHTML = TASKS.map(t => `
    <div class="task" id="task-${t.id}" data-task="${t.id}">
      <span class="t-ico"><img src="${t.icon}" alt=""></span>
      <div class="t-body">
        <div class="t-top">
          <span class="t-name">${t.name}</span>
          <span class="t-reward">+${t.reward.coins} 金币${t.reward.stars ? ' · +' + t.reward.stars + ' 钻' : ''}</span>
        </div>
        <span class="t-prog" id="prog-${t.id}">待开始</span>
        <div class="t-bar" id="bar-${t.id}"><i></i></div>
      </div>
      <button class="t-claim" id="claim-${t.id}" data-claim="${t.id}">领取</button>
    </div>`).join('');
  $$('.t-claim').forEach(b => {
    b.onclick = e => { e.stopPropagation(); claimTask(b.dataset.claim); };
  });
}
function updateTaskbar() {
  TASKS.forEach(t => {
    const el = $('#task-' + t.id);
    if (!el) return;
    const { done, total } = taskState(t.id);
    const pr = $('#prog-' + t.id), bar = $('#bar-' + t.id);
    const claimed = !!G.claimed[t.id];
    const complete = total > 0 && done >= total;
    if (pr) {
      if (claimed) pr.textContent = '奖励已领取';
      else if (!total) pr.textContent = '待开始';
      else pr.textContent = (t.id === 'revenue' ? '¥' + Math.round(done) + ' / ¥' + Math.round(total) : done + ' / ' + total);
    }
    if (bar) bar.style.setProperty('--p', total ? Math.round(Math.min(1, done / total) * 100) + '%' : '0%');
    el.classList.toggle('done', complete);
    el.classList.toggle('claimed', claimed);
    const btn = $('#claim-' + t.id);
    if (btn) btn.style.display = complete && !claimed ? '' : 'none';
  });
}
function setTaskProgress() { updateTaskbar(); }
function setActiveTask(id) {
  TASKS.forEach(t => {
    const el = $('#task-' + t.id);
    if (!el) return;
    el.classList.toggle('active', t.id === id);
  });
}
function claimTask(id) {
  const t = TASKS.find(x => x.id === id);
  if (!t) return;
  const { done, total } = taskState(id);
  if (!(total > 0 && done >= total) || G.claimed[id]) return;
  const btn = $('#claim-' + id);
  G.claimed[id] = true;
  G.coins += t.reward.coins;
  G.totalStars += t.reward.stars || 0;
  flyCoins(btn, 7);
  SFX.coin();
  if (t.reward.stars) setTimeout(() => SFX.star(), 180);
  updateHUD();
  updateTaskbar();
  toast('任务完成：' + t.name + ' · +' + t.reward.coins + ' 金币' +
    (t.reward.stars ? ' · +' + t.reward.stars + ' 钻石' : ''), 'good');
}

function resetStage() {
  $('#trashLayer').innerHTML = '';
  $('#charLayer').innerHTML = '';
  $('#modalLayer').innerHTML = '';
  $('#modalLayer').classList.remove('show');
  $('#dialogueLayer').innerHTML = '';
  $('#dialogueLayer').classList.remove('show');
  $('#toastLayer').innerHTML = '';
  $('#crate').classList.remove('show');
  $('#crateItems').innerHTML = '';
  $$('.stain').forEach(e => e.remove());
  $$('.shelf-items').forEach(e => e.innerHTML = '');
  $$('.shelf').forEach(e => e.classList.remove('droppable', 'hot', 'shake', 'good'));
  $('#odenStand').classList.remove('droppable', 'hot');
  $('#phaseHint').classList.remove('show');
}

function startLevel(idx) {
  if (idx >= LEVELS.length) { showEnding(); return; }
  G.levelIndex = idx;
  const L = LEVELS[idx];
  G.time = L.timeLimit;
  G.timeLimit = L.timeLimit;
  G.satisfaction = 100;
  G.phase = 'idle';
  G.dialogOpen = false;
  G.modalOpen = false;
  G.co = { idx: 0, total: L.customers.length, done: 0, current: null };
  G.st = { queue: [], done: 0, total: L.stock.length, sel: -1 };
  G.clean = { total: 0, done: 0 };
  G.revenue = 0;
  G.claimed = {};
  const fullRev = L.customers.reduce((sum, c) =>
    sum + c.items.reduce((s2, pid) => s2 + priceOf(pid), 0), 0);
  G.revTarget = Math.round(fullRev * 0.8 / 10) * 10;
  initInventory();

  stopClock();
  resetStage();
  buildScene(L);
  G.weather = pickWeather();
  applyWeather();
  renderDecor();
  renderTaskbar();
  updateTaskbar();
  G.time = L.timeLimit;
  updateHUD();
  $('#hudLevel').textContent = '第 ' + (idx + 1) + ' 天';
  showScreen('game');

  setTimeout(() => showDialogue(L.intro, beginPlay), 280);
}

function beginPlay() {
  const L = LEVELS[G.levelIndex];
  startClock();
  startCleanPhase(L);
}

/* ==================== 8. 打扫任务 ==================== */
const TRASH_POOL = [
  'assets/t_candy.svg', 'assets/t_paper.svg', 'assets/t_can.svg',
  'assets/t_leaf.svg', 'assets/t_tissue.svg', 'assets/t_cup.svg'
];

function startCleanPhase(L) {
  G.phase = 'clean';
  setActiveTask('clean');
  hint('点掉地上的垃圾 · 擦干净柜台 · 把放错货架的商品归位');
  G.clean = { total: 0, done: 0 };
  const c = L.clean;
  for (let i = 0; i < c.trash; i++) spawnTrash();
  for (let i = 0; i < c.stain; i++) spawnStain();
  for (let i = 0; i < c.sort; i++) spawnMisfit();
  setTaskProgress('clean', 0, G.clean.total);
  setTaskProgress('checkout', 0, L.customers.length);
  setTaskProgress('stock', 0, L.stock.length);

  // 升级：小吸尘器
  const vac = G.up.vacuum;
  for (let i = 0; i < vac; i++) {
    const tr = $$('#trashLayer .trash').filter(e => !e.dataset.cleaned);
    if (!tr.length) break;
    const el = tr[0];
    setTimeout(() => { if (document.body.contains(el)) cleanTrash(el, true); }, 700 + i * 420);
  }
  // 升级：自动理货机
  if (G.up.autosort) {
    setTimeout(() => {
      const mf = $$('.misfit')[0];
      if (mf) fixMisfit(mf, true);
    }, 1100);
  }
  if (G.clean.total === 0) setTimeout(finishClean, 300);
  updateHUD();
}

function spawnTrash() {
  const el = document.createElement('div');
  el.className = 'trash';
  el.innerHTML = `<img src="${pick(TRASH_POOL)}" alt="">`;
  el.style.left = rand(40, 93) + '%';
  el.style.top = rand(58, 89) + '%';
  el.addEventListener('click', () => cleanTrash(el));
  $('#trashLayer').appendChild(el);
  G.clean.total++;
}

function cleanTrash(el, isAuto) {
  if (el.dataset.cleaned === '1') return;
  el.dataset.cleaned = '1';
  el.classList.add('gone');
  if (!isAuto) SFX.wipe(); else SFX.click();
  sparkle(el);
  setTimeout(() => el.remove(), 420);
  bumpClean(1);
}

function spawnStain() {
  const el = document.createElement('div');
  el.className = 'stain';
  el.dataset.need = '2';
  el.dataset.hits = '0';
  el.style.left = rand(8, 62) + '%';
  el.style.top = rand(24, 58) + '%';
  el.addEventListener('click', () => wipeStain(el));
  $('.counter').appendChild(el);
  G.clean.total++;
}

function wipeStain(el) {
  const hits = Number(el.dataset.hits) + 1;
  el.dataset.hits = hits;
  if (hits >= Number(el.dataset.need)) {
    SFX.wipe();
    sparkle(el);
    el.classList.add('gone');
    setTimeout(() => el.remove(), 380);
    bumpClean(1);
  } else {
    SFX.wipe();
    el.style.transform = 'scale(.75)';
    setTimeout(() => { if (el.parentNode) el.style.transform = ''; }, 120);
    toast('再擦一下下～');
  }
}

function spawnMisfit() {
  const cats = SHELF_CATS.concat(['oden']);
  const rightCat = pick(cats);
  const wrongCat = pick(cats.filter(c => c !== rightCat) .filter(c => c !== 'oden'));
  const pool = Object.keys(PRODUCTS).filter(k => PRODUCTS[k].cat === rightCat);
  if (!pool.length) return;
  const pid = pick(pool);
  const el = document.createElement('span');
  el.className = 'misfit';
  el.innerHTML = goodsItem(rightCat, randi(0, 3));
  el.title = '放错位置了：' + PRODUCTS[pid].name;
  el.dataset.answer = rightCat;
  el.dataset.pid = pid;
  el.addEventListener('click', e => { e.stopPropagation(); fixMisfit(el); });
  const target = wrongCat === 'oden' ? $('#odenStand .oden-pot') : $('#shelf-items-' + wrongCat);
  if (!target) return;
  target.appendChild(el);
  G.clean.total++;
}

function fixMisfit(el, isAuto) {
  const cat = el.dataset.answer, pid = el.dataset.pid;
  sparkle(el);
  if (!isAuto) SFX.ok(); else SFX.click();
  el.remove();
  const inv = invOf(cat);
  if (inv) {
    inv.stock = Math.min(inv.cap, inv.stock + 1);
    const holder = cat === 'oden' ? $('#odenStand .oden-pot') : $('#shelf-items-' + cat);
    if (holder) holder.insertAdjacentHTML('beforeend', goodsItem(cat, randi(0, 3)));
  }
  bumpClean(1);
  if (!isAuto) toast('归位啦！' + PRODUCTS[pid].name + ' 回到「' + CATS[cat].name + '」货架', 'good');
}

function bumpClean(n) {
  G.clean.done += n;
  setTaskProgress('clean', G.clean.done, G.clean.total);
  updateHUD();
  if (G.clean.done >= G.clean.total) {
    setTaskProgress('clean', G.clean.total, G.clean.total);
    setTimeout(finishClean, 500);
  }
}

function finishClean() {
  if (G.phase !== 'clean') return;
  G.phase = 'transition';
  toast('店面干干净净！', 'good');
  SFX.ok();
  setTimeout(() => startCheckoutPhase(LEVELS[G.levelIndex]), 600);
}

/* ==================== 9. 顾客 & 结账系统 ==================== */
function startCheckoutPhase(L) {
  G.phase = 'checkout';
  setActiveTask('checkout');
  hint('点击走进来的客人，帮他结账吧');
  setTimeout(spawnCustomer, 500);
}

function spawnCustomer() {
  const L = LEVELS[G.levelIndex];
  if (G.co.idx >= L.customers.length) { finishCheckout(); return; }
  const cfg = L.customers[G.co.idx];
  G.co.idx++;

  const el = document.createElement('div');
  el.className = 'customer';
  el.style.left = '96%';
  el.style.opacity = '0';
  el.innerHTML = `<div class="cs-shadow"></div>${charSVG(cfg.who, 'happy')}
    <div class="patience"><i></i></div>`;
  $('#charLayer').appendChild(el);
  SFX.bell();
  doorOpen();

  setTimeout(() => {
    el.style.opacity = '1';
    el.style.left = '58%';
  }, 60);

  const maxP = Math.round(L.patience * (G.up.patience ? 1.5 : 1));
  const cust = { el, cfg, patience: maxP, max: maxP, bubble: null };
  G.co.current = cust;

  setTimeout(() => {
    if (G.co.current !== cust) return;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = pick(['拜托啦～', '麻烦结账！', '请帮我结账～', '我要这些！']);
    el.appendChild(b);
    cust.bubble = b;
    el.classList.add('ready');
  }, 1250);

  el.addEventListener('click', () => {
    if (G.co.current === cust && !G.modalOpen && G.phase === 'checkout') openCheckout();
  });

  setTaskProgress('checkout', G.co.done, G.co.total);
}

function priceOf(pid) {
  const L = LEVELS[G.levelIndex];
  const p = PRODUCTS[pid];
  if (L.promo && L.promo.id === pid) return Math.round(p.price * L.promo.rate / 10) * 10;
  return p.price;
}
function billFor(total) {
  if (total < 500) return 500;
  if (total < 1000) return 1000;
  return 2000;
}

function openCheckout() {
  const c = G.co.current;
  if (!c) return;
  G.modalOpen = true;
  c.input = '';
  c.lines = c.cfg.items.map(pid => ({ pid, price: priceOf(pid), done: false }));
  setCustomerFace(c, 'neutral');

  // 升级：高速扫码枪
  const auto = Math.min(G.up.scanner, c.lines.length);
  for (let i = 0; i < auto; i++) c.lines[i].done = true;

  renderCheckout();
  $('#modalLayer').classList.add('show');
  if (auto > 0) toast('高速扫码枪帮你扫好了 ' + auto + ' 件商品！', 'good');
}

function renderCheckout() {
  const c = G.co.current;
  if (!c) return;
  const ch = CHARACTERS[c.cfg.who];
  const L = LEVELS[G.levelIndex];
  const scanned = c.lines.filter(l => l.done);
  const total = scanned.reduce((s, l) => s + l.price, 0);
  const fullTotal = c.lines.reduce((s, l) => s + l.price, 0);
  const allDone = scanned.length === c.lines.length;
  const pay = billFor(fullTotal);
  c.fullTotal = fullTotal;
  c.pay = pay;
  c.change = pay - fullTotal;

  const items = c.lines.map((l, i) => {
    const p = PRODUCTS[l.pid];
    const isPromo = L.promo && L.promo.id === l.pid;
    return `<div class="co-item${l.done ? ' scanned' : ''}" data-i="${i}">
      <span class="ico"><img src="${goodsSrc(p.cat, i)}" alt=""></span>
      <span class="nm">${p.name}</span>
      <span class="qty">×1</span>
      ${isPromo ? '<span class="promo-tag">特价</span>' : ''}
      <span class="pr">¥${l.price}</span>
      <span class="scanline"></span>
    </div>`;
  }).join('');

  const payBlock = allDone ? `
    <div class="co-total"><span>应收金额（${c.lines.length} 件）</span><b>¥${fullTotal}</b></div>
    <div class="co-pay"><span>客人支付</span><b>¥${pay}</b></div>
    <div class="co-change">
      <label>找零 ¥</label>
      <div class="co-input" id="coInput">${c.input || '0'}</div>
    </div>
    ${G.up.hint ? `<div class="co-hintline">提示：找零 = 支付 − 总价 = <b>¥${c.change}</b></div>` : ''}
    <div class="keypad" id="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
      <button data-k="del">⌫</button>
      <button data-k="0">0</button>
      <button data-k="clr">C</button>
    </div>
    <div class="co-actions"><button class="btn btn-primary" id="coOk">确认收款</button></div>
  ` : `
    <div class="co-total"><span>已扫 ${scanned.length} / ${c.lines.length}</span><b>¥${total}</b></div>
    <div class="co-hintline">点一下上面的商品，用扫码枪「哔」一下～</div>
  `;

  $('#modalLayer').innerHTML = `
    <div class="co-card" id="coCard">
      <div class="co-head">
        <div class="co-cust">${charSVG(c.cfg.who, allDone ? 'happy' : 'neutral')}</div>
        <div>
          <div class="co-title">${ch.name}</div>
          <div class="co-sub">${allDone ? '正在等待找零…' : '把商品放上来吧'}</div>
        </div>
      </div>
      <div class="co-items" id="coItems">${items}</div>
      ${payBlock}
    </div>`;

  // 绑定商品点击
  $$('.co-item', $('#coCard')).forEach(row => {
    row.addEventListener('click', () => {
      const i = Number(row.dataset.i);
      const line = c.lines[i];
      if (!line || line.done) return;
      line.done = true;
      SFX.scan();
      row.classList.add('scanning');
      setTimeout(renderCheckout, 230);
    });
  });

  const kp = $('#keypad');
  if (kp) kp.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    handleKey(b.dataset.k);
  };
  const okBtn = $('#coOk');
  if (okBtn) okBtn.onclick = confirmChange;
}

function handleKey(k) {
  const c = G.co.current;
  if (!c) return;
  if (k === 'del') c.input = c.input.slice(0, -1);
  else if (k === 'clr') c.input = '';
  else if (c.input.length < 4) c.input = (c.input + k).replace(/^0+(?=\d)/, '');
  const inp = $('#coInput');
  if (inp) inp.textContent = c.input || '0';
  SFX.click();
}

function confirmChange() {
  const c = G.co.current;
  if (!c) return;
  const val = Number(c.input || 0);
  if (val === c.change) {
    const card = $('#coCard');
    SFX.ok();
    SFX.coin();
    setCustomerFace(c, 'happy');
    // 营业额与库存结算
    G.revenue += c.fullTotal;
    let soldOut = null;
    const soldCats = {};
    c.lines.forEach(l => {
      const p = PRODUCTS[l.pid];
      const inv = invOf(p.cat);
      if (!inv) return;
      inv.stock = Math.max(0, inv.stock - 1);
      soldCats[p.cat] = true;
      if (inv.stock <= 0) soldOut = p.cat;
    });
    renderAllShelves();
    Object.keys(soldCats).forEach(cat => {
      const sh = cat === 'oden' ? $('#odenStand') : $('#shelf-' + cat);
      if (!sh) return;
      sh.classList.remove('sold');
      void sh.offsetWidth;
      sh.classList.add('sold');
      setTimeout(() => sh.classList.remove('sold'), 620);
    });
    G.satisfaction = Math.min(100, G.satisfaction + 2 + Math.min(3, G.decor.placed.length));
    G.co.done++;
    const earn = Math.max(1, Math.round(c.fullTotal * 0.1));
    const exp = c.lines.length * 3;
    G.coins += earn;
    G.exp += exp;
    updateHUD();
    updateTaskbar();
    flyCoins(card, 8);
    closeModal();
    toast('找零 ¥' + c.change + ' · 收入 +' + earn + ' 金币 · 经验 +' + exp, 'good');
    if (soldOut) setTimeout(() => toast(CATS[soldOut].name + '货架售罄，记得补货！', 'bad'), 700);
    customerLeave(false);
    if (G.co.done >= G.co.total) setTimeout(finishCheckout, 900);
    else setTimeout(spawnCustomer, 900);
  } else {
    SFX.err();
    G.satisfaction = Math.max(0, G.satisfaction - 8);
    updateHUD();
    c.input = '';
    const inp = $('#coInput');
    if (inp) {
      inp.textContent = '0';
      inp.classList.add('err');
      setTimeout(() => inp.classList.remove('err'), 420);
    }
    toast('嗯…再算一次吧～', 'bad');
  }
}

function customerLeave(timeout) {
  const c = G.co.current;
  if (!c) return;
  G.co.current = null;
  if (c.bubble) c.bubble.remove();
  doorOpen();
  if (timeout) {
    c.el.style.left = '96%';
    c.el.style.opacity = '0';
  } else {
    c.el.classList.add('leaving');
  }
  setTimeout(() => c.el.remove(), 900);
}

/* ---- 自动门与顾客表情 ---- */
function doorOpen() {
  const d = $('.auto-door');
  if (!d) return;
  d.classList.remove('open');
  void d.offsetWidth;
  d.classList.add('open');
  setTimeout(() => d.classList.remove('open'), 1300);

  const old = d.querySelector('.door-welcome');
  if (old) old.remove();
  const w = document.createElement('div');
  w.className = 'door-welcome';
  w.textContent = '叮咚～欢迎光临';
  d.appendChild(w);
  setTimeout(() => w.remove(), 1700);
}
function setCustomerFace(c, mood) {
  if (!c || !c.el) return;
  const svg = c.el.querySelector('svg');
  if (svg) svg.outerHTML = charSVG(c.cfg.who, mood);
}

function customerTimeout() {
  const c = G.co.current;
  if (!c) return;
  G.satisfaction = Math.max(0, G.satisfaction - 12);
  updateHUD();
  toast('客人等太久，先走了……', 'bad');
  SFX.err();
  closeModal();
  customerLeave(true);
  G.co.done++;
  setTaskProgress('checkout', G.co.done, G.co.total);
  if (G.co.done >= G.co.total) setTimeout(finishCheckout, 800);
  else setTimeout(spawnCustomer, 800);
}

function finishCheckout() {
  if (G.phase !== 'checkout') return;
  closeModal();
  G.phase = 'transition';
  toast('客人们都满意地离开了～', 'good');
  SFX.ok();
  setTimeout(() => startStockPhase(LEVELS[G.levelIndex]), 600);
}

/* ==================== 10. 上架系统 ==================== */
function startStockPhase(L) {
  G.phase = 'stock';
  setActiveTask('stock');
  hint('先点箱子里的商品，再点对应分类的货架（关东煮放锅边）');
  G.st = { queue: L.stock.slice(), done: 0, total: L.stock.length, sel: -1 };

  // 为待上架商品预留货架空位，保证每一次上架都能看到库存与画面变化
  const need = {};
  G.st.queue.forEach(pid => {
    const c = PRODUCTS[pid].cat;
    need[c] = (need[c] || 0) + 1;
  });
  Object.keys(need).forEach(c => {
    const inv = invOf(c);
    if (inv) inv.stock = Math.min(inv.stock, Math.max(0, inv.cap - need[c]));
  });
  renderAllShelves();

  $('#crate').classList.add('show');
  $$('.shelf').forEach(s => s.classList.add('droppable'));
  $('#odenStand').classList.add('droppable');
  renderCrate();
  setTaskProgress('stock', 0, G.st.total);

  // 升级：加宽货架（自动上架）
  const auto = Math.min(G.up.shelf, G.st.queue.length);
  for (let i = 0; i < auto; i++) {
    setTimeout(() => {
      if (G.st.queue.length) placeStock(G.st.queue[0], true);
    }, 600 + i * 450);
  }
}

function renderCrate() {
  const box = $('#crateItems');
  if (!box) return;
  if (!G.st.queue.length) {
    box.innerHTML = '<div class="crate-empty">箱子空啦～</div>';
    return;
  }
  box.innerHTML = G.st.queue.map((pid, i) => {
    const p = PRODUCTS[pid];
    return `<button class="crate-item${G.st.sel === i ? ' sel' : ''}" data-i="${i}">
      <img src="${goodsSrc(p.cat, i)}" alt=""><span>${p.short}</span>
    </button>`;
  }).join('');
  $$('.crate-item', box).forEach(b => {
    b.onclick = () => {
      G.st.sel = Number(b.dataset.i);
      SFX.click();
      renderCrate();
      const p = PRODUCTS[G.st.queue[G.st.sel]];
      hint('拿起了「' + p.name + '」→ 点一下它的货架');
    };
  });
}

function placeStock(pid, isAuto) {
  const p = PRODUCTS[pid];
  const idx = G.st.queue.indexOf(pid);
  if (idx < 0) return;
  G.st.queue.splice(idx, 1);
  if (G.st.sel >= G.st.queue.length) G.st.sel = -1;
  G.st.done++;

  const inv = invOf(p.cat);
  if (inv) {
    inv.stock = Math.min(inv.cap, inv.stock + 1);
    renderShelfStock(p.cat, true);
  }
  const target = p.cat === 'oden' ? $('#odenStand') : $('#shelf-' + p.cat);
  if (target) {
    target.classList.add('good');
    setTimeout(() => target.classList.remove('good'), 460);
  }
  SFX.ok();
  if (!isAuto) sparkleAt(randi(30, 70), randi(30, 55));
  setTaskProgress('stock', G.st.done, G.st.total);
  renderCrate();
  if (G.st.queue.length === 0) setTimeout(finishStock, 500);
}

function tryShelf(cat) {
  if (G.phase !== 'stock' || G.st.sel < 0) return;
  const pid = G.st.queue[G.st.sel];
  if (!pid) return;
  const p = PRODUCTS[pid];
  const target = cat === 'oden' ? $('#odenStand') : $('#shelf-' + cat);
  if (p.cat === cat) {
    placeStock(pid, false);
    SFX.pop();
    toast('上架完成：' + p.name, 'good');
  } else {
    SFX.err();
    G.satisfaction = Math.max(0, G.satisfaction - 5);
    updateHUD();
    if (target) {
      target.classList.add('shake');
      setTimeout(() => target.classList.remove('shake'), 400);
    }
    toast('「' + p.name + '」应该放到 ' + CATS[p.cat].name + ' 的货架哦', 'bad');
  }
}

function finishStock() {
  if (G.phase !== 'stock') return;
  G.phase = 'transition';
  $('#crate').classList.remove('show');
  $$('.shelf').forEach(s => s.classList.remove('droppable', 'hot'));
  $('#odenStand').classList.remove('droppable', 'hot');
  setTaskProgress('stock', G.st.total, G.st.total);
  toast('货架满满当当！', 'good');
  setTimeout(endLevel, 700);
}

/* ==================== 11. 时间 / 满意度 ==================== */
function startClock() {
  stopClock();
  G.lastTick = performance.now();
  G.clockId = setInterval(tick, 200);
  updateHUD();
}
function stopClock() {
  if (G.clockId) clearInterval(G.clockId);
  G.clockId = null;
}
function tick() {
  const now = performance.now();
  const dt = Math.min(0.6, (now - G.lastTick) / 1000);
  G.lastTick = now;
  if (G.dialogOpen || G.modalOpen) return;
  if (G.phase === 'done' || G.phase === 'fail' || G.phase === 'idle') return;

  G.time -= dt;
  if (G.time <= 0) {
    G.time = 0;
    updateHUD();
    failLevel();
    return;
  }
  updateHUD();

  // 顾客耐心
  const c = G.co.current;
  if (c && c.max) {
    c.patience -= dt;
    const bar = c.el.querySelector('.patience i');
    const pc = Math.max(0, c.patience / c.max);
    if (bar) bar.style.width = (pc * 100) + '%';
    if (pc < 0.3) c.el.querySelector('.patience').classList.add('low');
    if (c.patience <= 0) customerTimeout();
  }
}

function popStat(el) {
  const st = el && el.closest('.stat');
  if (!st) return;
  st.classList.remove('pop');
  void st.offsetWidth;
  st.classList.add('pop');
}

function updateHUD() {
  $('#hudTime').textContent = fmtTime(G.time);
  const tr = G.timeLimit ? (G.time / G.timeLimit) : 0;
  const tb = $('#hudTimeBar');
  tb.style.width = Math.max(0, tr * 100) + '%';
  tb.style.background = tr < 0.25 ? '#ef9a9a' : (tr < 0.5 ? '#f6c56b' : '#89c7a7');
  $('#hudMood').textContent = Math.round(G.satisfaction);
  $('#hudMoodBar').style.width = Math.max(0, Math.min(100, G.satisfaction)) + '%';
  $('#hudMoodBar').style.background = G.satisfaction < 50 ? '#ef9a9a' : '#f3a7a7';

  const lvEl = $('#hudShopLv');
  if (lvEl) {
    const lv = 1 + Object.keys(G.up).reduce((n, k) => n + (G.up[k] || 0), 0);
    lvEl.textContent = 'Lv.' + lv + ' 店铺';
  }

  const coinEl = $('#hudCoin');
  if (coinEl && coinEl.dataset.v !== String(G.coins)) {
    coinEl.dataset.v = String(G.coins);
    animateNumber(coinEl, G.coins);
    popStat(coinEl);
  }
  const gemEl = $('#hudGem');
  if (gemEl && gemEl.textContent !== String(G.totalStars)) {
    gemEl.textContent = G.totalStars;
    popStat(gemEl);
  }

  // 可升级提醒
  const affordable = UPGRADES.some(u => {
    const lv = G.up[u.id] || 0;
    return lv < u.max && G.coins >= u.costs[lv];
  });
  ['#navDot', '#railUpgradeDot'].forEach(sel => {
    const d = $(sel);
    if (d) d.style.display = affordable ? '' : 'none';
  });

  const tw = $('#hudTime');
  const stat = tw && tw.closest('.stat');
  if (stat) stat.classList.toggle('warn', tr < 0.2 && G.phase !== 'done');

  updateTimeOfDay();
}

/* ---- 天气 & 昼夜 ---- */
function pickWeather() {
  const pool = ['sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'rain', 'rain', 'snow'];
  return pool[Math.floor(Math.random() * pool.length)];
}
function applyWeather() {
  const stage = $('#stage');
  if (!stage) return;
  const id = WEATHERS[G.weather] ? G.weather : 'sunny';
  stage.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rain', 'weather-snow');
  stage.classList.add('weather-' + id);
  const w = WEATHERS[id];
  const ico = $('#hudWeatherIco'); if (ico) ico.src = w.icon;
  const nm = $('#hudWeather'); if (nm) nm.textContent = w.name;
  buildWeatherFx();
  updateTimeOfDay();
}
function buildWeatherFx() {
  const fx = $('#weatherFx');
  if (!fx) return;
  fx.innerHTML = '';
  if (G.weather !== 'rain' && G.weather !== 'snow') return;
  const rain = G.weather === 'rain';
  const n = rain ? 28 : 20;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i');
    d.style.left = (Math.random() * 98 + 1) + '%';
    d.style.animationDelay = '-' + (Math.random() * (rain ? 2.4 : 6)).toFixed(2) + 's';
    d.style.animationDuration = (rain ? 0.9 + Math.random() * 0.7 : 6 + Math.random() * 5).toFixed(2) + 's';
    if (rain) {
      d.style.opacity = (0.6 + Math.random() * 0.3).toFixed(2);
      d.style.height = (14 + Math.random() * 10).toFixed(0) + 'px';
    } else {
      const s = 3 + Math.random() * 4;
      d.style.width = s.toFixed(1) + 'px';
      d.style.height = s.toFixed(1) + 'px';
      d.style.opacity = (0.55 + Math.random() * 0.4).toFixed(2);
    }
    fx.appendChild(d);
  }
}
function updateTimeOfDay() {
  const limit = G.timeLimit || 1;
  const elapsed = Math.min(1, Math.max(0, 1 - G.time / limit));
  const tint = $('#timeTint');
  if (tint) tint.style.opacity = (Math.max(0, (elapsed - 0.45) / 0.55) * 0.36).toFixed(3);
  const stage = $('#stage');
  if (stage) stage.classList.toggle('dusk', elapsed >= 0.62);
  const tod = $('#hudTod');
  if (tod) tod.textContent = elapsed < 0.2 ? '早晨' : elapsed < 0.55 ? '午后' : elapsed < 0.85 ? '傍晚' : '夜晚';
}

/* ---- 店铺装修 ---- */
function renderDecor() {
  const layer = $('#decorLayer');
  if (!layer) return;
  layer.innerHTML = G.decor.placed.map(id =>
    `<img class="decor decor-${id}" src="assets/d_${id}.svg?v=1" alt="">`).join('');
}
function decorPanelHTML() {
  const rows = DECOR.map(d => {
    const owned = G.decor.owned.includes(d.id);
    const placed = G.decor.placed.includes(d.id);
    let act;
    if (!owned) act = `<button class="ui-buy" data-buy="${d.id}">¥${d.price}</button>`;
    else if (placed) act = `<button class="ui-buy ghost" data-take="${d.id}">收起</button>`;
    else act = `<button class="ui-buy" data-place="${d.id}">摆放</button>`;
    return `<div class="ui-row decor-row">
      <img src="${d.icon}" alt="">
      <div class="ui-row-main">
        <div class="ui-row-name">${d.name}<span class="ui-reward">${d.slot}${placed ? ' · 已摆放' : owned ? ' · 已拥有' : ''}</span></div>
        <div class="ui-row-sub">${d.desc}</div>
      </div>
      ${act}
    </div>`;
  }).join('');
  return `<div class="ui-card">
      <div class="ui-head"><img src="assets/i_decor.svg" alt=""><b>店铺装修</b>
        <span class="ui-coin"><img src="assets/i_coin.svg?v=2" alt="">${G.coins}</span>
        <button class="ui-close" id="uiClose"><img src="assets/i_close.svg?v=2" alt=""></button></div>
      <p class="ui-tip">买下装饰摆进店里，每位顾客结算时心情 +1（最多 +3）。</p>
      ${rows}
      <div class="ui-actions"><button class="btn btn-primary" id="uiDecorOk">继续打工</button></div>
    </div>`;
}
function bindDecorPanel() {
  const ok = $('#uiDecorOk');
  if (ok) ok.onclick = () => { SFX.click(); closeModal(); setNav('home'); };
  const close = $('#uiClose');
  if (close) close.onclick = () => { SFX.click(); closeModal(); setNav('home'); };
  $$('#modalLayer [data-buy]').forEach(b => { b.onclick = () => buyDecor(b.dataset.buy); });
  $$('#modalLayer [data-place]').forEach(b => { b.onclick = () => placeDecor(b.dataset.place); });
  $$('#modalLayer [data-take]').forEach(b => { b.onclick = () => takeDecor(b.dataset.take); });
}
function openDecorPanel() {
  if (G.modalOpen || !LEVELS[G.levelIndex]) return;
  openPanel(decorPanelHTML());
  bindDecorPanel();
}
function refreshDecorPanel() {
  const m = $('#modalLayer');
  if (!m || !m.classList.contains('show')) return;
  G.modalOpen = true;
  m.innerHTML = decorPanelHTML();
  bindDecorPanel();
}
function buyDecor(id) {
  const d = DECOR.find(x => x.id === id);
  if (!d) return;
  if (G.decor.owned.includes(id)) { placeDecor(id); return; }
  if (G.coins < d.price) { SFX.err(); toast('金币不够，多做几单生意再来吧～', 'bad'); return; }
  G.coins -= d.price;
  G.decor.owned.push(id);
  SFX.coin(); updateHUD();
  toast('购入「' + d.name + '」，点「摆放」放进店里', 'good');
  refreshDecorPanel();
}
function placeDecor(id) {
  const d = DECOR.find(x => x.id === id);
  if (!d || !G.decor.owned.includes(id)) return;
  DECOR.forEach(x => {
    if (x.slot === d.slot && x.id !== id) {
      G.decor.placed = G.decor.placed.filter(p => p !== x.id);
    }
  });
  if (!G.decor.placed.includes(id)) G.decor.placed.push(id);
  renderDecor(); SFX.ok(); updateHUD();
  toast('「' + d.name + '」已摆好 · 人气 +1', 'good');
  refreshDecorPanel();
}
function takeDecor(id) {
  const d = DECOR.find(x => x.id === id);
  if (!d) return;
  G.decor.placed = G.decor.placed.filter(p => p !== id);
  renderDecor(); SFX.click(); updateHUD();
  toast('已收起「' + d.name + '」', 'good');
  refreshDecorPanel();
}

/* ---- 数字增长 & 金币飞入 ---- */
let numRaf = null;
function animateNumber(el, to) {
  if (!el) return;
  const from = Number(String(el.textContent).replace(/[^\d]/g, '')) || 0;
  if (from === to) { el.textContent = to; return; }
  if (numRaf) cancelAnimationFrame(numRaf);
  const t0 = performance.now();
  const tick = t => {
    const p = Math.min(1, (t - t0) / 420);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (p < 1) numRaf = requestAnimationFrame(tick);
    else el.textContent = to;
  };
  numRaf = requestAnimationFrame(tick);
}
function flyCoins(fromEl, n) {
  const target = $('#hudCoin');
  if (!target) return;
  const tr = target.getBoundingClientRect();
  let sx = innerWidth / 2, sy = innerHeight / 2;
  if (fromEl && fromEl.getBoundingClientRect) {
    const r = fromEl.getBoundingClientRect();
    if (r.width || r.height) { sx = r.left + r.width / 2; sy = r.top + r.height / 2; }
  }
  const count = n || 6;
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'coin-fly';
    d.textContent = '¥';
    document.body.appendChild(d);
    const jx = (Math.random() - 0.5) * 46;
    const jy = (Math.random() - 0.5) * 26;
    const tx = tr.left + tr.width / 2 + (Math.random() - 0.5) * 14;
    const ty = tr.top + tr.height / 2 + (Math.random() - 0.5) * 10;
    const anim = d.animate([
      { transform: `translate(${sx}px,${sy}px) scale(.45)`, opacity: 0 },
      { transform: `translate(${sx + jx}px,${sy + jy}px) scale(1)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${tx}px,${ty}px) scale(1.12)`, opacity: 1, offset: 0.86 },
      { transform: `translate(${tx}px,${ty}px) scale(.3)`, opacity: 0 }
    ], { duration: 620 + i * 45, easing: 'cubic-bezier(.3,.7,.3,1)' });
    anim.onfinish = () => d.remove();
    setTimeout(() => d.remove(), 1300);
  }
}

/* ---------- 通用反馈 ---------- */
let hintTimer = null;
function hint(text) {
  const el = $('#phaseHint');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 4200);
}
function toast(text, type) {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = text;
  $('#toastLayer').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s,transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 320);
  }, 1700);
}
function sparkle(el) {
  const s = document.createElement('div');
  s.className = 'spark';
  s.innerHTML = '<i></i><i></i><i></i>';
  s.style.left = el.style.left || '50%';
  s.style.top = el.style.top || '50%';
  (el.parentNode || $('#trashLayer')).appendChild(s);
  setTimeout(() => s.remove(), 780);
}
function sparkleAt(x, y) {
  const s = document.createElement('div');
  s.className = 'spark';
  s.innerHTML = '<i></i><i></i><i></i>';
  s.style.left = x + '%';
  s.style.top = y + '%';
  $('#trashLayer').appendChild(s);
  setTimeout(() => s.remove(), 780);
}
function closeModal() {
  $('#modalLayer').classList.remove('show');
  $('#modalLayer').innerHTML = '';
  G.modalOpen = false;
}

/* ==================== 12. 结算 & 奖励 ==================== */
function failLevel() {
  if (G.phase === 'fail') return;
  G.phase = 'fail';
  stopClock();
  closeModal();
  SFX.err();
  const L = LEVELS[G.levelIndex];
  $('#failFace').innerHTML = charSVG('manager', 'worried');
  $('#failText').textContent = '店长：「没关系，' +
    (L.id === 1 ? '第一天谁都会手忙脚乱的' : '谁都有手忙脚乱的时候') +
    '。休息一下，我们再来一次吧！」';
  showScreen('fail');
}

function endLevel() {
  if (G.phase === 'done') return;
  G.phase = 'done';
  stopClock();
  closeModal();
  $$('.shelf').forEach(s => s.classList.remove('droppable', 'hot'));
  $('#odenStand').classList.remove('droppable', 'hot');
  $('#crate').classList.remove('show');

  const L = LEVELS[G.levelIndex];
  const timeRatio = Math.max(0, G.time / G.timeLimit);
  let stars = 1;
  if (G.satisfaction >= 95 && timeRatio >= 0.45) stars = 3;
  else if (G.satisfaction >= 80) stars = 2;

  const coinTime = Math.round(timeRatio * 20);
  const coinMood = Math.round(G.satisfaction / 10);
  const coinStar = stars * 5;
  const coins = 15 + coinTime + coinMood + coinStar;

  G.coins += coins;
  G.totalStars += stars;
  const unlockedNow = unlockScenes();

  G.lastResult = {
    stars, coins, coinTime, coinMood, coinStar,
    timeLeft: Math.ceil(G.time), satisfaction: Math.round(G.satisfaction),
    unlocked: unlockedNow
  };

  const after = () => showResult();
  if (L.outro && L.outro.length) {
    setTimeout(() => showDialogue(L.outro, after), 350);
  } else {
    setTimeout(after, 350);
  }
}

function unlockScenes() {
  const cleared = G.levelIndex + 1;
  const newly = [];
  Object.keys(SCENES).forEach(k => {
    if (SCENES[k].need <= cleared && !G.unlocked.includes(k)) {
      G.unlocked.push(k);
      newly.push(k);
    }
  });
  return newly;
}

function showResult() {
  const r = G.lastResult;
  if (!r) { showScreen('title'); return; }
  const L = LEVELS[G.levelIndex];
  showScreen('result');

  $('#resTitle').textContent = L.title + '　完成！';
  const starHtml = [1, 2, 3].map(i =>
    `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${(i - 1) * 0.18}s"><img src="assets/i_star.svg" alt=""></span>`
  ).join('');
  $('#resStars').innerHTML = starHtml;

  $('#resChar').innerHTML = charSVG('manager', r.stars >= 2 ? 'happy' : 'neutral');
  $('#resBubble').textContent = r.stars === 3
    ? '满分！小春，你进步得比关东煮熟得还快呢。'
    : r.stars === 2
      ? '做得不错哦。再快一点点，就是满分店员啦。'
      : '嗯……没关系，客人还是笑着走出去的。明天再稳一点。';

  const satisfied = r.satisfaction;
  $('#resRows').innerHTML = `
    <div class="res-row"><span>剩余时间</span><b>${fmtTime(r.timeLeft)}（+${r.coinTime} 金币）</b></div>
    <div class="res-row"><span>顾客满意度</span><b>${satisfied}%（+${r.coinMood} 金币）</b></div>
    <div class="res-row"><span>评星奖励</span><b>${'★'.repeat(r.stars)}（+${r.coinStar} 金币）</b></div>
    <div class="res-row total"><span>本日收入</span><b>+${r.coins} 金币</b></div>`;

  const chips = Object.keys(SCENES).map(k => {
    const s = SCENES[k];
    const on = G.unlocked.includes(k);
    const isNew = r.unlocked.includes(k);
    return `<span class="scene-chip${on ? '' : ' locked'}${isNew ? ' new' : ''}">${s.name}${on ? '' : ' · 未解锁'}${isNew ? ' · NEW' : ''}</span>`;
  }).join('');
  const isFinal = G.levelIndex >= LEVELS.length - 1;
  $('#resUnlock').innerHTML = chips + (isFinal
    ? `<div class="res-row" style="width:100%;margin-top:4px;background:#fff4dc;border:2px dashed #ecd3a8;text-align:left;line-height:1.6">
        结局：一个月后，灯街便利店多了一块小牌子——「店员 小春」。<br>
        而海边的那家分店，正在等她。
       </div>` : '');

  $('#btnNextDay').textContent = isFinal ? '完结 · 回标题' : '下一天 →';
  SFX.star();
  setTimeout(() => SFX.coin(), 350);
}

function showEnding() {
  showScreen('title');
  G.phase = 'idle';
  stopClock();
}

/* ==================== 13. 升级系统 ==================== */
function renderUpgrades() {
  $('#upCoin').textContent = G.coins;
  $('#upgradeList').innerHTML = UPGRADES.map(u => {
    const lv = G.up[u.id] || 0;
    const maxed = lv >= u.max;
    const cost = maxed ? 0 : u.costs[lv];
    const canBuy = !maxed && G.coins >= cost;
    const pips = Array.from({ length: u.max }, (_, i) =>
      `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
    const btn = maxed
      ? `<button class="up-buy owned" disabled>已满级</button>`
      : `<button class="up-buy" data-id="${u.id}" ${canBuy ? '' : 'disabled'}>
           ${canBuy ? cost + ' 金币 · 升级' : cost + ' 金币 · 金币不足'}
         </button>`;
    return `<div class="up-card${maxed ? ' max' : (canBuy ? ' can-buy' : '')}">
      <div class="up-card-top">
        <div class="up-ico"><img src="${u.icon}" alt=""></div>
        <div class="up-card-title">
          <div class="up-name">${u.name}</div>
          <div class="up-pips">${pips}</div>
        </div>
        <div class="up-lv">Lv.${lv} / ${u.max}</div>
      </div>
      <div class="up-desc">${maxed ? u.desc(u.max) : '下一级 · ' + u.desc(lv + 1)}</div>
      ${btn}
    </div>`;
  }).join('');

  $$('.up-buy[data-id]').forEach(b => {
    b.onclick = () => buyUpgrade(b.dataset.id);
  });
}

function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (!u) return;
  const lv = G.up[id] || 0;
  if (lv >= u.max) return;
  const cost = u.costs[lv];
  if (G.coins < cost) { SFX.err(); toast('金币不够啦～', 'bad'); return; }
  G.coins -= cost;
  G.up[id] = lv + 1;
  SFX.coin();
  const hud = $('.hud');
  if (hud) {
    hud.classList.remove('upflash');
    void hud.offsetWidth;
    hud.classList.add('upflash');
    setTimeout(() => hud.classList.remove('upflash'), 800);
  }
  toast(u.name + ' 升级到 Lv.' + (lv + 1) + '！', 'good');
  renderUpgrades();
  updateHUD();
}

/* ==================== 14. 界面切换 & 启动 ==================== */
function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $('#screen-' + name);
  if (el) el.classList.add('active');
}

function goUpgrade() {
  renderUpgrades();
  showScreen('upgrade');
}

/* ---------- 功能入口面板（任务 / 升级 / 设置） ---------- */
function setNav(name) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
}
function openPanel(html) {
  if (G.modalOpen) return;
  G.modalOpen = true;
  $('#modalLayer').innerHTML = html;
  $('#modalLayer').classList.add('show');
  const close = $('#uiClose');
  if (close) close.onclick = () => { SFX.click(); closeModal(); setNav('home'); };
}
function openTaskPanel() {
  if (!LEVELS[G.levelIndex]) return;
  const rows = TASKS.map(t => {
    const { done, total } = taskState(t.id);
    const pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
    const complete = total > 0 && done >= total;
    const claimed = !!G.claimed[t.id];
    const val = !total ? '待开始'
      : (t.id === 'revenue' ? '¥' + Math.round(done) + ' / ¥' + total : done + ' / ' + total);
    return `<div class="ui-row">
      <img src="${t.icon}" alt="">
      <div class="ui-row-main">
        <div class="ui-row-name">${t.name}<span class="ui-reward">+${t.reward.coins} 金币${t.reward.stars ? ' · +' + t.reward.stars + ' 钻' : ''}</span></div>
        <div class="ui-bar"><i style="width:${pct}%"></i></div>
        <div class="ui-row-sub">${val} · ${claimed ? '奖励已领取' : complete ? '可领取' : '进行中'}</div>
      </div>
      ${complete && !claimed ? `<button class="ui-buy" data-claim="${t.id}">领取</button>` : ''}
    </div>`;
  }).join('');
  openPanel(`
    <div class="ui-card">
      <div class="ui-head"><img src="assets/i_task.svg?v=2" alt=""><b>今日经营任务</b>
        <button class="ui-close" id="uiClose"><img src="assets/i_close.svg?v=2" alt=""></button></div>
      ${rows}
      <div class="ui-actions"><button class="btn btn-primary" id="uiTaskOk">继续打工</button></div>
    </div>`);
  const ok = $('#uiTaskOk');
  if (ok) ok.onclick = () => { SFX.click(); closeModal(); setNav('home'); };
  $$('#modalLayer .ui-buy').forEach(b => {
    b.onclick = () => {
      claimTask(b.dataset.claim);
      closeModal();
      openTaskPanel();
    };
  });
}
function openUpgradePanel() {
  const rows = UPGRADES.map(u => {
    const lv = G.up[u.id] || 0;
    const maxed = lv >= u.max;
    const cost = maxed ? 0 : u.costs[lv];
    const canBuy = !maxed && G.coins >= cost;
    return `<div class="ui-row">
      <img src="${u.icon}" alt="">
      <div class="ui-row-main">
        <div class="ui-row-name">${u.name} <span style="font-size:10px;color:#b3a293">Lv.${lv}/${u.max}</span></div>
        <div class="ui-row-sub">${maxed ? u.desc(u.max) : '下一级 · ' + u.desc(lv + 1)}</div>
      </div>
      ${maxed
        ? '<button class="ui-buy owned" disabled>已满级</button>'
        : `<button class="ui-buy" data-buy="${u.id}" ${canBuy ? '' : 'disabled'}>${cost} 金币</button>`}
    </div>`;
  }).join('');
  openPanel(`
    <div class="ui-card">
      <div class="ui-head"><img src="assets/i_upgrade.svg" alt=""><b>道具升级</b>
        <span style="margin-left:auto;display:flex;align-items:center;gap:4px;font-weight:900;color:#b5842f">
          <img src="assets/i_coin.svg?v=2" style="width:20px;height:20px" alt="">${G.coins}</span>
        <button class="ui-close" id="uiClose"><img src="assets/i_close.svg?v=2" alt=""></button></div>
      ${rows}
    </div>`);
  $$('.ui-buy[data-buy]').forEach(b => {
    b.onclick = () => {
      const before = G.coins;
      buyUpgrade(b.dataset.buy);
      if (G.coins !== before) { closeModal(); openUpgradePanel(); }
    };
  });
}
function openSettingPanel() {
  openPanel(`
    <div class="ui-card">
      <div class="ui-head"><img src="assets/i_setting.svg" alt=""><b>设置</b>
        <button class="ui-close" id="uiClose"><img src="assets/i_close.svg?v=2" alt=""></button></div>
      <div class="ui-row">
        <img src="assets/i_music.svg?v=2" alt="">
        <div class="ui-row-main"><div class="ui-row-name">背景音乐</div><div class="ui-row-sub">点击切换开关</div></div>
        <button class="ui-buy${G.musicOff ? '' : ' owned'}" id="uiMusic">${G.musicOff ? '已关闭' : '已开启'}</button>
      </div>
      <div class="ui-row">
        <img src="assets/i_sound.svg" alt="">
        <div class="ui-row-main"><div class="ui-row-name">音效</div><div class="ui-row-sub">点击切换开关</div></div>
        <button class="ui-buy${G.muted ? '' : ' owned'}" id="uiSound">${G.muted ? '已关闭' : '已开启'}</button>
      </div>
      <div class="ui-row">
        <img src="assets/i_store.svg" alt="">
        <div class="ui-row-main"><div class="ui-row-name">重新开始今天</div><div class="ui-row-sub">今天的进度会重置哦</div></div>
        <button class="ui-buy" id="uiRestart">重来</button>
      </div>
      <div class="ui-actions">
        <button class="btn" id="uiHome">回标题</button>
        <button class="btn btn-primary" id="uiResume">继续打工</button>
      </div>
    </div>`);
  const snd = $('#uiSound');
  if (snd) snd.onclick = () => {
    G.muted = !G.muted;
    $('#btnSound').classList.toggle('off', G.muted);
    snd.textContent = G.muted ? '已关闭' : '已开启';
    snd.classList.toggle('owned', !G.muted);
    if (!G.muted) SFX.tap();
  };
  const mus = $('#uiMusic');
  if (mus) mus.onclick = () => {
    toggleMusic();
    if (!G.musicOff) SFX.tap();
  };
  const restart = $('#uiRestart');
  if (restart) restart.onclick = () => {
    SFX.click();
    closeModal();
    setNav('home');
    startLevel(G.levelIndex);
  };
  const home = $('#uiHome');
  if (home) home.onclick = () => {
    SFX.click();
    stopClock();
    G.phase = 'idle';
    closeModal();
    setNav('home');
    showScreen('title');
  };
  const resume = $('#uiResume');
  if (resume) resume.onclick = () => { SFX.click(); closeModal(); setNav('home'); };
}
function onNav(name) {
  if (G.dialogOpen || G.modalOpen) return;
  if (name === 'home') { setNav('home'); return; }
  setNav(name);
  if (name === 'task') openTaskPanel();
  else if (name === 'upgrade') openUpgradePanel();
  else if (name === 'decor') openDecorPanel();
  else if (name === 'setting') openSettingPanel();
}

function startNextLevel() {
  if (G.levelIndex + 1 >= LEVELS.length) { showEnding(); return; }
  startLevel(G.levelIndex + 1);
}

function init() {
  FX.init();
  $('#titleChar1').innerHTML = charSVG('player', 'happy');
  $('#titleChar2').innerHTML = charSVG('manager', 'happy');
  $('#failFace').innerHTML = charSVG('manager', 'worried');
  renderUpgrades();

  // 首次交互后解锁音频并开始背景音乐（绕开浏览器自动播放限制）
  const unlockAudio = () => {
    document.removeEventListener('pointerdown', unlockAudio);
    ac();
    if (!G.musicOff) Music.start();
  };
  document.addEventListener('pointerdown', unlockAudio);

  $('#btnMusic').onclick = () => { SFX.click(); toggleMusic(); };

  $('#btnStart').onclick = () => {
    SFX.ok();
    Music.start();
    G.coins = 20;
    G.up = { vacuum: 0, scanner: 0, shelf: 0, hint: 0, autosort: 0, patience: 0 };
    G.unlocked = ['day'];
    G.totalStars = 0;
    G.inv = null;
    G.exp = 0;
    G.decor = { owned: [], placed: [] };
    startLevel(0);
  };

  $('#btnNextDay').onclick = () => {
    SFX.click();
    if (G.levelIndex >= LEVELS.length - 1) { showEnding(); return; }
    startNextLevel();
  };
  $('#btnUpgrade').onclick = () => { SFX.click(); goUpgrade(); };
  $('#btnUpgradeGo').onclick = () => { SFX.click(); startNextLevel(); };
  $('#btnBackResult').onclick = () => { SFX.click(); showResult(); };

  $('#btnRetry').onclick = () => {
    SFX.click();
    startLevel(G.levelIndex);
  };
  $('#btnFailHome').onclick = () => {
    SFX.click();
    stopClock();
    G.phase = 'idle';
    showScreen('title');
  };
  $('#btnSound').onclick = () => {
    G.muted = !G.muted;
    $('#btnSound').classList.toggle('off', G.muted);
    if (!G.muted) SFX.tap();
  };
  $('#btnQuit').onclick = () => {
    stopClock();
    G.phase = 'idle';
    closeModal();
    showScreen('title');
  };

  // 货架点击（上架）
  $('#shelfRow').addEventListener('click', e => {
    const shelf = e.target.closest('.shelf');
    if (!shelf) return;
    if (G.phase === 'stock') tryShelf(shelf.dataset.cat);
    else openShelfPanel(shelf.dataset.cat);
  });
  $('#odenStand').addEventListener('click', () => {
    if (G.phase === 'stock') tryShelf('oden');
    else openShelfPanel('oden');
  });
  const baskets = $('.baskets');
  if (baskets) baskets.addEventListener('click', () => {
    if (G.phase === 'checkout' && G.co.current && !G.modalOpen) openCheckout();
  });

  // 右侧功能入口
  $('#railTask').onclick = () => { SFX.click(); onNav('task'); };
  $('#railUpgrade').onclick = () => { SFX.click(); onNav('upgrade'); };
  $('#railDecor').onclick = () => { SFX.click(); onNav('decor'); };
  $('#railSetting').onclick = () => { SFX.click(); onNav('setting'); };

  // 底部导航
  $$('.nav-btn').forEach(b => {
    b.onclick = () => { SFX.click(); onNav(b.dataset.nav); };
  });

  // 关闭弹窗（点击遮罩）
  $('#modalLayer').addEventListener('click', e => {
    if (e.target !== $('#modalLayer')) return;
    if ($('#coCard')) return; // 结账中不允许误关
    if ($('#modalLayer .ui-card')) { closeModal(); setNav('home'); }
  });

  showScreen('title');
}

document.addEventListener('DOMContentLoaded', init);
