const OFFICIAL_IMAGE = 'https://dm.takaratomy.co.jp/wp-content/card/';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function imageCandidates(stems) {
  const variants = unique(stems.flatMap(stem => {
    if (/[ab]$/i.test(stem)) return [stem];
    return [stem, `${stem}a`, `${stem}b`];
  }));

  return unique(variants.flatMap(stem => [
    `${OFFICIAL_IMAGE}cardimage/${stem}.jpg`,
    `${OFFICIAL_IMAGE}cardthumb/${stem}.jpg`,
  ]));
}

const normalRows = [
  [1, 'SR', '切札連結「修羅」「黄金」「覇」'],
  [2, 'SR', '「誣」の頂 ウェディング・イノセンス'],
  [3, 'SR', '切札接続 ドールバロム'],
  [4, 'SR', '切札接続 マンジー・ザ・ジョリー'],
  [5, 'SR', '切札混成 レッヴォゾーン'],
  [6, 'SR', '切札電融 モル世界ドラゴEXT'],
  [7, 'SR', '切札電融 “銃銃銃”ジョランド'],
  [8, 'SR', '火神 アポフィス'],
  [9, 'SR', '土神 クサビラガミ'],
  [10, 'SR', '切札混成 光隼 蒼斬丸'],
  [11, 'SR', '切札縫合 アビス記号jS'],
  [12, 'SR', '切札連結 バロXGXディアス'],
  [13, 'SR', '鮫鰐竜 ACE-Agony / 覚醒の杯'],
  [14, 'SR', '切札混成 ドギラダンテ刈'],
  [15, 'SR', 'DREAMの逆転撃'],
  [16, 'SR', '切札連結 ガイアーセイ・カイザー / 切札電融 リュウセール・カイザー'],
  [17, 'SR', '切札電融 モモムゲン'],
  [18, 'SR', 'NIGHTMAREの逆転撃'],
  [19, 'SR', '切札連融王 Dol-Fal-20th'],
  [20, 'VR', '夢幻戦士 ダンダリバン'],
  [21, 'VR', 'せんすいカンたろう'],
  [22, 'VR', 'アルケミック・プラチナム'],
  [23, 'VR', '大偽我罪 ド・ラグオンザーク'],
  [24, 'VR', '切札混成 インビンシブル・ドラゴン'],
  [25, 'VR', '切札混成 ブルージャイアント・フルバーンアウト'],
  [26, 'VR', 'トッジョ・アポロ・ヒツハコ'],
  [27, 'VR', 'クサビ＝護＝ノヌシ'],
  [28, 'VR', '切札接続 MAXAM ザ・オウガ'],
  [29, 'VR', '切札縫合 メイドヴァロム'],
  [30, 'VR', '切札電融 ボンシャラー・KIRIX'],
  [31, 'VR', '切札混成 ゴッド・タイム'],
  [32, 'VR', '剛撃戦攻ドルゲーザ / ドンドン吸い込むナウ'],
  [33, 'VR', '切札連結 バロムレイズ'],
  [34, 'VR', '切札混成 5000BT'],
  [35, 'VR', '切札接続 スーパー・ロマキルカスク'],
  [36, 'VR', '切札縫合 零災'],
  [37, 'VR', '切札電融 デス・フェルザーク'],
  [38, 'VR', '切札縫合 ジャシン＝ジャシン'],
  [39, 'VR', '新たなる王族 プリン＆リュウセイ'],
  [40, 'R', 'キング・ガ・チャレンジ3'],
  [41, 'R', 'ヤッタレガール'],
  [42, 'R', 'エータ・トゥレイト'],
  [43, 'R', 'ペダンティック・ガード'],
  [44, 'R', '親愛なる友 アリス'],
  [45, 'R', 'ペダンティック・アート'],
  [46, 'R', '幽忍 ハンゾウ'],
  [47, 'R', '名も無き闇'],
  [48, 'R', 'ペダンティック・ニール'],
  [49, 'R', '堕ちし龍魂珠'],
  [50, 'R', 'ニドギ・ラ・ヒツラク'],
  [51, 'R', 'ペダンティック・クラフト'],
  [52, 'R', 'クサビエノキノヌシ'],
  [53, 'R', 'ペダンティック・ライフ'],
  [54, 'R', '精霊龍 ライトマスターズ / 龍素解析'],
  [55, 'R', '珊瑚妖精キユリ / キユリのFSMラジオ'],
  [56, 'R', '凶星王ダーク・ヒドラ / 魂と記憶の盾'],
  [57, 'R', 'アカシック・ゼノン Mk.7 / 「攻めるか守るか…悩ましいわね」'],
  [58, 'R', 'アカシック・ゼノン Mk.7 / 「Q.白金の縛り？A.怪しい」'],
  [59, 'R', 'アカシック・ゼノン Mk.7 / 「勇気と愛があれば私たちは変わらない！」'],
  [60, 'U', '鉄壁の守護者ガリア・ゾールα GR'],
  [61, 'U', 'ツインヘッド・タートルβ GR'],
  [62, 'U', 'ダーク・ティアラγ GR'],
  [63, 'U', 'リンネ 丙-三式'],
  [64, 'U', '幽傀 マグナム'],
  [65, 'U', '罪侵入'],
  [66, 'U', 'スフィンティラノスβ GR'],
  [67, 'U', '龍覇 スコッチ・レゼルヴァ'],
  [68, 'U', 'トップギ・ラ・ヒツヤシ'],
  [69, 'U', 'シェル・ファクトリーγ GR'],
  [70, 'U', 'クサビナメコノヌシ'],
  [71, 'U', '心山の炎 ボルメテウス・ピアラ / マウンテン・チャージャー'],
  [72, 'U', '「愛と」「勇気で」「「勝負を決める！」」'],
  [73, 'U', '未来の玉 ダンテ / 未来設計図'],
  [74, 'U', 'アクア・サーファー / ボイル・チャージャー'],
  [75, 'U', '切り離された森 旧パンドラ'],
  [76, 'U', '死を超えた森 ベランド'],
  [77, 'U', '覇王の特務大使 ナツキ'],
  [78, 'U', '闇鎧亜ジャック・アルカディアス / 執拗なる鎧亜の牢獄'],
  [79, 'U', '青銅の鎧 / 炎槍と水剣の裁'],
  [80, 'C', '漂流 UV-20'],
  [81, 'C', 'ジョー星・チャージャー'],
  [82, 'C', '覇王 ヘイヴン-4'],
  [83, 'C', 'ほどよクール'],
  [84, 'C', 'Disエビンビー'],
  [85, 'C', '天空城 ジャスティス・グローリー'],
  [86, 'C', '覇王 トリトナス-4'],
  [87, 'C', 'Disフィアット'],
  [88, 'C', '覇王 カリーマ-4'],
  [89, 'C', 'Disオニゾウ'],
  [90, 'C', '死罪 デ墓スマーチ'],
  [91, 'C', '覇王 インフェル-4'],
  [92, 'C', 'チキン・オドッ太'],
  [93, 'C', 'テンビ・ラ・ヒツソリ'],
  [94, 'C', 'Disモエル'],
  [95, 'C', '覇王 コロッサス-4'],
  [96, 'C', 'Disシラウオ'],
  [97, 'C', 'クサビタケノヌシ'],
  [98, 'C', 'ボルシャック・ヴァリヴァリウス'],
  [99, 'C', 'ビワ入道'],
];

