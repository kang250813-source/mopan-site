const RES = [
  { key: 'food', name: '食物', ico: '🌾', era: 0 },
  { key: 'goods', name: '物资', ico: '📦', era: 0 },
  { key: 'gold', name: '金币', ico: '💰', era: 0 },
  { key: 'qi', name: '灵气', ico: '✨', era: 3 },
  { key: 'tech', name: '科技', ico: '🔬', era: 4 },
  { key: 'star', name: '星能', ico: '🌌', era: 5 },
  { key: 'gene', name: '基因点', ico: '🧬', era: 6 },
  { key: 'time', name: '时序', ico: '⏳', era: 7 },
  { key: 'dark', name: '暗能', ico: '🕳️', era: 8 },
  { key: 'mind', name: '意识', ico: '🧠', era: 9 },
  { key: 'origin', name: '源质', ico: '🌱', era: 10 },
  { key: 'dao', name: '道果', ico: '♾️', era: 11 }
]

const ERAS = [
  { id: 0, name: '原始文明', em: '🛖', tiers: ['村庄', '小镇', '城市', '王国', '帝国'], need: 500 },
  { id: 1, name: '十二生肖时代', em: '🐉', tiers: ['生肖觉醒', '氏族', '部落联盟', '生肖王朝'], need: 5e4 },
  { id: 2, name: '神兽时代', em: '🦅', tiers: ['神兽现世', '驯兽', '神兽军团', '御兽天下'], need: 5e6 },
  { id: 3, name: '修仙时代', em: '🗡', tiers: ['灵气复苏', '结丹', '元婴', '化神', '飞升'], need: 2e8 },
  { id: 4, name: 'AI科技时代', em: '🤖', tiers: ['蒸汽', '工业', '信息', '人工智能'], need: 8e9 },
  { id: 5, name: '星际文明时代', em: '🚀', tiers: ['近地轨道', '星球殖民', '戴森球', '星海帝国'], need: 3e11 },
  { id: 6, name: '基因进化时代', em: '🧬', tiers: ['基因解码', '血脉重写', '物种档案', '进化王庭'], need: 2e13 },
  { id: 7, name: '时间文明时代', em: '⏳', tiers: ['时间种子', '时间线分支', '逆因果工程', '时序主宰'], need: 1e15 },
  { id: 8, name: '多元宇宙时代', em: '🕳️', tiers: ['暗物质开采', '分支宇宙', '多元远征', '虚空网络'], need: 6e16 },
  { id: 9, name: '意识上传时代', em: '🧠', tiers: ['意识上传', '灵网节点', '数字金丹', '合道飞升'], need: 4e18 },
  { id: 10, name: '造物主时代', em: '🌱', tiers: ['源质凝结', '法则编织', '宇宙重启', '造物主'], need: 3e20 },
  { id: 11, name: '道果循环时代', em: '♾️', tiers: ['道种', '赛季法则', '无限循环', '道果圆满'], need: 2e22 }
]

const BUILDINGS = [
  { id: 'farm', era: 0, ico: '🌾', name: '农田', desc: '产出食物', res: 'food', cost: 15, prod: 0.5, growth: 1.15 },
  { id: 'mine', era: 0, ico: '🔨', name: '矿场', desc: '产出物资', res: 'goods', cost: 50, prod: 0.4, growth: 1.16 },
  { id: 'market', era: 0, ico: '🏪', name: '集市', desc: '产出金币', res: 'gold', cost: 120, prod: 0.3, growth: 1.17 },
  { id: 'barrack', era: 0, ico: '🗡', name: '兵营', desc: '金币×军事加成', res: 'gold', cost: 600, prod: 1.2, growth: 1.2 },
  { id: 'shrine', era: 1, ico: '🏛', name: '生肖神殿', desc: '产出大量金币', res: 'gold', cost: 8000, prod: 8, growth: 1.18 },
  { id: 'totem', era: 1, ico: '🗿', name: '图腾柱', desc: '产出物资', res: 'goods', cost: 6000, prod: 10, growth: 1.18 },
  { id: 'den', era: 2, ico: '🐲', name: '神兽巢穴', desc: '产出金币', res: 'gold', cost: 5e5, prod: 120, growth: 1.19 },
  { id: 'altar', era: 2, ico: '🔮', name: '驯兽祭坛', desc: '产出物资', res: 'goods', cost: 4e5, prod: 140, growth: 1.19 },
  { id: 'vein', era: 3, ico: '✨', name: '聚灵阵', desc: '产出灵气', res: 'qi', cost: 2e6, prod: 5, growth: 1.2 },
  { id: 'sect', era: 3, ico: '🏯', name: '修仙宗门', desc: '产出金币+灵气', res: 'gold', cost: 1e7, prod: 2000, growth: 1.21 },
  { id: 'lab', era: 4, ico: '🔬', name: '研究所', desc: '产出科技', res: 'tech', cost: 1e8, prod: 500, growth: 1.2 },
  { id: 'factory', era: 4, ico: '🏭', name: '自动工厂', desc: '产出物资+科技', res: 'goods', cost: 5e8, prod: 5e4, growth: 1.22 },
  { id: 'station', era: 5, ico: '🛰️', name: '空间站', desc: '产出星能', res: 'star', cost: 1e10, prod: 2500, growth: 1.22 },
  { id: 'dyson', era: 5, ico: '🌟', name: '戴森球', desc: '产出海量星能', res: 'star', cost: 1e12, prod: 2e4, growth: 1.25 },
  { id: 'gene_lab', era: 6, ico: '🧬', name: '基因实验室', desc: '产出基因点', res: 'gene', cost: 5e13, prod: 5000, growth: 1.22 },
  { id: 'archive', era: 6, ico: '📚', name: '物种档案馆', desc: '产出基因点', res: 'gene', cost: 2e14, prod: 2e4, growth: 1.23 },
  { id: 'chronicle', era: 7, ico: '⏳', name: '时间方尖碑', desc: '产出时序', res: 'time', cost: 5e16, prod: 2e5, growth: 1.22 },
  { id: 'darkwell', era: 8, ico: '🕳️', name: '暗能井', desc: '产出暗能', res: 'dark', cost: 5e19, prod: 1e6, growth: 1.23 },
  { id: 'mindcloud', era: 9, ico: '🧠', name: '意识云', desc: '产出意识', res: 'mind', cost: 5e22, prod: 5e6, growth: 1.23 },
  { id: 'originforge', era: 10, ico: '🌱', name: '源质熔炉', desc: '产出源质', res: 'origin', cost: 5e25, prod: 2e7, growth: 1.24 },
  { id: 'daotree', era: 11, ico: '♾️', name: '道果树', desc: '产出道果', res: 'dao', cost: 5e28, prod: 8e7, growth: 1.25 }
]

const BUILD_COSTS = {
  farm: { gold: 1 },
  mine: { gold: 1 },
  market: { food: 0.65, goods: 0.45 },
  barrack: { food: 0.9, goods: 0.75 },
  shrine: { gold: 0.85, goods: 0.45 },
  totem: { gold: 0.35, goods: 1 },
  den: { gold: 0.9, food: 0.45, goods: 0.35 },
  altar: { gold: 0.3, goods: 1.1 },
  vein: { gold: 0.8, goods: 0.7 },
  sect: { gold: 0.95, food: 0.4, goods: 0.55 },
  lab: { gold: 0.8, goods: 0.7 },
  factory: { gold: 0.35, goods: 1.2, tech: 0.08 },
  station: { gold: 0.75, goods: 0.7, tech: 0.2 },
  dyson: { gold: 0.55, goods: 1, tech: 0.35, star: 0.08 },
  gene_lab: { gold: 0.55, goods: 0.8, tech: 0.4, star: 0.18 },
  archive: { gold: 0.4, goods: 0.7, tech: 0.35, star: 0.28 },
  chronicle: { gold: 0.4, star: 0.55, gene: 0.35 },
  darkwell: { gold: 0.35, star: 0.6, gene: 0.25, time: 0.3 },
  mindcloud: { tech: 0.55, star: 0.35, gene: 0.25, dark: 0.3 },
  originforge: { star: 0.45, time: 0.25, dark: 0.25, mind: 0.35 },
  daotree: { origin: 0.6, mind: 0.25, dark: 0.2 }
}

const ZODIAC = [
  { id: 'rat', ico: '🐀', name: '鼠族', desc: '资源产量 +20%', mult: { all: 0.2 } },
  { id: 'ox', ico: '🐂', name: '牛族', desc: '建筑更便宜 -8%', costCut: 0.08 },
  { id: 'tiger', ico: '🐅', name: '虎族', desc: '金币产量 +35%', mult: { gold: 0.35 } },
  { id: 'rabbit', ico: '🐇', name: '兔族', desc: '点击收益 +50%', tap: 0.5 },
  { id: 'dragon', ico: '🐉', name: '龙族', desc: '全属性 +15%', mult: { all: 0.15 }, tap: 0.15, costCut: 0.04 },
  { id: 'snake', ico: '🐍', name: '蛇族', desc: '灵气产量 +40%', mult: { qi: 0.4 } },
  { id: 'horse', ico: '🐎', name: '马族', desc: '物资产量 +35%', mult: { goods: 0.35 } },
  { id: 'goat', ico: '🐐', name: '羊族', desc: '食物产量 +40%', mult: { food: 0.4 } },
  { id: 'monkey', ico: '🐒', name: '猴族', desc: '科技产量 +35%', mult: { tech: 0.35 } },
  { id: 'rooster', ico: '🐓', name: '鸡族', desc: '离线收益 +50%', offline: 0.5 },
  { id: 'dog', ico: '🐕', name: '狗族', desc: '全产量 +12%', mult: { all: 0.12 } },
  { id: 'pig', ico: '🐖', name: '猪族', desc: '金币 +25% 食物 +25%', mult: { gold: 0.25, food: 0.25 } }
]

const BEASTS = [
  { id: 'azure', ico: '🐉', name: '青龙', mult: 0.08 },
  { id: 'white', ico: '🐯', name: '白虎', mult: 0.08 },
  { id: 'vermil', ico: '🦅', name: '朱雀', mult: 0.08 },
  { id: 'black', ico: '🐢', name: '玄武', mult: 0.08 },
  { id: 'qilin', ico: '🦌', name: '麒麟', mult: 0.12 },
  { id: 'phoenix', ico: '🔥', name: '凤凰', mult: 0.12 },
  { id: 'yinglong', ico: '🐲', name: '应龙', mult: 0.15 },
  { id: 'ninetail', ico: '🦊', name: '九尾狐', mult: 0.1 },
  { id: 'kunpeng', ico: '🐋', name: '鲲鹏', mult: 0.15 },
  { id: 'taotie', ico: '👹', name: '饕餮', mult: 0.2 }
]

const BEAST_RANKS = [
  { id: 'S', name: '红', rate: 0.6 },
  { id: 'SS', name: '银', rate: 0.27 },
  { id: 'SSS', name: '金', rate: 0.1 },
  { id: 'SP', name: '七彩', rate: 0.03 }
]

const CIV_CARDS = [
  { id: 'liubei', era: 0, ico: '🟫', book: '三国演义', name: '刘备', rar: '铜卡', desc: '金币产量 +5%/级', mult: { gold: 0.05 } },
  { id: 'zhangfei', era: 0, ico: '🟫', book: '三国演义', name: '张飞', rar: '铜卡', desc: '远征战力 +7%/级', army: 0.07 },
  { id: 'zhaoyun', era: 0, ico: '⬜', book: '三国演义', name: '赵云', rar: '银卡', desc: '远征战力 +10%/级', army: 0.1 },
  { id: 'caocao', era: 0, ico: '🟨', book: '三国演义', name: '曹操', rar: '金卡', desc: '金币产量 +16%/级', mult: { gold: 0.16 } },
  { id: 'guanyu', era: 0, ico: '🌟', book: '三国演义', name: '武圣关羽', rar: '特别卡', desc: '远征战力 +28%/级，金币 +12%/级', army: 0.28, mult: { gold: 0.12 } },
  { id: 'kongming', era: 0, ico: '🌟', book: '三国演义', name: '卧龙诸葛亮', rar: '特别卡', desc: '全产量 +10%/级，科技 +20%/级', mult: { all: 0.1, tech: 0.2 } },
  { id: 'songjiang', era: 0, ico: '🟫', book: '水浒传', name: '宋江', rar: '铜卡', desc: '金币产量 +5%/级', mult: { gold: 0.05 } },
  { id: 'linchong', era: 0, ico: '⬜', book: '水浒传', name: '林冲', rar: '银卡', desc: '远征战力 +10%/级', army: 0.1 },
  { id: 'wusong', era: 0, ico: '🟨', book: '水浒传', name: '武松', rar: '金卡', desc: '点击收益 +18%/级', tap: 0.18 },
  { id: 'luzhishen', era: 0, ico: '🟨', book: '水浒传', name: '鲁智深', rar: '金卡', desc: '食物 +12%/级，远征战力 +12%/级', mult: { food: 0.12 }, army: 0.12 },
  { id: 'likui', era: 0, ico: '🟫', book: '水浒传', name: '李逵', rar: '铜卡', desc: '物资产量 +5%/级', mult: { goods: 0.05 } },
  { id: 'wuyong', era: 0, ico: '⬜', book: '水浒传', name: '吴用', rar: '银卡', desc: '建筑费用 -1%/级', costCut: 0.01 },
  { id: 'tangseng', era: 0, ico: '🟫', book: '西游记', name: '唐僧', rar: '铜卡', desc: '点击收益 +8%/级', tap: 0.08 },
  { id: 'bajie', era: 0, ico: '🟫', book: '西游记', name: '猪八戒', rar: '铜卡', desc: '食物产量 +6%/级', mult: { food: 0.06 } },
  { id: 'shaseng', era: 0, ico: '⬜', book: '西游记', name: '沙僧', rar: '银卡', desc: '物资产量 +9%/级', mult: { goods: 0.09 } },
  { id: 'nezha', era: 0, ico: '🟨', book: '西游记', name: '哪吒', rar: '金卡', desc: '远征战力 +18%/级', army: 0.18 },
  { id: 'sunwukong', era: 0, ico: '🌟', book: '西游记', name: '齐天大圣', rar: '特别卡', desc: '点击收益 +35%/级，远征战力 +25%/级', tap: 0.35, army: 0.25 },
  { id: 'guanyin', era: 0, ico: '🌟', book: '西游记', name: '观音菩萨', rar: '特别卡', desc: '全产量 +12%/级，灵气 +18%/级', mult: { all: 0.12, qi: 0.18 } },
  { id: 'jiabaoyu', era: 0, ico: '🟫', book: '红楼梦', name: '贾宝玉', rar: '铜卡', desc: '点击收益 +8%/级', tap: 0.08 },
  { id: 'xuebaochai', era: 0, ico: '⬜', book: '红楼梦', name: '薛宝钗', rar: '银卡', desc: '金币 +8%/级，物资 +8%/级', mult: { gold: 0.08, goods: 0.08 } },
  { id: 'wangxifeng', era: 0, ico: '🟨', book: '红楼梦', name: '王熙凤', rar: '金卡', desc: '建筑费用 -2%/级，金币 +8%/级', costCut: 0.02, mult: { gold: 0.08 } },
  { id: 'lindaiyu', era: 0, ico: '🌟', book: '红楼梦', name: '林黛玉', rar: '特别卡', desc: '灵气 +22%/级，全产量 +8%/级', mult: { qi: 0.22, all: 0.08 } },
  { id: 'shixiangyun', era: 0, ico: '⬜', book: '红楼梦', name: '史湘云', rar: '银卡', desc: '食物 +9%/级，点击收益 +9%/级', mult: { food: 0.09 }, tap: 0.09 },
  { id: 'tan_chun', era: 0, ico: '🟫', book: '红楼梦', name: '探春', rar: '铜卡', desc: '物资产量 +5%/级', mult: { goods: 0.05 } },
  { id: 'sunquan', era: 0, ico: '⬜', book: '三国演义', name: '孙权', rar: '银卡', desc: '金币 +8%/级，物资 +7%/级', mult: { gold: 0.08, goods: 0.07 } },
  { id: 'zhouyu', era: 0, ico: '🟨', book: '三国演义', name: '周瑜', rar: '金卡', desc: '科技 +14%/级，远征战力 +10%/级', mult: { tech: 0.14 }, army: 0.1 },
  { id: 'lvbu', era: 0, ico: '🌟', book: '三国演义', name: '吕布', rar: '特别卡', desc: '远征战力 +36%/级', army: 0.36 },
  { id: 'simayi', era: 0, ico: '🟨', book: '三国演义', name: '司马懿', rar: '金卡', desc: '科技 +16%/级，金币 +8%/级', mult: { tech: 0.16, gold: 0.08 } },
  { id: 'huarong', era: 0, ico: '⬜', book: '水浒传', name: '花荣', rar: '银卡', desc: '远征战力 +11%/级', army: 0.11 },
  { id: 'yangzhi', era: 0, ico: '🟫', book: '水浒传', name: '杨志', rar: '铜卡', desc: '物资产量 +5%/级', mult: { goods: 0.05 } },
  { id: 'yanshun', era: 0, ico: '🟨', book: '水浒传', name: '燕青', rar: '金卡', desc: '点击收益 +16%/级，金币 +8%/级', tap: 0.16, mult: { gold: 0.08 } },
  { id: 'lujunyi', era: 0, ico: '🌟', book: '水浒传', name: '卢俊义', rar: '特别卡', desc: '远征战力 +30%/级，全产量 +8%/级', army: 0.3, mult: { all: 0.08 } },
  { id: 'baigujing', era: 0, ico: '⬜', book: '西游记', name: '白骨精', rar: '银卡', desc: '灵气 +10%/级', mult: { qi: 0.1 } },
  { id: 'niumo', era: 0, ico: '🟨', book: '西游记', name: '牛魔王', rar: '金卡', desc: '远征战力 +20%/级', army: 0.2 },
  { id: 'honghaier', era: 0, ico: '🟨', book: '西游记', name: '红孩儿', rar: '金卡', desc: '点击收益 +16%/级，灵气 +10%/级', tap: 0.16, mult: { qi: 0.1 } },
  { id: 'erlang', era: 0, ico: '🌟', book: '西游记', name: '二郎神', rar: '特别卡', desc: '远征战力 +30%/级，科技 +12%/级', army: 0.3, mult: { tech: 0.12 } },
  { id: 'jia_mu', era: 0, ico: '⬜', book: '红楼梦', name: '贾母', rar: '银卡', desc: '金币 +9%/级', mult: { gold: 0.09 } },
  { id: 'miaoyu', era: 0, ico: '🟨', book: '红楼梦', name: '妙玉', rar: '金卡', desc: '灵气 +18%/级', mult: { qi: 0.18 } },
  { id: 'qingwen', era: 0, ico: '🟫', book: '红楼梦', name: '晴雯', rar: '铜卡', desc: '点击收益 +7%/级', tap: 0.07 },
  { id: 'yuanchun', era: 0, ico: '🌟', book: '红楼梦', name: '元春', rar: '特别卡', desc: '金币 +18%/级，全产量 +8%/级', mult: { gold: 0.18, all: 0.08 } },
  { id: 'machao', era: 0, ico: '🟨', book: '三国演义', name: '马超', rar: '金卡', desc: '远征战力 +19%/级', army: 0.19 },
  { id: 'huangzhong', era: 0, ico: '⬜', book: '三国演义', name: '黄忠', rar: '银卡', desc: '远征战力 +10%/级，金币 +5%/级', army: 0.1, mult: { gold: 0.05 } },
  { id: 'diaochan', era: 0, ico: '⬜', book: '三国演义', name: '貂蝉', rar: '银卡', desc: '点击收益 +12%/级', tap: 0.12 },
  { id: 'pangtong', era: 0, ico: '🟨', book: '三国演义', name: '庞统', rar: '金卡', desc: '科技 +18%/级', mult: { tech: 0.18 } },
  { id: 'liubei_emperor', era: 0, ico: '🌟', book: '三国演义', name: '昭烈帝刘备', rar: '特别卡', desc: '全产量 +9%/级，金币 +16%/级', mult: { all: 0.09, gold: 0.16 } },
  { id: 'gongsunsheng', era: 0, ico: '🟨', book: '水浒传', name: '公孙胜', rar: '金卡', desc: '灵气 +18%/级', mult: { qi: 0.18 } },
  { id: 'chaogai', era: 0, ico: '⬜', book: '水浒传', name: '晁盖', rar: '银卡', desc: '金币 +9%/级，远征战力 +7%/级', mult: { gold: 0.09 }, army: 0.07 },
  { id: 'shijin', era: 0, ico: '🟫', book: '水浒传', name: '史进', rar: '铜卡', desc: '远征战力 +7%/级', army: 0.07 },
  { id: 'daizong', era: 0, ico: '⬜', book: '水浒传', name: '戴宗', rar: '银卡', desc: '点击收益 +12%/级', tap: 0.12 },
  { id: 'ruanxiaoer', era: 0, ico: '🟫', book: '水浒传', name: '阮小二', rar: '铜卡', desc: '食物 +6%/级', mult: { food: 0.06 } },
  { id: 'zixia', era: 0, ico: '⬜', book: '西游记', name: '紫霞仙子', rar: '银卡', desc: '灵气 +12%/级，点击收益 +8%/级', mult: { qi: 0.12 }, tap: 0.08 },
  { id: 'taishang', era: 0, ico: '🌟', book: '西游记', name: '太上老君', rar: '特别卡', desc: '科技 +18%/级，灵气 +24%/级', mult: { tech: 0.18, qi: 0.24 } },
  { id: 'jade_emperor', era: 0, ico: '🌟', book: '西游记', name: '玉皇大帝', rar: '特别卡', desc: '全产量 +12%/级，金币 +12%/级', mult: { all: 0.12, gold: 0.12 } },
  { id: 'queen_west', era: 0, ico: '🟨', book: '西游记', name: '西王母', rar: '金卡', desc: '灵气 +16%/级，全产量 +5%/级', mult: { qi: 0.16, all: 0.05 } },
  { id: 'jingshen', era: 0, ico: '🟫', book: '西游记', name: '金角大王', rar: '铜卡', desc: '金币 +6%/级', mult: { gold: 0.06 } },
  { id: 'puti', era: 0, ico: '🌟', book: '西游记', name: '菩提祖师', rar: '特别卡', desc: '点击收益 +20%/级，灵气 +20%/级', tap: 0.2, mult: { qi: 0.2 } },
  { id: 'dragon_king', era: 0, ico: '⬜', book: '西游记', name: '东海龙王', rar: '银卡', desc: '物资 +10%/级，金币 +8%/级', mult: { goods: 0.1, gold: 0.08 } },
  { id: 'yanluo', era: 0, ico: '⬜', book: '西游记', name: '阎罗王', rar: '银卡', desc: '暗能 +8%/级，金币 +8%/级', mult: { dark: 0.08, gold: 0.08 } },
  { id: 'bailongma', era: 0, ico: '🟨', book: '西游记', name: '白龙马', rar: '金卡', desc: '远征战力 +16%/级，食物 +10%/级', army: 0.16, mult: { food: 0.1 } },
  { id: 'heixiong', era: 0, ico: '⬜', book: '西游记', name: '黑熊精', rar: '银卡', desc: '远征战力 +10%/级，物资 +8%/级', army: 0.1, mult: { goods: 0.08 } },
  { id: 'huangfeng', era: 0, ico: '🟨', book: '西游记', name: '黄风怪', rar: '金卡', desc: '远征战力 +15%/级', army: 0.15 },
  { id: 'zhenyuan', era: 0, ico: '🌟', book: '西游记', name: '镇元大仙', rar: '特别卡', desc: '全产量 +10%/级，灵气 +16%/级', mult: { all: 0.1, qi: 0.16 } },
  { id: 'yinjiao', era: 0, ico: '⬜', book: '西游记', name: '银角大王', rar: '银卡', desc: '金币 +9%/级', mult: { gold: 0.09 } },
  { id: 'xichun', era: 0, ico: '🟫', book: '红楼梦', name: '惜春', rar: '铜卡', desc: '灵气 +6%/级', mult: { qi: 0.06 } },
  { id: 'yingchun', era: 0, ico: '🟫', book: '红楼梦', name: '迎春', rar: '铜卡', desc: '食物 +6%/级', mult: { food: 0.06 } },
  { id: 'xuepan', era: 0, ico: '⬜', book: '红楼梦', name: '薛蟠', rar: '银卡', desc: '金币 +10%/级', mult: { gold: 0.1 } },
  { id: 'liwan', era: 0, ico: '⬜', book: '红楼梦', name: '李纨', rar: '银卡', desc: '食物 +9%/级，金币 +6%/级', mult: { food: 0.09, gold: 0.06 } },
  { id: 'qin_keqing', era: 0, ico: '🟨', book: '红楼梦', name: '秦可卿', rar: '金卡', desc: '灵气 +16%/级，点击收益 +12%/级', mult: { qi: 0.16 }, tap: 0.12 }
]

