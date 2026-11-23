// Constants and Bengali arcade dialogue / text configurations

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GROUND_Y = 440; // Ground surface coordinate

export const PHYSICS = {
  GRAVITY: 0.72,
  JUMP_FORCE: -14.2,
  BASE_SPEED: 6.2,
  BOOST_SPEED: 9.2,
  MAX_SPEED: 11.5,
  SPEED_ACCEL: 0.00025, // Steady progression over distance
  ENERGY_DRAIN_RATE: 0.065, // ~3.9% per second drain
  ENERGY_LOW_THRESHOLD: 30,
  KICK_DURATION: 18, // frames of kick extension
  STUN_DURATION: 36, // frames when colliding without kicking
  BOOST_DURATION: 160, // frames (~2.6 seconds boost)
  BOOST_ENERGY_REFILL: 25, // +25% energy refill per bottle
  KICK_BONUS_SCORE: 50,
};

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
