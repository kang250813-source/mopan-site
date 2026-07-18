const core = require('./utils/game-core')

const SAVE_KEY = 'civ-minigame-save-v1'
const GUIDE_KEY = 'civ-minigame-guide-seen-v1'
const TICK_MS = 1000
const FLOAT_MS = 760
const CONFETTI_MS = 1200
const COMBO_TIMEOUT_MS = 1400
const PACK_OPEN_MS = 680
const PACK_CARD_DELAY_MS = 260
const PACK_CARD_IN_MS = 420
const PACK_FINISH_MS = 560
const CARD_PAGE_SIZE = 8
const EQUIP_PAGE_SIZE = 8
const AD_PLACEHOLDER_H = 48
const AD_PLACEHOLDER_GAP = 10
const SAVE_FLUSH_MS = 5000
const TEXT_WIDTH_CACHE_LIMIT = 900
const VIEW_CACHE_MS = 300
const RESOURCE_ICONS = {
  food: '🌾',
  goods: '📦',
  gold: '💰',
  qi: '✨',
  tech: '🔬',
  star: '🌌',
  gene: '🧬',
  time: '⏳',
  dark: '🕳️',
  mind: '🧠',
  origin: '🌱',
  dao: '♾️'
}
const GUIDE_ITEMS = [
  ['点王座', '先点中间皇冠获得金币，这是文明启动资金。'],
  ['买建筑', '进入建筑页购买农田、矿场、集市，资源会自动增长。'],
  ['看目标', '目标页会显示随机事件、成就和组合加成，是前期奖励入口。'],
  ['推时代', '时代进度到 100% 后点击进入下一时代，解锁新系统。'],
  ['去远征', '有食物后可以出征，胜利会带回资源并提高副本进度。'],
  ['收集养成', '商城使用游戏内金币购买卡包和装备箱，再到卡包、装备页开启。']
]

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const openData = wx.getOpenDataContext ? wx.getOpenDataContext() : null
const sharedCanvas = openData ? openData.canvas : null
const logo = wx.createImage()
logo.src = 'assets/kang.png'
logo.onload = () => draw()
const tapAudio = createAudio('assets/tap.wav', 0.42)
const rewardAudio = createAudio('assets/reward.wav', 0.42)
const packAudio = createAudio('assets/pack.wav', 0.5)

const game = {
  state: core.normalize(wx.getStorageSync(SAVE_KEY) || null),
  tab: 'build',
  cardPage: 0,
  equipPage: 0,
  goalCombosOpen: false,
  goalAchievementsOpen: false,
  goalDailyOpen: false,
  beastUnknownOpen: false,
  resourceScrollX: 0,
  maxResourceScrollX: 0,
  resourceBar: null,
  tabScrollX: 0,
  maxTabScrollX: 0,
  tabBar: null,
  scrollY: 0,
  touch: null,
  hitRegions: [],
  floatTexts: [],
  floatFramePending: false,
  tapCombo: 0,
  lastTapAt: 0,
  lastTapSoundAt: 0,
  confetti: [],
  confettiFramePending: false,
  packReveal: null,
  packRevealFramePending: false,
  detailOverlay: null,
  cachedTapValue: 1,
  expeditionNotice: null,
  guideOpen: !wx.getStorageSync(GUIDE_KEY),
  rankLoading: false,
  rankError: '',
  rankRequested: false,
  lastRankSyncAt: 0,
  maxScrollY: 0,
  scrollTopY: 0,
  scrollBottomY: 0,
  scrollbar: null,
  momentumFramePending: false,
  momentumToken: 0,
  drawFramePending: false,
  saveDirty: false,
  saveTimer: null,
  stateVersion: 0,
  viewCache: null,
  viewCacheAt: 0,
  viewCacheVersion: -1,
  bgGradient: null,
  bgGradientH: 0,
  canvasReady: false,
  textWidthCache: {},
  textWidthCacheKeys: [],
  width: 0,
  height: 0,
  dpr: 1,
  uiScale: 1,
  topOffset: 0,
  bottomInset: 0,
  menuLeft: 0
}

function setupCanvas(force) {
  if (game.canvasReady && !force) return
  const info = wx.getSystemInfoSync()
  game.dpr = info.pixelRatio || 1
  game.width = info.windowWidth
  game.height = info.windowHeight
  game.uiScale = Math.min(1, game.width / 390)
  let menuBottom = 0
  let menuLeft = 0
  if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
    const menu = wx.getMenuButtonBoundingClientRect()
    menuBottom = menu && menu.bottom ? menu.bottom : 0
    menuLeft = menu && menu.left ? menu.left : 0
  }
  const safeTop = info.safeArea && info.safeArea.top ? info.safeArea.top : 0
  const safeBottom = info.safeArea && info.safeArea.bottom ? info.safeArea.bottom : game.height
  game.topOffset = Math.max(0, Math.max(menuBottom + 8, safeTop + 44) - 54)
  game.bottomInset = Math.max(0, game.height - safeBottom)
  game.menuLeft = menuLeft
  canvas.width = Math.floor(game.width * game.dpr)
  canvas.height = Math.floor(game.height * game.dpr)
  ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0)
  game.canvasReady = true
  game.bgGradient = null
  game.bgGradientH = 0
  game.textWidthCache = {}
  game.textWidthCacheKeys = []
}

function flushSave() {
  if (!game.saveDirty) return
  game.saveDirty = false
  if (game.saveTimer) {
    clearTimeout(game.saveTimer)
    game.saveTimer = null
  }
  game.state.last = Date.now()
  wx.setStorageSync(SAVE_KEY, game.state)
}

function save(defer) {
  game.stateVersion += 1
  if (!defer) {
    game.saveDirty = true
    flushSave()
    return
  }
  game.saveDirty = true
  if (game.saveTimer) return
  game.saveTimer = setTimeout(flushSave, SAVE_FLUSH_MS)
}

function getVisibleData(force) {
  const now = Date.now()
  if (!force && game.viewCache && game.viewCacheVersion === game.stateVersion && now - game.viewCacheAt < VIEW_CACHE_MS) {
    return { ...game.viewCache }
  }
  const v = core.visibleData(game.state)
  game.viewCache = v
  game.viewCacheAt = now
  game.viewCacheVersion = game.stateVersion
  return { ...v }
}

function backgroundGradient() {
  if (game.bgGradient && game.bgGradientH === game.height) return game.bgGradient
  const gradient = ctx.createLinearGradient(0, 0, 0, game.height)
  gradient.addColorStop(0, '#1c2a52')
  gradient.addColorStop(0.55, '#0c1226')
  gradient.addColorStop(1, '#070b18')
  game.bgGradient = gradient
  game.bgGradientH = game.height
  return gradient
}

function toast(title) {
  wx.showToast({ title, icon: 'none' })
}

function createAudio(src, volume) {
  if (typeof wx.createInnerAudioContext !== 'function') return null
  const audio = wx.createInnerAudioContext()
  audio.src = src
  audio.volume = volume
  audio.obeyMuteSwitch = true
  return audio
}

function playTapSound() {
  if (!tapAudio) return
  const now = Date.now()
  if (now - game.lastTapSoundAt < 70) return
  game.lastTapSoundAt = now
  try {
    tapAudio.stop()
    tapAudio.seek(0)
    tapAudio.play()
  } catch (err) {
    // Audio playback can be ignored when the runtime blocks it.
  }
}

function playRewardSound() {
  if (!rewardAudio) return
  try {
    rewardAudio.stop()
    rewardAudio.seek(0)
    rewardAudio.play()
  } catch (err) {
    // Audio playback can be ignored when the runtime blocks it.
  }
}

function playOpenFeedback() {
  if (packAudio) {
    try {
      packAudio.stop()
      packAudio.seek(0)
      packAudio.play()
    } catch (err) {
      playRewardSound()
    }
  } else {
    playRewardSound()
  }
  if (typeof wx.vibrateShort !== 'function') return
  try {
    wx.vibrateShort({ type: 'light' })
  } catch (err) {
    // Haptics are optional on unsupported runtimes.
  }
}

function updateTapCombo() {
  const now = Date.now()
  game.tapCombo = now - game.lastTapAt <= COMBO_TIMEOUT_MS ? game.tapCombo + 1 : 1
  game.lastTapAt = now
  if (game.tapCombo === 10) toast('10连击 点击 ×1.5')
  else if (game.tapCombo === 30) toast('30连击 点击 ×2')
  else if (game.tapCombo === 100) toast('100连击 点击 ×3')
  return game.tapCombo
}

function tapComboMult(count) {
  if (count >= 100) return 3
  if (count >= 30) return 2
  if (count >= 10) return 1.5
  return 1
}

function nextFrame(fn) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(fn)
  } else {
    setTimeout(fn, 16)
  }
}

function requestDraw() {
  if (game.drawFramePending) return
  game.drawFramePending = true
  nextFrame(() => {
    game.drawFramePending = false
    draw()
  })
}

function startMomentum(velocity) {
  if (game.momentumFramePending || Math.abs(velocity) < 0.2) return
  game.momentumFramePending = true
  const token = ++game.momentumToken
  let v = velocity
  const step = () => {
    if (token !== game.momentumToken) {
      game.momentumFramePending = false
      return
    }
    game.momentumFramePending = false
    game.scrollY = Math.max(0, Math.min(game.maxScrollY, game.scrollY - v))
    v *= 0.92
    draw()
    if (Math.abs(v) > 0.2 && game.scrollY > 0 && game.scrollY < game.maxScrollY) {
      game.momentumFramePending = true
      nextFrame(step)
    }
  }
  nextFrame(step)
}

function tabs() {
  return [
    { id: 'build', name: '建筑' },
    { id: 'war', name: '远征' },
    { id: 'goal', name: '目标' },
    { id: 'shop', name: '商城' },
    { id: 'cards', name: '卡包' },
    { id: 'equip', name: '装备' },
    ...(game.state.era >= 1 ? [{ id: 'zodiac', name: '生肖' }] : []),
    ...(game.state.era >= 2 ? [{ id: 'beast', name: '神兽' }] : []),
    ...(game.state.era >= 3 ? [{ id: 'cultivate', name: '修仙' }] : []),
    ...(game.state.era >= 4 ? [{ id: 'tech', name: '科技' }] : []),
    ...(game.state.era >= 5 ? [{ id: 'star', name: '星际' }] : []),
    ...(game.state.era >= 6 ? [{ id: 'evolve', name: '进化' }] : []),
    ...(game.state.era >= 11 || (game.state.season && game.state.season.cycle > 0) ? [{ id: 'reboot', name: '轮回' }] : []),
    { id: 'rank', name: '排行' }
  ]
}

function panelTitle() {
  return {
    build: '建筑 · 升级文明产能',
    war: '远征副本 · 派军征伐',
    goal: '目标 · 事件成就与羁绊',
    shop: '商城 · 购买卡包库存',
    cards: '名著卡包 · 四大名著人物收集',
    equip: '装备图鉴 · 名著装备收集',
    zodiac: '十二生肖 · 选择血脉',
    beast: '神兽 · 孵蛋收集',
    cultivate: '修仙 · 突破境界',
    tech: 'AI 科技 · 研发科技树',
    star: '星际 · 终极工程',
    evolve: '基因进化 · 血脉与变异',
    reboot: '道果轮回 · 重启宇宙',
    rank: '好友排行 · 最高国力'
  }[game.tab] || '文明之主纪元'
}

function tabHasNotice(id, v) {
  if (id === 'build') return v.buildings.some((b) => b.canBuy) || v.progress >= 1
  if (id === 'war') return v.dungeons.some((d) => d.canStart)
  if (id === 'goal') return !!v.eventOffer || v.mainChapters.some((c) => c.canClaim) || (v.journeyStory && v.journeyStory.canClaim) || (v.threeKingdomsStory && v.threeKingdomsStory.canClaim) || (v.waterMarginStory && v.waterMarginStory.canClaim) || (v.redChamberStory && v.redChamberStory.canClaim) || v.achievements.some((a) => a.canClaim) || v.dailyTasks.some((t) => t.canClaim)
  if (id === 'shop') return v.cardPacks.some((p) => p.canBuy) || v.equipmentBoxes.some((b) => b.canBuy)
  if (id === 'cards') return v.cardPacks.some((p) => p.canOpen) || v.cardSell.count > 0
  if (id === 'equip') return v.equipmentBoxes.some((b) => b.canOpen) || v.equipmentSell.count > 0
  if (id === 'zodiac') return v.zodiacs.some((z) => !z.recruited && z.canRecruit)
  if (id === 'beast') return v.canHatch
  if (id === 'cultivate') return v.realms.some((r) => !r.reached && r.canBreak)
  if (id === 'tech') return v.techs.some((t) => !t.owned && t.canBuy)
  if (id === 'star') return v.stars.some((p) => !p.owned && p.canBuy)
  if (id === 'evolve') return v.evolutions.some((ev) => !ev.owned && ev.canBuy)
  if (id === 'reboot') return v.season.canReboot
  return false
}

function drawRoundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

function clipRoundRect(x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.clip()
}

function scaledSize(size) {
  return Math.max(10, Math.round(size * game.uiScale))
}

function text(value, x, y, size, color, weight = '400', align = 'left') {
  size = scaledSize(size)
  ctx.font = `${weight} ${size}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.fillText(String(value), x, y)
}

function centeredText(value, x, y, size, color, weight = '400', align = 'center') {
  size = scaledSize(size)
  ctx.font = `${weight} ${size}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(String(value), x, y)
}

function drawFloatingTexts() {
  const now = Date.now()
  game.floatTexts = game.floatTexts.filter((item) => now - item.at < FLOAT_MS)
  game.floatTexts.forEach((item) => {
    const p = (now - item.at) / FLOAT_MS
    const y = item.y - p * 54
    ctx.globalAlpha = Math.max(0, 1 - p)
    text(item.value, item.x, y, 24, '#ffcd4c', '900', 'center')
    ctx.globalAlpha = 1
  })
}

function drawConfetti() {
  const now = Date.now()
  game.confetti = game.confetti.filter((item) => now - item.at < CONFETTI_MS)
  game.confetti.forEach((item) => {
    const p = (now - item.at) / CONFETTI_MS
    const x = item.x + item.vx * p
    const y = item.y + item.vy * p + 120 * p * p
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(item.spin * p)
    ctx.globalAlpha = Math.max(0, 1 - p * 0.85)
    ctx.fillStyle = item.color
    ctx.fillRect(-item.w / 2, -item.h / 2, item.w, item.h)
    ctx.restore()
  })
}