const WATER_MARGIN_TIANGANG_IDS = [
  'songjiang', 'lujunyi', 'wuyong', 'gongsunsheng', 'guansheng', 'linchong',
  'qinming', 'huyanzhuo', 'huarong', 'chaijin', 'liying', 'zhutong',
  'luzhishen', 'wusong', 'dongping', 'zhangqing_yu', 'yangzhi', 'xuning',
  'suochao', 'daizong', 'liutang', 'likui', 'shijin', 'muhong',
  'leiheng', 'lijun', 'ruanxiaoer', 'zhangheng', 'ruanxiaowu', 'zhangshun',
  'ruanxiaoqi', 'yangxiong', 'shixiu', 'xiezhen', 'xiebao', 'yanshun'
]

const WATER_MARGIN_EFFECTS = {
  army: (v) => ({ desc: `远征战力 +${Math.round(v * 100)}%/级`, army: v }),
  gold: (v) => ({ desc: `金币产量 +${Math.round(v * 100)}%/级`, mult: { gold: v } }),
  goods: (v) => ({ desc: `物资产量 +${Math.round(v * 100)}%/级`, mult: { goods: v } }),
  food: (v) => ({ desc: `食物产量 +${Math.round(v * 100)}%/级`, mult: { food: v } }),
  tap: (v) => ({ desc: `点击收益 +${Math.round(v * 100)}%/级`, tap: v }),
  tech: (v) => ({ desc: `科技产量 +${Math.round(v * 100)}%/级`, mult: { tech: v } }),
  qi: (v) => ({ desc: `灵气产量 +${Math.round(v * 100)}%/级`, mult: { qi: v } }),
  cost: (v) => ({ desc: `建筑费用 -${Math.round(v * 100)}%/级`, costCut: v }),
  all: (v) => ({ desc: `全产量 +${Math.round(v * 100)}%/级`, mult: { all: v } })
}

function waterCard(id, name, rar, effect, value) {
  return {
    id,
    era: 0,
    ico: { '铜卡': '🟫', '银卡': '⬜', '金卡': '🟨', '特别卡': '🌟' }[rar],
    book: '水浒传',
    name,
    rar,
    ...WATER_MARGIN_EFFECTS[effect](value)
  }
}

const WATER_MARGIN_EXTRA_CARDS = [
  waterCard('guansheng', '关胜', '特别卡', 'army', 0.26),
  waterCard('qinming', '秦明', '金卡', 'army', 0.18),
  waterCard('huyanzhuo', '呼延灼', '金卡', 'army', 0.17),
  waterCard('chaijin', '柴进', '金卡', 'gold', 0.16),
  waterCard('liying', '李应', '金卡', 'goods', 0.15),
  waterCard('zhutong', '朱仝', '金卡', 'gold', 0.14),
  waterCard('dongping', '董平', '金卡', 'army', 0.18),
  waterCard('zhangqing_yu', '张清', '金卡', 'tap', 0.16),
  waterCard('xuning', '徐宁', '银卡', 'army', 0.11),
  waterCard('suochao', '索超', '银卡', 'army', 0.11),
  waterCard('liutang', '刘唐', '银卡', 'tap', 0.1),
  waterCard('muhong', '穆弘', '银卡', 'gold', 0.09),
  waterCard('leiheng', '雷横', '银卡', 'army', 0.1),
  waterCard('lijun', '李俊', '金卡', 'food', 0.14),
  waterCard('zhangheng', '张横', '银卡', 'food', 0.09),
  waterCard('ruanxiaowu', '阮小五', '银卡', 'food', 0.09),
  waterCard('zhangshun', '张顺', '金卡', 'tap', 0.15),
  waterCard('ruanxiaoqi', '阮小七', '银卡', 'food', 0.1),
  waterCard('yangxiong', '杨雄', '银卡', 'army', 0.1),
  waterCard('shixiu', '石秀', '金卡', 'army', 0.14),
  waterCard('xiezhen', '解珍', '银卡', 'army', 0.1),
  waterCard('xiebao', '解宝', '银卡', 'army', 0.1),
  waterCard('zhuwu', '朱武', '银卡', 'tech', 0.08),
  waterCard('huangxin', '黄信', '银卡', 'army', 0.09),
  waterCard('sunli', '孙立', '金卡', 'army', 0.13),
  waterCard('xuanzan', '宣赞', '银卡', 'gold', 0.08),
  waterCard('haosiwen', '郝思文', '银卡', 'army', 0.08),
  waterCard('hantao', '韩滔', '铜卡', 'army', 0.06),
  waterCard('pengqi', '彭玘', '铜卡', 'army', 0.06),
  waterCard('shantinggui', '单廷珪', '银卡', 'food', 0.08),
  waterCard('weidingguo', '魏定国', '银卡', 'gold', 0.08),
  waterCard('xiaorang', '萧让', '银卡', 'tech', 0.08),
  waterCard('peixuan', '裴宣', '银卡', 'cost', 0.01),
  waterCard('oupeng', '欧鹏', '铜卡', 'army', 0.06),
  waterCard('dengfei', '邓飞', '铜卡', 'food', 0.06),
  waterCard('yanshun_real', '燕顺', '铜卡', 'gold', 0.06),
  waterCard('yanglin', '杨林', '铜卡', 'goods', 0.06),
  waterCard('lingzhen', '凌振', '银卡', 'tech', 0.09),
  waterCard('jiangjing', '蒋敬', '银卡', 'gold', 0.08),
  waterCard('lvfang', '吕方', '铜卡', 'army', 0.06),
  waterCard('guosheng', '郭盛', '铜卡', 'army', 0.06),
  waterCard('andaoquan', '安道全', '金卡', 'qi', 0.13),
  waterCard('huangfuduan', '皇甫端', '银卡', 'food', 0.08),
  waterCard('wangying', '王英', '铜卡', 'tap', 0.06),
  waterCard('husanniang', '扈三娘', '金卡', 'army', 0.14),
  waterCard('baoxu', '鲍旭', '银卡', 'army', 0.09),
  waterCard('fanrui', '樊瑞', '金卡', 'qi', 0.14),
  waterCard('kongming_liangshan', '孔明', '铜卡', 'gold', 0.06),
  waterCard('kongliang', '孔亮', '铜卡', 'food', 0.06),
  waterCard('xiangchong', '项充', '银卡', 'army', 0.08),
  waterCard('ligun', '李衮', '银卡', 'army', 0.08),
  waterCard('jindajian', '金大坚', '银卡', 'goods', 0.08),
  waterCard('malin', '马麟', '铜卡', 'tap', 0.06),
  waterCard('tongwei', '童威', '铜卡', 'food', 0.06),
  waterCard('tongmeng', '童猛', '铜卡', 'food', 0.06),
  waterCard('mengkang', '孟康', '铜卡', 'goods', 0.06),
  waterCard('houjian', '侯健', '铜卡', 'goods', 0.06),
  waterCard('chenda', '陈达', '铜卡', 'army', 0.06),
  waterCard('yangchun', '杨春', '铜卡', 'army', 0.06),
  waterCard('zhengtian', '郑天寿', '铜卡', 'gold', 0.06),
  waterCard('taozongwang', '陶宗旺', '铜卡', 'food', 0.06),
  waterCard('songqing', '宋清', '铜卡', 'food', 0.06),
  waterCard('yuehe', '乐和', '银卡', 'tap', 0.08),
  waterCard('gongwang', '龚旺', '铜卡', 'army', 0.06),
  waterCard('dingdesun', '丁得孙', '铜卡', 'army', 0.06),
  waterCard('muchun', '穆春', '铜卡', 'gold', 0.06),
  waterCard('caozheng', '曹正', '铜卡', 'food', 0.06),
  waterCard('songwan', '宋万', '铜卡', 'army', 0.05),
  waterCard('duqian', '杜迁', '铜卡', 'goods', 0.05),
  waterCard('xueyong', '薛永', '铜卡', 'army', 0.06),
  waterCard('shien', '施恩', '铜卡', 'gold', 0.06),
  waterCard('zhoutong', '周通', '铜卡', 'army', 0.06),
  waterCard('lizhong', '李忠', '铜卡', 'tap', 0.06),
  waterCard('duxing', '杜兴', '铜卡', 'goods', 0.06),
  waterCard('tanglong', '汤隆', '银卡', 'goods', 0.08),
  waterCard('zouyuan', '邹渊', '铜卡', 'army', 0.06),
  waterCard('zourun', '邹润', '铜卡', 'army', 0.06),
  waterCard('zhugui', '朱贵', '铜卡', 'gold', 0.06),
  waterCard('zhufu', '朱富', '铜卡', 'food', 0.06),
  waterCard('caifu', '蔡福', '银卡', 'gold', 0.08),
  waterCard('caiqing', '蔡庆', '铜卡', 'gold', 0.06),
  waterCard('lili', '李立', '铜卡', 'gold', 0.06),
  waterCard('liyun', '李云', '铜卡', 'army', 0.06),
  waterCard('jiaoting', '焦挺', '铜卡', 'army', 0.06),
  waterCard('shiyong', '石勇', '铜卡', 'goods', 0.06),
  waterCard('sunxin', '孙新', '铜卡', 'food', 0.06),
  waterCard('gudasao', '顾大嫂', '银卡', 'food', 0.08),
  waterCard('zhangqing_caiyuan', '张青', '铜卡', 'food', 0.06),
  waterCard('sunerniang', '孙二娘', '银卡', 'tap', 0.08),
  waterCard('wangdingliu', '王定六', '铜卡', 'tap', 0.06),
  waterCard('yubaosi', '郁保四', '铜卡', 'goods', 0.06),
  waterCard('baisheng', '白胜', '铜卡', 'gold', 0.05),
  waterCard('shiqian', '时迁', '银卡', 'tap', 0.09),
  waterCard('duanjingzhu', '段景住', '铜卡', 'food', 0.05)
]

CIV_CARDS.push(...WATER_MARGIN_EXTRA_CARDS)

function novelCard(book, id, name, rar, effect, value) {
  return {
    id,
    era: 0,
    ico: { '铜卡': '🟫', '银卡': '⬜', '金卡': '🟨', '特别卡': '🌟' }[rar],
    book,
    name,
    rar,
    ...WATER_MARGIN_EFFECTS[effect](value)
  }
}