const normalCards = normalRows.map(([number, rarity, name]) => {
  const no = String(number).padStart(3, '0');
  const stems = number === 16
    ? [`dm26ex4-${no}a`, `dm26ex4-${no}b`, `dm26ex4-${no}`]
    : [`dm26ex4-${no}`];
  return {
    id: `normal-${no}`,
    number,
    displayNo: no,
    code: `${number}/99`,
    rarity,
    name,
    imageUrls: imageCandidates(stems),
  };
});

const secretBaseNumbers = [33, 24, 37, 3, 25, 35, 10, 30, 12, 16, 1, 31, 6, 5, 14, 4, 7, 36, 17, 19, 28, 11, 34, 29, 38];
const normalByNumber = new Map(normalCards.map(card => [card.number, card]));
const secretCards = secretBaseNumbers.map((baseNumber, index) => {
  const number = index + 1;
  const no = String(number).padStart(3, '0');
  const base = normalByNumber.get(baseNumber);
  const stems = number === 10
    ? [`dm26ex4-SEC${no}a`, `dm26ex4-SEC${no}b`, `dm26ex4-SEC${no}`]
    : [`dm26ex4-SEC${no}`];
  return {
    id: `secret-${no}`,
    number,
    displayNo: `秘${number}`,
    code: `㊙${number}/㊙25`,
    rarity: base?.rarity || 'SEC',
    name: base?.name || `シークレット ${number}`,
    imageUrls: imageCandidates(stems),
  };
});