function startFloatAnimation() {
  if (game.floatFramePending) return
  game.floatFramePending = true
  const step = () => {
    game.floatFramePending = false
    draw()
    if (game.floatTexts.length) {
      startFloatAnimation()
    }
  }
  nextFrame(step)
}

function startConfettiAnimation() {
  if (game.confettiFramePending) return
  game.confettiFramePending = true
  const step = () => {
    game.confettiFramePending = false
    draw()
    if (game.confetti.length) {
      startConfettiAnimation()
    }
  }
  nextFrame(step)
}

function startPackRevealAnimation() {
  if (game.packRevealFramePending) return
  game.packRevealFramePending = true
  const step = () => {
    game.packRevealFramePending = false
    draw()
    if (game.packReveal && Date.now() - game.packReveal.at < packRevealDuration(game.packReveal)) {
      startPackRevealAnimation()
    }
  }
  nextFrame(step)
}

function addFloatText(x, y, amount) {
  game.floatTexts.push({
    x,
    y,
    value: `+${core.fmt(amount)}`,
    at: Date.now()
  })
  startFloatAnimation()
}

function celebrateExpedition() {
  burstConfetti(game.width / 2, game.scrollTopY + 18, 46)
}

function burstConfetti(x, y, count, palette) {
  const colors = palette || ['#ffcd4c', '#37d07f', '#58a6ff', '#ff6b8a', '#ffffff']
  const now = Date.now()
  for (let i = 0; i < count; i += 1) {
    game.confetti.push({
      x: x + (Math.random() - 0.5) * 80,
      y,
      vx: (Math.random() - 0.5) * game.width * 1.35,
      vy: -80 - Math.random() * 220,
      w: 5 + Math.random() * 5,
      h: 8 + Math.random() * 8,
      spin: (Math.random() - 0.5) * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      at: now
    })
  }
  startConfettiAnimation()
}

function rewardText(reward) {
  if (!reward) return ''
  return Object.keys(reward).map((k) => `${RESOURCE_ICONS[k] || ''}${core.fmt(reward[k])}`).join(' / ')
}

function handleExpeditionResult(result) {
  if (!result || !result.dungeon) return
  core.recordDailyProgress(game.state, 'expedition', 1)
  if (result.win) {
    const beastText = result.beast ? `，发现${result.beast.name}` : ''
    game.expeditionNotice = {
      text: `${result.dungeon.name}凯旋，获得 ${rewardText(result.reward)}${beastText}`,
      tone: 'done',
      at: Date.now()
    }
    playRewardSound()
    toast('远征成功')
    celebrateExpedition()
  } else {
    game.expeditionNotice = {
      text: `${result.dungeon.name}远征失败，军队已返回`,
      tone: 'warning',
      at: Date.now()
    }
    toast('远征失败')
  }
}

function showCardDetail(id) {
  const v = getVisibleData()
  const c = v.cards.find((item) => item.id === id)
  if (!c) return
  game.detailOverlay = { type: 'card', item: c }
}

function showEquipmentDetail(id) {
  const v = getVisibleData()
  const e = v.equipments.find((item) => item.id === id)
  if (!e) return
  game.detailOverlay = { type: 'equipment', item: e }
}

function showBuildingDetail(id) {
  const v = getVisibleData()
  const b = v.buildings.find((item) => item.id === id)
  if (!b) return
  game.detailOverlay = { type: 'building', item: b }
}

function showPackDetail(kind, id) {
  const v = getVisibleData()
  const list = kind === 'equipmentBox' ? v.equipmentBoxes : v.cardPacks
  const item = list.find((x) => x.id === id)
  if (!item) return
  game.detailOverlay = { type: kind, item }
}

function showJourneyStoryDetail() {
  const j = getVisibleData().journeyStory
  if (!j) return
  game.detailOverlay = { type: 'journey', item: j }
}

function showWaterMarginStoryDetail() {
  const j = getVisibleData().waterMarginStory
  if (!j) return
  game.detailOverlay = { type: 'journey', item: j }
}

function showThreeKingdomsStoryDetail() {
  const j = getVisibleData().threeKingdomsStory
  if (!j) return
  game.detailOverlay = { type: 'journey', item: j }
}

function showRedChamberStoryDetail() {
  const j = getVisibleData().redChamberStory
  if (!j) return
  game.detailOverlay = { type: 'journey', item: j }
}

function revealTone(item) {
  return item.book ? cardRarityTone(item.rar) : equipmentTone(item.rar)
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function easeOutCubic(value) {
  const t = clamp01(value)
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(value) {
  const t = clamp01(value)
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function packRevealDuration(reveal) {
  return PACK_OPEN_MS + Math.max(0, reveal.items.length - 1) * PACK_CARD_DELAY_MS + PACK_CARD_IN_MS + PACK_FINISH_MS
}

function revealIsRare(item) {
  return ['SSS', 'SP', '金卡', '特别卡', '名器', '神器'].indexOf(item.rar) >= 0
}

function revealGrade(item) {
  return {
    铜卡: 0,
    凡品: 0,
    S: 1,
    SS: 2,
    SSS: 3,
    SP: 4,
    稀有: 1,
    银卡: 1,
    良品: 1,
    史诗: 2,
    金卡: 2,
    名器: 2,
    传说: 3,
    特别卡: 3,
    神器: 3,
    神话: 4
  }[item && item.rar] || 0
}

function bestRevealItem(items) {
  return (items || []).slice().sort((a, b) => revealGrade(b) - revealGrade(a))[0] || {}
}

function rarityLabelColor(rarity) {
  return rarity === 'SS' || rarity === '银卡' || rarity === '良品' ? '#061426' : '#1a1206'
}

function revealPalette(item) {
  const rarity = item && item.rar
  if (rarity === 'SP' || rarity === '特别卡' || rarity === '神器') {
    return {
      accent: '#ff8ed1',
      alt: '#b78cff',
      glow: 'rgba(255, 99, 185, 0.22)',
      ray: 'rgba(255, 177, 222, 0.52)',
      text: '#ffe3f5',
      confetti: ['#ff8ed1', '#b78cff', '#ffffff', '#ffcd4c', '#58a6ff']
    }
  }
  if (rarity === 'SSS' || rarity === '金卡' || rarity === '名器') {
    return {
      accent: '#ffdf67',
      alt: '#ff9f43',
      glow: 'rgba(255, 205, 76, 0.2)',
      ray: 'rgba(255, 224, 126, 0.5)',
      text: '#fff3bf',
      confetti: ['#ffdf67', '#ff9f43', '#ffffff', '#ffd166', '#ffcd4c']
    }
  }
  if (rarity === 'SS') {
    return {
      accent: '#6fd3ff',
      alt: '#3b82f6',
      glow: 'rgba(111, 211, 255, 0.22)',
      ray: 'rgba(111, 211, 255, 0.46)',
      text: '#dff5ff',
      confetti: ['#6fd3ff', '#3b82f6', '#ffffff', '#b9e8ff']
    }
  }
  if (rarity === 'SS' || rarity === '银卡' || rarity === '良品') {
    return {
      accent: rarity === '良品' ? '#59e79b' : '#dfe8f6',
      alt: rarity === '良品' ? '#37d07f' : '#8fb8ff',
      glow: rarity === '良品' ? 'rgba(89, 231, 155, 0.22)' : 'rgba(224, 234, 248, 0.24)',
      ray: rarity === '良品' ? 'rgba(89, 231, 155, 0.44)' : 'rgba(224, 234, 248, 0.48)',
      text: rarity === '良品' ? '#dcfff0' : '#f4f8ff',
      confetti: rarity === '良品' ? ['#59e79b', '#37d07f', '#ffffff', '#c7f9df'] : ['#dfe8f6', '#8fb8ff', '#ffffff', '#cfd8f6']
    }
  }
  if (rarity === 'S') {
    return {
      accent: '#ff675f',
      alt: '#ff9a6b',
      glow: 'rgba(255, 103, 95, 0.18)',
      ray: 'rgba(255, 154, 107, 0.34)',
      text: '#ffe1dc',
      confetti: ['#ff675f', '#ff9a6b', '#ffe1dc']
    }
  }
  return {
    accent: rarity === '凡品' ? '#9aa6cc' : '#d99a5c',
    alt: rarity === '凡品' ? '#6b7280' : '#ffb56b',
    glow: rarity === '凡品' ? 'rgba(154, 166, 204, 0.12)' : 'rgba(217, 154, 92, 0.16)',
    ray: rarity === '凡品' ? 'rgba(154, 166, 204, 0.22)' : 'rgba(217, 154, 92, 0.32)',
    text: rarity === '凡品' ? '#d7def2' : '#ffe7c8',
    confetti: rarity === '凡品' ? ['#9aa6cc', '#6b7280', '#ffffff'] : ['#d99a5c', '#ffb56b', '#ffe7c8']
  }
}

function revealAccent(item) {
  return revealPalette(item).accent
}

function drawPackSparkles(cx, cy, radius, elapsed, palette, count) {
  ctx.save()
  for (let i = 0; i < count; i += 1) {
    const drift = elapsed / (1800 + i * 51)
    const angle = i * 2.399 + drift * Math.PI * 2
    const wave = 0.65 + 0.35 * Math.sin(elapsed / 240 + i)
    const r = radius * (0.36 + (i % 7) / 9) * wave
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r * 0.58
    ctx.globalAlpha = 0.25 + 0.55 * wave
    ctx.fillStyle = i % 5 === 0 ? palette.alt : (i % 3 === 0 ? palette.accent : '#ffffff')
    ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2)
  }
  ctx.restore()
}

function drawRarityRays(cx, cy, radius, elapsed, palette, grade) {
  if (grade < 2) return
  const rayCount = grade === 3 ? 8 : 6
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(elapsed / (grade === 3 ? 1200 : 1500))
  ctx.globalAlpha = grade === 3 ? 0.34 : 0.24
  ctx.strokeStyle = palette.ray
  ctx.lineWidth = grade === 3 ? 3 : 2
  for (let i = 0; i < rayCount; i += 1) {
    const angle = Math.PI * 2 * i / rayCount
    const inner = radius * 0.18
    const outer = radius * (0.52 + (i % 2) * 0.08)
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner * 0.58)
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer * 0.58)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMiniRevealCard(item, x, y, w, h, progress, spotlight) {
  const owned = true
  const colors = item.book ? rarityColors(item.rar, owned) : equipmentColors(item.rar, owned)
  const p = easeOutBack(progress)
  const grade = revealGrade(item)
  const rare = grade >= 2
  const palette = revealPalette(item)
  const accent = palette.accent
  const lift = (1 - easeOutCubic(progress)) * 34
  ctx.save()
  ctx.globalAlpha = clamp01(progress * 1.35)
  ctx.translate(x + w / 2, y + h / 2 - lift)
  ctx.scale(0.76 + p * 0.24, 0.76 + p * 0.24)
  ctx.rotate((1 - clamp01(progress)) * (spotlight ? -0.16 : 0.12))
  const px = -w / 2
  const py = -h / 2
  if (spotlight || rare) {
    ctx.globalAlpha = clamp01(progress) * (rare ? 0.58 : 0.28)
    ctx.fillStyle = palette.glow
    ctx.beginPath()
    ctx.arc(0, 0, w * (grade === 3 ? 1.02 : (rare ? 0.82 : 0.58)), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = clamp01(progress)
  }
  drawRoundRect(px, py, w, h, 12, colors.fill, rare ? accent : colors.stroke)
  if (grade === 3) {
    ctx.globalAlpha = clamp01(progress) * (0.28 + 0.16 * Math.sin(Date.now() / 120))
    drawRoundRect(px - 4, py - 4, w + 8, h + 8, 15, 'rgba(255,255,255,0.04)', palette.alt)
    ctx.globalAlpha = clamp01(progress)
  }
  drawRoundRect(px + 8, py + 8, w - 16, 24, 9, colors.accent)
  centeredText(item.rar, 0, py + 20, 11, rarityLabelColor(item.rar), '900')
  centeredText(item.name, 0, py + 52, 15, '#ffffff', '900')
  centeredText(item.book || item.type, 0, py + 76, 11, colors.text, '800')
  centeredText(item.book ? `Lv.${item.level}` : `★${item.level}`, 0, py + 101, 13, '#cfd8f6', '900')
  drawRoundRect(px + 16, py + h - 30, w - 32, 22, 11, rare ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)', rare ? accent : 'rgba(255,255,255,0.12)')
  const statusText = item.book
    ? (!item.duplicate ? '新卡' : (item.overflow ? '满级溢出' : (item.upgraded ? `升到 Lv.${item.level}` : `碎片 ${item.shardText || ''}`)))
    : (item.kind === 'beast' ? '神兽现世' : (item.duplicate ? '升星' : '新装备'))
  centeredText(statusText, 0, py + h - 19, 12, rare ? '#ffffff' : colors.accent, '900')
  if (rare && item.kind !== 'beast') {
    ctx.globalAlpha = clamp01(progress) * (grade === 3 ? 0.92 : 0.72)
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    ctx.strokeRect(px + 5, py + 5, w - 10, h - 10)
    ctx.globalAlpha = clamp01(progress) * 0.85
    centeredText(grade === 3 ? '绝世' : '稀有', 0, py - 20, 13, palette.text, '900')
  }
  ctx.restore()
}

function drawPackReveal() {
  const reveal = game.packReveal
  if (!reveal) return
  const elapsed = Date.now() - reveal.at
  const openP = easeOutCubic(elapsed / PACK_OPEN_MS)
  const completeAt = PACK_OPEN_MS + Math.max(0, reveal.items.length - 1) * PACK_CARD_DELAY_MS + PACK_CARD_IN_MS
  const complete = elapsed >= completeAt
  if (!reveal.bestItem) {
    reveal.bestItem = bestRevealItem(reveal.items)
    reveal.bestGrade = revealGrade(reveal.bestItem)
    reveal.palette = revealPalette(reveal.bestItem)
  }
  const bestItem = reveal.bestItem
  const bestGrade = reveal.bestGrade
  const palette = reveal.palette
  const accent = palette.accent
  const isBeastReveal = reveal.mode === 'beast'
  ctx.save()
  ctx.globalAlpha = 0.72 + openP * (bestGrade >= 2 ? 0.12 : 0.2)
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, game.width, game.height)
  ctx.globalAlpha = 1
  const pad = 18
  const boxW = game.width - pad * 2
  const boxH = Math.min(game.height - game.topOffset - game.bottomInset - 36, 418)
  const boxY = Math.max(game.topOffset + 28, (game.height - boxH) / 2)
  drawRoundRect(pad, boxY, boxW, boxH, 18, '#121a33', bestGrade >= 2 ? accent : `rgba(255,205,76,${0.28 + openP * 0.24})`)
  if (!isBeastReveal) {
    ctx.fillStyle = palette.glow
    ctx.fillRect(pad + 12, boxY + 72, boxW - 24, Math.min(210, boxH - 146))
    drawRarityRays(game.width / 2, boxY + boxH * 0.45, boxW * 0.68, elapsed, palette, bestGrade)
    drawPackSparkles(game.width / 2, boxY + boxH * 0.46, boxW * 0.55, elapsed, palette, bestGrade === 3 ? 20 : (bestGrade === 2 ? 16 : 10))
  }

  const cx = game.width / 2
  centeredText(reveal.title, cx, boxY + 30, 21, bestGrade >= 2 ? accent : '#ffcd4c', '900')
  const subtitle = isBeastReveal
    ? (complete ? `${bestItem.name} 已归入神兽图鉴` : reveal.subtitle)
    : (complete && bestGrade >= 2 ? `${bestItem.rar} ${bestItem.name} 已入册` : (complete ? '已全部收入文明图鉴' : reveal.subtitle))
  centeredText(subtitle, cx, boxY + 58, 13, bestGrade >= 2 ? palette.text : '#cfd8f6', '800')

  const packW = 104
  const packH = 78
  const packX = cx - packW / 2
  const packY = boxY + 86 - openP * 18
  if (!isBeastReveal) {
    ctx.save()
    ctx.globalAlpha = 1 - openP * 0.62
    drawRoundRect(packX, packY + openP * 12, packW, packH, 13, '#3b2b63', accent)
    drawRoundRect(packX + 10, packY + 12 - openP * 24, packW - 20, 24, 9, '#ffb13c', 'rgba(255,255,255,0.28)')
    centeredText(reveal.items.length === 2 ? '装备箱' : '名著卡包', cx, packY + 48, 15, '#ffffff', '900')
    ctx.restore()
  }

  ctx.save()
  ctx.globalAlpha = isBeastReveal ? 0 : openP * 0.55
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + elapsed / 700
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * 34, packY + 42 + Math.sin(angle) * 18)
    ctx.lineTo(cx + Math.cos(angle) * (74 + openP * 34), packY + 42 + Math.sin(angle) * (36 + openP * 18))
    ctx.stroke()
  }
  ctx.restore()

  const gap = reveal.items.length === 2 ? 14 : 9
  const maxCardW = isBeastReveal ? 128 : (reveal.items.length === 2 ? 128 : 100)
  const cardW = Math.min(maxCardW, (boxW - 30 - gap * (reveal.items.length - 1)) / Math.max(1, reveal.items.length))
  const cardH = isBeastReveal ? 172 : Math.min(158, Math.max(138, boxH - 246))
  const totalW = reveal.items.length * cardW + Math.max(0, reveal.items.length - 1) * gap
  let x = cx - totalW / 2
  const cardY = isBeastReveal ? boxY + 126 : boxY + Math.max(150, boxH * 0.39)
  reveal.items.forEach((item, index) => {
    const cardP = (elapsed - PACK_OPEN_MS - index * PACK_CARD_DELAY_MS) / PACK_CARD_IN_MS
    if (cardP > 0) drawMiniRevealCard(item, x, cardY, cardW, cardH, cardP, revealIsRare(item))
    x += cardW + gap
  })
  const btnW = 132
  const btnY = boxY + boxH - 58
  if (complete) {
    const pulse = 0.5 + 0.5 * Math.sin(elapsed / 160)
    drawRoundRect(cx - btnW / 2 - 5, btnY - 5, btnW + 10, 50, 15, bestGrade >= 2 ? palette.glow : `rgba(255,205,76,${0.12 + pulse * 0.12})`)
  }
  button(complete ? '收下' : '开启中', cx - btnW / 2, btnY, btnW, 40, complete, 'closePackReveal', null, true, 16)
  ctx.restore()
}