const THREE_KINGDOMS_EXTRA_CARDS = [
  novelCard('三国演义', 'dongzhuo', '董卓', '金卡', 'gold', 0.15),
  novelCard('三国演义', 'yuanshao', '袁绍', '金卡', 'gold', 0.14),
  novelCard('三国演义', 'yuanshu', '袁术', '银卡', 'gold', 0.08),
  novelCard('三国演义', 'xiahou_dun', '夏侯惇', '金卡', 'army', 0.17),
  novelCard('三国演义', 'xiahou_yuan', '夏侯渊', '银卡', 'army', 0.11),
  novelCard('三国演义', 'dianwei', '典韦', '金卡', 'army', 0.18),
  novelCard('三国演义', 'xuchu', '许褚', '金卡', 'army', 0.18),
  novelCard('三国演义', 'zhangliao', '张辽', '特别卡', 'army', 0.27),
  novelCard('三国演义', 'xuhuang', '徐晃', '银卡', 'army', 0.11),
  novelCard('三国演义', 'zhanghe', '张郃', '银卡', 'army', 0.11),
  novelCard('三国演义', 'xunyu', '荀彧', '金卡', 'tech', 0.16),
  novelCard('三国演义', 'guojia', '郭嘉', '特别卡', 'tech', 0.24),
  novelCard('三国演义', 'jiaxu', '贾诩', '金卡', 'cost', 0.02),
  novelCard('三国演义', 'luxun', '陆逊', '特别卡', 'tech', 0.24),
  novelCard('三国演义', 'taishici', '太史慈', '金卡', 'army', 0.17),
  novelCard('三国演义', 'ganning', '甘宁', '金卡', 'army', 0.17),
  novelCard('三国演义', 'lusu', '鲁肃', '银卡', 'goods', 0.09),
  novelCard('三国演义', 'huanggai', '黄盖', '银卡', 'army', 0.1),
  novelCard('三国演义', 'weiyan', '魏延', '金卡', 'army', 0.16),
  novelCard('三国演义', 'jiangwei', '姜维', '金卡', 'tech', 0.16),
  novelCard('三国演义', 'fazheng', '法正', '银卡', 'tech', 0.1),
  novelCard('三国演义', 'xushu', '徐庶', '银卡', 'tech', 0.1),
  novelCard('三国演义', 'huatuo', '华佗', '金卡', 'qi', 0.15),
  novelCard('三国演义', 'xiaoqiao', '小乔', '银卡', 'tap', 0.1)
]

CIV_CARDS.push(...THREE_KINGDOMS_EXTRA_CARDS)

const CARD_PACKS = [
  { id: 'classic', ico: '🎴', name: '名著人物包', desc: '四大名著基础人物包，适合日常收集。', cost: 3000, growth: 1.12, rates: { special: 0.02, gold: 0.12, silver: 0.3 } },
  { id: 'silver', ico: '⬜', name: '银卡以上包', desc: '更容易出现银卡和金卡。', cost: 12000, growth: 1.15, rates: { special: 0.03, gold: 0.2, silver: 0.5 } },
  { id: 'gold', ico: '🟨', name: '金卡精选包', desc: '金卡概率提升，适合冲关键人物。', cost: 65000, growth: 1.18, rates: { special: 0.06, gold: 0.42, silver: 0.36 } },
  { id: 'special', ico: '🌟', name: '特别卡传说包', desc: '特别卡概率大幅提升，价格也会涨得更快。', cost: 320000, growth: 1.24, rates: { special: 0.18, gold: 0.48, silver: 0.26 } },
  { id: 'taoyuan', ico: '🍑', name: '桃园结义包', desc: '三国剧情包，更容易抽到蜀汉与群雄人物。', cost: 22000, growth: 1.16, books: ['三国演义'], rates: { special: 0.05, gold: 0.24, silver: 0.45 } },
  { id: 'liangshan', ico: '🏔️', name: '梁山聚义包', desc: '水浒剧情包，更容易抽到梁山好汉。', cost: 22000, growth: 1.16, books: ['水浒传'], rates: { special: 0.05, gold: 0.24, silver: 0.45 } },
  { id: 'tiangang', ico: '⭐', name: '天罡星包', desc: '更容易抽到梁山三十六天罡。', cost: 48000, growth: 1.18, ids: WATER_MARGIN_TIANGANG_IDS, rates: { special: 0.07, gold: 0.34, silver: 0.42 } },
  { id: 'xitian', ico: '🪷', name: '西天取经包', desc: '西游剧情包，更容易抽到取经与天庭妖王人物。', cost: 26000, growth: 1.17, books: ['西游记'], rates: { special: 0.07, gold: 0.28, silver: 0.42 } },
  { id: 'honglou', ico: '🌸', name: '红楼梦境包', desc: '红楼剧情包，更容易抽到大观园人物。', cost: 22000, growth: 1.16, books: ['红楼梦'], rates: { special: 0.05, gold: 0.24, silver: 0.45 } }
]

const EQUIPMENTS = [
  { id: 'qinglong_blade', ico: '🗡', name: '青龙偃月刀', type: '武器', rar: '神器', desc: '远征战力 +18%/星，金币 +6%/星', army: 0.18, mult: { gold: 0.06 } },
  { id: 'snake_spear', ico: '⚔️', name: '丈八蛇矛', type: '武器', rar: '名器', desc: '远征战力 +14%/星', army: 0.14 },
  { id: 'fangtian_halberd', ico: '🔱', name: '方天画戟', type: '武器', rar: '神器', desc: '远征战力 +22%/星', army: 0.22 },
  { id: 'chitu', ico: '🐎', name: '赤兔马', type: '坐骑', rar: '神器', desc: '点击收益 +18%/星，远征战力 +10%/星', tap: 0.18, army: 0.1 },
  { id: 'kongming_fan', ico: '🪭', name: '诸葛羽扇', type: '法宝', rar: '神器', desc: '科技 +18%/星，全产量 +5%/星', mult: { tech: 0.18, all: 0.05 } },
  { id: 'golden_cudgel', ico: '🪄', name: '如意金箍棒', type: '武器', rar: '神器', desc: '点击收益 +24%/星，远征战力 +18%/星', tap: 0.24, army: 0.18 },
  { id: 'nine_tooth_rake', ico: '🔨', name: '九齿钉耙', type: '武器', rar: '名器', desc: '食物 +12%/星，远征战力 +8%/星', mult: { food: 0.12 }, army: 0.08 },
  { id: 'purple_bowl', ico: '🥣', name: '紫金钵', type: '法宝', rar: '良品', desc: '灵气 +10%/星', mult: { qi: 0.1 } },
  { id: 'seven_star_sword', ico: '🗡', name: '七星剑', type: '武器', rar: '名器', desc: '灵气 +12%/星，远征战力 +8%/星', mult: { qi: 0.12 }, army: 0.08 },
  { id: 'liangshan_flag', ico: '🚩', name: '梁山令旗', type: '书卷', rar: '良品', desc: '金币 +8%/星，远征战力 +6%/星', mult: { gold: 0.08 }, army: 0.06 },
  { id: 'psychic_jade', ico: '💎', name: '通灵宝玉', type: '法宝', rar: '神器', desc: '灵气 +20%/星，全产量 +6%/星', mult: { qi: 0.2, all: 0.06 } },
  { id: 'mirror', ico: '🪞', name: '风月宝鉴', type: '法宝', rar: '名器', desc: '点击收益 +14%/星，灵气 +10%/星', tap: 0.14, mult: { qi: 0.1 } },
  { id: 'cloth_armor', ico: '🛡', name: '布甲', type: '防具', rar: '凡品', desc: '远征战力 +4%/星', army: 0.04 },
  { id: 'travel_boots', ico: '🥾', name: '行者靴', type: '防具', rar: '凡品', desc: '点击收益 +5%/星', tap: 0.05 },
  { id: 'bamboo_scroll', ico: '📜', name: '竹简兵书', type: '书卷', rar: '凡品', desc: '科技 +5%/星', mult: { tech: 0.05 } },
  { id: 'brocade_robe', ico: '🥻', name: '锦绣披风', type: '防具', rar: '良品', desc: '金币 +8%/星', mult: { gold: 0.08 } },
  { id: 'green_sword', ico: '🗡', name: '青釭剑', type: '武器', rar: '名器', desc: '远征战力 +13%/星，金币 +5%/星', army: 0.13, mult: { gold: 0.05 } },
  { id: 'double_swords', ico: '⚔️', name: '雌雄双股剑', type: '武器', rar: '名器', desc: '全产量 +5%/星，远征战力 +8%/星', mult: { all: 0.05 }, army: 0.08 },
  { id: 'white_dragon_horse', ico: '🐴', name: '白龙马', type: '坐骑', rar: '名器', desc: '点击收益 +12%/星，食物 +8%/星', tap: 0.12, mult: { food: 0.08 } },
  { id: 'banana_fan', ico: '🍃', name: '芭蕉扇', type: '法宝', rar: '神器', desc: '灵气 +22%/星，远征战力 +10%/星', mult: { qi: 0.22 }, army: 0.1 },
  { id: 'purple_gourd', ico: '🏺', name: '紫金葫芦', type: '法宝', rar: '名器', desc: '灵气 +14%/星，点击收益 +8%/星', mult: { qi: 0.14 }, tap: 0.08 },
  { id: 'jade_bottle', ico: '🏺', name: '玉净瓶', type: '法宝', rar: '神器', desc: '全产量 +7%/星，灵气 +18%/星', mult: { all: 0.07, qi: 0.18 } },
  { id: 'tiger_tally', ico: '🎖', name: '虎符', type: '书卷', rar: '名器', desc: '远征战力 +15%/星', army: 0.15 },
  { id: 'heaven_book', ico: '📖', name: '天书三卷', type: '书卷', rar: '神器', desc: '科技 +22%/星，全产量 +6%/星', mult: { tech: 0.22, all: 0.06 } },
  { id: 'chain_armor', ico: '🛡', name: '锁子甲', type: '防具', rar: '良品', desc: '远征战力 +7%/星', army: 0.07 },
  { id: 'gold_armor', ico: '🛡', name: '黄金甲', type: '防具', rar: '名器', desc: '金币 +12%/星，远征战力 +8%/星', mult: { gold: 0.12 }, army: 0.08 },
  { id: 'pearl_crown', ico: '👑', name: '凤冠霞帔', type: '防具', rar: '名器', desc: '金币 +10%/星，点击收益 +10%/星', mult: { gold: 0.1 }, tap: 0.1 },
  { id: 'embroidered_pouch', ico: '👝', name: '香囊', type: '法宝', rar: '凡品', desc: '点击收益 +4%/星', tap: 0.04 },
  { id: 'wine_gourd', ico: '🍶', name: '酒葫芦', type: '法宝', rar: '良品', desc: '食物 +10%/星，点击收益 +6%/星', mult: { food: 0.1 }, tap: 0.06 },
  { id: 'iron_staff', ico: '🪄', name: '禅杖', type: '武器', rar: '良品', desc: '远征战力 +8%/星，灵气 +6%/星', army: 0.08, mult: { qi: 0.06 } },
  { id: 'account_book', ico: '📒', name: '荣府账册', type: '书卷', rar: '凡品', desc: '金币 +5%/星', mult: { gold: 0.05 } },
  { id: 'water_map', ico: '🗺️', name: '水泊地图', type: '书卷', rar: '良品', desc: '物资 +8%/星，远征战力 +5%/星', mult: { goods: 0.08 }, army: 0.05 }
]

const EQUIPMENT_BOXES = [
  { id: 'gear_basic', ico: '📦', name: '装备木箱', desc: '基础装备箱，容易出凡品和良品。', cost: 8000, growth: 1.13, rates: { divine: 0.01, named: 0.12, fine: 0.35 } },
  { id: 'gear_named', ico: '🧰', name: '名器宝箱', desc: '更容易获得名器装备。', cost: 48000, growth: 1.17, rates: { divine: 0.04, named: 0.36, fine: 0.42 } },
  { id: 'gear_divine', ico: '💠', name: '神器匣', desc: '神器概率提升，价格更高。', cost: 260000, growth: 1.23, rates: { divine: 0.16, named: 0.46, fine: 0.28 } }
]

const CARD_DETAILS = {
  liubei: { force: 65, wisdom: 78, lead: 84, charm: 96, bio: '仁德立身，善于聚拢人才，适合稳扎稳打经营文明。' },
  zhangfei: { force: 96, wisdom: 55, lead: 78, charm: 70, bio: '勇猛刚烈，冲阵破敌，远征时能显著提升军势。' },
  zhaoyun: { force: 95, wisdom: 78, lead: 86, charm: 88, bio: '一身是胆，攻守兼备，是远征队伍中的稳定核心。' },
  caocao: { force: 78, wisdom: 94, lead: 96, charm: 88, bio: '雄才大略，善用资源和人才，能强化金币经营。' },
  guanyu: { force: 99, wisdom: 76, lead: 90, charm: 95, bio: '义薄云天，威震华夏，特别适合提升远征与金币收益。' },
  kongming: { force: 45, wisdom: 100, lead: 92, charm: 94, bio: '卧龙出山，筹谋天下，可带动全局产能与科技成长。' },
  songjiang: { force: 62, wisdom: 82, lead: 91, charm: 95, bio: '及时雨广结豪杰，擅长组织人心与资源流转。' },
  linchong: { force: 94, wisdom: 73, lead: 82, charm: 78, bio: '豹子头枪棒过人，适合增强远征作战能力。' },
  wusong: { force: 98, wisdom: 70, lead: 76, charm: 86, bio: '景阳冈打虎的豪杰，爆发力强，点击收益突出。' },
  luzhishen: { force: 97, wisdom: 68, lead: 80, charm: 84, bio: '豪爽仗义，力大无穷，兼顾食物补给与战力。' },
  likui: { force: 93, wisdom: 42, lead: 65, charm: 68, bio: '黑旋风勇悍直接，适合带动物资消耗型扩张。' },
  wuyong: { force: 50, wisdom: 96, lead: 84, charm: 82, bio: '智多星善谋划，能减少建设成本。' },
  tangseng: { force: 28, wisdom: 86, lead: 76, charm: 92, bio: '取经核心，信念坚定，适合提升长期点击收益。' },
  bajie: { force: 78, wisdom: 58, lead: 62, charm: 80, bio: '能吃能干，带来稳定食物产出。' },
  shaseng: { force: 76, wisdom: 70, lead: 74, charm: 72, bio: '沉稳可靠，负责行囊物资，强化物资产出。' },
  nezha: { force: 94, wisdom: 78, lead: 82, charm: 88, bio: '少年神将，攻势凌厉，远征战力成长明显。' },
  sunwukong: { force: 100, wisdom: 88, lead: 86, charm: 98, bio: '齐天大圣，战斗与爆发兼具，是最值得追逐的特别卡之一。' },
  guanyin: { force: 70, wisdom: 98, lead: 90, charm: 100, bio: '慈悲与智慧并重，能提升全局产能和灵气。' },
  jiabaoyu: { force: 42, wisdom: 82, lead: 62, charm: 94, bio: '灵性通透，情感细腻，适合提升点击收益。' },
  xuebaochai: { force: 35, wisdom: 90, lead: 78, charm: 92, bio: '稳重周全，擅长持家经营，增强金币和物资。' },
  wangxifeng: { force: 50, wisdom: 92, lead: 88, charm: 90, bio: '精明强干，调度有方，可降低建设成本。' },
  lindaiyu: { force: 30, wisdom: 96, lead: 60, charm: 98, bio: '才情极高，灵气充盈，是红楼系特别卡。' },
  shixiangyun: { force: 45, wisdom: 82, lead: 70, charm: 90, bio: '爽朗洒脱，能兼顾食物与点击成长。' },
  tan_chun: { force: 38, wisdom: 88, lead: 84, charm: 86, bio: '有治理才干，适合提升文明物资管理。' },
  sunquan: { force: 72, wisdom: 86, lead: 90, charm: 88, bio: '坐断东南，善守基业，适合稳定经营与物资调度。' },
  zhouyu: { force: 82, wisdom: 96, lead: 94, charm: 92, bio: '赤壁名将，风流倜傥，能兼顾科技谋略与远征战力。' },
  lvbu: { force: 100, wisdom: 48, lead: 78, charm: 82, bio: '人中吕布，武力冠绝，特别适合追求极致远征战力。' },
  simayi: { force: 62, wisdom: 98, lead: 92, charm: 82, bio: '隐忍深谋，后发制人，擅长科技和资源布局。' },
  huarong: { force: 88, wisdom: 76, lead: 78, charm: 84, bio: '小李广箭术精绝，能提升远征队伍的打击能力。' },
  yangzhi: { force: 86, wisdom: 70, lead: 74, charm: 68, bio: '青面兽谨慎坚忍，适合护送物资和稳步扩张。' },
  yanshun: { force: 78, wisdom: 88, lead: 74, charm: 94, bio: '浪子机敏潇洒，擅长快速行动和经营收益。' },
  lujunyi: { force: 97, wisdom: 82, lead: 88, charm: 90, bio: '玉麒麟武艺超群，是梁山战力天花板之一。' },
  baigujing: { force: 70, wisdom: 88, lead: 62, charm: 86, bio: '变化多端，善用诡计，能带来灵气成长。' },
  niumo: { force: 96, wisdom: 72, lead: 84, charm: 82, bio: '平天大圣，力压群妖，适合增强远征硬实力。' },
  honghaier: { force: 84, wisdom: 78, lead: 70, charm: 86, bio: '三昧真火威势惊人，兼具爆发与灵气收益。' },
  erlang: { force: 98, wisdom: 88, lead: 90, charm: 92, bio: '清源妙道真君，战斗与洞察兼备，是西游系强力特别卡。' },
  jia_mu: { force: 30, wisdom: 86, lead: 82, charm: 96, bio: '荣府核心长辈，维系家族秩序与资源流动。' },
  miaoyu: { force: 25, wisdom: 92, lead: 58, charm: 88, bio: '清高孤洁，灵性深厚，适合提升灵气产出。' },
  qingwen: { force: 40, wisdom: 78, lead: 55, charm: 88, bio: '心性锋利，灵巧敏捷，带来点击成长。' },
  yuanchun: { force: 28, wisdom: 88, lead: 82, charm: 94, bio: '贵妃省亲，带来家族声望和文明财富增长。' },
  machao: { force: 96, wisdom: 70, lead: 86, charm: 84, bio: '西凉锦马超，骑战冲锋极强，适合强化远征。' },
  huangzhong: { force: 90, wisdom: 76, lead: 82, charm: 78, bio: '老当益壮，百步穿杨，稳健提升远征火力。' },
  diaochan: { force: 30, wisdom: 86, lead: 58, charm: 98, bio: '闭月佳人，善用离间与魅力，提升点击收益。' },
  pangtong: { force: 42, wisdom: 98, lead: 86, charm: 82, bio: '凤雏奇才，谋略深远，推动科技成长。' },
  liubei_emperor: { force: 70, wisdom: 84, lead: 92, charm: 100, bio: '昭烈称帝，仁德与号召力达到顶点。' },
  gongsunsheng: { force: 72, wisdom: 94, lead: 80, charm: 84, bio: '入云龙精通道法，适合提升灵气产出。' },
  chaogai: { force: 86, wisdom: 78, lead: 88, charm: 90, bio: '托塔天王义气深重，能带动财富与战力。' },
  shijin: { force: 84, wisdom: 62, lead: 70, charm: 76, bio: '九纹龙血气方刚，是早期远征好手。' },
  daizong: { force: 70, wisdom: 78, lead: 74, charm: 82, bio: '神行太保奔走如飞，强化点击节奏。' },
  ruanxiaoer: { force: 78, wisdom: 66, lead: 72, charm: 74, bio: '水军头领，善于水上补给与食物获取。' },
  zixia: { force: 45, wisdom: 88, lead: 62, charm: 96, bio: '霞光灵动，带来灵气与行动效率。' },
  taishang: { force: 55, wisdom: 100, lead: 88, charm: 92, bio: '炼丹炼器之祖，科技与灵气双修。' },
  jade_emperor: { force: 70, wisdom: 92, lead: 100, charm: 96, bio: '天庭至尊，统御万方，强化全局文明。' },
  queen_west: { force: 62, wisdom: 94, lead: 88, charm: 96, bio: '掌蟠桃仙境，灵气与全局成长兼备。' },
  jingshen: { force: 82, wisdom: 68, lead: 70, charm: 72, bio: '金角大王法宝众多，能带来金币收益。' },
  xichun: { force: 24, wisdom: 82, lead: 50, charm: 82, bio: '清冷出尘，心向空门，带来灵气成长。' },
  yingchun: { force: 24, wisdom: 70, lead: 52, charm: 78, bio: '温顺敦厚，适合平稳补给和食物成长。' },
  xuepan: { force: 58, wisdom: 50, lead: 52, charm: 66, bio: '呆霸王挥霍成性，却能带来商业流动。' },
  liwan: { force: 25, wisdom: 86, lead: 78, charm: 84, bio: '守成持家，稳定粮食和财富产出。' },
  qin_keqing: { force: 24, wisdom: 90, lead: 72, charm: 98, bio: '风流袅娜，气韵不凡，提升灵气与点击。' }
}

