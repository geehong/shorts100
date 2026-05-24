export interface DummyItem {
  rank: number;
  title: string;
  channel: string;
  views: string;
  likes: string;
  ago: string;
  region: string;
  lang: string;
  category: string;
  thumb: string; // gradient class
}

export const DUMMY: DummyItem[] = [
  { rank:1,  title:"아기상어 댄스 Baby Shark Dance", channel:"핑크퐁",        views:"12.3억", likes:"890만", ago:"2년 전",  region:"KR", lang:"ko", category:"교육",   thumb:"from-pink-400 to-red-500" },
  { rank:2,  title:"Mamá VS Papá 🤣 #shorts",        channel:"Gabriela F",    views:"3.3억",  likes:"462만", ago:"7일 전",  region:"MX", lang:"es", category:"코미디",  thumb:"from-yellow-400 to-orange-500" },
  { rank:3,  title:"Monster drinks boba tea 🧋",      channel:"Yoeslan",       views:"7.0억",  likes:"320만", ago:"12일 전", region:"US", lang:"en", category:"엔터",   thumb:"from-purple-400 to-indigo-500" },
  { rank:4,  title:"Belly Button Song Dance!",        channel:"Cocomelon",     views:"12.9억", likes:"1100만",ago:"1년 전",  region:"US", lang:"en", category:"교육",   thumb:"from-blue-400 to-cyan-500" },
  { rank:5,  title:"Sister love 💕 #shorts",          channel:"Cute Family",   views:"21.9억", likes:"780만", ago:"2년 전",  region:"IN", lang:"hi", category:"라이프",  thumb:"from-rose-400 to-pink-500" },
  { rank:6,  title:"고양이 몰래카메라 반응 ㅋㅋ",       channel:"냥이TV",         views:"8800만", likes:"230만", ago:"3일 전",  region:"KR", lang:"ko", category:"동물",   thumb:"from-amber-400 to-yellow-500" },
  { rank:7,  title:"Squid Game Dalgona #shorts",      channel:"Mr DegrEE",     views:"1.2억",  likes:"88만",  ago:"8개월 전",region:"KR", lang:"ko", category:"게임",   thumb:"from-green-400 to-emerald-500" },
  { rank:8,  title:"Wait for the end 🤣 #shorts",     channel:"Baccha Mat",    views:"1.2억",  likes:"127만", ago:"8개월 전",region:"IN", lang:"hi", category:"코미디",  thumb:"from-teal-400 to-cyan-500" },
  { rank:9,  title:"Cute rabbit baby 😍 #shorts",     channel:"Crazy Vlog",    views:"2.7억",  likes:"198만", ago:"2년 전",  region:"VN", lang:"vi", category:"동물",   thumb:"from-lime-400 to-green-500" },
  { rank:10, title:"BTS 정국 직캠 4K Fancam",         channel:"HYBE LABELS",   views:"5500만", likes:"410만", ago:"1개월 전",region:"KR", lang:"ko", category:"음악",   thumb:"from-violet-400 to-purple-500" },
];

export const PERIODS = ["TODAY","WEEKLY","MONTHLY","YEARLY","ALL"];
export const REGIONS = ["🌍전체","🇰🇷한국","🇺🇸미국","🇮🇳인도","🇯🇵일본","🇧🇷브라질","🇬🇧영국"];
export const CATEGORIES = ["전체","🎮게임","🎵음악","😂코미디","🎬엔터","⚽스포츠","📚교육","🐾동물","💄라이프"];
export const LANGUAGES = ["전체","한국어","영어","힌디","스페인어","일본어"];