function drawDetailOverlay() {
  const detail = game.detailOverlay
  if (!detail) return
  // A full-screen dismiss target makes modal closing tolerant of mobile touch drift.
  addHit('detail-overlay-dismiss', 0, 0, game.width, game.height, 'closeDetailOverlay')
  const item = detail.item
  if (detail.type === 'journey') {
    ctx.save()
    ctx.globalAlpha = 0.88
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, game.width, game.height)
    ctx.globalAlpha = 1
    const pad = 18
    const boxW = game.width - pad * 2
    const boxH = Math.min(430, game.height - game.topOffset - game.bottomInset - 76)
    const boxY = Math.max(game.topOffset + 54, (game.height - boxH) / 2)
    drawRoundRect(pad, boxY, boxW, boxH, 18, '#121a33', 'rgba(255,205,76,0.58)')
    drawRoundRect(pad + 14, boxY + 14, boxW - 28, 58, 14, 'rgba(255,205,76,0.12)', 'rgba(255,205,76,0.34)')
    const bookLabel = item.bookLabel || '西游记'
    const doneTitle = item.doneTitle || '西游记百回圆满'
    centeredText(item.done ? (item.icon || '🪷') : (item.icon || '📖'), pad + 42, boxY + 43, 24, '#ffcd4c', '900')
    clippedText(item.done ? doneTitle : `${bookLabel}第${item.no}${bookLabel === '西游记' ? '回' : '组'}`, pad + 72, boxY + 24, boxW - 104, 19, '#ffffff', '900')
    clippedText(item.done ? '全部章回已收入文明史册' : item.title, pad + 72, boxY + 49, boxW - 104, 12, '#ffdf8a', '800')

    let y = boxY + 92
    const lines = wrapLines(item.done ? '一百回故事已全部完成。' : item.desc, boxW - 44, 14, '700').slice(0, 2)
    lines.forEach((line) => {
      text(line, pad + 22, y, 14, '#cfd8f6', '700')
      y += 22
    })
    y += 8
    text('完成条件', pad + 22, y, 15, '#ffcd4c', '900')
    y += 26
    const conditionList = item.done ? [] : item.requiredCards
    if (!conditionList.length) {
      drawRoundRect(pad + 22, y, boxW - 44, 42, 10, 'rgba(55,208,127,0.16)', 'rgba(55,208,127,0.42)')
      centeredText('全部条件已完成', game.width / 2, y + 21, 14, '#9ff3bd', '900')
      y += 54
    } else {
      conditionList.forEach((card) => {
        const fill = card.reached ? 'rgba(55,208,127,0.14)' : 'rgba(255,177,60,0.13)'
        const stroke = card.reached ? 'rgba(55,208,127,0.42)' : 'rgba(255,177,60,0.42)'
        const color = card.reached ? '#9ff3bd' : '#ffcd8a'
        drawRoundRect(pad + 22, y, boxW - 44, 40, 10, fill, stroke)
        centeredText(card.reached ? '✓' : '○', pad + 42, y + 20, 16, color, '900')
        clippedText(card.name, pad + 62, y + 10, boxW - 190, 14, '#ffffff', '900')
        text(`Lv.${card.level}/${card.requiredLevel}`, game.width - pad - 92, y + 10, 14, color, '900')
        y += 48
      })
    }
    drawRoundRect(pad + 22, y, boxW - 44, 42, 10, 'rgba(0,0,0,0.22)', 'rgba(255,255,255,0.1)')
    clippedText(`奖励 ${item.rewardText || '已领取'}`, pad + 40, y + 12, boxW - 80, 14, '#ffdf8a', '900')
    const btnW = 132
    button('关闭', game.width / 2 - btnW / 2, boxY + boxH - 58, btnW, 40, true, 'closeDetailOverlay', null, true, 16)
    ctx.restore()
    return
  }
  if (detail.type === 'building') {
    const b = item
    const resInfo = core.RES.find((r) => r.key === b.res)
    ctx.save()
    ctx.globalAlpha = 0.88
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, game.width, game.height)
    ctx.globalAlpha = 1
    const pad = 18
    const boxW = game.width - pad * 2
    const boxH = Math.min(460, game.height - game.topOffset - game.bottomInset - 44)
    const boxY = Math.max(game.topOffset + 54, (game.height - boxH) / 2)
    drawRoundRect(pad, boxY, boxW, boxH, 18, '#121a33', b.canBuy ? 'rgba(55,208,127,0.58)' : 'rgba(255,205,76,0.46)')
    drawRoundRect(pad + 14, boxY + 14, boxW - 28, 64, 14, 'rgba(255,205,76,0.12)', 'rgba(255,205,76,0.32)')
    centeredText(b.ico, pad + 46, boxY + 46, 28, '#ffffff', '900')
    clippedText(`${b.name} ×${b.count}`, pad + 82, boxY + 24, boxW - 120, 20, '#ffffff', '900')
    clippedText(b.desc, pad + 82, boxY + 52, boxW - 120, 12, '#ffdf8a', '800')

    let y = boxY + 98
    drawRoundRect(pad + 22, y, boxW - 44, 46, 10, 'rgba(0,0,0,0.22)', 'rgba(255,255,255,0.1)')
    clippedText(`产出：${resInfo ? resInfo.ico : ''}${resInfo ? resInfo.name : b.res} · 单产 ${b.unit}/秒`, pad + 40, y + 13, boxW - 80, 14, '#cfd8f6', '900')
    y += 64
    text('建造条件', pad + 22, y, 15, '#ffcd4c', '900')
    y += 26
    Object.keys(b.cost || {}).forEach((key) => {
      const need = b.cost[key]
      const have = game.state.res[key] || 0
      const reached = have >= need
      const r = core.RES.find((x) => x.key === key)
      const fill = reached ? 'rgba(55,208,127,0.14)' : 'rgba(255,177,60,0.13)'
      const stroke = reached ? 'rgba(55,208,127,0.42)' : 'rgba(255,177,60,0.42)'
      const color = reached ? '#9ff3bd' : '#ffcd8a'
      drawRoundRect(pad + 22, y, boxW - 44, 40, 10, fill, stroke)
      centeredText(reached ? '✓' : '○', pad + 42, y + 20, 16, color, '900')
      clippedText(`${r ? r.ico : ''}${r ? r.name : key}`, pad + 62, y + 10, boxW * 0.34, 14, '#ffffff', '900')
      fittedText(`${core.fmt(have)} / ${core.fmt(need)}`, game.width - pad - 28, y + 10, boxW * 0.5, 13, color, '900', 'right', 10)
      y += 48
    })
    y = Math.min(y, boxY + boxH - 112)
    drawRoundRect(pad + 22, y, boxW - 44, 42, 10, b.canBuy ? 'rgba(55,208,127,0.16)' : 'rgba(255,177,60,0.12)', b.canBuy ? 'rgba(55,208,127,0.42)' : 'rgba(255,177,60,0.36)')
    clippedText(b.canBuy ? '资源充足，可以建造' : '资源不足，继续积累后再建造', pad + 40, y + 12, boxW - 80, 14, b.canBuy ? '#9ff3bd' : '#ffcd8a', '900')
    const btnW = 132
    button('关闭', game.width / 2 - btnW / 2, boxY + boxH - 58, btnW, 40, true, 'closeDetailOverlay', null, true, 16)
    ctx.restore()
    return
  }
  if (detail.type === 'cardPack' || detail.type === 'equipmentBox') {
    const pack = item
    const isEquipment = detail.type === 'equipmentBox'
    ctx.save()
    ctx.globalAlpha = 0.88
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, game.width, game.height)
    ctx.globalAlpha = 1
    const pad = 18
    const boxW = game.width - pad * 2
    const boxH = Math.min(390, game.height - game.topOffset - game.bottomInset - 54)
    const boxY = Math.max(game.topOffset + 54, (game.height - boxH) / 2)
    drawRoundRect(pad, boxY, boxW, boxH, 18, '#121a33', 'rgba(255,205,76,0.52)')
    drawRoundRect(pad + 14, boxY + 14, boxW - 28, 68, 14, 'rgba(255,205,76,0.12)', 'rgba(255,205,76,0.32)')
    centeredText(pack.ico, pad + 48, boxY + 48, 28, '#ffffff', '900')
    clippedText(pack.name, pad + 86, boxY + 24, boxW - 124, 20, '#ffffff', '900')
    clippedText(isEquipment ? `库存 ${pack.stock} 箱 · 每箱开出 2 件装备` : `库存 ${pack.stock} 包 · 每包开出 3 张人物卡`, pad + 86, boxY + 54, boxW - 124, 12, '#ffdf8a', '800')

    let y = boxY + 104
    wrapLines(pack.desc, boxW - 44, 14, '700').slice(0, 2).forEach((line) => {
      text(line, pad + 22, y, 14, '#cfd8f6', '700')
      y += 22
    })
    y += 12
    text(isEquipment ? '开箱概率' : '开包概率', pad + 22, y, 15, '#ffcd4c', '900')
    y += 26
    const rows = isEquipment
      ? [
        ['神器', pack.rates.divine],
        ['名器', pack.rates.named],
        ['良品', pack.rates.fine],
        ['凡品', Math.max(0, 1 - pack.rates.divine - pack.rates.named - pack.rates.fine)]
      ]
      : [
        ['特别卡', pack.rates.special],
        ['金卡', pack.rates.gold],
        ['银卡', pack.rates.silver],
        ['铜卡', Math.max(0, 1 - pack.rates.special - pack.rates.gold - pack.rates.silver)]
      ]
    rows.forEach((row) => {
      drawRoundRect(pad + 22, y, boxW - 44, 34, 9, 'rgba(0,0,0,0.22)', 'rgba(255,255,255,0.1)')
      clippedText(row[0], pad + 40, y + 9, boxW - 140, 13, '#ffffff', '900')
      text(`${Math.round(row[1] * 100)}%`, game.width - pad - 70, y + 9, 13, '#ffcd4c', '900')
      y += 40
    })
    const btnW = 132
    button('关闭', game.width / 2 - btnW / 2, boxY + boxH - 58, btnW, 40, true, 'closeDetailOverlay', null, true, 16)
    ctx.restore()
    return
  }
  const isCard = detail.type === 'card'
  const colors = isCard ? rarityColors(item.rar, item.owned) : equipmentColors(item.rar, item.owned)
  ctx.save()
  ctx.globalAlpha = 0.86
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, game.width, game.height)
  ctx.globalAlpha = 1
  const pad = 18
  const boxW = game.width - pad * 2
  const boxH = isCard ? 420 : 360
  const boxY = Math.max(game.topOffset + 56, (game.height - boxH) / 2)
  drawRoundRect(pad, boxY, boxW, boxH, 16, '#121a33', colors.stroke)

  const cardX = pad + 22
  const cardY = boxY + 22
  const cardW = 86
  const cardH = 122
  drawRoundRect(cardX, cardY, cardW, cardH, 10, colors.fill, colors.stroke)
  drawRoundRect(cardX + 8, cardY + 9, cardW - 16, 20, 7, colors.accent)
  centeredText(item.rar, cardX + cardW / 2, cardY + 22, 11, rarityLabelColor(item.rar), '900')
  centeredText(item.owned ? (isCard ? item.levelText : item.levelText) : '????', cardX + cardW / 2, cardY + 62, 20, '#ffffff', '900')
  centeredText(isCard ? item.book : item.type, cardX + cardW / 2, cardY + 92, 11, colors.text, '800')

  const textX = cardX + cardW + 18
  clippedText(item.owned ? item.name : '未收集', textX, boxY + 28, boxW - cardW - 62, 22, '#ffffff', '900')
  const metaText = isCard && item.owned ? `${item.book} · ${item.rar} · 碎片 ${item.shardText}` : `${isCard ? item.book : item.type} · ${item.rar}`
  clippedText(metaText, textX, boxY + 62, boxW - cardW - 62, 13, colors.text, '800')
  clippedText(item.owned ? (isCard ? '人物已入册，加成生效' : '装备已入库，加成生效') : '尚未获得', textX, boxY + 88, boxW - cardW - 62, 12, '#cfd8f6', '800')

  let y = boxY + 192
  if (isCard) {
    const statW = (boxW - 44 - 18) / 2
    drawStatPill('武力', item.force, pad + 22, y, statW, colors.accent)
    drawStatPill('智谋', item.wisdom, pad + 22 + statW + 18, y, statW, colors.accent)
    drawStatPill('统率', item.lead, pad + 22, y + 28, statW, colors.accent)
    drawStatPill('魅力', item.charm, pad + 22 + statW + 18, y + 28, statW, colors.accent)
    y += 68
  }
  clippedText(`效果：${item.desc}`, pad + 22, y, boxW - 44, 14, '#ffffff', '900')
  y += 30
  const desc = isCard ? item.bio : '重复获得会自动升星，装备加成全局生效。'
  wrapLines(desc, boxW - 44, 14, '500').slice(0, 4).forEach((line) => {
    text(line, pad + 22, y, 14, '#cfd8f6', '500')
    y += 21
  })
  const btnW = 132
  button('关闭', game.width / 2 - btnW / 2, boxY + boxH - 58, btnW, 40, true, 'closeDetailOverlay', null, true, 16)
  ctx.restore()
}