const maxRows = [
  [1, 'アルカディアス・モモキング'],
  [2, 'ジョリー・ザ・ジョルネード'],
  [3, '大卍罪 ド・ラガンザーク 卍'],
  [4, '蒼き団長 ドギラゴン剣'],
  [5, 'ジョギラゴン＆ジョニー ～Jの旅路～'],
  [6, '偽りの羅刹 アガサ・エルキュール'],
  [7, '昇カオスマントラ'],
  [8, '天革の騎令嬢 ミラクルステラ'],
  [9, 'トンカチ・シュモック'],
  [10, '邪眼皇アレクサンドルIII世'],
  [11, 'DARK MATERIAL COMPLEX'],
  [12, 'メラベンチャー・ザ・ジョニー'],
  [13, '希望の絆 鬼修羅'],
  [14, '熊四駆 ベアシガラ'],
  [15, '極限の精霊インフィニティ・シリウス'],
  [16, '龍月 ドラグ・スザーク / 龍・獄・殺'],
  [17, 'バーンメア・ザ・シルバー / オラオラ・スラッシュ'],
  [18, '戦国接続 ギャラクテスト・シデンシーザー'],
  [19, '終末縫合王 ザ＝キラー・キーナリー'],
  [20, '魔誕の封殺ディアス Z'],
  [21, 'ジョジョジョ・マキシマム'],
  [22, '勝熱と弾丸と自由の決断'],
  [23, '♪立ち上がる 悪魔に天使 堕ちるかな'],
  [24, '魔龍バベルギヌス'],
  [25, '瞬閃と疾駆と双撃の決断'],
  [26, 'グレープ・ダール'],
  [27, 'PP-「P」'],
  [28, '王道ダチ モンキッド'],
  [29, '音奏 ハイオリーダ / 音奏曲第3番「幻惑」'],
  [30, 'スゴ腕プロジューサー / りんご娘はさんにんっ娘'],
  [31, '一音の妖精'],
  [32, '金天使 エン・ゴルギーニ'],
  [33, '終止の時計 ザ・ミュート'],
  [34, 'サーイ＝サイクル'],
  [35, '欲望の邪道 ニガ＝アブシューム / 支配の邪道 獄鬼夜城'],
  [36, '炎龍覇 グレンアイラ / 「助けて！モルト!!」'],
  [37, '鬼寄せの術'],
  [38, '～地獄帰りの騎士～'],
  [39, '宇宙妖精エリンギ'],
  [40, '天翼 クリティブ-1'],
  [41, '星光の精霊龍 ベルフォール'],
  [42, '裏斬隠 テンサイ・ハート'],
  [43, '霊刑連結 ジゴク・パルテノン'],
  [44, 'タイク・タイソンズ'],
  [45, '運命の選択'],
  [46, '夜露死苦 キャロル'],
  [47, 'DARK MEMORY CONTAINER'],
  [48, '♪銀河の裁きに勝てるもの無し'],
  [49, 'エメラル'],
  [50, '次元の霊峰'],
];

const maxCards = maxRows.map(([number, name]) => {
  const no = String(number).padStart(3, '0');
  return {
    id: `max-${no}`,
    number,
    displayNo: `超${number}`,
    code: `超${number}/超50`,
    rarity: 'MAX',
    name,
    imageUrls: imageCandidates([`dm26ex4-CHO${no}`]),
  };
});

const goldRows = [
  [1, 'ハイパー・ザ・ジョニー'],
  [2, '神歌の悪夢 ナイトメア・キリコ'],
  [3, '悪夢神バロム・ナイトメア'],
  [4, '轟く邪道 レッドゾーン'],
  [5, '双龍覇王 バーサス＝ザ＝デッドマン'],
  [6, '鬼ヶ覇覇覇 ジャオウガ'],
  [7, '蒼き王道 ドギラゴン超'],
  [8, '王闘竜皇 ボルシャック・ドラゴン'],
  [9, '王導聖霊 アルファディオス'],
  [10, '勝熱伝双 モモキングVS'],
  [11, '双龍覇王 モルトVERSUS'],
  [12, 'ドリーム・ボルメテウス・ホワイト・ドラゴン'],
];

const goldCards = goldRows.map(([number, name]) => {
  const no = String(number).padStart(3, '0');
  return {
    id: `gold-${no}`,
    number,
    displayNo: `超G${number}`,
    code: `超G${number}/超G12`,
    rarity: 'DMR',
    name,
    imageUrls: imageCandidates([
      `dm26ex4-ChoG${no}`,
      `dm26ex4-CHOG${no}`,
    ]),
  };
});

export const pack = {
  id: 'dm26-ex4',
  code: 'DM26-EX4',
  shortName: 'デュエキング2026',
  name: 'DM26-EX4 切札不滅!! デュエキング FOREVER 2026',
  imageSourceName: 'デュエル・マスターズ公式',
  imageSourceUrl: 'https://dm.takaratomy.co.jp/product/dm26ex4/',
  defaultCategoryId: 'normal',
  categories: [
    { id: 'normal', shortLabel: '通常', label: '通常版99種', targetCopies: 4, mode: 'fourCon', cards: normalCards },
    { id: 'max', shortLabel: 'MAX', label: 'デュエキングMAX50種', targetCopies: 1, mode: 'collection', cards: maxCards },
    { id: 'secret', shortLabel: 'シク', label: 'シークレット25種', targetCopies: 1, mode: 'collection', cards: secretCards },
    { id: 'gold', shortLabel: 'ゴールド', label: 'ゴールドMAX12種', targetCopies: 1, mode: 'collection', cards: goldCards },
  ],
};