const SYNERGIES = [
  { id: 'dragon_azure', zodiac: 'dragon', beast: 'azure', name: '龙脉青穹', desc: '龙族 + 青龙：全产量 +25%，灵气 +35%。', mult: { all: 0.25, qi: 0.35 } },
  { id: 'tiger_white', zodiac: 'tiger', beast: 'white', name: '白虎兵锋', desc: '虎族 + 白虎：金币 +20%，远征战力 +35%。', mult: { gold: 0.2 }, army: 0.35 },
  { id: 'rooster_phoenix', zodiac: 'rooster', beast: 'phoenix', name: '凤鸣晨曦', desc: '鸡族 + 凤凰：科技 +25%，离线收益 +60%。', mult: { tech: 0.25 }, offline: 0.6 },
  { id: 'monkey_qilin', zodiac: 'monkey', beast: 'qilin', name: '智猿麒麟', desc: '猴族 + 麒麟：科技 +35%，基因点 +35%。', mult: { tech: 0.35, gene: 0.35 } },
  { id: 'snake_ninetail', zodiac: 'snake', beast: 'ninetail', name: '玄蛇九尾', desc: '蛇族 + 九尾狐：灵气 +45%，点击收益 +80%。', mult: { qi: 0.45 }, tap: 0.8 },
  { id: 'pig_taotie', zodiac: 'pig', beast: 'taotie', name: '饕餮丰年', desc: '猪族 + 饕餮：食物 +60%，建筑费用 -8%。', mult: { food: 0.6 }, costCut: 0.08 }
]

const SECRET_COMBOS = [
  {
    id: 'true_dragon_court',
    ico: '🐉',
    name: '真龙王庭',
    hint: '龙族血脉、青龙、筑基境、生肖神殿达到 6 级。',
    desc: '全产量 ×3，灵气 ×4。',
    zodiac: 'dragon',
    beast: 'azure',
    realm: 1,
    building: 'shrine',
    count: 6,
    mult: { all: 2, qi: 3 }
  },
  {
    id: 'white_tiger_legion',
    ico: '🐯',
    name: '白虎军国',
    hint: '虎族血脉、白虎、兵营达到 18 级。',
    desc: '金币 ×3，远征战力 ×5。',
    zodiac: 'tiger',
    beast: 'white',
    building: 'barrack',
    count: 18,
    mult: { gold: 2 },
    army: 4
  },
  {
    id: 'mystic_fox_sect',
    ico: '🦊',
    name: '玄狐灵宗',
    hint: '蛇族血脉、九尾狐、金丹境、聚灵阵达到 8 级。',
    desc: '灵气 ×5，点击收益 ×3。',
    zodiac: 'snake',
    beast: 'ninetail',
    realm: 2,
    building: 'vein',
    count: 8,
    mult: { qi: 4 },
    tap: 2
  },
  {
    id: 'phoenix_machine_city',
    ico: '🔥',
    name: '凤鸣机城',
    hint: '鸡族血脉、凤凰、研究所达到 8 级。',
    desc: '科技 ×4，离线收益 ×2。',
    zodiac: 'rooster',
    beast: 'phoenix',
    building: 'lab',
    count: 8,
    mult: { tech: 3 },
    offline: 1
  },
  {
    id: 'taotie_granary',
    ico: '👹',
    name: '饕餮粮国',
    hint: '猪族血脉、饕餮、农田达到 30 级。',
    desc: '食物 ×5，建筑费用 -15%。',
    zodiac: 'pig',
    beast: 'taotie',
    building: 'farm',
    count: 30,
    mult: { food: 4 },
    costCut: 0.15
  }
]

const REALMS = [
  { id: 'qi', name: '炼气', cost: 0, mult: 1 },
  { id: 'found', name: '筑基', cost: 5e5, mult: 1.5 },
  { id: 'gold', name: '金丹', cost: 5e6, mult: 2.2 },
  { id: 'nascent', name: '元婴', cost: 5e7, mult: 3.5 },
  { id: 'spirit', name: '化神', cost: 5e8, mult: 6 },
  { id: 'tribulation', name: '渡劫', cost: 5e9, mult: 10 },
  { id: 'ascend', name: '飞升', cost: 5e10, mult: 20 }
]

const TECHS = [
  { id: 'steam', ico: '⚙️', name: '蒸汽机', desc: '全产量 ×1.3', cost: 5e6, mult: 0.3 },
  { id: 'factory2', ico: '🏭', name: '流水线', desc: '物资 ×1.5', cost: 5e7, mult: 0.5, res: 'goods' },
  { id: 'computer', ico: '💻', name: '计算机', desc: '科技 ×2', cost: 5e8, mult: 1, res: 'tech' },
  { id: 'ai', ico: '🤖', name: 'AI助手', desc: '全产量 ×1.5', cost: 5e9, mult: 0.5 },
  { id: 'robot', ico: '🦾', name: '机器人军团', desc: '金币 ×2', cost: 5e10, mult: 1, res: 'gold' },
  { id: 'quantum', ico: '🧮', name: '量子计算机', desc: '全产量 ×2', cost: 5e11, mult: 1 },
  { id: 'brain', ico: '🧠', name: '脑机接口', desc: '点击收益 ×3', cost: 5e12, tap: 2 }
]

const STARPROJ = [
  { id: 'moon', ico: '🌙', name: '月球基地', desc: '全产量 ×1.5', cost: 5e11, mult: 0.5 },
  { id: 'mars', ico: '🔴', name: '火星殖民地', desc: '全产量 ×2', cost: 5e12, mult: 1 },
  { id: 'dyson2', ico: '☀️', name: '戴森球阵列', desc: '全产量 ×3', cost: 5e13, mult: 2 },
  { id: 'wormhole', ico: '🌀', name: '虫洞引擎', desc: '全产量 ×5', cost: 5e14, mult: 4 },
  { id: 'galaxy', ico: '🌌', name: '星海帝国', desc: '终极 全产量 ×10', cost: 5e15, mult: 9 }
]

const EVOLUTIONS = [
  { id: 'z_dragon', type: 'zodiac', target: 'dragon', ico: '🐲', cost: 8e4, mult: { all: 0.35 }, name: '星鳞龙族', desc: '龙族血脉二阶，全产量 +35%。' },
  { id: 'z_snake', type: 'zodiac', target: 'snake', ico: '🐍', cost: 5e4, mult: { qi: 0.8, gene: 0.3 }, name: '玄基蛇族', desc: '灵气 +80%，基因点 +30%。' },
  { id: 'z_monkey', type: 'zodiac', target: 'monkey', ico: '🐒', cost: 5e4, mult: { tech: 0.8, gene: 0.25 }, name: '智猿族', desc: '科技 +80%，基因点 +25%。' },
  { id: 'b_azure', type: 'beast', target: 'azure', ico: '🐉', cost: 1.2e5, mult: { qi: 0.45, star: 0.25 }, name: '星穹青龙', desc: '灵气 +45%，星能 +25%。' },
  { id: 'b_phoenix', type: 'beast', target: 'phoenix', ico: '🔥', cost: 1.4e5, mult: { tech: 0.35, star: 0.4 }, name: '量子凤凰', desc: '科技 +35%，星能 +40%。' },
  { id: 'b_qilin', type: 'beast', target: 'qilin', ico: '🦌', cost: 1.4e5, mult: { all: 0.25, gene: 0.35 }, name: '赛博麒麟', desc: '全产量 +25%，基因点 +35%。' }
]

const DUNGEONS = [
  { id: 'wolf', era: 0, ico: '🐺', name: '野狼谷', desc: '清剿袭扰村庄的狼群。', power: 50, dur: 8, reward: { gold: 200, goods: 120 }, egg: 0 },
  { id: 'bandit', era: 0, ico: '🏴', name: '山贼寨', desc: '剿灭占山为王的盗匪。', power: 300, dur: 12, reward: { gold: 1200, food: 600 }, egg: 0 },
  { id: 'clan', era: 1, ico: '🏛', name: '生肖试炼', desc: '挑战十二生肖守护者。', power: 3000, dur: 20, reward: { gold: 1.5e4, goods: 8000 }, egg: 0.15 },
  { id: 'beast', era: 2, ico: '🐲', name: '神兽巢穴', desc: '深入神兽大陆的守巢之战。', power: 8e4, dur: 30, reward: { gold: 3e5, goods: 1.5e5 }, egg: 0.5 },
  { id: 'secret', era: 3, ico: '🏔️', name: '上古秘境', desc: '宗门弟子探索灵气秘境。', power: 2e6, dur: 45, reward: { qi: 3e5, gold: 2e6 }, egg: 0.25 },
  { id: 'ai', era: 4, ico: '🛸', name: 'AI 要塞', desc: '机器人军团攻坚战。', power: 5e8, dur: 60, reward: { tech: 2e6, gold: 5e7 }, egg: 0.3 },
  { id: 'void', era: 5, ico: '🌀', name: '虫洞深渊', desc: '星海帝国的终极远征。', power: 5e10, dur: 90, reward: { star: 5e6, gold: 5e9 }, egg: 0.4 },
  { id: 'dna', era: 6, ico: '🧬', name: '远古 DNA 遗迹', desc: '回收可改写血脉的基因样本。', power: 5e12, dur: 100, reward: { gene: 8e4, star: 2e7 }, egg: 0.35 }
]

const EVENTS = [
  { id: 'merchant', minEra: 0, ico: '🛒', name: '商队来访', desc: '领取一批金币和物资。', reward: { gold: 1200, goods: 700 } },
  { id: 'harvest', minEra: 0, ico: '🌾', name: '丰收季', desc: '粮仓突然充盈。', reward: { food: 1600 } },
  { id: 'craftsman', minEra: 0, ico: '🧰', name: '工匠入城', desc: '工匠带来一批物资。', reward: { goods: 1500 } },
  { id: 'tax_day', minEra: 0, ico: '🪙', name: '市集税收', desc: '集市贡献额外金币。', reward: { gold: 1800 } },
  { id: 'granary', minEra: 1, ico: '🏚️', name: '粮仓扩建', desc: '生肖氏族协助扩充粮仓。', reward: { food: 9000, goods: 3000 } },
  { id: 'totem_blessing', minEra: 1, ico: '🗿', name: '图腾祝福', desc: '图腾引来一波金币与物资。', reward: { gold: 9000, goods: 7000 } },
  { id: 'zodiac_fair', minEra: 1, ico: '🎪', name: '生肖集会', desc: '各族献上资源。', reward: { food: 8000, goods: 8000, gold: 8000 } },
  { id: 'meteor', minEra: 2, ico: '☄️', name: '星陨奇石', desc: '获得金币、物资和少量灵气。', reward: { gold: 8e4, goods: 3e4, qi: 5000 } },
  { id: 'beast_trace', minEra: 2, ico: '🐾', name: '神兽足迹', desc: '追踪神兽留下的稀有资源。', reward: { gold: 1.2e5, food: 5e4 } },
  { id: 'ancient_scale', minEra: 2, ico: '🐲', name: '古鳞现世', desc: '神兽古鳞引发资源潮。', reward: { goods: 1.1e5, qi: 8000 } },
  { id: 'spirit_rain', minEra: 3, ico: '🌧️', name: '灵雨降世', desc: '灵气暴涨，适合突破。', reward: { qi: 8e4 } },
  { id: 'sect_trial', minEra: 3, ico: '🏯', name: '宗门试炼', desc: '修士试炼带来金币与灵气。', reward: { gold: 5e5, qi: 1.2e5 } },
  { id: 'alchemy_batch', minEra: 3, ico: '⚗️', name: '丹炉成药', desc: '丹药出炉，灵气充盈。', reward: { qi: 2e5 } },
  { id: 'spirit_vein', minEra: 3, ico: '⛰️', name: '灵脉开裂', desc: '地下灵脉短暂喷涌。', reward: { qi: 3e5, goods: 1e5 } },
  { id: 'data_tide', minEra: 4, ico: '📡', name: '数据潮汐', desc: '科研节点涌现灵感。', reward: { tech: 1.5e5, gold: 2e6 } },
  { id: 'lab_breakthrough', minEra: 4, ico: '🔬', name: '实验突破', desc: '研究所获得关键数据。', reward: { tech: 5e5 } },
  { id: 'auto_order', minEra: 4, ico: '🏭', name: '自动订单', desc: '自动工厂完成大批订单。', reward: { goods: 5e6, gold: 3e6 } },
  { id: 'ai_patch', minEra: 4, ico: '🤖', name: 'AI 补丁', desc: '智能系统优化生产参数。', reward: { tech: 8e5, gold: 8e6 } },
  { id: 'orbital_supply', minEra: 5, ico: '🛰️', name: '轨道补给', desc: '空间站送回稀有补给。', reward: { star: 4e5, tech: 2e6 } },
  { id: 'solar_flare', minEra: 5, ico: '☀️', name: '太阳耀斑', desc: '戴森阵列捕获额外星能。', reward: { star: 1.2e6 } },
  { id: 'mars_cargo', minEra: 5, ico: '🔴', name: '火星货运', desc: '殖民地送回金币与星能。', reward: { gold: 8e6, star: 8e5 } },
  { id: 'gene_echo', minEra: 6, ico: '🧬', name: '基因回响', desc: '古老血脉样本浮现。', reward: { gene: 5e4, star: 1e6 } },
  { id: 'gene_library', minEra: 6, ico: '📚', name: '基因档案', desc: '档案馆复原远古样本。', reward: { gene: 1.5e5 } },
  { id: 'evolution_surge', minEra: 6, ico: '🧪', name: '进化涌动', desc: '族群进化带来基因点。', reward: { gene: 2.5e5, star: 2e6 } },
  { id: 'time_echo', minEra: 7, ico: '⏳', name: '时间回响', desc: '时间方尖碑回收一段时序。', reward: { time: 1e5, gene: 1e5 } },
  { id: 'timeline_branch', minEra: 7, ico: '🧭', name: '时间线分支', desc: '分支时间线带回资源。', reward: { time: 2e5, star: 5e6 } },
  { id: 'dark_pulse', minEra: 8, ico: '🕳️', name: '暗能脉冲', desc: '暗能井出现短暂脉冲。', reward: { dark: 1e5, time: 1e5 } },
  { id: 'void_market', minEra: 8, ico: '🌌', name: '虚空贸易', desc: '多元商队交换奇异资源。', reward: { dark: 2e5, star: 1e7 } },
  { id: 'mind_sync', minEra: 9, ico: '🧠', name: '意识同步', desc: '意识云完成一次集体同步。', reward: { mind: 1e5, dark: 1e5 } },
  { id: 'origin_spark', minEra: 10, ico: '🌱', name: '源质火花', desc: '法则编织时溢出源质。', reward: { origin: 8e4, mind: 1e5 } },
  { id: 'dao_seed', minEra: 11, ico: '♾️', name: '道种萌发', desc: '道果树凝结一枚道种。', reward: { dao: 5e4, origin: 8e4 } }
]

const EVENT_GOLD_NEED = [500, 5000, 30000, 200000, 2e6, 2e7, 2e8, 2e9, 2e10, 2e11, 2e12, 2e13]

const ACHIEVEMENTS = [
  { id: 'era_zodiac', name: '生肖初醒', desc: '进入十二生肖时代。', reward: { gold: 2e4 }, done: (s) => s.era >= 1 },
  { id: 'era_cultivate', name: '灵气复苏', desc: '进入修仙时代。', reward: { qi: 6e4 }, done: (s) => s.era >= 3 },
  { id: 'build_20', name: '百业兴建', desc: '建筑总数达到 20。', reward: { gold: 8e4, goods: 4e4 }, done: (s) => totalBuildings(s) >= 20 },
  { id: 'zodiac_3', name: '三族归附', desc: '招募 3 个生肖。', reward: { gold: 1.2e5 }, done: (s) => Object.keys(s.zodiacRecruited).length >= 3 },
  { id: 'beast_1', name: '神兽现世', desc: '孵化任意 1 只神兽。', reward: { gold: 2e5, food: 8e4 }, done: (s) => totalBeasts(s) >= 1 },
  { id: 'realm_3', name: '金丹已成', desc: '突破到金丹境。', reward: { qi: 3e5, gold: 8e5 }, done: (s) => s.realm >= 2 },
  { id: 'tech_3', name: '机械飞升', desc: '研发 3 项科技。', reward: { tech: 4e5 }, done: (s) => Object.keys(s.techs).length >= 3 },
  { id: 'synergy_1', name: '羁绊初成', desc: '激活任意 1 个生肖神兽羁绊。', reward: { gene: 5e4, gold: 1e6 }, done: (s) => activeSynergies(s).length >= 1 },
  { id: 'secret_combo_1', name: '隐秘文明', desc: '发现任意 1 个隐藏组合。', reward: { gold: 2e6, qi: 2e5, gene: 8e4 }, done: (s) => activeSecretCombos(s).length >= 1 }
]