function clippedText(value, x, y, maxWidth, size, color, weight) {
  ctx.font = `${weight || '400'} ${scaledSize(size)}px sans-serif`
  let out = String(value)
  while (out.length > 1 && textWidth(out) > maxWidth) {
    out = out.slice(0, -2) + '…'
  }
  text(out, x, y, size, color, weight)
}

function fittedText(value, x, y, maxWidth, size, color, weight, align = 'left', minSize = 10) {
  let s = size
  ctx.font = `${weight || '400'} ${scaledSize(s)}px sans-serif`
  while (s > minSize && textWidth(value) > maxWidth) {
    s -= 1
    ctx.font = `${weight || '400'} ${scaledSize(s)}px sans-serif`
  }
  text(value, x, y, s, color, weight, align)
}

function wrapLines(value, maxWidth, size, weight) {
  ctx.font = `${weight || '400'} ${size}px sans-serif`
  const chars = String(value).split('')
  const lines = []
  let line = ''
  chars.forEach((ch) => {
    const next = line + ch
    if (line && textWidth(next) > maxWidth) {
      lines.push(line)
      line = ch
    } else {
      line = next
    }
  })
  if (line) lines.push(line)
  return lines
}

function textWidth(value) {
  const key = `${ctx.font}|${value}`
  const cached = game.textWidthCache[key]
  if (cached !== undefined) return cached
  const width = ctx.measureText(String(value)).width
  game.textWidthCache[key] = width
  game.textWidthCacheKeys.push(key)
  if (game.textWidthCacheKeys.length > TEXT_WIDTH_CACHE_LIMIT) {
    const oldKey = game.textWidthCacheKeys.shift()
    delete game.textWidthCache[oldKey]
  }
  return width
}

function addHit(id, x, y, w, h, action, data) {
  game.hitRegions.push({ id, x, y, w, h, action, data })
}

function syncRank(force, done) {
  if (typeof wx.setUserCloudStorage !== 'function') {
    if (done) done(false)
    return
  }
  const now = Date.now()
  if (!force && now - game.lastRankSyncAt < 30000) {
    if (done) done(true)
    return
  }
  game.lastRankSyncAt = now
  const score = Math.floor(getVisibleData().score || 0)
  wx.setUserCloudStorage({
    KVDataList: [{ key: 'power', value: String(score) }],
    success: () => {
      if (done) done(true)
    },
    fail: () => {
      game.rankError = '好友榜上报失败'
      if (done) done(false)
    }
  })
}

function loadRank() {
  game.rankRequested = true
  game.rankError = ''
  game.rankLoading = true
  if (!openData || !sharedCanvas) {
    game.rankError = '好友榜不可用'
    game.rankLoading = false
    draw()
    return
  }
  sharedCanvas.width = Math.floor(game.width - 28)
  sharedCanvas.height = 360
  const score = Math.floor(getVisibleData().score || 0)
  syncRank(true, () => {
    openData.postMessage({ type: 'rank', score })
    ;[250, 800, 1600].forEach((delay) => {
      setTimeout(() => {
        game.rankLoading = false
        if (game.tab === 'rank') requestDraw()
      }, delay)
    })
  })
  draw()
}

function button(label, x, y, w, h, enabled, action, data, special, fontSize = 16, radius = 10) {
  drawRoundRect(x, y, w, h, radius, enabled ? (special ? '#ffb13c' : '#37d07f') : '#2b334a')
  centeredText(label, x + w / 2, y + h / 2, fontSize, enabled ? '#101827' : '#8d96ad', '700')
  if (enabled && (!game.clipHit || (y + h > game.clipHit.top && y < game.clipHit.bottom))) addHit(label, x, y, w, h, action, data)
}

function drawHeader(v) {
  const pad = 14
  const o = game.topOffset
  drawRoundRect(pad, 12 + o, 36, 36, 9, '#101827', 'rgba(255,255,255,0.16)')
  if (logo.complete || logo.width) {
    ctx.save()
    clipRoundRect(pad, 12 + o, 36, 36, 9)
    ctx.drawImage(logo, pad, 12 + o, 36, 36)
    ctx.restore()
  }
  const checkW = 54
  const checkRight = game.menuLeft ? Math.min(game.width - pad, game.menuLeft - 8) : game.width - pad
  const checkX = checkRight - checkW
  fittedText('文明之主纪元', pad + 46, 20 + o, Math.max(54, checkX - pad - 60), 20, '#eef3ff', '900', 'left', 14)
  button(v.canCheckIn ? '签到' : '已签', checkX, 16 + o, checkW, 30, true, 'checkIn', null, v.canCheckIn, 14, 8)

  const eraY = 62 + o
  const miniW = 32
  const miniGroupW = miniW
  drawRoundRect(pad, eraY, game.width - pad * 2, 72, 14, '#172449', '#53619a')
  const tierW = Math.min(86, Math.max(66, game.width * 0.22))
  const tierX = game.width - pad - miniGroupW - tierW - 12
  clippedText(`${v.era.em} ${v.era.name}`, pad + 14, eraY + 12, tierX - pad - 26, 21, '#ffffff', '900')
  drawRoundRect(tierX, eraY + 14, tierW, 24, 12, 'rgba(255,205,76,0.12)', 'rgba(255,205,76,0.28)')
  fittedText(v.tier, tierX + tierW / 2, eraY + 19, tierW - 12, 13, '#ffcd4c', '900', 'center', 10)
  const guideX = game.width - pad - miniGroupW
  drawRoundRect(guideX, eraY + 8, miniW, 56, 10, '#37d07f')
  centeredText('引', guideX + miniW / 2, eraY + 23, 13, '#101827', '900')
  centeredText('导', guideX + miniW / 2, eraY + 47, 13, '#101827', '900')
  addHit('guide-vertical', guideX, eraY + 8, miniW, 56, 'guide')
  const progress = Math.floor(v.progress * 100)
  const progressW = game.width - pad * 2 - 28 - miniGroupW
  drawRoundRect(pad + 14, eraY + 45, progressW, 16, 8, '#070b18')
  drawRoundRect(pad + 14, eraY + 45, progressW * progress / 100, 16, 8, '#ffcd4c')
  centeredText(`${progress}%`, pad + 14 + progressW / 2, eraY + 53, 11, '#eaf0ff', '900')
  if (v.progress >= 1 && game.state.era < core.ERAS.length - 1) {
    button(`进入 ${core.ERAS[game.state.era + 1].name}`, pad + 14, eraY + 66, game.width - pad * 2 - 28, 28, true, 'advance', null, true)
  }
}

function drawResources(v) {
  const pad = 14
  const top = 142 + game.topOffset
  const gap = 6
  const h = 48
  const visibleCount = 5
  const count = Math.max(1, v.resources.length)
  const menuW = game.width - pad * 2
  const cellW = (menuW - gap * (visibleCount - 1)) / visibleCount
  const totalW = count * cellW + Math.max(0, count - 1) * gap
  game.maxResourceScrollX = Math.max(0, totalW - menuW)
  if (game.resourceScrollX > game.maxResourceScrollX) game.resourceScrollX = game.maxResourceScrollX
  game.resourceBar = { x: pad, y: top, w: menuW, h }

  ctx.save()
  ctx.beginPath()
  ctx.rect(pad, top - 1, menuW, h + 2)
  ctx.clip()
  v.resources.forEach((r, i) => {
    const x = pad + i * (cellW + gap) - game.resourceScrollX
    const y = top
    if (x + cellW < pad || x > game.width - pad) return
    drawRoundRect(x, y, cellW, h, 10, 'rgba(0,0,0,0.26)', 'rgba(255,255,255,0.10)')
    centeredText(r.ico, x + cellW / 2, y + 9, 13, '#ffffff', '800')
    fittedText(r.name, x + cellW / 2, y + 16, cellW - 8, 10, '#9aa6cc', '700', 'center', 8)
    fittedText(r.value, x + cellW / 2, y + 27, cellW - 8, 12, '#ffffff', '900', 'center', 8)
    fittedText(`+${r.prod}/秒`, x + cellW / 2, y + 39, cellW - 8, 10, '#5be08a', '900', 'center', 8)
  })
  ctx.restore()
  if (game.maxResourceScrollX > 0) {
    if (game.resourceScrollX > 2) text('‹', pad + 2, top + 10, 18, '#ffcd4c', '900')
    if (game.resourceScrollX < game.maxResourceScrollX - 2) text('›', game.width - pad - 10, top + 10, 18, '#ffcd4c', '900')
  }
  return top + h + 10
}

