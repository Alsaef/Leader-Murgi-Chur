// Constants and Bengali arcade dialogue / text configurations

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y = 440; // Ground surface coordinate

export const PHYSICS = {
  GRAVITY: 0.72,
  JUMP_FORCE: -14.2,
  DOUBLE_JUMP_FORCE: -12.6,
  BASE_SPEED: 7.0,
  BOOST_SPEED: 9.8,
  BIKE_SPEED: 12.6,
  MAX_SPEED: 12.5,
  SPEED_ACCEL: 0.00045, // Steady, faster progression over distance
  ENERGY_DRAIN_RATE: 0.088, // Faster energy drain (~5.3% per sec)
  ENERGY_LOW_THRESHOLD: 35,
  KICK_DURATION: 18, // frames of kick extension
  STUN_DURATION: 36, // frames when colliding without kicking
  BOOST_DURATION: 135, // frames (~2.25 seconds boost)
  BIKE_DURATION: 240, // frames (~4 seconds CNG/Bike rush)
  BOOST_ENERGY_REFILL: 22, // +22% energy refill per bottle
  KICK_BONUS_SCORE: 50,
  SANDAL_DEFLECT_SCORE: 30,
};

export const LEADER_RANKS = [
  {
    minScore: 3500,
    title: 'জাতীয় মুরগি ডন!',
    subtitle: 'কিংবদন্তি! কোনো গ্রামবাসীই আপনাকে থামাতে পারেনি!',
    badge: '🔥👑',
    color: '#fb7185',
    bg: 'rgba(244, 63, 94, 0.2)',
    border: '#f43f5e',
  },
  {
    minScore: 1500,
    title: 'উপজেলা পোল্ট্রি সম্রাট',
    subtitle: 'পুরো থানার খামারে আপনার নামে রীতিমতো আতঙ্ক!',
    badge: '👑',
    color: '#facc15',
    bg: 'rgba(250, 204, 21, 0.18)',
    border: '#eab308',
  },
  {
    minScore: 500,
    title: 'ওয়ার্ড মুরগি লিডার',
    subtitle: 'এলাকার মুরগি মহলে বেশ পরিচিত ও ভয়ংকর মুখ!',
    badge: '🐓',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.18)',
    border: '#38bdf8',
  },
  {
    minScore: 0,
    title: 'পাতি চোর',
    subtitle: 'সবে তো চুরি শুরু হলো, তাতেই ধরা খাইলেন!',
    badge: '🐣',
    color: '#cbd5e1',
    bg: 'rgba(148, 163, 184, 0.16)',
    border: '#94a3b8',
  },
];

export function getLeaderRank(score = 0) {
  return LEADER_RANKS.find((r) => score >= r.minScore) || LEADER_RANKS[LEADER_RANKS.length - 1];
}

export const CHAT_PHRASES = {
  MOB_SHOUTS: [
    'চোর! চোর!',
    'মুরগি নামা!',
    'আজকে ছাড়ুম না!',
    'ধইরা ধোলাই দে!',
    'লাঠি আন রে!',
    'ঘেরাও কর!',
  ],
  BLOCKER_SHOUTS: [
    'কই যাস?!',
    'ধর ওরে!',
    'থাম ব্যাটা!',
    'আমার মুরগি!',
    'পালাবি কই?!',
  ],
  KICK_FX: [
    'ঠাস!',
    'ধুম!',
    'উইড়া গেল!',
    'DISHOOM!',
    'চিৎপটাং!',
    'লাত্থি!',
  ],
  POWER_FX: [
    'লিডার পাওয়ার! ⚡',
    'স্পিড অন ফায়ার!',
    'টাইগার বুস্ট!',
    'দোকানদার স্পেশাল!',
  ],
  DOG_FX: [
    'ঘেউ ঘেউ!',
    'কামড় দিল রে!',
  ],
  SANDAL_FX: [
    'উড়ন্ত স্যান্ডেল!',
    'বদনা-স্যান্ডেল অ্যাটাক!',
  ],
  MUD_FX: [
    'পিছলা কাদা!',
    'হড়কে গেল রে!',
  ],
  BIKE_FX: [
    'সিএনজি রাশ! পিঁপ পিঁপ! 🛺',
    'হিরো বাইক মুড! 🏍️💨',
  ],
  BREAKING_HEADLINES: [
    'ব্রেকিং নিউজ: মুরগি বগলদাবা করে পালানোর সময় লিডারকে গণধোলাই দিল গ্রামবাসী!',
    'বিশেষ সংবাদ: স্পিড ড্রিংক শেষ হওয়ায় ধরা খেলেন লিডার, মুরগি অক্ষত উদ্ধার!',
    'সরাসরি মাঠ থেকে: বীরদর্পে লাত্থি মেরেও শেষ রক্ষা হলো না লিডারের, উড়ল স্যান্ডেল!',
    'টক অব দ্য কান্ট্রি: "আমি তো মুরগি ধার নিছিলাম", গণপিটুনির পর লিডারের দাবি!',
    'চাঞ্চল্যকর খবর: সকালের মুরগি চুরির রুদ্ধশ্বাস দৌড়ে লিডারকে ঘিরে ফেলল গ্রাম্য জনতা!',
  ],
};

export const POSTERS = [
  'ভোট দিন মুরগি মার্কায়',
  'লিডার এগিয়ে চলো!',
  'খাঁটি গাভীর দুধের স্পেশাল চা',
  'মুরগি চোর ধরা পড়লে গণধোলাই!',
  'এখানে বাকিতে চা বিক্রি নিষেধ',
];