const MAIN_CHAPTERS = []

const BOOK_TASK_GROUP_SIZE = 3

function makeBookStories(book, idPrefix, titlePrefix, rewardBase = {}) {
  return CIV_CARDS
  .filter((card) => card.book === book)
  .reduce((groups, card, index) => {
    const groupIndex = Math.floor(index / BOOK_TASK_GROUP_SIZE)
    groups[groupIndex] = groups[groupIndex] || []
    groups[groupIndex].push(card.id)
    return groups
  }, [])
  .map((ids, index, groups) => {
    const progress = index / Math.max(1, groups.length - 1)
    const requiredLevel = Math.min(20, 1 + Math.floor(progress * progress * 19))
    return {
      id: `${idPrefix}_${index + 1}`,
      no: index + 1,
      title: `${titlePrefix}第 ${index + 1} 组`,
      requiredCards: ids,
      requiredLevel,
      reward: {
        gold: Math.floor((rewardBase.gold || 2500) * Math.pow(1.08, index)),
        food: Math.floor((rewardBase.food || 900) * Math.pow(1.07, index)),
        goods: Math.floor((rewardBase.goods || 1100) * Math.pow(1.07, index))
      }
    }
  })
}

const THREE_KINGDOMS_STORIES = makeBookStories('三国演义', 'three_kingdoms', '三国群雄', { gold: 2600, food: 800, goods: 1000 })
const WATER_MARGIN_STORIES = makeBookStories('水浒传', 'water_margin', '梁山人物', { gold: 2500, food: 900, goods: 1100 })
const RED_CHAMBER_STORIES = makeBookStories('红楼梦', 'red_chamber', '红楼人物', { gold: 2400, food: 900, goods: 900 })

const JOURNEY_STORY_TITLES = [
  '灵根孕育石猴出世',
  '菩提祖师传授仙法',
  '龙宫借得如意金箍棒',
  '地府勾销生死簿',
  '弼马温初入天庭',
  '齐天大圣反下天宫',
  '蟠桃会前群仙震动',
  '八卦炉中炼火眼金睛',
  '五行山下压大圣',
  '江流儿身世浮出',
  '玄奘奉旨西行取经',
  '双叉岭初逢妖难',
  '五行山收孙悟空',
  '鹰愁涧白龙归队',
  '观音院袈裟生祸',
  '黑风山降伏熊罴怪',
  '高老庄收猪八戒',
  '黄风岭遭遇黄风怪',
  '流沙河收沙悟净',
  '四圣试禅心',
  '五庄观偷食人参果',
  '镇元大仙索赔仙树',
  '三打白骨精',
  '宝象国救百花羞',
  '平顶山遇金银角',
  '莲花洞巧夺宝物',
  '乌鸡国辨真假国王',
  '号山大战红孩儿',
  '黑水河遇鼍龙',
  '车迟国斗法三妖',
  '通天河遇灵感大王',
  '金兜洞大战青牛怪',
  '女儿国误饮子母河',
  '毒敌山降蝎子精',
  '真假唐僧风波',
  '火焰山初阻西行',
  '一借芭蕉扇',
  '二借芭蕉扇',
  '三借芭蕉扇',
  '祭赛国扫塔寻宝',
  '碧波潭擒九头虫',
  '荆棘岭木仙联诗',
  '小雷音寺遇黄眉怪',
  '弥勒佛收黄眉',
  '七绝山除蟒开路',
  '朱紫国寻医揭榜',
  '金毛犼归还紫金铃',
  '盘丝洞陷七蛛精',
  '黄花观破百眼魔君',
  '狮驼岭闻三魔名',
  '狮驼洞大圣探营',
  '狮驼国三魔逞凶',
  '如来降伏大鹏',
  '比丘国救童子',
  '白鹿精现出原形',
  '灭法国改名钦法国',
  '隐雾山除豹精',
  '凤仙郡求雨',
  '玉华州收徒传艺',
  '黄狮精盗兵器',
  '九灵元圣归正',
  '金平府观灯遇犀牛',
  '青龙山擒三犀',
  '天竺国玉兔招亲',
  '布金寺公主认亲',
  '铜台府寇员外设斋',
  '地灵县遭诬入狱',
  '寇家还魂洗冤',
  '灵山脚下遇金顶大仙',
  '凌云渡脱凡胎',
  '雷音寺初取无字经',
  '燃灯古佛提醒换经',
  '通天河老鼋问寿',
  '经卷落水晒经石',
  '八十一难圆满',
  '五圣成真',
  '花果山旧部重聚',
  '净坛使者归位',
  '金身罗汉受封',
  '八部天龙归海',
  '旃檀功德佛归真',
  '斗战胜佛得位',
  '取经功德传东土',
  '长安设坛迎真经',
  '百姓听经开悟',
  '四众功德入文明',
  '西行路谱成图鉴',
  '妖王旧事化为试炼',
  '天庭重订功过簿',
  '灵山赐下护国愿',
  '取经队伍再启程',
  '花果山铸文明魂',
  '大唐法会照九州',
  '八十一难化星图',
  '真经入藏兴文脉',
  '万民传颂西游记',
  '齐天意志护王座',
  '西天功德满文明',
  '百回故事终成道',
  '西游全书圆满'
]

function journeyRequiredCards(title, index) {
  const base = index < 12 ? ['sunwukong'] : ['tangseng', 'sunwukong']
  if (title.includes('菩提')) return ['sunwukong', 'puti']
  if (title.includes('龙宫') || title.includes('金箍棒')) return ['sunwukong', 'dragon_king']
  if (title.includes('地府') || title.includes('生死簿')) return ['sunwukong', 'yanluo']
  if (title.includes('观音')) return ['sunwukong', 'guanyin']
  if (title.includes('天庭') || title.includes('蟠桃') || title.includes('八卦炉')) return ['sunwukong', 'jade_emperor', 'taishang']
  if (title.includes('五行山') || title.includes('西行') || title.includes('玄奘')) return ['tangseng', 'sunwukong', 'guanyin']
  if (title.includes('白龙')) return ['tangseng', 'sunwukong', 'bailongma', 'guanyin']
  if (title.includes('黑风') || title.includes('熊罴')) return ['tangseng', 'sunwukong', 'heixiong', 'guanyin']
  if (title.includes('高老庄') || title.includes('八戒')) return ['tangseng', 'sunwukong', 'bajie']
  if (title.includes('黄风')) return ['tangseng', 'sunwukong', 'bajie', 'huangfeng']
  if (title.includes('流沙') || title.includes('沙悟净')) return ['tangseng', 'sunwukong', 'bajie', 'shaseng']
  if (title.includes('五庄') || title.includes('人参果') || title.includes('镇元')) return ['tangseng', 'sunwukong', 'zhenyuan']
  if (title.includes('白骨')) return ['tangseng', 'sunwukong', 'baigujing']
  if (title.includes('红孩儿') || title.includes('号山')) return ['tangseng', 'sunwukong', 'honghaier', 'guanyin']
  if (title.includes('金银角') || title.includes('莲花洞')) return ['tangseng', 'sunwukong', 'jingshen', 'yinjiao', 'taishang']
  if (title.includes('牛') || title.includes('火焰') || title.includes('芭蕉')) return ['tangseng', 'sunwukong', 'bajie', 'niumo']
  if (title.includes('女儿国') || title.includes('子母河')) return ['tangseng', 'sunwukong', 'queen_west']
  if (title.includes('二郎') || title.includes('真假')) return ['sunwukong', 'erlang']
  if (title.includes('哪吒') || title.includes('天竺') || title.includes('玉兔')) return ['tangseng', 'sunwukong', 'nezha']
  if (title.includes('灵山') || title.includes('雷音') || title.includes('真经') || title.includes('佛') || title.includes('功德')) return ['tangseng', 'sunwukong', 'guanyin']
  if (title.includes('四众') || title.includes('取经队伍') || title.includes('五圣')) return ['tangseng', 'sunwukong', 'bajie', 'shaseng', 'guanyin']
  return base
}

function journeyRequiredLevel(index) {
  const maxLevel = 99
  const progress = index / Math.max(1, JOURNEY_STORY_TITLES.length - 1)
  return Math.min(maxLevel, 1 + Math.floor(progress * progress * (maxLevel - 1)))
}

const JOURNEY_STORIES = JOURNEY_STORY_TITLES.map((title, index) => ({
  id: `journey_${index + 1}`,
  no: index + 1,
  title,
  requiredCards: journeyRequiredCards(title, index),
  requiredLevel: journeyRequiredLevel(index),
  reward: {
    gold: Math.floor(1200 * Math.pow(1.12, index)),
    food: Math.floor(500 * Math.pow(1.1, index)),
    goods: Math.floor(420 * Math.pow(1.1, index))
  }
}))

const DAILY_TASKS = [
  { id: 'tap_100', type: 'tap', name: '王座召令', desc: '点击王座 100 次。', target: 100, reward: { gold: 3000 } },
  { id: 'build_5', type: 'build', name: '百工开市', desc: '购买建筑 5 次。', target: 5, reward: { gold: 4500, goods: 1800 } },
  { id: 'expedition_1', type: 'expedition', name: '军旗出征', desc: '完成远征 1 次。', target: 1, reward: { food: 3500, gold: 3500 } },
  { id: 'open_pack_1', type: 'openPack', name: '开卷有得', desc: '开启卡包或装备箱 1 次。', target: 1, reward: { gold: 6000 } }
]

const DEV_FAST_MODE = false
const SHOP_RESTOCK_MS = 30 * 60 * 1000
const SHOP_STOCK_LIMIT = 50
const CARD_MAX_LEVEL = 99
const EVENT_OFFER_MS = 30 * 1000

const SPEED = DEV_FAST_MODE
  ? { tap: 50, production: 25, goldProduction: 5, qiProduction: 20, realmCost: 0.1, eraNeed: 0.08, expeditionDuration: 0.25 }
  : { tap: 1, production: 1, goldProduction: 1, qiProduction: 1, realmCost: 1, eraNeed: 1, expeditionDuration: 1 }
const REBOOT_MIN_ERA = 11
const REBOOT_MIN_SCORE = ERAS[REBOOT_MIN_ERA].need

function fmt(n) {
  n = Math.floor(n || 0)
  if (n < 1e4) return String(n)
  if (n < 1e8) return `${(n / 1e4).toFixed(n < 1e6 ? 1 : 0)}万`
  if (n < 1e12) return `${(n / 1e8).toFixed(2)}亿`
  if (n < 1e16) return `${(n / 1e12).toFixed(2)}兆`
  return `${(n / 1e16).toFixed(2)}京`
}

function fmtRate(n) {
  n = Number(n || 0)
  if (n > 0 && n < 10) return n.toFixed(1).replace(/\.0$/, '')
  return fmt(n)
}

function freshState() {
  return {
    era: 0,
    tier: 0,
    res: { food: 0, goods: 0, gold: 10, qi: 0, tech: 0, star: 0, gene: 0, time: 0, dark: 0, mind: 0, origin: 0, dao: 0 },
    buildings: {},
    bloodline: null,
    zodiacRecruited: {},
    beasts: {},
    beastRanks: {},
    cards: {},
    cardShards: {},
    equipments: {},
    equipmentBoxes: {},
    equipmentBoxesBought: {},
    evolutions: {},
    realm: 0,
    techs: {},
    starProj: {},
    achievements: {},
    eventOffer: null,
    eventGoldSpent: 0,
    expedition: null,
    dungeonWins: {},
    cardPacks: {},
    cardPacksBought: {},
    shopStock: {},
    equipmentShopStock: {},
    dailyTasks: null,
    mainChapterClaims: {},
    journeyStoryClaims: {},
    threeKingdomsStoryClaims: {},
    waterMarginStoryClaims: {},
    redChamberStoryClaims: {},
    season: { cycle: 0, daoSeeds: 0, bestPower: 0, lastGain: 0 },
    lastShopRestockAt: Date.now(),
    lastCheckInDay: '',
    last: Date.now(),
    peakPower: 0
  }
}

function scaledReward(reward, s) {
  const scale = Math.pow(8, Math.min(s.era || 0, 8))
  const out = {}
  Object.keys(reward).forEach((k) => { out[k] = Math.floor(reward[k] * scale) })
  return out
}

function ensureDailyTasks(s, now = Date.now()) {
  const today = dayKey(now)
  if (!s.dailyTasks || s.dailyTasks.day !== today) {
    s.dailyTasks = { day: today, progress: {}, claimed: {} }
  }
  s.dailyTasks.progress = s.dailyTasks.progress || {}
  s.dailyTasks.claimed = s.dailyTasks.claimed || {}
  DAILY_TASKS.forEach((task) => {
    s.dailyTasks.progress[task.id] = Math.max(0, Math.floor(s.dailyTasks.progress[task.id] || 0))
  })
  return s.dailyTasks
}

function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function safeCount(value, max) {
  const count = Math.max(0, Math.floor(safeNumber(value)))
  return max === undefined ? count : Math.min(max, count)
}

function idMap(items, key = 'id') {
  return items.reduce((out, item) => {
    out[item[key]] = true
    return out
  }, {})
}

function safeMap(map) {
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {}
}

function sanitizeCountMap(map, validIds, max) {
  const out = safeMap(map)
  Object.keys(out).forEach((id) => {
    if (validIds && !validIds[id]) {
      delete out[id]
    } else {
      out[id] = safeCount(out[id], max)
    }
  })
  return out
}

function sanitizeFlagMap(map, validIds) {
  const out = safeMap(map)
  Object.keys(out).forEach((id) => {
    if (validIds && !validIds[id]) delete out[id]
    else out[id] = !!out[id]
  })
  return out
}