function drawTapAndTabs(v, y) {
  const pad = 14
  const crownR = 34
  const cx = game.width / 2
  const cy = y + 36
  ctx.beginPath()
  ctx.arc(cx, cy, crownR, 0, Math.PI * 2)
  ctx.fillStyle = '#2b2554'
  ctx.fill()
  ctx.strokeStyle = '#ffcd4c'
  ctx.lineWidth = 2
  ctx.stroke()
  text('👑', cx, y + 13, 30, '#ffcd4c', '900', 'center')
  if (game.tapCombo > 1 && Date.now() - game.lastTapAt <= COMBO_TIMEOUT_MS) {
    const mult = tapComboMult(game.tapCombo)
    const label = mult > 1 ? `${game.tapCombo}连击 ×${mult}` : `${game.tapCombo}连击`
    drawRoundRect(cx - 50, y + 59, 100, 20, 10, 'rgba(255,205,76,0.18)', 'rgba(255,205,76,0.35)')
    fittedText(label, cx, y + 63, 88, 12, '#ffcd4c', '900', 'center', 10)
  }
  addHit('tap', cx - crownR - 6, cy - crownR - 6, (crownR + 6) * 2, (crownR + 6) * 2, 'tap')

  const list = tabs()
  const tabY = y + 78
  const gap = 7
  const w = (game.width - pad * 2 - gap * 3) / 4
  const totalW = list.length * w + Math.max(0, list.length - 1) * gap
  game.maxTabScrollX = Math.max(0, totalW - (game.width - pad * 2))
  if (game.tabScrollX > game.maxTabScrollX) game.tabScrollX = game.maxTabScrollX
  game.tabBar = { x: pad, y: tabY, w: game.width - pad * 2, h: 30 }
  ctx.save()
  ctx.beginPath()
  ctx.rect(pad, tabY - 1, game.width - pad * 2, 32)
  ctx.clip()
  list.forEach((t, i) => {
    const x = pad + i * (w + gap) - game.tabScrollX
    const yy = tabY
    const on = game.tab === t.id
    if (x + w < pad || x > game.width - pad) return
    drawRoundRect(x, yy, w, 28, 8, on ? '#ffb13c' : 'rgba(0,0,0,0.28)', 'rgba(255,255,255,0.12)')
    centeredText(t.name, x + w / 2, yy + 14, 13, on ? '#1a1206' : '#cfd8f6', '800')
    if (tabHasNotice(t.id, v)) {
      ctx.beginPath()
      ctx.arc(x + w - 8, yy + 7, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ff3b30'
      ctx.fill()
      ctx.strokeStyle = on ? '#ffb13c' : '#0c1226'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    addHit(`tab-${t.id}`, x, yy, w, 28, 'tab', t.id)
  })
  if (game.maxTabScrollX > 0) {
    if (game.tabScrollX > 2) {
      drawRoundRect(pad, tabY + 4, 16, 20, 8, 'rgba(7,11,24,0.72)')
      text('‹', pad + 8, tabY + 2, 19, '#ffcd4c', '900', 'center')
    }
    if (game.tabScrollX < game.maxTabScrollX - 2) {
      drawRoundRect(game.width - pad - 16, tabY + 4, 16, 20, 8, 'rgba(7,11,24,0.72)')
      text('›', game.width - pad - 8, tabY + 2, 19, '#ffcd4c', '900', 'center')
    }
  }
  ctx.restore()
  return tabY + 36
}

function cardTone(tone) {
  return {
    done: { fill: 'rgba(43, 184, 119, 0.24)', stroke: 'rgba(89, 231, 155, 0.45)' },
    active: { fill: 'rgba(255, 177, 60, 0.24)', stroke: 'rgba(255, 205, 76, 0.48)' },
    bronze: { fill: 'rgba(176, 111, 55, 0.24)', stroke: 'rgba(220, 158, 94, 0.44)' },
    silver: { fill: 'rgba(176, 190, 210, 0.22)', stroke: 'rgba(224, 234, 248, 0.42)' },
    gold: { fill: 'rgba(255, 205, 76, 0.24)', stroke: 'rgba(255, 224, 126, 0.54)' },
    special: { fill: 'rgba(255, 99, 185, 0.22)', stroke: 'rgba(255, 177, 222, 0.52)' },
    ready: { fill: 'rgba(255, 205, 76, 0.18)', stroke: 'rgba(255, 205, 76, 0.42)' },
    selected: { fill: 'rgba(88, 166, 255, 0.24)', stroke: 'rgba(125, 196, 255, 0.48)' },
    locked: { fill: 'rgba(86, 96, 124, 0.18)', stroke: 'rgba(154, 166, 204, 0.22)' },
    warning: { fill: 'rgba(255, 99, 99, 0.17)', stroke: 'rgba(255, 122, 122, 0.34)' },
    normal: { fill: 'rgba(0,0,0,0.24)', stroke: 'rgba(255,255,255,0.1)' }
  }[tone || 'normal'] || { fill: 'rgba(0,0,0,0.24)', stroke: 'rgba(255,255,255,0.1)' }
}

function cardRarityTone(rarity) {
  return {
    铜卡: 'bronze',
    银卡: 'silver',
    金卡: 'gold',
    特别卡: 'special'
  }[rarity] || 'done'
}

function equipmentTone(rarity) {
  return {
    凡品: 'locked',
    良品: 'done',
    名器: 'gold',
    神器: 'special'
  }[rarity] || 'normal'
}

function rarityColors(rarity, owned) {
  if (!owned) return { fill: 'rgba(43,49,68,0.72)', stroke: 'rgba(154,166,204,0.24)', accent: '#6b7280', text: '#9aa6cc' }
  return {
    铜卡: { fill: 'rgba(96, 54, 24, 0.82)', stroke: 'rgba(220, 158, 94, 0.72)', accent: '#d99a5c', text: '#ffe7c8' },
    银卡: { fill: 'rgba(70, 82, 103, 0.82)', stroke: 'rgba(224, 234, 248, 0.72)', accent: '#dfe8f6', text: '#f4f8ff' },
    金卡: { fill: 'rgba(107, 78, 18, 0.86)', stroke: 'rgba(255, 224, 126, 0.86)', accent: '#ffdf67', text: '#fff3bf' },
    特别卡: { fill: 'rgba(88, 31, 81, 0.88)', stroke: 'rgba(255, 177, 222, 0.86)', accent: '#ff8ed1', text: '#ffe3f5' }
  }[rarity] || { fill: 'rgba(43, 184, 119, 0.24)', stroke: 'rgba(89, 231, 155, 0.45)', accent: '#59e79b', text: '#ffffff' }
}

function equipmentColors(rarity, owned) {
  if (!owned) return rarityColors('', false)
  return {
    S: { fill: 'rgba(107, 38, 34, 0.84)', stroke: 'rgba(255,103,95,0.62)', accent: '#ff675f', text: '#ffe1dc' },
    SS: { fill: 'rgba(23, 74, 128, 0.86)', stroke: 'rgba(111,211,255,0.76)', accent: '#6fd3ff', text: '#dff5ff' },
    SSS: { fill: 'rgba(107, 78, 18, 0.86)', stroke: 'rgba(255, 224, 126, 0.86)', accent: '#ffdf67', text: '#fff3bf' },
    SP: { fill: 'rgba(88, 31, 81, 0.88)', stroke: 'rgba(255, 177, 222, 0.86)', accent: '#ff8ed1', text: '#ffe3f5' },
    稀有: { fill: 'rgba(28, 91, 64, 0.82)', stroke: 'rgba(89,231,155,0.58)', accent: '#59e79b', text: '#dcfff0' },
    史诗: { fill: 'rgba(70, 82, 103, 0.82)', stroke: 'rgba(224, 234, 248, 0.72)', accent: '#dfe8f6', text: '#f4f8ff' },
    传说: { fill: 'rgba(107, 78, 18, 0.86)', stroke: 'rgba(255, 224, 126, 0.86)', accent: '#ffdf67', text: '#fff3bf' },
    神话: { fill: 'rgba(88, 31, 81, 0.88)', stroke: 'rgba(255, 177, 222, 0.86)', accent: '#ff8ed1', text: '#ffe3f5' },
    凡品: { fill: 'rgba(58, 65, 82, 0.82)', stroke: 'rgba(154,166,204,0.35)', accent: '#9aa6cc', text: '#d7def2' },
    良品: { fill: 'rgba(28, 91, 64, 0.82)', stroke: 'rgba(89,231,155,0.58)', accent: '#59e79b', text: '#dcfff0' },
    名器: { fill: 'rgba(107, 78, 18, 0.86)', stroke: 'rgba(255, 224, 126, 0.86)', accent: '#ffdf67', text: '#fff3bf' },
    神器: { fill: 'rgba(88, 31, 81, 0.88)', stroke: 'rgba(255, 177, 222, 0.86)', accent: '#ff8ed1', text: '#ffe3f5' }
  }[rarity] || rarityColors('', true)
}

function beastRankBreakdown(ranks) {
  return (core.BEAST_RANKS || [])
    .map((rank) => {
      const count = ranks && ranks[rank.id] ? ranks[rank.id] : 0
      return count ? `${rank.name}${rank.id}×${count}` : ''
    })
    .filter(Boolean)
    .join(' ')
}

function beastRankHint(name) {
  return (core.BEAST_RANKS || [])
    .map((rank) => `${rank.name}${name}`)
    .join(' / ')
}

function card(y, icon, name, desc, cost, buttonLabel, enabled, action, data, special, tone) {
  const pad = 14
  const h = 86
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const colors = cardTone(tone)
    drawRoundRect(pad, sy, game.width - pad * 2, h - 8, 10, colors.fill, colors.stroke)
    text(icon, pad + 12, sy + 22, 21, '#fff')
    clippedText(name, pad + 56, sy + 13, game.width - 202, 15, '#ffffff', '900')
    clippedText(desc, pad + 56, sy + 36, game.width - 202, 12, '#9aa6cc')
    clippedText(cost, pad + 56, sy + 56, game.width - 202, 12, '#cfd8f6', '700')
    if (action && (!buttonLabel || action === 'showCardDetail' || action === 'toggleBeastUnknown')) addHit(`${action}-${data || name}`, pad, sy, game.width - pad * 2, h - 8, action, data)
    if (buttonLabel) button(buttonLabel, game.width - pad - 76, sy + 24, 66, 32, enabled, action, data, special)
  }
  return y + h
}

function journeyStoryCard(y, j) {
  const pad = 14
  const h = 86
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const tone = j.done ? 'done' : (j.canClaim ? 'ready' : 'active')
    const colors = cardTone(tone)
    const status = j.done ? '已完结' : (j.canClaim ? '可完成' : '需升级')
    const bookLabel = j.bookLabel || '西游记'
    const doneTitle = j.doneTitle || '西游记百回圆满'
    const title = j.done ? doneTitle : `${bookLabel} ${j.progressText} · 第${j.no}${bookLabel === '西游记' ? '回' : '组'} ${status}`
    const cost = j.done ? '全部章回已完成' : `点击查看条件 · 奖励 ${j.rewardText}`
    const btnText = j.done ? '已完结' : (j.canClaim ? '完成' : '条件')
    drawRoundRect(pad, sy, game.width - pad * 2, h - 8, 10, colors.fill, colors.stroke)
    text(j.done ? (j.icon || '🪷') : (j.icon || '📖'), pad + 12, sy + 22, 21, '#fff')
    clippedText(title, pad + 56, sy + 13, game.width - 202, 15, '#ffffff', '900')
    clippedText(j.desc, pad + 56, sy + 36, game.width - 202, 12, '#9aa6cc')
    clippedText(cost, pad + 56, sy + 56, game.width - 202, 12, '#cfd8f6', '700')
    const detailActions = {
      三国演义: 'showThreeKingdomsStoryDetail',
      水浒传: 'showWaterMarginStoryDetail',
      红楼梦: 'showRedChamberStoryDetail'
    }
    const claimActions = {
      三国演义: 'claimThreeKingdomsStory',
      水浒传: 'claimWaterMarginStory',
      红楼梦: 'claimRedChamberStory'
    }
    const detailAction = detailActions[bookLabel] || 'showJourneyStoryDetail'
    const claimAction = claimActions[bookLabel] || 'claimJourneyStory'
    button(btnText, game.width - pad - 76, sy + 24, 66, 32, true, j.canClaim ? claimAction : detailAction, null, j.canClaim)
    addHit(detailAction, pad, sy, game.width - pad * 2, h - 8, detailAction)
  }
  return y + h
}

function drawStatPill(label, value, x, y, w, color) {
  drawRoundRect(x, y, w, 20, 10, 'rgba(0,0,0,0.28)', 'rgba(255,255,255,0.10)')
  centeredText(label, x + 18, y + 10, 10, '#cfd8f6', '800')
  centeredText(value, x + w - 20, y + 10, 11, color, '900')
}

function characterCard(baseY, c, index) {
  const pad = 14
  const h = 96
  const x = pad + 8
  const w = game.width - pad * 2 - 16
  const sy = baseY + index * (h + 10) - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const colors = rarityColors(c.rar, c.owned)
    drawRoundRect(x, sy, w, h, 9, c.owned ? 'rgba(31,36,58,0.92)' : 'rgba(43,49,68,0.72)', c.owned ? colors.stroke : 'rgba(154,166,204,0.24)')
    drawRoundRect(x + 10, sy + 12, 50, 72, 9, colors.fill, colors.stroke)
    drawRoundRect(x + 15, sy + 18, 40, 18, 7, colors.accent)
    centeredText(c.rar.replace('卡', ''), x + 35, sy + 27, 10, c.rar === '银卡' ? '#111827' : '#1a1206', '900')
    centeredText(c.owned ? c.levelText.replace('Lv.', '') : '?', x + 35, sy + 50, 19, '#ffffff', '900')
    centeredText(c.owned ? '名著' : '????', x + 35, sy + 74, 10, colors.text, '800')
    const nameColor = c.owned ? (c.rar === '金卡' ? '#ffcd4c' : (c.rar === '特别卡' ? '#ff8ed1' : '#ffffff')) : '#ffffff'
    clippedText(c.owned ? c.name : '未收集', x + 72, sy + 13, w - 106, 20, nameColor, '900')
    const meta = c.owned ? `${c.book} · ${c.rar} · ${c.shardText}` : `${c.book} · ${c.rar}`
    clippedText(meta, x + 72, sy + 39, w - 106, 13, colors.text, '800')
    const statY = sy + 62
    const statW = Math.max(42, (w - 104) / 4)
    ;[
      ['武', c.owned ? c.force : '--'],
      ['智', c.owned ? c.wisdom : '--'],
      ['统', c.owned ? c.lead : '--'],
      ['魅', c.owned ? c.charm : '--']
    ].forEach((item, i) => {
      const sx = x + 78 + i * statW
      text(item[0], sx - 6, statY, 11, '#9aa6cc', '800')
      text(item[1], sx - 6, statY + 15, 16, c.owned ? '#ffffff' : '#9aa6cc', '900')
    })
    centeredText('›', x + w - 22, sy + h / 2, 28, '#cfd8f6', '400')
    addHit(`showCardDetail-${c.id}`, x, sy, w, h, 'showCardDetail', c.id)
  }
  return h + 10
}

function equipmentCard(baseY, e, index) {
  const pad = 14
  const gap = 10
  const cols = 2
  const w = (game.width - pad * 2 - gap) / cols
  const h = 156
  const row = Math.floor(index / cols)
  const col = index % cols
  const x = pad + col * (w + gap)
  const sy = baseY + row * (h + gap) - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const colors = equipmentColors(e.rar, e.owned)
    drawRoundRect(x, sy, w, h, 10, colors.fill, colors.stroke)
    drawRoundRect(x + 8, sy + 8, w - 16, 22, 8, colors.accent)
    centeredText(e.rar, x + w / 2, sy + 19, 12, e.rar === '名器' ? '#1a1206' : '#111827', '900')
    centeredText(e.owned ? e.name : '未获得', x + w / 2, sy + 48, e.owned ? 16 : 17, '#ffffff', '900')
    centeredText(e.type, x + w / 2, sy + 72, 12, colors.text, '800')
    centeredText(e.owned ? e.levelText : '????', x + w / 2, sy + 94, 12, '#cfd8f6', '800')
    clippedText(e.owned ? e.desc : '点击查看装备线索', x + 12, sy + 118, w - 24, 11, colors.text, '700')
    addHit(`showEquipmentDetail-${e.id}`, x, sy, w, h, 'showEquipmentDetail', e.id)
  }
  return h + gap
}

function pagerRow(y, page, totalPages, action) {
  const pad = 14
  const gap = 10
  const h = 52
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    drawRoundRect(pad, sy, game.width - pad * 2, h, 10, 'rgba(0,0,0,0.24)', 'rgba(255,255,255,0.1)')
    centeredText(`第 ${page + 1} / ${totalPages} 页`, game.width / 2, sy + 26, 13, '#cfd8f6', '800')
    button('上一页', pad + 10, sy + 9, 84, 34, page > 0, action, -1, false, 14)
    button('下一页', game.width - pad - 94, sy + 9, 84, 34, page < totalPages - 1, action, 1, true, 14)
  }
  return y + h + gap
}

function compactInfoRow(y, icon, title, meta, tone) {
  const pad = 14
  const h = 40
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const colors = cardTone(tone || 'active')
    drawRoundRect(pad, sy, game.width - pad * 2, h, 9, colors.fill, colors.stroke)
    centeredText(icon, pad + 22, sy + h / 2, 15, '#ffffff', '900')
    clippedText(title, pad + 42, sy + 8, game.width * 0.42, 13, '#ffffff', '900')
    clippedText(meta, game.width - pad - 138, sy + 10, 126, 12, '#cfd8f6', '800')
  }
  return y + h + 8
}

function buildingCard(y, icon, name, desc, cost, enabled, action, data) {
  const pad = 14
  const h = 68
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    drawRoundRect(pad, sy, game.width - pad * 2, h - 7, 10, 'rgba(0,0,0,0.24)', 'rgba(255,255,255,0.1)')
    text(icon, pad + 12, sy + 21, 21, '#fff')
    const btnW = 82
    const btnH = 40
    const btnX = game.width - pad - btnW
    const textW = btnX - pad - 72
    fittedText(name, pad + 56, sy + 12, textW * 0.48, 15, '#ffffff', '900')
    fittedText(cost, pad + 56 + textW * 0.5, sy + 12, textW * 0.5, 14, '#ffcd4c', '900')
    fittedText(desc, pad + 56, sy + 36, textW, 12, '#9aa6cc', '400')
    if (enabled) addHit(`buyBuilding-zone-${data}`, btnX - 14, sy - 4, btnW + 28, h + 1, action, data)
    button('建造', btnX, sy + 14, btnW, btnH, enabled, action, data, false)
    addHit(`showBuildingDetail-${data}`, pad, sy, btnX - pad - 10, h - 7, 'showBuildingDetail', data)
  }
  return y + h
}

function inventoryPackCard(y, item, kind) {
  const pad = 14
  const h = 86
  const sy = y - game.scrollY
  const isEquipment = kind === 'equipmentBox'
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const enabled = item.canOpen
    const action = isEquipment ? 'openEquipmentBox' : 'openCardPack'
    const detailAction = isEquipment ? 'showEquipmentBoxDetail' : 'showCardPackDetail'
    const btnX = game.width - pad - 76
    const textW = btnX - pad - 72
    drawRoundRect(pad, sy, game.width - pad * 2, h - 8, 10, 'rgba(0,0,0,0.24)', enabled ? 'rgba(55,208,127,0.45)' : 'rgba(255,255,255,0.1)')
    text(item.ico, pad + 12, sy + 22, 21, '#fff')
    fittedText(item.name, pad + 56, sy + 12, textW, 15, '#ffffff', '900')
    fittedText(isEquipment ? '每箱开出 2 件装备' : '每包开出 3 张人物卡', pad + 56, sy + 36, textW, 12, '#9aa6cc', '700')
    fittedText(`库存 ${item.stock} ${isEquipment ? '箱' : '包'} · 点击查看详情`, pad + 56, sy + 56, textW, 12, '#cfd8f6', '700')
    if (enabled) addHit(`${action}-zone-${item.id}`, btnX - 8, sy, 84, h - 8, action, item.id)
    button(isEquipment ? '开箱' : '开包', btnX, sy + 24, 66, 32, enabled, action, item.id, true)
    addHit(`${detailAction}-${item.id}`, pad, sy, btnX - pad - 10, h - 8, detailAction, item.id)
  }
  return y + h
}

function shopPackCard(y, p) {
  const pad = 14
  const h = 146
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    const soldOut = p.soldOut
    const border = p.canBuy ? 'rgba(68, 218, 255, 0.65)' : (soldOut ? 'rgba(255,122,122,0.38)' : 'rgba(125,196,255,0.38)')
    drawRoundRect(pad, sy, game.width - pad * 2, h - 4, 10, 'rgba(36, 37, 52, 0.94)', border)

    const packX = pad + 14
    const packY = sy + 22
    const packW = 74
    const packH = 96
    const colors = p.id === 'special' ? rarityColors('特别卡', true)
      : (p.id === 'gold' ? rarityColors('金卡', true)
        : (p.id === 'silver' ? rarityColors('银卡', true)
          : (p.books ? rarityColors('金卡', true) : rarityColors('铜卡', true))))
    drawRoundRect(packX, packY, packW, packH, 8, colors.fill, colors.stroke)
    drawRoundRect(packX + 8, packY + 8, packW - 16, 22, 7, colors.accent)
    centeredText(p.ico, packX + packW / 2, packY + 20, 17, '#111827', '900')
    centeredText('名著', packX + packW / 2, packY + 48, 16, '#ffffff', '900')
    centeredText('3张', packX + packW / 2, packY + 72, 13, colors.text, '900')

    const textX = packX + packW + 14
    const rightW = game.width - textX - pad - 18
    clippedText(p.name, textX, sy + 18, rightW - 34, 18, '#ffffff', '900')
    drawRoundRect(game.width - pad - 36, sy + 16, 24, 24, 12, soldOut ? '#ff6b6b' : '#d8ff4f')
    centeredText(String(p.shopStock), game.width - pad - 24, sy + 28, 14, '#111827', '900')
    clippedText(p.desc, textX, sy + 48, rightW, 12, '#cfd8f6', '700')
    text('人物', textX, sy + 76, 11, '#9aa6cc', '800')
    text('3', textX, sy + 92, 20, '#ffffff', '900')
    text('稀有', textX + 56, sy + 76, 11, '#9aa6cc', '800')
    text(`${Math.round((p.rates.gold + p.rates.special) * 100)}%`, textX + 56, sy + 94, 14, '#ffcd4c', '900')
    text('售价', textX + 126, sy + 76, 11, '#9aa6cc', '800')
    text(`💰${p.costText}`, textX + 126, sy + 94, 14, '#ffcd4c', '900')
    button('购买', textX, sy + 110, 70, 26, p.canBuy, 'buyCardPack', p.id, true, 12)
    button('库存', game.width - pad - 82, sy + 110, 70, 26, p.stock > 0, 'tab', 'cards', false, 12)
  }
  return y + h
}

function friendRankPanel(y) {
  const pad = 14
  const h = 380
  const sy = y - game.scrollY
  if (sy > game.scrollTopY - h && sy < game.scrollBottomY + h) {
    drawRoundRect(pad, sy, game.width - pad * 2, h - 8, 10, 'rgba(0,0,0,0.24)', 'rgba(255,255,255,0.1)')
    if (game.rankError) {
      centeredText(game.rankError, game.width / 2, sy + 78, 15, '#cfd8f6', '800')
    } else if (game.rankLoading) {
      centeredText('好友榜加载中...', game.width / 2, sy + 78, 15, '#cfd8f6', '800')
      centeredText('真机上需要微信好友也玩过并同步国力', game.width / 2, sy + 106, 12, '#9aa6cc', '600')
    } else if (sharedCanvas && game.rankRequested) {
      ctx.drawImage(sharedCanvas, pad, sy + 8, game.width - pad * 2, h - 24)
    } else {
      centeredText('点击刷新查看微信好友榜', game.width / 2, sy + 78, 15, '#cfd8f6', '800')
    }
  }
  return y + h
}

function drawPanel(v, startY) {
  const pad = 14
  const panelBottomPad = AD_PLACEHOLDER_H + AD_PLACEHOLDER_GAP + 8
  game.scrollTopY = startY + 44
  game.scrollBottomY = game.height - game.bottomInset - panelBottomPad
  drawRoundRect(pad, startY, game.width - pad * 2, game.height - startY - game.bottomInset - panelBottomPad, 14, '#161e3a', 'rgba(255,255,255,0.1)')
  text(panelTitle(), pad + 14, startY + 12, 16, '#ffcd4c', '900')

  ctx.save()
  ctx.beginPath()
  ctx.rect(pad, game.scrollTopY, game.width - pad * 2, game.scrollBottomY - game.scrollTopY)
  ctx.clip()
  game.clipHit = { top: game.scrollTopY, bottom: game.scrollBottomY }

  let y = startY + 44
  if (game.tab === 'build') {
    v.buildings.forEach((b) => {
      y = buildingCard(y, b.ico, `${b.name} ×${b.count}`, `${b.desc} · 单产 ${b.unit}/秒`, b.costText, b.canBuy, 'buyBuilding', b.id)
    })
  } else if (game.tab === 'war') {
    if (game.expeditionNotice && Date.now() - game.expeditionNotice.at < 8000) {
      y = card(y, game.expeditionNotice.tone === 'done' ? '🎉' : '⚠', game.expeditionNotice.tone === 'done' ? '远征成功' : '远征失败', game.expeditionNotice.text, '', null, false, null, null, false, game.expeditionNotice.tone)
    }
    y = card(y, '🗡', `战力 ${v.armyText}`, '远征消耗食物，胜利获得资源。', '', null)
    v.dungeons.forEach((d) => {
      y = card(y, d.ico, `${d.name} 胜${d.wins}`, `需求 ${d.powerText} · 胜率 ${d.winRate}% · 🌾${d.foodCostText}`, `奖励 ${d.rewardText}`, '出征', d.canStart, 'startExpedition', d.id, true, d.canStart ? 'ready' : 'locked')
    })
  } else if (game.tab === 'goal') {
    if (v.eventOffer) {
      y = card(y, v.eventOffer.ico, `${v.eventOffer.name} ${v.eventOffer.seconds}s`, v.eventOffer.desc, `奖励 ${v.eventOffer.rewardText}`, '领取', true, 'claimEvent', null, true, 'ready')
    } else {
      y = card(y, '🎯', '随机事件进度', '消费金币会积累事件进度。', v.eventProgressText, null, false, null, null, false, 'locked')
    }
    if (v.journeyStory) {
      y = journeyStoryCard(y, v.journeyStory)
    }
    if (v.threeKingdomsStory) {
      y = journeyStoryCard(y, v.threeKingdomsStory)
    }
    if (v.waterMarginStory) {
      y = journeyStoryCard(y, v.waterMarginStory)
    }
    if (v.redChamberStory) {
      y = journeyStoryCard(y, v.redChamberStory)
    }
    v.mainChapters.forEach((c) => {
      const tone = c.claimed ? 'done' : (c.canClaim ? 'ready' : 'selected')
      y = card(y, c.claimed ? '🏛' : '📜', `${c.title} ${c.claimed ? '已领取' : c.progressText}`, c.desc, `${c.stepText} · 奖励 ${c.rewardText}`, c.claimed ? '已领' : '领取', c.canClaim, 'claimMainChapter', c.id, true, tone)
    })
    const readyDaily = v.dailyTasks.filter((t) => t.canClaim).length
    const claimedDaily = v.dailyTasks.filter((t) => t.claimed).length
    y = card(y, '📌', `每日任务 ${claimedDaily}/${v.dailyTasks.length}`, '王座召令、百工开市、军旗出征等每日目标收在这里。', readyDaily > 0 ? `${readyDaily} 个可领取` : (game.goalDailyOpen ? '已展开' : '点击展开查看'), game.goalDailyOpen ? '收起' : '展开', true, 'toggleGoalDaily', null, true, readyDaily > 0 ? 'ready' : 'selected')
    if (game.goalDailyOpen) {
      v.dailyTasks.forEach((t) => {
        const tone = t.claimed ? 'done' : (t.canClaim ? 'ready' : 'active')
        y = card(y, t.canClaim ? '✅' : '📌', `${t.name} ${t.claimed ? '已领取' : t.progressText}`, t.desc, `奖励 ${t.rewardText}`, t.claimed ? '已领' : '领取', t.canClaim, 'claimDailyTask', t.id, true, tone)
      })
    }
    const activeCombos = v.secretCombos.filter((c) => c.active).length
    y = card(y, '🧩', `隐藏组合 ${activeCombos}/${v.secretCombos.length}`, '真龙王庭、白虎军国等进阶目标收在这里。', game.goalCombosOpen ? '已展开' : '点击展开查看条件', game.goalCombosOpen ? '收起' : '展开', true, 'toggleGoalCombos', null, true, activeCombos > 0 ? 'active' : 'selected')
    if (game.goalCombosOpen) {
      v.secretCombos.forEach((c) => {
        y = card(y, c.ico, `${c.name} ${c.statusText}`, c.active ? c.desc : c.hint, c.active ? '隐藏组合加成生效中' : '达成后解锁高倍产能', null, false, null, null, false, c.active ? 'active' : 'locked')
      })
    }
    const readyAchievements = v.achievements.filter((a) => a.canClaim).length
    const claimedAchievements = v.achievements.filter((a) => a.claimed).length
    y = card(y, '🏆', `成就目标 ${claimedAchievements}/${v.achievements.length}`, '生肖初醒、百业兴建、三族归附等长期任务收在这里。', readyAchievements > 0 ? `${readyAchievements} 个可领取` : (game.goalAchievementsOpen ? '已展开' : '点击展开查看'), game.goalAchievementsOpen ? '收起' : '展开', true, 'toggleGoalAchievements', null, true, readyAchievements > 0 ? 'ready' : 'selected')
    if (game.goalAchievementsOpen) {
      v.achievements.forEach((a) => {
        const tone = a.claimed ? 'done' : (a.done ? 'ready' : 'locked')
        y = card(y, '🏆', `${a.name} ${a.statusText}`, a.desc, `奖励 ${a.rewardText}`, a.buttonText, !a.disabled, 'claimAchievement', a.id, true, tone)
      })
    }
  } else if (game.tab === 'shop') {
    v.cardPacks.forEach((p) => {
      y = shopPackCard(y, p)
    })
    v.equipmentBoxes.forEach((b) => {
      const tone = b.canBuy ? 'ready' : (b.soldOut ? 'warning' : 'selected')
      const status = b.soldOut ? '已售罄' : `商城剩余 ${b.shopStock} 箱`
      y = card(y, b.ico, b.name, b.desc, `${status} · 售价 💰${b.costText}`, '购买', b.canBuy, 'buyEquipmentBox', b.id, true, tone)
    })
  } else if (game.tab === 'cards') {
    const stockedPacks = v.cardPacks.filter((p) => p.stock > 0)
    stockedPacks.forEach((p) => {
      y = inventoryPackCard(y, p, 'cardPack')
    })
    const totalPages = Math.max(1, Math.ceil(v.cards.length / CARD_PAGE_SIZE))
    if (game.cardPage >= totalPages) game.cardPage = totalPages - 1
    if (game.cardPage < 0) game.cardPage = 0
    y = compactInfoRow(y, '📖', `人物图鉴 ${game.cardPage + 1}/${totalPages}`, `已收集 ${v.cardCollected}/${v.cardTotal}`, 'active')
    y = card(y, '💰', '出售满级溢出', '重复人物会自动变成升级碎片；只有满级后的多余碎片可出售。', `可售 ${v.cardSell.count} 张 · 💰${v.cardSell.goldText}`, '出售', v.cardSell.count > 0, 'sellDuplicateCards', null, true, v.cardSell.count > 0 ? 'ready' : 'locked')
    const gridY = y
    const pageCards = v.cards.slice(game.cardPage * CARD_PAGE_SIZE, game.cardPage * CARD_PAGE_SIZE + CARD_PAGE_SIZE)
    pageCards.forEach((c, index) => {
      characterCard(gridY, c, index)
    })
    y += pageCards.length * 106
    y = pagerRow(y, game.cardPage, totalPages, 'cardPage')
  } else if (game.tab === 'equip') {
    const stockedBoxes = v.equipmentBoxes.filter((b) => b.stock > 0)
    stockedBoxes.forEach((b) => {
      y = inventoryPackCard(y, b, 'equipmentBox')
    })
    y = card(y, '💰', '快速出售重复装备', '保留每件装备 1 星图鉴，出售多余重复星级。', `可售 ${v.equipmentSell.count} 件 · 💰${v.equipmentSell.goldText}`, '出售', v.equipmentSell.count > 0, 'sellDuplicateEquipments', null, true, v.equipmentSell.count > 0 ? 'ready' : 'locked')
    const totalPages = Math.max(1, Math.ceil(v.equipments.length / EQUIP_PAGE_SIZE))
    if (game.equipPage >= totalPages) game.equipPage = totalPages - 1
    if (game.equipPage < 0) game.equipPage = 0
    y = compactInfoRow(y, '🧰', `装备图鉴 ${game.equipPage + 1}/${totalPages}`, `已收集 ${v.equipmentCollected}/${v.equipmentTotal}`, 'active')
    const gridY = y
    const pageItems = v.equipments.slice(game.equipPage * EQUIP_PAGE_SIZE, game.equipPage * EQUIP_PAGE_SIZE + EQUIP_PAGE_SIZE)
    pageItems.forEach((e, index) => {
      equipmentCard(gridY, e, index)
    })
    y += Math.ceil(pageItems.length / 2) * 166
    y = pagerRow(y, game.equipPage, totalPages, 'equipPage')
  } else if (game.tab === 'zodiac') {
    v.zodiacs.forEach((z) => {
      const tone = z.isBlood ? 'selected' : (z.recruited ? 'done' : (z.canRecruit ? 'ready' : 'locked'))
      y = card(y, z.ico, `${z.name} ${z.statusText}`, z.desc, z.recruited ? '已加入文明' : '💰2万', z.recruited ? z.bloodButtonText : '招募', z.recruited || z.canRecruit, z.recruited ? 'setBloodline' : 'recruitZodiac', z.id, z.recruited, tone)
    })
  } else if (game.tab === 'beast') {
    y = card(y, '🥚', '神兽蛋', '随机孵化神兽，同种最多叠 5 层加成。', `💰${v.eggCostText}`, '孵化', v.canHatch, 'hatchEgg', null, true, v.canHatch ? 'ready' : 'locked')
    const ownedBeasts = v.beasts.filter((b) => b.count > 0)
    const unknownBeasts = v.beasts.filter((b) => !b.count)
    const discoveredCount = v.beasts.length - unknownBeasts.length
    ownedBeasts.forEach((b) => {
      y = card(y, b.iconText, `${b.titleText} ${b.countText}`, b.descText, '', null, false, null, null, false, b.count ? 'done' : 'locked')
    })
    const unknownDesc = unknownBeasts.length
      ? '点击查看还缺哪些神兽；每种都有红/银/金/七彩品质。'
      : '已发现全部神兽；继续孵化可追更高品质和叠加数量。'
    y = card(y, unknownBeasts.length ? '📜' : '✅', `神兽图鉴 ${discoveredCount}/${v.beasts.length}`, unknownDesc, game.beastUnknownOpen ? '已展开' : '点击展开查看', game.beastUnknownOpen ? '收起' : '展开', true, 'toggleBeastUnknown', null, true, unknownBeasts.length ? 'selected' : 'done')
    if (game.beastUnknownOpen) {
      if (unknownBeasts.length) {
        unknownBeasts.forEach((b) => {
          y = card(y, b.ico, `线索：${b.name}`, `可孵化 ${beastRankHint(b.name)}`, '来源：神兽蛋 / 神兽远征掉落', null, false, null, null, false, 'locked')
        })
      } else {
        y = card(y, '🏆', '全部神兽已发现', '下一步目标：补齐 SS/SSS/SP 品质，提升同种神兽数量加成。', '继续孵化神兽蛋', null, false, null, null, false, 'done')
      }
    }
  } else if (game.tab === 'cultivate') {
    v.realmList.forEach((r) => {
      y = card(y, '☯', `${r.name}境 ${r.statusText}`, `全产量 ×${r.mult}`, `✨${r.costText}`, r.buttonText, r.canBreak, 'breakRealm', r.index, true, r.reached ? 'done' : (r.canBreak ? 'ready' : 'locked'))
    })
  } else if (game.tab === 'tech') {
    v.techs.forEach((t) => {
      y = card(y, t.ico, `${t.name} ${t.statusText}`, t.desc, `🔬${t.costText}`, t.buttonText, !t.disabled, 'buyTech', t.id, true, t.owned ? 'done' : (t.canBuy ? 'ready' : 'locked'))
    })
  } else if (game.tab === 'star') {
    v.stars.forEach((p) => {
      y = card(y, p.ico, `${p.name} ${p.statusText}`, p.desc, `🌌${p.costText}`, p.buttonText, !p.disabled, 'buyStar', p.id, true, p.owned ? 'done' : (p.canBuy ? 'ready' : 'locked'))
    })
  } else if (game.tab === 'evolve') {
    v.evolutions.forEach((ev) => {
      const tone = ev.owned ? 'done' : (ev.canBuy ? 'ready' : (ev.unlocked ? 'active' : 'locked'))
      y = card(y, ev.ico, `${ev.name} ${ev.statusText}`, ev.desc, `🧬${ev.costText}`, ev.buttonText, !ev.disabled, 'buyEvolution', ev.id, true, tone)
    })
  } else if (game.tab === 'reboot') {
    y = card(y, '♾️', `第 ${v.season.cycle} 次轮回`, '道种提供永久加成，影响产出、点击收益和远征战力。', `道种 ${v.season.daoSeeds} 枚 · 永久倍率 ${v.season.multText}`, null, false, null, null, false, 'active')
    y = card(y, '🌌', '宇宙重启', `要求进入道果循环时代，国力达到 ${v.season.needText}。重启会保留人物、装备、生肖和神兽收藏。`, `本次可获得 ${v.season.rewardText} 枚道种`, '重启', v.season.canReboot, 'rebootUniverse', null, true, v.season.canReboot ? 'ready' : 'locked')
    y = card(y, '📜', '重启规则', '会重置资源、建筑、时代、远征、商城库存和每日进度；收藏向资产与历史最高国力保留。', `上次获得 ${core.fmt(v.season.lastGain || 0)} 道种 · 历史最高 ${core.fmt(v.season.bestPower || 0)}`, null, false, null, null, false, 'selected')
  } else {
    y = card(y, '🏅', '我的国力', v.scoreText, '最高国力会同步到微信好友榜', '刷新', true, 'refreshRank', null, true)
    y = friendRankPanel(y)
  }
  game.clipHit = null
  ctx.restore()
  const visibleBottom = game.height - game.bottomInset - panelBottomPad
  game.maxScrollY = Math.max(0, y - visibleBottom)
  if (game.scrollY > game.maxScrollY) game.scrollY = game.maxScrollY
}