function normalize(state) {
  const def = freshState()
  const needsInitialShopStock = !state || !state.lastShopRestockAt
  const defaultRes = def.res
  const s = Object.assign(def, state || {})
  s.res = Object.assign({}, defaultRes, s.res || {})
  s.era = Math.min(ERAS.length - 1, safeCount(s.era))
  s.tier = Math.min(ERAS[s.era].tiers.length - 1, safeCount(s.tier))
  s.realm = Math.min(REALMS.length - 1, safeCount(s.realm))
  Object.keys(defaultRes).forEach((k) => {
    s.res[k] = Math.max(0, safeNumber(s.res[k]))
  })
  ;['buildings', 'zodiacRecruited', 'beasts', 'beastRanks', 'cards', 'cardShards', 'equipments', 'equipmentBoxes', 'equipmentBoxesBought', 'evolutions', 'techs', 'starProj', 'achievements', 'dungeonWins', 'mainChapterClaims', 'journeyStoryClaims', 'threeKingdomsStoryClaims', 'waterMarginStoryClaims', 'redChamberStoryClaims'].forEach((k) => {
    s[k] = safeMap(s[k])
  })
  const validBuildingIds = idMap(BUILDINGS)
  const validZodiacIds = idMap(ZODIAC)
  const validBeastIds = idMap(BEASTS)
  const validBeastRankIds = idMap(BEAST_RANKS)
  const validCardIds = idMap(CIV_CARDS)
  const validEquipmentIds = idMap(EQUIPMENTS)
  const validEvolutionIds = idMap(EVOLUTIONS)
  const validTechIds = idMap(TECHS)
  const validStarIds = idMap(STARPROJ)
  const validAchievementIds = idMap(ACHIEVEMENTS)
  const validDungeonIds = idMap(DUNGEONS)
  const validMainChapterIds = idMap(MAIN_CHAPTERS)
  const validJourneyStoryIds = idMap(JOURNEY_STORIES)
  const validThreeKingdomsStoryIds = idMap(THREE_KINGDOMS_STORIES)
  const validWaterMarginStoryIds = idMap(WATER_MARGIN_STORIES)
  const validRedChamberStoryIds = idMap(RED_CHAMBER_STORIES)
  s.buildings = sanitizeCountMap(s.buildings, validBuildingIds)
  s.zodiacRecruited = sanitizeFlagMap(s.zodiacRecruited, validZodiacIds)
  s.beasts = sanitizeCountMap(s.beasts, validBeastIds)
  Object.keys(s.beastRanks).forEach((id) => {
    if (!validBeastIds[id]) delete s.beastRanks[id]
    else s.beastRanks[id] = sanitizeCountMap(s.beastRanks[id], validBeastRankIds)
  })
  s.cards = sanitizeCountMap(s.cards, validCardIds, CARD_MAX_LEVEL)
  s.cardShards = sanitizeCountMap(s.cardShards, validCardIds)
  s.equipments = sanitizeCountMap(s.equipments, validEquipmentIds)
  s.evolutions = sanitizeFlagMap(s.evolutions, validEvolutionIds)
  s.techs = sanitizeFlagMap(s.techs, validTechIds)
  s.starProj = sanitizeFlagMap(s.starProj, validStarIds)
  s.achievements = sanitizeFlagMap(s.achievements, validAchievementIds)
  s.dungeonWins = sanitizeCountMap(s.dungeonWins, validDungeonIds)
  s.mainChapterClaims = sanitizeFlagMap(s.mainChapterClaims, validMainChapterIds)
  s.journeyStoryClaims = sanitizeFlagMap(s.journeyStoryClaims, validJourneyStoryIds)
  s.threeKingdomsStoryClaims = sanitizeFlagMap(s.threeKingdomsStoryClaims, validThreeKingdomsStoryIds)
  s.waterMarginStoryClaims = sanitizeFlagMap(s.waterMarginStoryClaims, validWaterMarginStoryIds)
  s.redChamberStoryClaims = sanitizeFlagMap(s.redChamberStoryClaims, validRedChamberStoryIds)
  Object.keys(s.cards).forEach((id) => {
    s.cards[id] = Math.max(0, Math.min(CARD_MAX_LEVEL, Math.floor(s.cards[id] || 0)))
    s.cardShards[id] = Math.max(0, Math.floor(s.cardShards[id] || 0))
    if (s.cards[id] >= CARD_MAX_LEVEL) s.cardShards[id] = 0
  })
  if (typeof s.cardPacks === 'number') s.cardPacks = { classic: Math.max(0, Math.floor(s.cardPacks)) }
  if (typeof s.cardPacksBought === 'number') s.cardPacksBought = { classic: Math.max(0, Math.floor(s.cardPacksBought)) }
  s.cardPacks = s.cardPacks || {}
  s.cardPacksBought = s.cardPacksBought || {}
  s.shopStock = s.shopStock || {}
  s.equipmentShopStock = s.equipmentShopStock || {}
  s.eventGoldSpent = Math.max(0, safeNumber(s.eventGoldSpent))
  s.peakPower = Math.max(0, safeNumber(s.peakPower))
  s.last = safeNumber(s.last, Date.now())
  s.lastShopRestockAt = safeNumber(s.lastShopRestockAt, 0)
  s.season = Object.assign({ cycle: 0, daoSeeds: 0, bestPower: 0, lastGain: 0 }, s.season || {})
  s.season.cycle = Math.max(0, Math.floor(s.season.cycle || 0))
  s.season.daoSeeds = Math.max(0, Math.floor(s.season.daoSeeds || 0))
  s.season.bestPower = Math.max(0, Math.floor(s.season.bestPower || 0))
  s.season.lastGain = Math.max(0, Math.floor(s.season.lastGain || 0))
  ensureDailyTasks(s)
  CARD_PACKS.forEach((p) => {
    s.cardPacks[p.id] = Math.max(0, Math.floor(s.cardPacks[p.id] || 0))
    s.cardPacksBought[p.id] = Math.max(0, Math.floor(s.cardPacksBought[p.id] || 0))
    s.shopStock[p.id] = Math.min(SHOP_STOCK_LIMIT, Math.max(0, Math.floor(s.shopStock[p.id] || 0)))
  })
  EQUIPMENT_BOXES.forEach((b) => {
    s.equipmentBoxes[b.id] = Math.max(0, Math.floor(s.equipmentBoxes[b.id] || 0))
    s.equipmentBoxesBought[b.id] = Math.max(0, Math.floor(s.equipmentBoxesBought[b.id] || 0))
    s.equipmentShopStock[b.id] = Math.min(SHOP_STOCK_LIMIT, Math.max(0, Math.floor(s.equipmentShopStock[b.id] || 0)))
  })
  if (needsInitialShopStock && CARD_PACKS.every((p) => (s.shopStock[p.id] || 0) <= 0)) {
    s.shopStock.classic = 3
    s.shopStock.silver = 1
    s.shopStock.gold = Math.random() < 0.5 ? 1 : 0
    s.shopStock.special = Math.random() < 0.2 ? 1 : 0
    ;['taoyuan', 'liangshan', 'tiangang', 'xitian', 'honglou'].forEach((id) => {
      if (Math.random() < 0.5) s.shopStock[id] = 1
    })
  }
  if (needsInitialShopStock && EQUIPMENT_BOXES.every((b) => (s.equipmentShopStock[b.id] || 0) <= 0)) {
    s.equipmentShopStock.gear_basic = 2
    s.equipmentShopStock.gear_named = Math.random() < 0.5 ? 1 : 0
    s.equipmentShopStock.gear_divine = Math.random() < 0.18 ? 1 : 0
  }
  s.lastShopRestockAt = s.lastShopRestockAt || Date.now()
  restockShop(s)
  s.lastCheckInDay = s.lastCheckInDay || ''
  return s
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function bCount(s, id) {
  return s.buildings[id] || 0
}

function seasonMult(s) {
  const seeds = s.season && s.season.daoSeeds ? s.season.daoSeeds : 0
  return 1 + seeds * 0.08
}

function totalBuildings(s) {
  return Object.keys(s.buildings).reduce((sum, id) => sum + (s.buildings[id] || 0), 0)
}

function totalBeasts(s) {
  return Object.keys(s.beasts).reduce((sum, id) => sum + (s.beasts[id] || 0), 0)
}

function rollBeastRank() {
  const roll = Math.random()
  let acc = 0
  for (let i = 0; i < BEAST_RANKS.length; i += 1) {
    acc += BEAST_RANKS[i].rate
    if (roll < acc) return BEAST_RANKS[i]
  }
  return BEAST_RANKS[0]
}

function addBeast(s, beast, rank) {
  s.beastRanks = s.beastRanks || {}
  s.beasts[beast.id] = (s.beasts[beast.id] || 0) + 1
  s.beastRanks[beast.id] = s.beastRanks[beast.id] || {}
  const rankId = rank && rank.id ? rank.id : BEAST_RANKS[0].id
  s.beastRanks[beast.id][rankId] = (s.beastRanks[beast.id][rankId] || 0) + 1
  const rankData = BEAST_RANKS.find((x) => x.id === rankId) || BEAST_RANKS[0]
  return { ...beast, rank: rankId, rankName: rankData.name, rar: rankId }
}

function bestBeastRank(s, id) {
  const ranks = s.beastRanks && s.beastRanks[id] ? s.beastRanks[id] : {}
  for (let i = BEAST_RANKS.length - 1; i >= 0; i -= 1) {
    const rank = BEAST_RANKS[i]
    if ((ranks[rank.id] || 0) > 0) return rank.id
  }
  return (s.beasts[id] || 0) > 0 ? BEAST_RANKS[0].id : ''
}

function beastRankName(id) {
  const rank = BEAST_RANKS.find((x) => x.id === id)
  return rank ? rank.name : ''
}

function cardLevel(s, id) {
  return s.cards[id] || 0
}

function cardUpgradeNeed(level) {
  if (level <= 0 || level >= CARD_MAX_LEVEL) return 0
  return level * 10
}

function cardShardProgress(s, id) {
  const level = cardLevel(s, id)
  const need = cardUpgradeNeed(level)
  const shards = level > 0 && level < CARD_MAX_LEVEL ? Math.max(0, Math.floor(s.cardShards[id] || 0)) : 0
  return {
    shards,
    need,
    text: level > 0 && level < CARD_MAX_LEVEL ? `${shards}/${need}` : (level >= CARD_MAX_LEVEL ? '满级' : '未获得')
  }
}

function cardSellValue(rarity) {
  return {
    铜卡: 300,
    银卡: 1200,
    金卡: 6000,
    特别卡: 30000
  }[rarity] || 300
}

function equipmentSellValue(rarity) {
  return {
    凡品: 500,
    良品: 1800,
    名器: 9000,
    神器: 45000
  }[rarity] || 500
}

function sellableCards(s) {
  return CIV_CARDS.reduce((out, c) => {
    const count = cardLevel(s, c.id) >= CARD_MAX_LEVEL ? Math.max(0, s.cardShards[c.id] || 0) : 0
    if (count > 0) {
      out.count += count
      out.gold += count * cardSellValue(c.rar)
    }
    return out
  }, { count: 0, gold: 0 })
}

function sellableEquipments(s) {
  return EQUIPMENTS.reduce((out, e) => {
    const count = Math.max(0, (s.equipments[e.id] || 0) - 1)
    if (count > 0) {
      out.count += count
      out.gold += count * equipmentSellValue(e.rar)
    }
    return out
  }, { count: 0, gold: 0 })
}

function totalCards(s) {
  return Object.keys(s.cards).reduce((sum, id) => sum + (cardLevel(s, id) > 0 ? 1 : 0), 0)
}

function activeSynergies(s) {
  return SYNERGIES.filter((x) => !!s.zodiacRecruited[x.zodiac] && (s.beasts[x.beast] || 0) > 0)
}

function secretComboActive(s, x) {
  if (x.zodiac && s.bloodline !== x.zodiac) return false
  if (x.beast && (s.beasts[x.beast] || 0) <= 0) return false
  if (x.realm && s.realm < x.realm) return false
  if (x.building && bCount(s, x.building) < x.count) return false
  return true
}

function activeSecretCombos(s) {
  return SECRET_COMBOS.filter((x) => secretComboActive(s, x))
}

function synergyRequirement(x) {
  const z = ZODIAC.find((item) => item.id === x.zodiac)
  const b = BEASTS.find((item) => item.id === x.beast)
  return `${z ? z.name : x.zodiac} + ${b ? b.name : x.beast}`
}

function globalMult(s, resKey) {
  let m = 1
  if (s.bloodline) {
    const z = ZODIAC.find((x) => x.id === s.bloodline)
    if (z && z.mult) {
      if (z.mult.all) m *= 1 + z.mult.all
      if (z.mult[resKey]) m *= 1 + z.mult[resKey]
    }
  }
  m *= 1 + Object.keys(s.zodiacRecruited).length * 0.03
  let bm = 0
  Object.keys(s.beasts).forEach((id) => {
    const b = BEASTS.find((x) => x.id === id)
    if (b) bm += b.mult * Math.min(s.beasts[id], 5)
  })
  m *= 1 + bm
  Object.keys(s.evolutions).forEach((id) => {
    const ev = EVOLUTIONS.find((x) => x.id === id)
    if (ev && ev.mult) {
      if (ev.mult.all) m *= 1 + ev.mult.all
      if (ev.mult[resKey]) m *= 1 + ev.mult[resKey]
    }
  })
  Object.keys(s.equipments).forEach((id) => {
    const e = EQUIPMENTS.find((x) => x.id === id)
    const lv = s.equipments[id] || 0
    if (e && e.mult && lv > 0) {
      if (e.mult.all) m *= 1 + e.mult.all * lv
      if (e.mult[resKey]) m *= 1 + e.mult[resKey] * lv
    }
  })
  Object.keys(s.cards).forEach((id) => {
    const c = CIV_CARDS.find((x) => x.id === id)
    const lv = cardLevel(s, id)
    if (c && c.mult && lv > 0) {
      if (c.mult.all) m *= 1 + c.mult.all * lv
      if (c.mult[resKey]) m *= 1 + c.mult[resKey] * lv
    }
  })
  activeSynergies(s).forEach((x) => {
    if (x.mult) {
      if (x.mult.all) m *= 1 + x.mult.all
      if (x.mult[resKey]) m *= 1 + x.mult[resKey]
    }
  })
  activeSecretCombos(s).forEach((x) => {
    if (x.mult) {
      if (x.mult.all) m *= 1 + x.mult.all
      if (x.mult[resKey]) m *= 1 + x.mult[resKey]
    }
  })
  m *= REALMS[s.realm].mult
  Object.keys(s.techs).forEach((id) => {
    const t = TECHS.find((x) => x.id === id)
    if (t && t.mult && (!t.res || t.res === resKey)) m *= 1 + t.mult
  })
  Object.keys(s.starProj).forEach((id) => {
    const p = STARPROJ.find((x) => x.id === id)
    if (p) m *= 1 + p.mult
  })
  m *= seasonMult(s)
  return m
}

function costCut(s) {
  const z = ZODIAC.find((x) => x.id === s.bloodline)
  const synergyCut = activeSynergies(s).reduce((sum, x) => sum + (x.costCut || 0), 0)
  const comboCut = activeSecretCombos(s).reduce((sum, x) => sum + (x.costCut || 0), 0)
  const cardCut = Object.keys(s.cards).reduce((sum, id) => {
    const c = CIV_CARDS.find((x) => x.id === id)
    return sum + (c && c.costCut ? c.costCut * cardLevel(s, id) : 0)
  }, 0)
  return clamp((z && z.costCut ? z.costCut : 0) + synergyCut + comboCut + cardCut, 0, 0.5)
}

function tapMult(s) {
  let m = 1
  const z = ZODIAC.find((x) => x.id === s.bloodline)
  if (z && z.tap) m *= 1 + z.tap
  Object.keys(s.techs).forEach((id) => {
    const t = TECHS.find((x) => x.id === id)
    if (t && t.tap) m *= 1 + t.tap
  })
  activeSynergies(s).forEach((x) => {
    if (x.tap) m *= 1 + x.tap
  })
  activeSecretCombos(s).forEach((x) => {
    if (x.tap) m *= 1 + x.tap
  })
  Object.keys(s.cards).forEach((id) => {
    const c = CIV_CARDS.find((x) => x.id === id)
    if (c && c.tap) m *= 1 + c.tap * cardLevel(s, id)
  })
  Object.keys(s.equipments).forEach((id) => {
    const e = EQUIPMENTS.find((x) => x.id === id)
    if (e && e.tap) m *= 1 + e.tap * (s.equipments[id] || 0)
  })
  m *= seasonMult(s)
  return m
}

function buildingCost(s, b) {
  const base = Math.floor(b.cost * Math.pow(b.growth, bCount(s, b.id)) * (1 - costCut(s)))
  const mix = BUILD_COSTS[b.id] || { gold: 1 }
  const out = {}
  Object.keys(mix).forEach((k) => { out[k] = Math.max(1, Math.floor(base * mix[k])) })
  return out
}

function canPay(s, cost) {
  return Object.keys(cost).every((k) => (s.res[k] || 0) >= cost[k])
}

function pay(s, cost) {
  if (!canPay(s, cost)) return false
  Object.keys(cost).forEach((k) => { s.res[k] -= cost[k] })
  recordGoldSpent(s, cost.gold || 0)
  return true
}

function recordGoldSpent(s, amount) {
  if (!amount || amount <= 0) return
  s.eventGoldSpent = (s.eventGoldSpent || 0) + amount
  maybeEvent(s)
}

function prodPerSec(s) {
  const out = { food: 0, goods: 0, gold: 0, qi: 0, tech: 0, star: 0, gene: 0, time: 0, dark: 0, mind: 0, origin: 0, dao: 0 }
  BUILDINGS.forEach((b) => { out[b.res] += b.prod * bCount(s, b.id) })
  out.qi += bCount(s, 'sect') * 60
  Object.keys(out).forEach((k) => { out[k] *= globalMult(s, k) })
  Object.keys(out).forEach((k) => { out[k] *= SPEED.production })
  out.gold *= SPEED.goldProduction
  out.qi *= SPEED.qiProduction
  return out
}

function tapValue(s) {
  return Math.max(1, Math.floor(Math.pow(4, s.era) * (1 + s.tier) * tapMult(s) * SPEED.tap))
}

function realmCost(r) {
  return Math.floor((r ? r.cost : 0) * SPEED.realmCost)
}

function powerScore(s) {
  const r = s.res
  return r.gold + r.goods * 0.5 + r.food * 0.3 + r.qi * 5 + r.tech * 8 + r.star * 20 +
    r.gene * 60 + r.time * 180 + r.dark * 520 + r.mind * 1400 + r.origin * 4000 + r.dao * 12000 +
    Object.keys(s.buildings).reduce((sum, id) => sum + s.buildings[id] * 50, 0)
}

function eraScore(s) {
  const score = powerScore(s)
  if (!s.peakPower || score > s.peakPower) s.peakPower = score
  return Math.max(s.peakPower || 0, score)
}

function armyPower(s) {
  let b = 0
  BUILDINGS.forEach((x) => { b += bCount(s, x.id) * (x.res === 'gold' ? 2 : 1) * x.prod })
  b += bCount(s, 'barrack') * 8 + bCount(s, 'sect') * 50 + bCount(s, 'factory') * 200 + bCount(s, 'dyson') * 2000
  b += bCount(s, 'gene_lab') * 450 + bCount(s, 'archive') * 800
  let m = 1
  activeSynergies(s).forEach((x) => {
    if (x.army) m *= 1 + x.army
  })
  activeSecretCombos(s).forEach((x) => {
    if (x.army) m *= 1 + x.army
  })
  Object.keys(s.cards).forEach((id) => {
    const c = CIV_CARDS.find((x) => x.id === id)
    if (c && c.army) m *= 1 + c.army * cardLevel(s, id)
  })
  Object.keys(s.equipments).forEach((id) => {
    const e = EQUIPMENTS.find((x) => x.id === id)
    if (e && e.army) m *= 1 + e.army * (s.equipments[id] || 0)
  })
  return Math.floor((10 + b) * globalMult(s, 'gold') * REALMS[s.realm].mult * m * seasonMult(s))
}

function rebootGain(s) {
  const score = eraScore(s)
  if (s.era < REBOOT_MIN_ERA || score < REBOOT_MIN_SCORE) return 0
  const scoreGain = Math.floor(Math.sqrt(score / REBOOT_MIN_SCORE))
  const daoGain = Math.floor((s.res.dao || 0) / 1e5)
  return Math.max(1, scoreGain + daoGain)
}

function canReboot(s) {
  return rebootGain(s) > 0
}

function rebootUniverse(s) {
  const gain = rebootGain(s)
  if (gain <= 0) return null
  const keep = {
    cards: s.cards,
    cardShards: s.cardShards,
    equipments: s.equipments,
    zodiacRecruited: s.zodiacRecruited,
    bloodline: s.bloodline,
    beasts: s.beasts,
    achievements: s.achievements,
    mainChapterClaims: s.mainChapterClaims,
    journeyStoryClaims: s.journeyStoryClaims,
    threeKingdomsStoryClaims: s.threeKingdomsStoryClaims,
    waterMarginStoryClaims: s.waterMarginStoryClaims,
    redChamberStoryClaims: s.redChamberStoryClaims,
    season: {
      cycle: (s.season && s.season.cycle ? s.season.cycle : 0) + 1,
      daoSeeds: (s.season && s.season.daoSeeds ? s.season.daoSeeds : 0) + gain,
      bestPower: Math.max(s.season && s.season.bestPower ? s.season.bestPower : 0, eraScore(s)),
      lastGain: gain
    }
  }
  const fresh = freshState()
  Object.keys(s).forEach((k) => { delete s[k] })
  Object.assign(s, fresh, keep)
  s.last = Date.now()
  return { gain, seeds: s.season.daoSeeds, cycle: s.season.cycle, mult: seasonMult(s) }
}

function tick(s, dt) {
  const prod = prodPerSec(s)
  let expeditionResult = null
  Object.keys(prod).forEach((k) => { s.res[k] += prod[k] * dt })
  restockShop(s)
  if (s.expedition && Date.now() >= s.expedition.endAt) expeditionResult = resolveExpedition(s)
  updateEraTier(s)
  return { expeditionResult }
}

function updateEraTier(s) {
  const era = ERAS[s.era]
  const prog = clamp(eraScore(s) / (era.need * SPEED.eraNeed), 0, 1)
  s.tier = Math.min(era.tiers.length - 1, Math.floor(prog * era.tiers.length))
  return prog
}

function advanceEra(s) {
  if (s.era >= ERAS.length - 1) return false
  if (eraScore(s) < ERAS[s.era].need * SPEED.eraNeed) return false
  s.era += 1
  s.tier = 0
  return true
}

function buyBuilding(s, id) {
  const b = BUILDINGS.find((x) => x.id === id)
  if (!b) return false
  const cost = buildingCost(s, b)
  if (!pay(s, cost)) return false
  s.buildings[id] = bCount(s, id) + 1
  return true
}

function recruitZodiac(s, id) {
  if (s.zodiacRecruited[id] || s.res.gold < 20000) return false
  s.res.gold -= 20000
  recordGoldSpent(s, 20000)
  s.zodiacRecruited[id] = true
  if (!s.bloodline) s.bloodline = id
  return true
}

function setBloodline(s, id) {
  if (!s.zodiacRecruited[id]) return false
  s.bloodline = id
  return true
}

function beastEggCost(s) {
  const total = Object.keys(s.beasts).reduce((sum, k) => sum + s.beasts[k], 0)
  const early = Math.min(total, 14)
  const late = Math.max(0, total - 14)
  return Math.floor(1.5e5 * Math.pow(1.28, early) * Math.pow(1.08, late))
}

function hatchEgg(s) {
  const cost = beastEggCost(s)
  if (s.res.gold < cost) return null
  s.res.gold -= cost
  recordGoldSpent(s, cost)
  const b = BEASTS[Math.floor(Math.random() * BEASTS.length)]
  return addBeast(s, b, rollBeastRank())
}

function cardPackCost(s, id = 'classic') {
  const pack = CARD_PACKS.find((p) => p.id === id) || CARD_PACKS[0]
  return Math.floor(pack.cost * Math.pow(pack.growth, (s.cardPacksBought && s.cardPacksBought[pack.id]) || 0))
}

function restockShop(s, now = Date.now()) {
  if (!s.shopStock) s.shopStock = {}
  if (!s.lastShopRestockAt) s.lastShopRestockAt = now
  const rounds = Math.floor((now - s.lastShopRestockAt) / SHOP_RESTOCK_MS)
  if (rounds <= 0) return null
  const gained = {}
  for (let i = 0; i < Math.min(rounds, 8); i += 1) {
    CARD_PACKS.forEach((p) => {
      let add = 0
      if (p.id === 'classic') add = 1 + Math.floor(Math.random() * 3)
      else if (p.id === 'silver') add = Math.random() < 0.75 ? 1 : 0
      else if (p.id === 'gold') add = Math.random() < 0.4 ? 1 : 0
      else if (p.id === 'special') add = Math.random() < 0.18 ? 1 : 0
      else add = Math.random() < 0.42 ? 1 : 0
      if (add > 0) {
        s.shopStock[p.id] = Math.min(SHOP_STOCK_LIMIT, (s.shopStock[p.id] || 0) + add)
        gained[p.id] = (gained[p.id] || 0) + add
      }
    })
    EQUIPMENT_BOXES.forEach((b) => {
      let add = 0
      if (b.id === 'gear_basic') add = Math.random() < 0.85 ? 1 : 0
      else if (b.id === 'gear_named') add = Math.random() < 0.35 ? 1 : 0
      else if (b.id === 'gear_divine') add = Math.random() < 0.12 ? 1 : 0
      if (add > 0) {
        s.equipmentShopStock[b.id] = Math.min(SHOP_STOCK_LIMIT, (s.equipmentShopStock[b.id] || 0) + add)
        gained[b.id] = (gained[b.id] || 0) + add
      }
    })
  }
  s.lastShopRestockAt += rounds * SHOP_RESTOCK_MS
  return gained
}

function equipmentBoxCost(s, id = 'gear_basic') {
  const box = EQUIPMENT_BOXES.find((b) => b.id === id) || EQUIPMENT_BOXES[0]
  return Math.floor(box.cost * Math.pow(box.growth, (s.equipmentBoxesBought && s.equipmentBoxesBought[box.id]) || 0))
}

function rollEquipment(s, boxId = 'gear_basic') {
  const box = EQUIPMENT_BOXES.find((b) => b.id === boxId) || EQUIPMENT_BOXES[0]
  const roll = Math.random()
  const rates = box.rates
  const rarity = roll < rates.divine ? '神器' : (roll < rates.divine + rates.named ? '名器' : (roll < rates.divine + rates.named + rates.fine ? '良品' : '凡品'))
  let pool = EQUIPMENTS.filter((e) => e.rar === rarity)
  if (!pool.length) pool = EQUIPMENTS
  const item = pool[Math.floor(Math.random() * pool.length)]
  const before = s.equipments[item.id] || 0
  s.equipments[item.id] = before + 1
  return { ...item, level: before + 1, duplicate: before > 0 }
}

function buyEquipmentBox(s, id = 'gear_basic') {
  const box = EQUIPMENT_BOXES.find((b) => b.id === id) || EQUIPMENT_BOXES[0]
  restockShop(s)
  if ((s.equipmentShopStock[box.id] || 0) <= 0) return { ok: false, reason: 'soldout', box }
  const cost = equipmentBoxCost(s, box.id)
  if (s.res.gold < cost) return { ok: false, reason: 'gold', box }
  s.res.gold -= cost
  recordGoldSpent(s, cost)
  s.equipmentShopStock[box.id] -= 1
  s.equipmentBoxes[box.id] = (s.equipmentBoxes[box.id] || 0) + 1
  s.equipmentBoxesBought[box.id] = (s.equipmentBoxesBought[box.id] || 0) + 1
  return { ok: true, box, cost, stock: s.equipmentBoxes[box.id] }
}

function openEquipmentBox(s, id = 'gear_basic') {
  const box = EQUIPMENT_BOXES.find((b) => b.id === id) || EQUIPMENT_BOXES[0]
  if ((s.equipmentBoxes[box.id] || 0) <= 0) return null
  s.equipmentBoxes[box.id] -= 1
  return {
    box,
    stock: s.equipmentBoxes[box.id],
    items: [rollEquipment(s, box.id), rollEquipment(s, box.id)]
  }
}

function sellDuplicateCards(s) {
  const value = sellableCards(s)
  if (value.count <= 0) return null
  CIV_CARDS.forEach((c) => {
    if (cardLevel(s, c.id) >= CARD_MAX_LEVEL && (s.cardShards[c.id] || 0) > 0) s.cardShards[c.id] = 0
  })
  s.res.gold += value.gold
  return value
}

function sellDuplicateEquipments(s) {
  const value = sellableEquipments(s)
  if (value.count <= 0) return null
  EQUIPMENTS.forEach((e) => {
    if ((s.equipments[e.id] || 0) > 1) s.equipments[e.id] = 1
  })
  s.res.gold += value.gold
  return value
}

function rollCard(s, packId = 'classic') {
  const pack = CARD_PACKS.find((p) => p.id === packId) || CARD_PACKS[0]
  const pool = CIV_CARDS.filter((c) => {
    if (s.era < c.era) return false
    if (pack.books && !pack.books.includes(c.book)) return false
    if (pack.ids && !pack.ids.includes(c.id)) return false
    return true
  })
  const roll = Math.random()
  const rates = pack.rates
  const rarity = roll < rates.special ? '特别卡' : (roll < rates.special + rates.gold ? '金卡' : (roll < rates.special + rates.gold + rates.silver ? '银卡' : '铜卡'))
  let rarityPool = pool.filter((c) => c.rar === rarity)
  if (!rarityPool.length) rarityPool = pool
  const card = rarityPool[Math.floor(Math.random() * rarityPool.length)]
  const before = cardLevel(s, card.id)
  let level = before
  let shards = Math.max(0, Math.floor(s.cardShards[card.id] || 0))
  let upgraded = false
  if (level <= 0) {
    level = 1
    shards = 0
  } else if (level < CARD_MAX_LEVEL) {
    shards += 1
    while (level < CARD_MAX_LEVEL && shards >= cardUpgradeNeed(level)) {
      shards -= cardUpgradeNeed(level)
      level += 1
      upgraded = true
    }
    if (level >= CARD_MAX_LEVEL) shards = 0
  } else {
    shards += 1
  }
  s.cards[card.id] = level
  s.cardShards[card.id] = shards
  const progress = cardShardProgress(s, card.id)
  return {
    ...card,
    level,
    beforeLevel: before,
    duplicate: before > 0,
    upgraded,
    shards: progress.shards,
    overflow: level >= CARD_MAX_LEVEL && before >= CARD_MAX_LEVEL,
    shardNeed: progress.need,
    shardText: progress.text
  }
}

function buyCardPack(s, id = 'classic') {
  const pack = CARD_PACKS.find((p) => p.id === id) || CARD_PACKS[0]
  restockShop(s)
  if ((s.shopStock[pack.id] || 0) <= 0) return { ok: false, reason: 'soldout', pack }
  const cost = cardPackCost(s, pack.id)
  if (s.res.gold < cost) return { ok: false, reason: 'gold', pack }
  s.res.gold -= cost
  recordGoldSpent(s, cost)
  s.shopStock[pack.id] -= 1
  s.cardPacks[pack.id] = (s.cardPacks[pack.id] || 0) + 1
  s.cardPacksBought[pack.id] = (s.cardPacksBought[pack.id] || 0) + 1
  return { ok: true, pack, cost, stock: s.cardPacks[pack.id] }
}

function openCardPack(s, id = 'classic') {
  const pack = CARD_PACKS.find((p) => p.id === id) || CARD_PACKS[0]
  if ((s.cardPacks[pack.id] || 0) <= 0) return null
  s.cardPacks[pack.id] -= 1
  return {
    pack,
    stock: s.cardPacks[pack.id],
    cards: [rollCard(s, pack.id), rollCard(s, pack.id), rollCard(s, pack.id)]
  }
}

function breakRealm(s, index) {
  const r = REALMS[index]
  const cost = realmCost(r)
  if (!r || s.realm !== index - 1 || s.res.qi < cost) return false
  s.res.qi -= cost
  s.realm = index
  return true
}

function buyTech(s, id) {
  const t = TECHS.find((x) => x.id === id)
  if (!t || s.techs[id] || s.res.tech < t.cost) return false
  s.res.tech -= t.cost
  s.techs[id] = true
  return true
}

function buyStar(s, id) {
  const p = STARPROJ.find((x) => x.id === id)
  if (!p || s.starProj[id] || s.res.star < p.cost) return false
  s.res.star -= p.cost
  s.starProj[id] = true
  return true
}

function buyEvolution(s, id) {
  const ev = EVOLUTIONS.find((x) => x.id === id)
  if (!ev || s.evolutions[id] || s.res.gene < ev.cost) return false
  const unlocked = ev.type === 'zodiac' ? !!s.zodiacRecruited[ev.target] : (s.beasts[ev.target] || 0) > 0
  if (!unlocked) return false
  s.res.gene -= ev.cost
  s.evolutions[id] = true
  return true
}

function expeditionFoodCost(d) {
  return Math.max(20, Math.floor(d.power * 0.08))
}

function startExpedition(s, id) {
  if (s.expedition) return false
  const d = DUNGEONS.find((x) => x.id === id)
  if (!d) return false
  const foodCost = expeditionFoodCost(d)
  if (s.res.food < foodCost) return false
  s.res.food -= foodCost
  const ratio = armyPower(s) / d.power
  const winRate = clamp(ratio >= 1 ? 0.6 + 0.35 * Math.min(1, ratio - 1) : 0.6 * ratio, 0.02, 0.97)
  const duration = Math.max(2, d.dur * SPEED.expeditionDuration)
  s.expedition = { id, endAt: Date.now() + duration * 1000, win: Math.random() < winRate }
  return true
}

function resolveExpedition(s) {
  if (!s.expedition || Date.now() < s.expedition.endAt) return null
  const d = DUNGEONS.find((x) => x.id === s.expedition.id)
  const win = s.expedition.win
  s.expedition = null
  if (!d) return null
  if (!win) return { win: false, dungeon: d }
  s.dungeonWins[d.id] = (s.dungeonWins[d.id] || 0) + 1
  Object.keys(d.reward).forEach((k) => { s.res[k] += d.reward[k] })
  let beast = null
  if (d.egg && Math.random() < d.egg && s.era >= 2) {
    beast = BEASTS[Math.floor(Math.random() * BEASTS.length)]
    beast = addBeast(s, beast, rollBeastRank())
  }
  return { win: true, dungeon: d, reward: d.reward, beast }
}

function eventReward(e, s) {
  const scale = 1 + s.era * 0.8
  const out = {}
  Object.keys(e.reward).forEach((k) => { out[k] = Math.floor(e.reward[k] * scale) })
  return out
}

function eventGoldNeed(s) {
  return EVENT_GOLD_NEED[Math.min(s.era, EVENT_GOLD_NEED.length - 1)]
}

function maybeEvent(s, now = Date.now()) {
  if (s.eventOffer && s.eventOffer.expiresAt > now) return null
  if (s.eventOffer && s.eventOffer.expiresAt <= now) s.eventOffer = null
  if (s.eventOffer) return null
  const need = eventGoldNeed(s)
  if ((s.eventGoldSpent || 0) < need) return null
  const pool = EVENTS.filter((e) => s.era >= e.minEra)
  if (!pool.length) return null
  s.eventGoldSpent -= need
  const e = pool[Math.floor(Math.random() * pool.length)]
  s.eventOffer = { id: e.id, expiresAt: now + EVENT_OFFER_MS }
  return s.eventOffer
}

function claimEvent(s) {
  const offer = s.eventOffer
  if (!offer || offer.expiresAt <= Date.now()) {
    s.eventOffer = null
    return null
  }
  const e = EVENTS.find((x) => x.id === offer.id)
  if (!e) return null
  const reward = eventReward(e, s)
  Object.keys(reward).forEach((k) => { s.res[k] += reward[k] })
  s.eventOffer = null
  return { event: e, reward }
}

function applyOffline(s, now = Date.now()) {
  const dt = Math.max(0, (now - (s.last || now)) / 1000)
  if (dt < 60) return null
  const capped = Math.min(dt, 8 * 3600)
  let eff = 0.5
  activeSynergies(s).forEach((x) => {
    if (x.offline) eff *= 1 + x.offline
  })
  activeSecretCombos(s).forEach((x) => {
    if (x.offline) eff *= 1 + x.offline
  })
  const prod = prodPerSec(s)
  const gained = {}
  Object.keys(prod).forEach((k) => {
    const v = prod[k] * capped * eff
    if (v >= 1) {
      s.res[k] += v
      gained[k] = v
    }
  })
  return { minutes: Math.floor(dt / 60), gained }
}

function achievementView(s) {
  return ACHIEVEMENTS.map((a) => {
    const done = a.done(s)
    const claimed = !!s.achievements[a.id]
    return { ...a, done, claimed, canClaim: done && !claimed, rewardText: costText(a.reward) }
  })
}

function mainChapterView(s) {
  return MAIN_CHAPTERS.map((chapter) => {
    const steps = chapter.steps.map((step) => ({ ...step, done: step.done(s) }))
    const doneCount = steps.filter((step) => step.done).length
    const claimed = !!s.mainChapterClaims[chapter.id]
    const done = doneCount >= steps.length
    return {
      id: chapter.id,
      title: chapter.title,
      desc: chapter.desc,
      reward: chapter.reward,
      rewardText: costText(chapter.reward),
      steps,
      stepText: steps.map((step) => `${step.short}${step.done ? '✓' : '○'}`).join(' · '),
      progressText: `${doneCount} / ${steps.length}`,
      done,
      claimed,
      canClaim: done && !claimed
    }
  })
}

function claimAchievement(s, id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id)
  if (!a || s.achievements[id] || !a.done(s)) return false
  Object.keys(a.reward).forEach((k) => { s.res[k] += a.reward[k] })
  s.achievements[id] = true
  return true
}