function drawAdPlaceholder() {
  const pad = 14
  const w = game.width - pad * 2
  const h = AD_PLACEHOLDER_H
  const y = game.height - game.bottomInset - h - 4
  drawRoundRect(pad, y, w, h, 10, 'rgba(7,11,24,0.86)', 'rgba(255,255,255,0.16)')
  drawRoundRect(pad + 10, y + 9, w - 20, h - 18, 8, 'rgba(255,255,255,0.04)', 'rgba(255,205,76,0.22)')
  centeredText('广告位', game.width / 2, y + h / 2, 13, '#9aa6cc', '800')
}

function drawScrollbar() {
  game.scrollbar = null
  if (game.maxScrollY <= 0) return
  const trackX = game.width - 10
  const trackY = game.scrollTopY
  const trackH = Math.max(40, game.scrollBottomY - game.scrollTopY)
  const visibleH = trackH
  const contentH = visibleH + game.maxScrollY
  const thumbH = Math.max(36, visibleH * visibleH / contentH)
  const thumbY = trackY + (trackH - thumbH) * (game.scrollY / game.maxScrollY)
  drawRoundRect(trackX, trackY, 4, trackH, 2, 'rgba(255,255,255,0.12)')
  drawRoundRect(trackX - 2, thumbY, 8, thumbH, 4, 'rgba(255,205,76,0.85)')
  game.scrollbar = { x: trackX - 8, y: trackY, w: 20, h: trackH, thumbY, thumbH }
  addHit('scrollbar', trackX - 8, trackY, 20, trackH, 'scrollbar')
}

function drawGuideOverlay() {
  if (!game.guideOpen) return
  ctx.fillStyle = 'rgba(0,0,0,0.62)'
  ctx.fillRect(0, 0, game.width, game.height)

  const pad = 22
  const boxX = 18
  const boxW = game.width - boxX * 2
  const boxH = Math.min(game.height - 64, 486)
  const boxY = Math.max(28, (game.height - boxH) / 2)
  drawRoundRect(boxX, boxY, boxW, boxH, 16, '#f8fafc')

  const compact = boxH < 520
  text('新手引导', game.width / 2, boxY + 22, 20, '#111827', '900', 'center')
  text('按这个顺序玩，前期不会卡住。', game.width / 2, boxY + (compact ? 49 : 52), compact ? 12 : 13, '#64748b', '700', 'center')

  const textX = boxX + pad
  const textW = boxW - pad * 2
  const btnW = boxW - pad * 2
  const btnH = 42
  const btnY = boxY + boxH - btnH - 16
  const listTop = boxY + (compact ? 74 : 84)
  const listGap = compact ? 5 : 8
  const rowH = Math.max(38, Math.floor((btnY - listTop - 12 - listGap * (GUIDE_ITEMS.length - 1)) / GUIDE_ITEMS.length))
  let y = listTop
  GUIDE_ITEMS.forEach((item, index) => {
    drawRoundRect(textX, y, textW, rowH, 10, index % 2 ? '#eef2ff' : '#ecfdf5', '#dbeafe')
    const badgeY = y + Math.max(6, Math.floor((rowH - 30) / 2))
    drawRoundRect(textX + 10, badgeY, 30, 30, 15, '#111827')
    centeredText(String(index + 1), textX + 25, badgeY + 15, 14, '#ffcd4c', '900')
    text(item[0], textX + 50, y + (rowH <= 42 ? 5 : 7), compact ? 13 : 14, '#111827', '900')
    const lines = wrapLines(item[1], textW - 62, compact ? 11 : 12, '600').slice(0, compact ? 1 : 2)
    lines.forEach((line, lineIndex) => {
      text(line, textX + 50, y + (rowH <= 42 ? 23 : 27) + lineIndex * 15, compact ? 11 : 12, '#475569', '600')
    })
    y += rowH + listGap
  })

  drawRoundRect(textX, btnY, btnW, btnH, 12, '#ffb13c')
  text('开始建设文明', game.width / 2, btnY + 11, 16, '#1a1206', '900', 'center')
  addHit('close-guide', textX, btnY, btnW, btnH, 'closeGuide')
}

function draw() {
  setupCanvas(false)
  game.hitRegions = []
  const v = getVisibleData()
  game.cachedTapValue = v.tap
  v.armyText = core.fmt(v.army)
  v.scoreText = core.fmt(v.score)
  v.eggCostText = core.fmt(eggCost())
  v.canHatch = game.state.res.gold >= eggCost()
  v.zodiacs = v.zodiacs.map((z) => ({
    ...z,
    statusText: z.isBlood ? '血脉' : (z.recruited ? '已招募' : ''),
    bloodButtonText: z.isBlood ? '已选' : '设为血脉'
  }))
  v.beasts = v.beasts.map((b) => ({
    ...b,
    iconText: b.count ? b.ico : '❓',
    titleText: b.count ? `${b.rankName || b.rank || ''}${b.name}` : '未发现',
    countText: b.count ? `×${b.count}` : '',
    descText: b.count ? `全产量 +${Math.round(b.mult * 100)}%/只 · ${beastRankBreakdown(b.ranks) || b.rar}` : '尚未孵出 · 红/银/金/七彩'
  }))
  v.realms = v.realms.map((r) => ({ ...r, statusText: r.reached ? '已达' : '', buttonText: r.reached ? '已达' : '突破' }))
  v.realmList = v.realms.filter((r) => r.index > 0)
  v.techs = v.techs.map((t) => ({ ...t, statusText: t.owned ? '已研发' : '', buttonText: t.owned ? '已研发' : '研发', disabled: t.owned || !t.canBuy }))
  v.stars = v.stars.map((p) => ({ ...p, statusText: p.owned ? '已建成' : '', buttonText: p.owned ? '已建成' : '建设', disabled: p.owned || !p.canBuy }))
  v.evolutions = v.evolutions.map((ev) => ({ ...ev, statusText: ev.owned ? '已进化' : (ev.unlocked ? '可研究' : '未获得本体'), buttonText: ev.owned ? '已进化' : '进化', disabled: ev.owned || !ev.canBuy }))
  v.achievements = v.achievements.map((a) => ({ ...a, statusText: a.claimed ? '已领取' : (a.done ? '可领取' : '进行中'), buttonText: a.claimed ? '已领' : '领取', disabled: a.claimed || !a.done }))
  v.dungeons = v.dungeons.map((d) => ({ ...d, powerText: core.fmt(d.power), foodCostText: core.fmt(d.foodCost) }))

  ctx.fillStyle = backgroundGradient()
  ctx.fillRect(0, 0, game.width, game.height)

  drawHeader(v)
  const afterRes = drawResources(v)
  const panelY = drawTapAndTabs(v, afterRes)
  drawPanel(v, panelY)
  drawScrollbar()
  drawAdPlaceholder()
  drawFloatingTexts()
  drawConfetti()
  drawPackReveal()
  drawDetailOverlay()
  drawGuideOverlay()
}

function eggCost() {
  return core.beastEggCost(game.state)
}

function act(fn, okText) {
  if (fn()) {
    toast(okText)
    save()
  } else {
    toast('资源不足或条件未满足')
  }
}

function handleAction(action, data, point) {
  if (action === 'tap') {
    const combo = updateTapCombo()
    const value = Math.floor((game.cachedTapValue || 1) * tapComboMult(combo))
    game.state.res.gold += value
    core.recordDailyProgress(game.state, 'tap', 1)
    playTapSound()
    addFloatText(point ? point.x : game.width / 2, point ? point.y : game.height / 2, value)
    save(true)
  } else if (action === 'advance') {
    if (core.advanceEra(game.state)) toast(`进入${core.ERAS[game.state.era].name}`)
    game.tab = 'build'
    save()
  } else if (action === 'tab') {
    game.tab = data
    game.scrollY = 0
    if (data === 'rank') loadRank()
  } else if (action === 'cardPage') {
    game.cardPage += Number(data)
    game.scrollY = 0
  } else if (action === 'equipPage') {
    game.equipPage += Number(data)
    game.scrollY = 0
  } else if (action === 'buyBuilding') {
    if (core.buyBuilding(game.state, data)) {
      core.recordDailyProgress(game.state, 'build', 1)
      toast('建造成功')
      save()
    } else {
      toast('资源不足或条件未满足')
    }
  } else if (action === 'recruitZodiac') {
    act(() => core.recruitZodiac(game.state, data), '招募成功')
  } else if (action === 'setBloodline') {
    act(() => core.setBloodline(game.state, data), '血脉已切换')
  } else if (action === 'hatchEgg') {
    const beast = core.hatchEgg(game.state)
    if (beast) {
      const item = {
        ...beast,
        kind: 'beast',
        type: '神兽',
        name: `${beast.rankName || beast.rank || ''}${beast.name}`,
        level: game.state.beasts[beast.id] || 1,
        desc: `${beast.rank || 'S'}品质 · 全产量 +${Math.round(beast.mult * 100)}%/只`
      }
      playOpenFeedback()
      game.packReveal = {
        mode: 'beast',
        title: '神兽蛋孵化',
        subtitle: '上古神兽现世',
        items: [item],
        at: Date.now()
      }
      startPackRevealAnimation()
      save()
    } else {
      toast('金币不足')
    }
  } else if (action === 'buyCardPack') {
    const result = core.buyCardPack(game.state, data)
    if (result && result.ok) {
      toast(`${result.pack.name} +1，库存 ${result.stock} 包`)
      save()
    } else {
      toast(result && result.reason === 'soldout' ? '这个卡包已售罄' : '金币不足')
    }
  } else if (action === 'buyEquipmentBox') {
    const result = core.buyEquipmentBox(game.state, data)
    if (result && result.ok) {
      toast(`${result.box.name} +1，库存 ${result.stock} 箱`)
      save()
    } else {
      toast(result && result.reason === 'soldout' ? '这个装备箱已售罄' : '金币不足')
    }
  } else if (action === 'openCardPack') {
    const result = core.openCardPack(game.state, data)
    if (result) {
      core.recordDailyProgress(game.state, 'openPack', 1)
      playOpenFeedback()
      game.packReveal = {
        title: result.pack.name,
        subtitle: '人物卡获取',
        items: result.cards,
        at: Date.now()
      }
      burstConfetti(game.width / 2, game.height * 0.35, 28, revealPalette(bestRevealItem(result.cards)).confetti)
      startPackRevealAnimation()
      save()
    } else {
      toast('没有卡包库存')
    }
  } else if (action === 'openEquipmentBox') {
    const result = core.openEquipmentBox(game.state, data)
    if (result) {
      core.recordDailyProgress(game.state, 'openPack', 1)
      playOpenFeedback()
      game.packReveal = {
        title: result.box.name,
        subtitle: '装备获取',
        items: result.items,
        at: Date.now()
      }
      burstConfetti(game.width / 2, game.height * 0.35, 24, revealPalette(bestRevealItem(result.items)).confetti)
      startPackRevealAnimation()
      save()
    } else {
      toast('没有装备箱库存')
    }
  } else if (action === 'sellDuplicateCards') {
    const result = core.sellDuplicateCards(game.state)
    if (result) {
      toast(`出售 ${result.count} 张，获得 ${core.fmt(result.gold)} 金币`)
      save()
    } else {
      toast('没有可出售的重复人物')
    }
  } else if (action === 'sellDuplicateEquipments') {
    const result = core.sellDuplicateEquipments(game.state)
    if (result) {
      toast(`出售 ${result.count} 件，获得 ${core.fmt(result.gold)} 金币`)
      save()
    } else {
      toast('没有可出售的重复装备')
    }
  } else if (action === 'closePackReveal') {
    game.packReveal = null
  } else if (action === 'closeDetailOverlay') {
    game.detailOverlay = null
  } else if (action === 'showCardDetail') {
    showCardDetail(data)
  } else if (action === 'showEquipmentDetail') {
    showEquipmentDetail(data)
  } else if (action === 'showBuildingDetail') {
    showBuildingDetail(data)
  } else if (action === 'showCardPackDetail') {
    showPackDetail('cardPack', data)
  } else if (action === 'showEquipmentBoxDetail') {
    showPackDetail('equipmentBox', data)
  } else if (action === 'showJourneyStoryDetail') {
    showJourneyStoryDetail()
  } else if (action === 'breakRealm') {
    act(() => core.breakRealm(game.state, Number(data)), '突破成功')
  } else if (action === 'buyTech') {
    act(() => core.buyTech(game.state, data), '研发成功')
  } else if (action === 'buyStar') {
    act(() => core.buyStar(game.state, data), '建设完成')
  } else if (action === 'buyEvolution') {
    act(() => core.buyEvolution(game.state, data), '进化完成')
  } else if (action === 'rebootUniverse') {
    if (!core.canReboot(game.state)) {
      toast('尚未达到轮回条件')
      return
    }
    const gain = core.rebootGain(game.state)
    wx.showModal({
      title: '确认宇宙重启',
      content: `本次可获得 ${core.fmt(gain)} 枚道种。资源、建筑、时代和远征会重置，人物装备等收藏保留。`,
      confirmText: '重启',
      cancelText: '取消',
      success(res) {
        if (!res.confirm) return
        const result = core.rebootUniverse(game.state)
        if (!result) {
          toast('尚未达到轮回条件')
          return
        }
        game.tab = 'build'
        game.scrollY = 0
        playRewardSound()
        burstConfetti(game.width / 2, game.height * 0.32, 34, ['#facc15', '#38bdf8', '#f8fafc'])
        toast(`获得 ${core.fmt(result.gain)} 道种`)
        save()
      }
    })
  } else if (action === 'startExpedition') {
    act(() => core.startExpedition(game.state, data), '军队出征')
  } else if (action === 'claimEvent') {
    const result = core.claimEvent(game.state)
    if (result) playRewardSound()
    toast(result ? '事件奖励已领取' : '暂无可领取事件')
    save()
  } else if (action === 'toggleGoalCombos') {
    game.goalCombosOpen = !game.goalCombosOpen
    requestDraw()
  } else if (action === 'toggleGoalAchievements') {
    game.goalAchievementsOpen = !game.goalAchievementsOpen
    requestDraw()
  } else if (action === 'toggleGoalDaily') {
    game.goalDailyOpen = !game.goalDailyOpen
    requestDraw()
  } else if (action === 'toggleBeastUnknown') {
    game.beastUnknownOpen = !game.beastUnknownOpen
    requestDraw()
  } else if (action === 'claimAchievement') {
    if (core.claimAchievement(game.state, data)) {
      playRewardSound()
      toast('成就奖励已领取')
      save()
    } else {
      toast('资源不足或条件未满足')
    }
  } else if (action === 'claimDailyTask') {
    const result = core.claimDailyTask(game.state, data)
    if (result) {
      playRewardSound()
      toast(`任务完成 ${result.rewardText}`)
      save()
    } else {
      toast('任务还未完成')
    }
  } else if (action === 'claimJourneyStory') {
    const result = core.claimJourneyStory(game.state)
    if (result) {
      playRewardSound()
      toast(`第${result.story.no}回完成 ${result.rewardText}`)
      save()
    } else {
      toast('先集齐本回关键人物卡')
    }
  } else if (action === 'showThreeKingdomsStoryDetail') {
    showThreeKingdomsStoryDetail()
  } else if (action === 'claimThreeKingdomsStory') {
    const result = core.claimThreeKingdomsStory(game.state)
    if (result) {
      playRewardSound()
      toast(`三国第${result.story.no}组完成 ${result.rewardText}`)
      save()
    } else {
      toast('先集齐本组三国人物卡')
    }
  } else if (action === 'showWaterMarginStoryDetail') {
    showWaterMarginStoryDetail()
  } else if (action === 'claimWaterMarginStory') {
    const result = core.claimWaterMarginStory(game.state)
    if (result) {
      playRewardSound()
      toast(`水浒第${result.story.no}组完成 ${result.rewardText}`)
      save()
    } else {
      toast('先集齐本组梁山人物卡')
    }
  } else if (action === 'showRedChamberStoryDetail') {
    showRedChamberStoryDetail()
  } else if (action === 'claimRedChamberStory') {
    const result = core.claimRedChamberStory(game.state)
    if (result) {
      playRewardSound()
      toast(`红楼第${result.story.no}组完成 ${result.rewardText}`)
      save()
    } else {
      toast('先集齐本组红楼人物卡')
    }
  } else if (action === 'claimMainChapter') {
    const result = core.claimMainChapter(game.state, data)
    if (result) {
      playRewardSound()
      toast(`章节完成 ${result.rewardText}`)
      save()
    } else {
      toast('主线目标还未完成')
    }
  } else if (action === 'checkIn') {
    const result = core.claimCheckIn(game.state)
    if (result) playRewardSound()
    toast(result ? `签到成功 ${result.rewardText}` : '今天已经签到')
    save()
  } else if (action === 'refreshRank') {
    syncRank(true)
    loadRank()
  } else if (action === 'guide') {
    game.guideOpen = true
  } else if (action === 'closeGuide') {
    game.guideOpen = false
    wx.setStorageSync(GUIDE_KEY, true)
  } else if (action === 'scrollbar' && point && game.scrollbar) {
    const ratio = Math.max(0, Math.min(1, (point.y - game.scrollbar.y - game.scrollbar.thumbH / 2) / Math.max(1, game.scrollbar.h - game.scrollbar.thumbH)))
    game.scrollY = game.maxScrollY * ratio
  }
  draw()
}

wx.onTouchStart((e) => {
  const t = e.touches[0]
  game.momentumToken += 1
  game.momentumFramePending = false
  game.touch = {
    x: t.clientX,
    y: t.clientY,
    startY: t.clientY,
    lastY: t.clientY,
    lastAt: Date.now(),
    velocity: 0,
    scrollY: game.scrollY,
    resourceScrollX: game.resourceScrollX,
    tabScrollX: game.tabScrollX,
    canDragResources: !!(game.resourceBar && t.clientY >= game.resourceBar.y - 8 && t.clientY <= game.resourceBar.y + game.resourceBar.h + 8),
    canDragTabs: !!(game.tabBar && t.clientY >= game.tabBar.y - 8 && t.clientY <= game.tabBar.y + game.tabBar.h + 8),
    draggingScrollbar: !!(game.scrollbar && t.clientX >= game.scrollbar.x && t.clientX <= game.scrollbar.x + game.scrollbar.w && t.clientY >= game.scrollbar.y && t.clientY <= game.scrollbar.y + game.scrollbar.h),
    canScroll: t.clientY >= game.scrollTopY && t.clientY <= game.scrollBottomY,
    moved: false
  }
})

wx.onTouchMove((e) => {
  if (!game.touch) return
  if (game.guideOpen) return
  const t = e.touches[0]
  if (game.touch.draggingScrollbar && game.scrollbar) {
    const ratio = Math.max(0, Math.min(1, (t.clientY - game.scrollbar.y - game.scrollbar.thumbH / 2) / Math.max(1, game.scrollbar.h - game.scrollbar.thumbH)))
    game.scrollY = game.maxScrollY * ratio
    game.touch.moved = true
    requestDraw()
    return
  }
  if (game.touch.canDragResources) {
    const dx = t.clientX - game.touch.x
    if (Math.abs(dx) > 6) game.touch.moved = true
    game.resourceScrollX = Math.max(0, Math.min(game.maxResourceScrollX, game.touch.resourceScrollX - dx))
    requestDraw()
    return
  }
  if (game.touch.canDragTabs) {
    const dx = t.clientX - game.touch.x
    if (Math.abs(dx) > 6) game.touch.moved = true
    game.tabScrollX = Math.max(0, Math.min(game.maxTabScrollX, game.touch.tabScrollX - dx))
    requestDraw()
    return
  }
  if (!game.touch.canScroll) return
  const dy = t.clientY - game.touch.startY
  const now = Date.now()
  const frameDy = t.clientY - game.touch.lastY
  const dt = Math.max(16, now - game.touch.lastAt)
  game.touch.velocity = frameDy / dt * 16
  game.touch.lastY = t.clientY
  game.touch.lastAt = now
  if (Math.abs(dy) > 6) game.touch.moved = true
  game.scrollY = Math.max(0, Math.min(game.maxScrollY, game.touch.scrollY - dy))
  requestDraw()
})

wx.onTouchEnd((e) => {
  if (!game.touch) return
  const changed = e.changedTouches[0] || game.touch
  const x = changed.clientX
  const y = changed.clientY
  const moved = game.touch.moved
  const velocity = game.touch.velocity
  const canScroll = game.touch.canScroll
  const draggingScrollbar = game.touch.draggingScrollbar
  game.touch = null
  if (moved) {
    if (canScroll && !draggingScrollbar) startMomentum(velocity)
    return
  }
  const regions = game.packReveal
    ? game.hitRegions.filter((r) => r.action === 'closePackReveal')
    : (game.detailOverlay
      ? game.hitRegions.filter((r) => r.action === 'closeDetailOverlay')
      : (game.guideOpen
        ? game.hitRegions.filter((r) => r.action === 'closeGuide')
        : game.hitRegions))
  const hit = regions.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
  if (hit) handleAction(hit.action, hit.data, { x, y })
})

const offline = core.applyOffline(game.state)
if (offline && Object.keys(offline.gained).length) {
  toast(`离线 ${offline.minutes} 分钟`)
}

if (typeof wx.onWindowResize === 'function') {
  wx.onWindowResize(() => {
    game.canvasReady = false
    setupCanvas(true)
    draw()
  })
}

if (typeof wx.onHide === 'function') wx.onHide(flushSave)
if (typeof wx.onUnload === 'function') wx.onUnload(flushSave)

syncRank(true)

setInterval(() => {
  const tickResult = core.tick(game.state, TICK_MS / 1000)
  if (tickResult && tickResult.expeditionResult) handleExpeditionResult(tickResult.expeditionResult)
  save(true)
  syncRank(false)
  draw()
}, TICK_MS)

draw()