function claimMainChapter(s, id) {
  const chapter = MAIN_CHAPTERS.find((x) => x.id === id)
  if (!chapter || s.mainChapterClaims[id]) return null
  if (!chapter.steps.every((step) => step.done(s))) return null
  Object.keys(chapter.reward).forEach((k) => { s.res[k] += chapter.reward[k] })
  s.mainChapterClaims[id] = true
  return { chapter, reward: chapter.reward, rewardText: costText(chapter.reward) }
}

function journeyStoryView(s) {
  const claimedCount = JOURNEY_STORIES.reduce((sum, story) => sum + (s.journeyStoryClaims[story.id] ? 1 : 0), 0)
  const next = JOURNEY_STORIES.find((story) => !s.journeyStoryClaims[story.id])
  if (!next) {
    return {
      done: true,
      claimedCount,
      total: JOURNEY_STORIES.length,
      progressText: `${claimedCount}/${JOURNEY_STORIES.length}`,
      title: '西游记百回圆满',
      desc: '一百回故事已全部收入文明史册。',
      needText: '已完成',
      rewardText: '',
      canClaim: false
    }
  }
  const requiredCards = next.requiredCards.map((id) => {
    const card = CIV_CARDS.find((x) => x.id === id)
    const level = cardLevel(s, id)
    const reached = level >= next.requiredLevel
    return {
      id,
      name: card ? card.name : id,
      level,
      requiredLevel: next.requiredLevel,
      reached,
      text: `${reached ? '✓' : '○'}${card ? card.name : id} Lv.${level}/${next.requiredLevel}`
    }
  })
  const previousClaimed = next.no === 1 || !!s.journeyStoryClaims[`journey_${next.no - 1}`]
  const canClaim = previousClaimed && requiredCards.every((card) => card.reached)
  const reward = scaledReward(next.reward, s)
  return {
    ...next,
    done: false,
    claimedCount,
    total: JOURNEY_STORIES.length,
    progressText: `${claimedCount}/${JOURNEY_STORIES.length}`,
    desc: `第 ${next.no} 回：${next.title}`,
    requiredLevel: next.requiredLevel,
    requiredCards,
    requirementText: requiredCards.map((card) => card.text).join(' · '),
    rewardText: costText(reward),
    canClaim
  }
}

function claimJourneyStory(s) {
  const view = journeyStoryView(s)
  if (!view || view.done || !view.canClaim) return null
  const story = JOURNEY_STORIES.find((x) => x.id === view.id)
  if (!story) return null
  const reward = scaledReward(story.reward, s)
  Object.keys(reward).forEach((k) => { s.res[k] += reward[k] })
  s.journeyStoryClaims[story.id] = true
  return { story, reward, rewardText: costText(reward) }
}

function bookStoryView(s, config) {
  const claimed = s[config.claimKey] || {}
  const claimedCount = config.stories.reduce((sum, story) => sum + (claimed[story.id] ? 1 : 0), 0)
  const next = config.stories.find((story) => !claimed[story.id])
  if (!next) {
    return {
      bookLabel: config.bookLabel,
      icon: config.icon,
      doneTitle: config.doneTitle,
      done: true,
      claimedCount,
      total: config.stories.length,
      progressText: `${claimedCount}/${config.stories.length}`,
      title: config.doneDesc,
      desc: `${config.bookLabel}人物收集任务已全部完成。`,
      needText: '已完成',
      rewardText: '',
      canClaim: false
    }
  }
  const requiredCards = next.requiredCards.map((id) => {
    const card = CIV_CARDS.find((x) => x.id === id)
    const level = cardLevel(s, id)
    const reached = level >= next.requiredLevel
    return {
      id,
      name: card ? card.name : id,
      level,
      requiredLevel: next.requiredLevel,
      reached,
      text: `${reached ? '✓' : '○'}${card ? card.name : id} Lv.${level}/${next.requiredLevel}`
    }
  })
  const previousClaimed = next.no === 1 || !!claimed[`${config.idPrefix}_${next.no - 1}`]
  const canClaim = previousClaimed && requiredCards.every((card) => card.reached)
  const reward = next.reward
  return {
    ...next,
    bookLabel: config.bookLabel,
    icon: config.icon,
    doneTitle: config.doneTitle,
    done: false,
    claimedCount,
    total: config.stories.length,
    progressText: `${claimedCount}/${config.stories.length}`,
    desc: `第 ${next.no} 组：${requiredCards.map((card) => card.name).join('、')}`,
    requiredLevel: next.requiredLevel,
    requiredCards,
    requirementText: requiredCards.map((card) => card.text).join(' · '),
    rewardText: costText(reward),
    canClaim
  }
}

function waterMarginStoryView(s) {
  return bookStoryView(s, {
    bookLabel: '水浒传',
    icon: '🏔️',
    doneTitle: '水浒传全员聚义',
    doneDesc: '水浒人物已全部收入文明图鉴。',
    idPrefix: 'water_margin',
    claimKey: 'waterMarginStoryClaims',
    stories: WATER_MARGIN_STORIES
  })
}

function threeKingdomsStoryView(s) {
  return bookStoryView(s, {
    bookLabel: '三国演义',
    icon: '⚔️',
    doneTitle: '三国群雄归册',
    doneDesc: '三国人物已全部收入文明图鉴。',
    idPrefix: 'three_kingdoms',
    claimKey: 'threeKingdomsStoryClaims',
    stories: THREE_KINGDOMS_STORIES
  })
}

function redChamberStoryView(s) {
  return bookStoryView(s, {
    bookLabel: '红楼梦',
    icon: '🌸',
    doneTitle: '红楼群芳入梦',
    doneDesc: '红楼人物已全部收入文明图鉴。',
    idPrefix: 'red_chamber',
    claimKey: 'redChamberStoryClaims',
    stories: RED_CHAMBER_STORIES
  })
}

function claimWaterMarginStory(s) {
  return claimBookStory(s, waterMarginStoryView, WATER_MARGIN_STORIES, 'waterMarginStoryClaims')
}

function claimBookStory(s, viewFn, stories, claimKey) {
  const view = viewFn(s)
  if (!view || view.done || !view.canClaim) return null
  const story = stories.find((x) => x.id === view.id)
  if (!story) return null
  const reward = story.reward
  Object.keys(reward).forEach((k) => { s.res[k] += reward[k] })
  s[claimKey] = s[claimKey] || {}
  s[claimKey][story.id] = true
  return { story, reward, rewardText: costText(reward) }
}

function claimThreeKingdomsStory(s) {
  return claimBookStory(s, threeKingdomsStoryView, THREE_KINGDOMS_STORIES, 'threeKingdomsStoryClaims')
}

function claimRedChamberStory(s) {
  return claimBookStory(s, redChamberStoryView, RED_CHAMBER_STORIES, 'redChamberStoryClaims')
}

function dayKey(now = Date.now()) {
  const d = new Date(now)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function checkInReward(s) {
  const eraScale = Math.pow(10, Math.min(s.era, 6))
  const reward = {
    gold: Math.floor(2000 * eraScale),
    food: Math.floor(1200 * eraScale),
    goods: Math.floor(1000 * eraScale)
  }
  if (s.era >= 3) reward.qi = Math.floor(8000 * Math.pow(8, s.era - 3))
  if (s.era >= 4) reward.tech = Math.floor(5000 * Math.pow(8, s.era - 4))
  if (s.era >= 5) reward.star = Math.floor(3000 * Math.pow(8, s.era - 5))
  if (s.era >= 6) reward.gene = Math.floor(2000 * Math.pow(8, s.era - 6))
  return reward
}

function canCheckIn(s, now = Date.now()) {
  return s.lastCheckInDay !== dayKey(now)
}

function claimCheckIn(s, now = Date.now()) {
  if (!canCheckIn(s, now)) return null
  const reward = checkInReward(s)
  Object.keys(reward).forEach((k) => { s.res[k] += reward[k] })
  s.lastCheckInDay = dayKey(now)
  return { reward, rewardText: costText(reward) }
}

function recordDailyProgress(s, type, amount = 1) {
  ensureDailyTasks(s)
  DAILY_TASKS.forEach((task) => {
    if (task.type !== type || s.dailyTasks.claimed[task.id]) return
    const before = s.dailyTasks.progress[task.id] || 0
    s.dailyTasks.progress[task.id] = Math.min(task.target, before + amount)
  })
}

function dailyTaskView(s) {
  ensureDailyTasks(s)
  return DAILY_TASKS.map((task) => {
    const progress = Math.min(task.target, s.dailyTasks.progress[task.id] || 0)
    const claimed = !!s.dailyTasks.claimed[task.id]
    const done = progress >= task.target
    const reward = scaledReward(task.reward, s)
    return {
      ...task,
      progress,
      claimed,
      done,
      canClaim: done && !claimed,
      progressText: `${fmt(progress)} / ${fmt(task.target)}`,
      reward,
      rewardText: costText(reward)
    }
  })
}

function generatedCardDetails(card) {
  const rarityBase = { '铜卡': 58, '银卡': 68, '金卡': 78, '特别卡': 88 }[card.rar] || 60
  const isArmy = !!card.army
  const isWisdom = !!(card.costCut || (card.mult && (card.mult.tech || card.mult.qi || card.mult.all)))
  const isResource = !!(card.mult && (card.mult.gold || card.mult.goods || card.mult.food))
  return {
    force: Math.min(99, rarityBase + (isArmy ? 14 : 0)),
    wisdom: Math.min(99, rarityBase + (isWisdom ? 14 : 2)),
    lead: Math.min(99, rarityBase + (isResource || isArmy ? 10 : 4)),
    charm: Math.min(99, rarityBase + (card.tap || card.mult && card.mult.gold ? 10 : 3)),
    bio: `${card.name}为梁山好汉之一，可通过水浒卡包收集并提升文明能力。`
  }
}

function claimDailyTask(s, id) {
  ensureDailyTasks(s)
  const task = DAILY_TASKS.find((x) => x.id === id)
  if (!task) return null
  const progress = s.dailyTasks.progress[id] || 0
  if (progress < task.target || s.dailyTasks.claimed[id]) return null
  const reward = scaledReward(task.reward, s)
  Object.keys(reward).forEach((k) => { s.res[k] += reward[k] })
  s.dailyTasks.claimed[id] = true
  return { task, reward, rewardText: costText(reward) }
}

function visibleData(s) {
  restockShop(s)
  maybeEvent(s)
  ensureDailyTasks(s)
  const score = eraScore(s)
  const era = ERAS[s.era]
  const progress = clamp(score / (era.need * SPEED.eraNeed), 0, 1)
  const prod = prodPerSec(s)
  const event = s.eventOffer ? EVENTS.find((e) => e.id === s.eventOffer.id) : null
  const eventNeed = eventGoldNeed(s)
  const eventProgress = Math.min(s.eventGoldSpent || 0, eventNeed)
  const nextShopRestockSeconds = Math.max(0, Math.ceil((SHOP_RESTOCK_MS - (Date.now() - (s.lastShopRestockAt || Date.now()))) / 1000))
  const cardSell = sellableCards(s)
  const equipmentSell = sellableEquipments(s)
  const rebootReward = rebootGain(s)
  return {
    era,
    tier: era.tiers[Math.min(s.tier, era.tiers.length - 1)],
    progress,
    score,
    season: {
      cycle: s.season.cycle,
      daoSeeds: s.season.daoSeeds,
      bestPower: s.season.bestPower,
      lastGain: s.season.lastGain,
      mult: seasonMult(s),
      multText: `+${Math.round((seasonMult(s) - 1) * 100)}%`,
      canReboot: rebootReward > 0,
      reward: rebootReward,
      rewardText: fmt(rebootReward),
      needText: fmt(REBOOT_MIN_SCORE)
    },
    secretComboCount: activeSecretCombos(s).length,
    tap: tapValue(s),
    army: armyPower(s),
    synergies: SYNERGIES.map((x) => ({ ...x, needText: synergyRequirement(x), active: activeSynergies(s).some((a) => a.id === x.id) })),
    secretCombos: SECRET_COMBOS.map((x) => ({ ...x, active: secretComboActive(s, x), statusText: secretComboActive(s, x) ? '已激活' : '线索' })),
    mainChapters: mainChapterView(s),
    journeyStory: journeyStoryView(s),
    threeKingdomsStory: threeKingdomsStoryView(s),
    waterMarginStory: waterMarginStoryView(s),
    redChamberStory: redChamberStoryView(s),
    achievements: achievementView(s),
    dailyTasks: dailyTaskView(s),
    canCheckIn: canCheckIn(s),
    checkInRewardText: costText(checkInReward(s)),
    eventProgressText: `${fmt(eventProgress)} / ${fmt(eventNeed)}`,
    eventOffer: event ? { ...event, rewardText: costText(eventReward(event, s)), seconds: Math.max(0, Math.ceil((s.eventOffer.expiresAt - Date.now()) / 1000)) } : null,
    resources: RES.filter((r) => r.era <= s.era).map((r) => ({
      ...r,
      value: fmt(s.res[r.key]),
      prod: fmtRate(prod[r.key])
    })),
    buildings: BUILDINGS.filter((b) => b.era <= s.era).map((b) => {
      const cost = buildingCost(s, b)
      return { ...b, count: bCount(s, b.id), cost, costText: costText(cost), canBuy: canPay(s, cost), unit: fmtRate(b.prod * globalMult(s, b.res)) }
    }),
    zodiacs: ZODIAC.map((z) => ({ ...z, recruited: !!s.zodiacRecruited[z.id], isBlood: s.bloodline === z.id, canRecruit: s.res.gold >= 20000 })),
    beasts: BEASTS.map((b) => {
      const rank = bestBeastRank(s, b.id)
      const ranks = s.beastRanks && s.beastRanks[b.id] ? s.beastRanks[b.id] : {}
      return { ...b, count: s.beasts[b.id] || 0, rank, rankName: beastRankName(rank), ranks, rar: rank || 'S' }
    }),
    cardPacks: CARD_PACKS.map((p) => ({
      ...p,
      stock: s.cardPacks[p.id] || 0,
      shopStock: s.shopStock[p.id] || 0,
      bought: s.cardPacksBought[p.id] || 0,
      cost: cardPackCost(s, p.id),
      costText: fmt(cardPackCost(s, p.id)),
      soldOut: (s.shopStock[p.id] || 0) <= 0,
      canAfford: s.res.gold >= cardPackCost(s, p.id),
      canBuy: (s.shopStock[p.id] || 0) > 0 && s.res.gold >= cardPackCost(s, p.id),
      canOpen: (s.cardPacks[p.id] || 0) > 0
    })),
    nextShopRestockSeconds,
    totalCardPacks: CARD_PACKS.reduce((sum, p) => sum + (s.cardPacks[p.id] || 0), 0),
    cardSell: { ...cardSell, goldText: fmt(cardSell.gold) },
    equipmentBoxes: EQUIPMENT_BOXES.map((b) => ({
      ...b,
      stock: s.equipmentBoxes[b.id] || 0,
      shopStock: s.equipmentShopStock[b.id] || 0,
      bought: s.equipmentBoxesBought[b.id] || 0,
      cost: equipmentBoxCost(s, b.id),
      costText: fmt(equipmentBoxCost(s, b.id)),
      soldOut: (s.equipmentShopStock[b.id] || 0) <= 0,
      canBuy: (s.equipmentShopStock[b.id] || 0) > 0 && s.res.gold >= equipmentBoxCost(s, b.id),
      canOpen: (s.equipmentBoxes[b.id] || 0) > 0
    })),
    equipmentCollected: EQUIPMENTS.filter((e) => (s.equipments[e.id] || 0) > 0).length,
    equipmentTotal: EQUIPMENTS.length,
    equipmentSell: { ...equipmentSell, goldText: fmt(equipmentSell.gold) },
    equipments: EQUIPMENTS.map((e) => {
      const level = s.equipments[e.id] || 0
      return { ...e, level, owned: level > 0, levelText: level > 0 ? `★${level}` : '未获得' }
    }),
    cardCollected: CIV_CARDS.filter((c) => s.era >= c.era && cardLevel(s, c.id) > 0).length,
    cardTotal: CIV_CARDS.filter((c) => s.era >= c.era).length,
    cards: CIV_CARDS.filter((c) => s.era >= c.era).map((c) => {
      const level = cardLevel(s, c.id)
      const progress = cardShardProgress(s, c.id)
      return {
        ...c,
        ...(CARD_DETAILS[c.id] || generatedCardDetails(c)),
        level,
        owned: level > 0,
        levelText: level > 0 ? `Lv.${level}` : '未获得',
        shards: progress.shards,
        shardNeed: progress.need,
        shardText: progress.text
      }
    }),
    realms: REALMS.map((r, i) => {
      const cost = realmCost(r)
      return { ...r, cost, index: i, reached: s.realm >= i, canBreak: s.realm === i - 1 && s.res.qi >= cost, costText: fmt(cost) }
    }),
    techs: TECHS.map((t) => ({ ...t, owned: !!s.techs[t.id], canBuy: s.res.tech >= t.cost, costText: fmt(t.cost) })),
    stars: STARPROJ.map((p) => ({ ...p, owned: !!s.starProj[p.id], canBuy: s.res.star >= p.cost, costText: fmt(p.cost) })),
    evolutions: EVOLUTIONS.map((ev) => {
      const unlocked = ev.type === 'zodiac' ? !!s.zodiacRecruited[ev.target] : (s.beasts[ev.target] || 0) > 0
      return { ...ev, owned: !!s.evolutions[ev.id], unlocked, canBuy: unlocked && !s.evolutions[ev.id] && s.res.gene >= ev.cost, costText: fmt(ev.cost) }
    }),
    dungeons: DUNGEONS.filter((d) => d.era <= s.era).map((d) => {
      const ratio = armyPower(s) / d.power
      const winRate = clamp(ratio >= 1 ? 0.6 + 0.35 * Math.min(1, ratio - 1) : 0.6 * ratio, 0.02, 0.97)
      return { ...d, wins: s.dungeonWins[d.id] || 0, winRate: Math.round(winRate * 100), foodCost: expeditionFoodCost(d), canStart: !s.expedition && s.res.food >= expeditionFoodCost(d), rewardText: costText(d.reward) }
    }),
    expedition: s.expedition
  }
}

function costText(cost) {
  return Object.keys(cost).map((k) => {
    const r = RES.find((x) => x.key === k)
    return `${r ? r.ico : ''}${fmt(cost[k])}`
  }).join(' ')
}

module.exports = {
  RES,
  ERAS,
  BUILDINGS,
  ZODIAC,
  BEASTS,
  BEAST_RANKS,
  CARD_PACKS,
  EQUIPMENTS,
  EQUIPMENT_BOXES,
  CIV_CARDS,
  SYNERGIES,
  SECRET_COMBOS,
  REALMS,
  TECHS,
  STARPROJ,
  EVOLUTIONS,
  DUNGEONS,
  EVENTS,
  ACHIEVEMENTS,
  MAIN_CHAPTERS,
  JOURNEY_STORIES,
  THREE_KINGDOMS_STORIES,
  WATER_MARGIN_STORIES,
  RED_CHAMBER_STORIES,
  DAILY_TASKS,
  fmt,
  fmtRate,
  freshState,
  normalize,
  visibleData,
  tick,
  applyOffline,
  advanceEra,
  buyBuilding,
  recruitZodiac,
  setBloodline,
  beastEggCost,
  hatchEgg,
  cardPackCost,
  buyCardPack,
  openCardPack,
  equipmentBoxCost,
  buyEquipmentBox,
  openEquipmentBox,
  sellDuplicateCards,
  sellDuplicateEquipments,
  breakRealm,
  buyTech,
  buyStar,
  buyEvolution,
  startExpedition,
  resolveExpedition,
  claimEvent,
  claimAchievement,
  claimMainChapter,
  claimJourneyStory,
  claimThreeKingdomsStory,
  claimWaterMarginStory,
  claimRedChamberStory,
  claimCheckIn,
  recordDailyProgress,
  claimDailyTask,
  canReboot,
  rebootGain,
  rebootUniverse
}
