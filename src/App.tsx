/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Shield,
  Sword,
  Zap,
  Sparkles,
  BookOpen,
  Info,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  TrendingUp,
  Award,
  Flame,
  Layers,
  Database,
  Search,
  UserCheck,
  Crown,
  ArrowRight,
  Copy,
  Check,
  Sliders,
  ChevronRight,
  Target,
  Download,
  Smartphone,
  Laptop,
  Cloud,
  X,
  ExternalLink,
  GitBranch,
  Network
} from 'lucide-react';
import {
  MASTER_CHARACTERS,
  MASTER_SR_RARITIES,
  MASTER_R_RARITIES,
  LEVEL_BASE_PARAMS,
  PLAYER_RANK_BONUSES,
  CharacterEntry,
  RarityEntry,
  getLevelBaseParam,
  getPlayerRankBonus,
} from './data/mementoData';

export const CP_RATES = {
  hp: 0.05,
  atk: 2.0,
  def: 7 / 3, // ~2.3333333333
  defPen: 7.0,
  pmDefPen: 7.0,
  pDef: 1.5,
  mDef: 1.5,
  hit: 1.0,
  evasion: 1.0,
  crit: 3.0,
  critRes: 3.0,
  critDmgBoost: 2000.0, // 2.000 CP per 1% (200.000 per 1.0)
  pCritCut: 2000.0,     // 2.000 CP per 1% (200.000 per 1.0) -> Terbukti 7.0% = +14.000 CP (Kasus Hathor)
  mCritCut: 2000.0,     // 2.000 CP per 1% (200.000 per 1.0)
  debuffHit: 1.0,
  debuffRes: 1.0,
  counter: 1500.0,      // 1.500 CP per 1% (150.000 per 1.0)
  hpDrain: 1500.0,      // 1.500 CP per 1% (150.000 per 1.0)
};

export type ModeTab = 'pure_base' | 'calculator' | 'validation' | 'guide';

export interface StatInputs {
  hp: number;
  atk: number;
  def: number;
  pDef: number;
  mDef: number;
  defPen: number;
  pmDefPen: number;
  speed: number;
  hit: number;
  evasion: number;
  crit: number;
  critRes: number;
  critDmgBoostPct: number;
  pCritCutPct: number;
  mCritCutPct: number;
  debuffHit: number;
  debuffRes: number;
  counterPct: number;
  hpDrainPct: number;
  str: number;
  dex: number;
  mag: number;
  sta: number;
}

const EMPTY_STATS: StatInputs = {
  hp: 0,
  atk: 0,
  def: 0,
  pDef: 0,
  mDef: 0,
  defPen: 0,
  pmDefPen: 0,
  speed: 0,
  hit: 0,
  evasion: 0,
  crit: 0,
  critRes: 0,
  critDmgBoostPct: 0,
  pCritCutPct: 0,
  mCritCutPct: 0,
  debuffHit: 0,
  debuffRes: 0,
  counterPct: 0,
  hpDrainPct: 0,
  str: 0,
  dex: 0,
  mag: 0,
  sta: 0,
};

const DEFAULT_SAMPLE_FLORENCE: StatInputs = {
  hp: 12500000,
  atk: 4200000,
  def: 620000,
  pDef: 310000,
  mDef: 240000,
  defPen: 84000,
  pmDefPen: 25000,
  speed: 3850,
  hit: 95000,
  evasion: 78000,
  crit: 165000,
  critRes: 92000,
  critDmgBoostPct: 45.5,
  pCritCutPct: 15.0,
  mCritCutPct: 10.0,
  debuffHit: 12000,
  debuffRes: 15000,
  counterPct: 0,
  hpDrainPct: 12.0,
  str: 185000,
  dex: 75000,
  mag: 55000,
  sta: 140000,
};

export default function App() {
  // Default to pure_base (Simulator Karakter & Rank) so user immediately lands on it
  const [activeTab, setActiveTab] = useState<ModeTab>('pure_base');
  const [roundingMode, setRoundingMode] = useState<'floor' | 'round'>('floor');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportModalTab, setExportModalTab] = useState<'pwa' | 'cloud' | 'local'>('pwa');

  // --- TAB 1: PURE BASE STAT (MASTER DATA & SIMULATOR) ---
  const [selectedCharId, setSelectedCharId] = useState<number>(7); // Default to Fenrir (Id 7)
  const [charSearch, setCharSearch] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedSubLevel, setSelectedSubLevel] = useState<number>(0); // Party Sub-Level (.0 s/d .9 di Lv 240+)
  const [lrCharacterCount, setLrCharacterCount] = useState<number>(5); // Jumlah karakter LR (5 LR = Cap 265, +5/LR)
  const [enforceLrCap, setEnforceLrCap] = useState<boolean>(false); // Enforce LR roster cap vs Sandbox bebas (s/d 1000)
  const [selectedRarityLabel, setSelectedRarityLabel] = useState<string>('SR');
  const [playerRank, setPlayerRank] = useState<number>(10); // Player Rank 10
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [displayViewStyle, setDisplayViewStyle] = useState<'ingame' | 'grid'>('ingame');

  // Extra optional in-game adjustment fields for simulator
  const [extraPmDefBreak, setExtraPmDefBreak] = useState<number>(0);
  const [extraAtk, setExtraAtk] = useState<number>(0);
  const [extraHp, setExtraHp] = useState<number>(0);
  const [extraDefPen, setExtraDefPen] = useState<number>(0);
  const [extraHpDrainPct, setExtraHpDrainPct] = useState<number>(0);
  const [extraPCritCutPct, setExtraPCritCutPct] = useState<number>(0);
  const [extraDebuffRes, setExtraDebuffRes] = useState<number>(0);

  // --- TAB 2: FULL STAT CALCULATOR (19 STATS) ---
  const [charClass, setCharClass] = useState<'Warrior' | 'Sniper' | 'Sorcerer'>('Sorcerer');
  const [stats, setStats] = useState<StatInputs>({
    hp: 19503,
    atk: 1912,
    def: 10,
    pDef: 1520,
    mDef: 1695,
    defPen: 0,
    pmDefPen: 0,
    speed: 2894,
    hit: 760,
    evasion: 753,
    crit: 749,
    critRes: 874,
    critDmgBoostPct: 0,
    pCritCutPct: 0,
    mCritCutPct: 0,
    debuffHit: 845,
    debuffRes: 0,
    counterPct: 0,
    hpDrainPct: 0,
    str: 1520,
    dex: 1501,
    mag: 1691,
    sta: 1748,
  });

  // Selected character & rarity list
  const currentChar: CharacterEntry = useMemo(() => {
    return MASTER_CHARACTERS.find((c) => c.id === selectedCharId) || MASTER_CHARACTERS[0];
  }, [selectedCharId]);

  const rarityOptions: RarityEntry[] = useMemo(() => {
    return currentChar.baseRarity === 'R' ? MASTER_R_RARITIES : MASTER_SR_RARITIES;
  }, [currentChar]);

  const currentRarity: RarityEntry = useMemo(() => {
    return rarityOptions.find((r) => r.label === selectedRarityLabel) || rarityOptions[0];
  }, [rarityOptions, selectedRarityLabel]);

  // Master calculation with Player Rank & InitialBattleParameter
  const masterCalculation = useMemo(() => {
    const effectiveSubLevel = selectedLevel >= 240 ? selectedSubLevel : 0;
    const rawLevelBase = getLevelBaseParam(selectedLevel, effectiveSubLevel);
    const scaledTotal = Math.floor(rawLevelBase * currentRarity.m + currentRarity.b);

    const gross = currentChar.gross || 340;
    const str = Math.floor((scaledTotal * currentChar.muscle) / gross);
    const dex = Math.floor((scaledTotal * currentChar.energy) / gross);
    const mag = Math.floor((scaledTotal * currentChar.intelligence) / gross);
    const sta = Math.floor((scaledTotal * currentChar.health) / gross);

    const sumPotential = str + dex + mag + sta;
    const speed = currentChar.baseSpeed || 2894;

    // Derived sub-stats from potential:
    const potPDef = str * 1;
    const potHit = Math.floor(str * 0.5);
    const potEva = Math.floor(dex * 0.5);
    const potCrit = Math.floor(dex * 0.5);
    const potMDef = mag * 1;
    const potDebuffHit = Math.floor(mag * 0.5);
    const potHp = sta * 10;
    const potCritRes = Math.floor(sta * 0.5);

    // Matching type ATK from potential:
    let potMatchingAtk = 0;
    if (currentChar.job === 'Warrior') potMatchingAtk = str;
    else if (currentChar.job === 'Sniper') potMatchingAtk = dex;
    else if (currentChar.job === 'Sorcerer') potMatchingAtk = mag;

    // Player Rank bonus (HpBonus, AttackPowerBonus, HpPercentBonus, AttackPowerPercentBonus, HitBonus, CriticalBonus, Slots):
    const rankBonus = getPlayerRankBonus(playerRank);

    // Initial Battle Parameter from CharacterMB:
    const initParam = currentChar.initialBattleParam;

    // Final Panel Attributes (Semua 19 stat lengkap):
    // HP: Base Flat HP + rankBonus.hp + initParam.hp + extraHp, multiplied by (1 + rankBonus.hpPct / 100)
    const baseHpPrePercent = potHp + rankBonus.hp + initParam.hp + extraHp;
    const hpRankMult = 1 + (rankBonus.hpPct || 0) / 100;
    const finalHp = Math.floor(baseHpPrePercent * hpRankMult);

    // ATK: Base Matching ATK + rankBonus.atk + initParam.atk + extraAtk, multiplied by (1 + rankBonus.atkPct / 100)
    const baseAtkPrePercent = potMatchingAtk + rankBonus.atk + initParam.atk + extraAtk;
    const atkRankMult = 1 + (rankBonus.atkPct || 0) / 100;
    const finalAtk = Math.floor(baseAtkPrePercent * atkRankMult);

    const finalDef = initParam.def; // 10 for most characters
    const finalPDef = potPDef + initParam.pDefRelax;
    const finalMDef = potMDef + initParam.mDefRelax;
    const finalHit = potHit + initParam.hit + (rankBonus.hit || 0);
    const finalEva = potEva + initParam.avoidance;
    const finalCrit = potCrit + initParam.critical + (rankBonus.crit || 0);
    const finalCritRes = potCritRes + initParam.critResist;
    const finalDebuffHit = potDebuffHit;
    const finalDebuffRes = extraDebuffRes;
    const finalPmDefBreak = (initParam.pmDefBreak || 0) + extraPmDefBreak;
    const finalDefPen = extraDefPen;
    const finalCritDmgBoostPct = 0;
    const finalPCritCutPct = extraPCritCutPct;
    const finalMCritCutPct = 0;
    const finalCounterPct = 0;
    const finalHpDrainPct = extraHpDrainPct;

    // CP Calculations (Semua 19 parameter dihitung, termasuk stat 0):
    const hpCp = finalHp * CP_RATES.hp;
    const atkCp = finalAtk * CP_RATES.atk;
    const defCp = finalDef * CP_RATES.def;
    const pDefCp = finalPDef * CP_RATES.pDef;
    const mDefCp = finalMDef * CP_RATES.mDef;
    const hitCp = finalHit * CP_RATES.hit;
    const evaCp = finalEva * CP_RATES.evasion;
    const critCp = finalCrit * CP_RATES.crit;
    const critResCp = finalCritRes * CP_RATES.critRes;
    const debuffHitCp = finalDebuffHit * CP_RATES.debuffHit;
    const debuffResCp = finalDebuffRes * CP_RATES.debuffRes;
    const pmDefBreakCp = finalPmDefBreak * CP_RATES.pmDefPen;
    const defPenCp = finalDefPen * CP_RATES.defPen;
    const critDmgBoostCp = finalCritDmgBoostPct * CP_RATES.critDmgBoost;
    const pCritCutCp = finalPCritCutPct * CP_RATES.pCritCut;
    const mCritCutCp = finalMCritCutPct * CP_RATES.mCritCut;
    const counterCp = finalCounterPct * CP_RATES.counter;
    const hpDrainCp = finalHpDrainPct * CP_RATES.hpDrain;

    const speedMultiplier = speed / 8000;
    const speedCp = sumPotential * speedMultiplier;

    const breakdown = [
      { name: 'HP (Hit Points / Darah)', jpName: 'HP', val: finalHp, rate: CP_RATES.hp, cp: hpCp, category: 'Survival' },
      { name: 'ATK (Kekuatan Serang)', jpName: '攻撃力', val: finalAtk, rate: CP_RATES.atk, cp: atkCp, category: 'Offense' },
      { name: 'DEF (Pertahanan Murni)', jpName: '防御力', val: finalDef, rate: CP_RATES.def, cp: defCp, category: 'Defense' },
      { name: 'Physical DEF (Pertahanan Fisik)', jpName: '物理防御', val: finalPDef, rate: CP_RATES.pDef, cp: pDefCp, category: 'Defense' },
      { name: 'Magic DEF (Pertahanan Sihir)', jpName: '魔法防御', val: finalMDef, rate: CP_RATES.mDef, cp: mDefCp, category: 'Defense' },
      { name: 'Accuracy (Akurasi / Hit)', jpName: '命中', val: finalHit, rate: CP_RATES.hit, cp: hitCp, category: 'Utility' },
      { name: 'Evasion (Penghindaran / EVA)', jpName: '回避', val: finalEva, rate: CP_RATES.evasion, cp: evaCp, category: 'Survival' },
      { name: 'Critical (Peluang Kritis)', jpName: 'クリティカル', val: finalCrit, rate: CP_RATES.crit, cp: critCp, category: 'Offense' },
      { name: 'Crit RES (Ketahanan Kritis)', jpName: 'クリ耐性', val: finalCritRes, rate: CP_RATES.critRes, cp: critResCp, category: 'Survival' },
      { name: 'Debuff ACC (Akurasi Efek Lemah)', jpName: '弱体効果命中', val: finalDebuffHit, rate: CP_RATES.debuffHit, cp: debuffHitCp, category: 'Utility' },
      { name: 'Debuff RES (Ketahanan Efek Lemah)', jpName: '弱体効果耐性', val: finalDebuffRes, rate: CP_RATES.debuffRes, cp: debuffResCp, category: 'Survival' },
      { name: 'PM. DEF Break (物魔防御貫通)', jpName: '物魔防御貫通', val: finalPmDefBreak, rate: CP_RATES.pmDefPen, cp: pmDefBreakCp, category: 'Offense' },
      { name: 'DEF Pen (Penetrasi DEF)', jpName: '防御貫通', val: finalDefPen, rate: CP_RATES.defPen, cp: defPenCp, category: 'Offense' },
      { name: 'Crit DMG Boost (Bonus DMG Kritis)', jpName: 'クリダメ強化', val: finalCritDmgBoostPct, rate: CP_RATES.critDmgBoost, cp: critDmgBoostCp, isPct: true, category: 'Offense' },
      { name: 'P.DEF DMG Cut / P.Crit Cut (Reduksi Kritis Fisik)', jpName: '物クリ緩和', val: finalPCritCutPct, rate: CP_RATES.pCritCut, cp: pCritCutCp, isPct: true, category: 'Defense' },
      { name: 'M.DEF DMG Cut / M.Crit Cut (Reduksi Kritis Sihir)', jpName: '魔クリ緩和', val: finalMCritCutPct, rate: CP_RATES.mCritCut, cp: mCritCutCp, isPct: true, category: 'Defense' },
      { name: 'Counter (Serangan Balik)', jpName: 'カウンタ', val: finalCounterPct, rate: CP_RATES.counter, cp: counterCp, isPct: true, category: 'Special' },
      { name: 'HP Drain (Penyedotan HP / Lifesteal)', jpName: 'HPドレイン', val: finalHpDrainPct, rate: CP_RATES.hpDrain, cp: hpDrainCp, isPct: true, category: 'Special' },
      { name: 'Speed Bonus (Coupling Total Potensial)', jpName: 'スピード', val: speed, rate: speedMultiplier, cp: speedCp, isSpeed: true, category: 'Special' },
    ];

    const totalCalculatedCpFloat = breakdown.reduce((sum, item) => sum + item.cp, 0);

    // Dual calculation: Floor (Truncate) and Round (Terdekat)
    const floorCp = Math.floor(totalCalculatedCpFloat);
    const roundCp = Math.round(totalCalculatedCpFloat);
    const totalCalculatedCp = roundingMode === 'floor' ? floorCp : roundCp;

    return {
      rawLevelBase,
      effectiveSubLevel,
      scaledTotal,
      str,
      dex,
      mag,
      sta,
      sumPotential,
      speed,
      potHp,
      potMatchingAtk,
      potPDef,
      potMDef,
      potHit,
      potEva,
      potCrit,
      potCritRes,
      potDebuffHit,
      rankBonus,
      initParam,
      baseHpPrePercent,
      baseAtkPrePercent,
      hpRankMult,
      atkRankMult,
      finalHp,
      finalAtk,
      finalDef,
      finalPDef,
      finalMDef,
      finalHit,
      finalEva,
      finalCrit,
      finalCritRes,
      finalDebuffHit,
      finalDebuffRes,
      finalPmDefBreak,
      finalDefPen,
      finalCritDmgBoostPct,
      finalPCritCutPct,
      finalMCritCutPct,
      finalCounterPct,
      finalHpDrainPct,
      hpCp,
      atkCp,
      defCp,
      pDefCp,
      mDefCp,
      hitCp,
      evaCp,
      critCp,
      critResCp,
      debuffHitCp,
      debuffResCp,
      pmDefBreakCp,
      defPenCp,
      critDmgBoostCp,
      pCritCutCp,
      mCritCutCp,
      counterCp,
      hpDrainCp,
      speedMultiplier,
      speedCp,
      breakdown,
      totalCalculatedCpFloat,
      floorCp,
      roundCp,
      totalCalculatedCp,
    };
  }, [
    currentChar,
    currentRarity,
    selectedLevel,
    selectedSubLevel,
    playerRank,
    extraPmDefBreak,
    extraAtk,
    extraHp,
    extraDefPen,
    extraHpDrainPct,
    extraPCritCutPct,
    extraDebuffRes,
    roundingMode,
  ]);

  // Full stat calculator logic
  const handleStatChange = (key: keyof StatInputs, value: string) => {
    const num = parseFloat(value) || 0;
    setStats((prev) => ({ ...prev, [key]: num }));
  };

  const fullCalculations = useMemo(() => {
    const totalPotential = (stats.str || 0) + (stats.dex || 0) + (stats.mag || 0) + (stats.sta || 0);
    const speedMultiplier = (stats.speed || 0) / 8000;
    const speedCp = totalPotential * speedMultiplier;

    const breakdown = [
      { name: 'HP (Darah)', jpName: 'HP', val: stats.hp, rate: CP_RATES.hp, cp: stats.hp * CP_RATES.hp, category: 'Survival' },
      { name: 'ATK (Kekuatan Serang)', jpName: '攻撃力', val: stats.atk, rate: CP_RATES.atk, cp: stats.atk * CP_RATES.atk, category: 'Offense' },
      { name: 'DEF (Pertahanan Murni)', jpName: '防御力', val: stats.def, rate: CP_RATES.def, cp: stats.def * CP_RATES.def, category: 'Defense' },
      { name: 'DEF Pen (Penetrasi DEF)', jpName: '防御貫通', val: stats.defPen, rate: CP_RATES.defPen, cp: stats.defPen * CP_RATES.defPen, category: 'Offense' },
      { name: 'P/M Def Pen (Penetrasi Fisik/Sihir)', jpName: '物魔防御貫通', val: stats.pmDefPen, rate: CP_RATES.pmDefPen, cp: stats.pmDefPen * CP_RATES.pmDefPen, category: 'Offense' },
      { name: 'Physical DEF (Pertahanan Fisik)', jpName: '物理防御', val: stats.pDef, rate: CP_RATES.pDef, cp: stats.pDef * CP_RATES.pDef, category: 'Defense' },
      { name: 'Magic DEF (Pertahanan Sihir)', jpName: '魔法防御', val: stats.mDef, rate: CP_RATES.mDef, cp: stats.mDef * CP_RATES.mDef, category: 'Defense' },
      { name: 'Accuracy (Akurasi / Hit)', jpName: '命中', val: stats.hit, rate: CP_RATES.hit, cp: stats.hit * CP_RATES.hit, category: 'Utility' },
      { name: 'Evasion (Penghindaran / EVA)', jpName: '回避', val: stats.evasion, rate: CP_RATES.evasion, cp: stats.evasion * CP_RATES.evasion, category: 'Survival' },
      { name: 'Critical (Peluang Kritis)', jpName: 'クリティカル', val: stats.crit, rate: CP_RATES.crit, cp: stats.crit * CP_RATES.crit, category: 'Offense' },
      { name: 'Crit RES (Ketahanan Kritis)', jpName: 'クリ耐性', val: stats.critRes, rate: CP_RATES.critRes, cp: stats.critRes * CP_RATES.critRes, category: 'Survival' },
      { name: 'Crit DMG Boost (Bonus DMG Kritis)', jpName: 'クリダメ強化', val: stats.critDmgBoostPct, rate: CP_RATES.critDmgBoost, cp: stats.critDmgBoostPct * CP_RATES.critDmgBoost, isPct: true, category: 'Offense' },
      { name: 'P.DEF DMG Cut / P.Crit Cut (Reduksi Kritis Fisik)', jpName: '物クリ緩和', val: stats.pCritCutPct, rate: CP_RATES.pCritCut, cp: stats.pCritCutPct * CP_RATES.pCritCut, isPct: true, category: 'Defense' },
      { name: 'M.DEF DMG Cut / M.Crit Cut (Reduksi Kritis Sihir)', jpName: '魔クリ緩和', val: stats.mCritCutPct, rate: CP_RATES.mCritCut, cp: stats.mCritCutPct * CP_RATES.mCritCut, isPct: true, category: 'Defense' },
      { name: 'Debuff HIT (Akurasi Efek Lemah)', jpName: '弱体効果命中', val: stats.debuffHit, rate: CP_RATES.debuffHit, cp: stats.debuffHit * CP_RATES.debuffHit, category: 'Utility' },
      { name: 'Debuff RES (Ketahanan Efek Lemah)', jpName: '弱体効果耐性', val: stats.debuffRes, rate: CP_RATES.debuffRes, cp: stats.debuffRes * CP_RATES.debuffRes, category: 'Survival' },
      { name: 'Counter (Serangan Balik)', jpName: 'カウンタ', val: stats.counterPct, rate: CP_RATES.counter, cp: stats.counterPct * CP_RATES.counter, isPct: true, category: 'Special' },
      { name: 'HP Drain (Penyedotan HP / Lifesteal)', jpName: 'HPドレイン', val: stats.hpDrainPct, rate: CP_RATES.hpDrain, cp: stats.hpDrainPct * CP_RATES.hpDrain, isPct: true, category: 'Special' },
      { name: 'Speed Bonus (Coupling Total Potential)', jpName: 'スピード', val: stats.speed, rate: speedMultiplier, cp: speedCp, isSpeed: true, category: 'Special' },
    ];

    const totalCpFloat = breakdown.reduce((sum, item) => sum + item.cp, 0);
    const floorCp = Math.floor(totalCpFloat);
    const roundCp = Math.round(totalCpFloat);
    const totalCp = roundingMode === 'floor' ? floorCp : roundCp;

    const categories = {
      Offense: breakdown.filter(i => i.category === 'Offense').reduce((s, i) => s + i.cp, 0),
      Defense: breakdown.filter(i => i.category === 'Defense').reduce((s, i) => s + i.cp, 0),
      Survival: breakdown.filter(i => i.category === 'Survival').reduce((s, i) => s + i.cp, 0),
      Utility: breakdown.filter(i => i.category === 'Utility').reduce((s, i) => s + i.cp, 0),
      Special: breakdown.filter(i => i.category === 'Special').reduce((s, i) => s + i.cp, 0),
    };

    return { breakdown, totalCpFloat, floorCp, roundCp, totalCp, categories };
  }, [stats, roundingMode]);

const CHARACTER_ALIASES: Record<number, string[]> = {
  38: ['Olivier'],
  53: ['Willa'],
  55: ['Rhea'],
  60: ['Fear'],
  63: ['Paradea'],
  64: ['Gilwial'],
  66: ['Iris (Dark Armor ver.)', 'Dark Armor Iris'],
  68: ['Fene'],
  77: ['Minashmari'],
  79: ['Cerulea'],
  80: ['Mira'],
  84: ['Liz'],
  86: ['Melia'],
  87: ['Nebula'],
  92: ['Idina'],
  99: ['Lylicot', 'Lilicot'],
  105: ['Natasha (Bouquet ver.)', 'Bouquet Natasha'],
  109: ['Irene'],
  111: ['Tilly'],
  114: ['Paula'],
  115: ['Popuri'],
  121: ['Lumika'],
  128: ['Riveria'],
  130: ['Aishe'],
  134: ['Fear (Trace ver.)', 'Fear (Vestige ver.)', 'Vestige Fear'],
  153: ['Shiro'],
};

  const filteredCharacters = useMemo(() => {
    if (!charSearch.trim()) return MASTER_CHARACTERS;
    const q = charSearch.toLowerCase().trim();
    return MASTER_CHARACTERS.filter((c) => {
      if (c.nameEn.toLowerCase().includes(q) || c.nameJp.toLowerCase().includes(q)) {
        return true;
      }
      const aliases = CHARACTER_ALIASES[c.id];
      if (aliases && aliases.some((a) => a.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [charSearch]);

  // Quick preset loader function
  const applyPreset = (
    charId: number,
    level: number,
    rarity: string,
    rank: number,
    extras?: { pmDef?: number; atk?: number; hp?: number; pCritCut?: number; debuffRes?: number; defPen?: number; hpDrain?: number; subLevel?: number }
  ) => {
    setSelectedCharId(charId);
    setSelectedLevel(level);
    setSelectedSubLevel(extras?.subLevel !== undefined ? extras.subLevel : (level >= 240 ? 0 : 0));
    setSelectedRarityLabel(rarity);
    setPlayerRank(rank);
    setExtraPmDefBreak(extras?.pmDef || 0);
    setExtraAtk(extras?.atk || 0);
    setExtraHp(extras?.hp || 0);
    setExtraDefPen(extras?.defPen || 0);
    setExtraHpDrainPct(extras?.hpDrain || 0);
    setExtraPCritCutPct(extras?.pCritCut || 0);
    setExtraDebuffRes(extras?.debuffRes || 0);
  };

  // Copy simulated stats to Custom Calculator
  const copyToCustomCalculator = () => {
    setCharClass(currentChar.job);
    setStats({
      hp: masterCalculation.finalHp,
      atk: masterCalculation.finalAtk,
      def: masterCalculation.finalDef,
      pDef: masterCalculation.finalPDef,
      mDef: masterCalculation.finalMDef,
      defPen: masterCalculation.finalDefPen,
      pmDefPen: masterCalculation.finalPmDefBreak,
      speed: masterCalculation.speed,
      hit: masterCalculation.finalHit,
      evasion: masterCalculation.finalEva,
      crit: masterCalculation.finalCrit,
      critRes: masterCalculation.finalCritRes,
      critDmgBoostPct: masterCalculation.finalCritDmgBoostPct,
      pCritCutPct: masterCalculation.finalPCritCutPct,
      mCritCutPct: masterCalculation.finalMCritCutPct,
      debuffHit: masterCalculation.finalDebuffHit,
      debuffRes: masterCalculation.finalDebuffRes,
      counterPct: masterCalculation.finalCounterPct,
      hpDrainPct: masterCalculation.finalHpDrainPct,
      str: masterCalculation.str,
      dex: masterCalculation.dex,
      mag: masterCalculation.mag,
      sta: masterCalculation.sta,
    });
    setCopiedNotification(true);
    setTimeout(() => {
      setCopiedNotification(false);
      setActiveTab('calculator');
    }, 600);
  };

  const formatNum = (n: number) => {
    return Math.floor(n).toLocaleString('id-ID');
  };

  const formatDec = (n: number, dec: number = 2) => {
    return n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-lg">Memento Mori CP Calculator</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Rumus Asli Terverifikasi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Level Scaling &bull; Rarity Multipliers &bull; Player Rank Bonus &bull; Truncate Math.floor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveTab('pure_base')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'pure_base'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Simulator Karakter & Rank
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'calculator'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                Kalkulator Bebas
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'validation'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Uji Validasi In-Game
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'guide'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Dokumentasi
              </button>
            </div>

            {/* Save & Export App Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-all border border-indigo-400/30"
              title="Cara menyimpan dan menjadikan aplikasi di HP/PC"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold">Simpan & Jadi Aplikasi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ========================================================================= */}
        {/* TAB 1: SIMULATOR KARAKTER, RARITY, LEVEL & PLAYER RANK                   */}
        {/* ========================================================================= */}
        {activeTab === 'pure_base' && (
          <div className="space-y-5">
            {/* Quick Test Presets Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Uji Cepat Karakter Terverifikasi:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => applyPreset(7, 1, 'SR', 10)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 7 && selectedLevel === 1 && selectedRarityLabel === 'SR' && playerRank === 10
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/50'
                      : 'bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30'
                  }`}
                >
                  <span className="font-bold">Fenrir Lv 1 (SR)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                    19.208 CP
                  </span>
                </button>

                <button
                  onClick={() => applyPreset(41, 1, 'SR', 10)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 41 && selectedLevel === 1 && selectedRarityLabel === 'SR' && playerRank === 10
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950/50'
                      : 'bg-slate-950 border-rose-500/40 text-rose-300 hover:bg-rose-950/30'
                  }`}
                >
                  <span className="font-bold">Natasha Lv 1 (SR)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                    19.707 CP
                  </span>
                </button>

                <button
                  onClick={() => applyPreset(26, 1, 'SR', 10)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 26 && selectedLevel === 1 && selectedRarityLabel === 'SR' && playerRank === 10
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/50'
                      : 'bg-slate-950 border-purple-500/40 text-purple-300 hover:bg-purple-950/30'
                  }`}
                >
                  <span className="font-bold">Merlyn Lv 1 (SR)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
                    19.176 CP
                  </span>
                </button>

                <button
                  onClick={() => applyPreset(37, 1, 'UR+', 207, { pCritCut: 7.0 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 37 && selectedLevel === 1 && selectedRarityLabel === 'UR+' && playerRank === 207 && extraPCritCutPct === 7.0
                      ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-950/50'
                      : 'bg-slate-950 border-amber-500/40 text-amber-300 hover:bg-amber-950/30'
                  }`}
                  title="Hathor UR+ Rank 207 dengan Arcana Lynx's Dance (P.Crit Cut 7.0% = +14.000 CP)"
                >
                  <span className="font-bold">Hathor UR+ (Rank 207 + Arcana 7%)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                    321.384 CP
                  </span>
                </button>

                <button
                  onClick={() => applyPreset(27, 1, 'LR', 207, { debuffRes: 150 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 27 && selectedLevel === 1 && selectedRarityLabel === 'LR' && playerRank === 207 && extraDebuffRes === 150
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/50'
                      : 'bg-slate-950 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/30'
                  }`}
                  title="Cordie LR Rank 207 dengan Arcana Ursa's Insight (Debuff RES 150 = +150 CP)"
                >
                  <span className="font-bold">Cordie LR (Rank 207 + Arcana 150)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold">
                    311.574 CP
                  </span>
                </button>

                <button
                  onClick={() => applyPreset(27, 240, 'LR', 200, { subLevel: 0 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 27 && selectedLevel === 240 && selectedSubLevel === 0 && selectedRarityLabel === 'LR'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/50'
                      : 'bg-slate-950 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30'
                  }`}
                  title="Level Link Base: Cordie LR Lv 240.0"
                >
                  <span className="font-bold">🌲 Cordie Lv 240.0</span>
                </button>

                <button
                  onClick={() => applyPreset(27, 240, 'LR', 200, { subLevel: 9 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 27 && selectedLevel === 240 && selectedSubLevel === 9 && selectedRarityLabel === 'LR'
                      ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-950/50'
                      : 'bg-slate-950 border-teal-500/40 text-teal-300 hover:bg-teal-950/30'
                  }`}
                  title="Level Link Pre-Breakthrough: Cordie LR Lv 240.9 (+6.697 param per sub)"
                >
                  <span className="font-bold">🌲 Cordie Lv 240.9</span>
                </button>

                <button
                  onClick={() => applyPreset(27, 241, 'LR', 200, { subLevel: 0 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 27 && selectedLevel === 241 && selectedSubLevel === 0 && selectedRarityLabel === 'LR'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950/50'
                      : 'bg-slate-950 border-blue-500/40 text-blue-300 hover:bg-blue-950/30'
                  }`}
                  title="Level Link Breakthrough: Cordie LR Lv 241.0 (+60.612 jump with Potential Orbs)"
                >
                  <span className="font-bold">⚡ Cordie Lv 241.0</span>
                </button>

                <button
                  onClick={() => applyPreset(27, 265, 'LR', 200, { subLevel: 0 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 27 && selectedLevel === 265 && selectedSubLevel === 0 && selectedRarityLabel === 'LR'
                      ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-950/50'
                      : 'bg-slate-950 border-violet-500/40 text-violet-300 hover:bg-violet-950/30'
                  }`}
                  title="Level Link 5 LR Cap Mentok: Cordie LR Lv 265.0"
                >
                  <span className="font-bold">🛡️ Lv 265.0 (5 LR Cap)</span>
                </button>

                <button
                  onClick={() => applyPreset(37, 500, 'LR10', 400, { pCritCut: 7.0, subLevel: 0 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 37 && selectedLevel === 500 && selectedRarityLabel === 'LR10' && playerRank === 400
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950/50'
                      : 'bg-slate-950 border-rose-500/40 text-rose-300 hover:bg-rose-950/30'
                  }`}
                  title="Simulasi Hathor: Level 500, Rarity LR10, Player Rank 400"
                >
                  <span className="font-bold">⭐ Hathor Lv 500 (Rank 400)</span>
                </button>

                <button
                  onClick={() => applyPreset(37, 1000, 'LR10', 1000, { pCritCut: 7.0, subLevel: 9 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 37 && selectedLevel === 1000 && selectedSubLevel === 9 && selectedRarityLabel === 'LR10' && playerRank === 1000
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-amber-400 shadow-lg shadow-amber-950/50'
                      : 'bg-slate-950 border-amber-500/40 text-amber-300 hover:bg-amber-950/30'
                  }`}
                  title="Simulasi Hathor MENTOK 1000.9: Level 1000.9, Rarity LR10, Player Rank 1000"
                >
                  <span className="font-bold">🔥 Hathor Lv 1000.9 (Rank 1000 Mentok)</span>
                </button>

                <button
                  onClick={() => applyPreset(27, 1000, 'LR10', 1000, { debuffRes: 150, subLevel: 9 })}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium flex items-center gap-1.5 transition ${
                    selectedCharId === 27 && selectedLevel === 1000 && selectedSubLevel === 9 && selectedRarityLabel === 'LR10' && playerRank === 1000
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30'
                  }`}
                  title="Simulasi Cordie MENTOK 1000.9: Level 1000.9, Rarity LR10, Player Rank 1000"
                >
                  <span className="font-bold">🔥 Cordie Lv 1000.9 (Rank 1000 Mentok)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                      <Sliders className="w-4 h-4" />
                      Parameter Input & Konfigurasi
                    </span>
                    <span className="text-[10px] text-slate-400">Total {MASTER_CHARACTERS.length} Witches</span>
                  </div>

                  {/* 1. Search Character */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-200 font-medium">Pilih Karakter Witch:</label>
                      <span className="text-[10px] text-indigo-400 font-mono">
                        {currentChar.nameEn} ({currentChar.job})
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={charSearch}
                        onChange={(e) => setCharSearch(e.target.value)}
                        placeholder="Cari e.g. Fenrir, Natasha, Merlyn, Florence..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    </div>

                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/60 border border-slate-800/80 rounded-lg bg-slate-950/80 p-1">
                      {filteredCharacters.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCharId(c.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs transition ${
                            selectedCharId === c.id
                              ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{c.nameEn}</span>
                            <span className="text-[10px] text-slate-500">({c.nameJp})</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              c.baseRarity === 'SR' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {c.baseRarity}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {c.job}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Tingkat Rarity */}
                  <div className="space-y-2 text-xs pt-1 border-t border-slate-800/80">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-200 font-medium">Tingkat Rarity:</label>
                      <span className="text-[11px] font-mono text-amber-400">
                        m: {currentRarity.m.toFixed(3)} &bull; b: +{formatNum(currentRarity.b)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {rarityOptions.map((r) => (
                        <button
                          key={r.label}
                          onClick={() => setSelectedRarityLabel(r.label)}
                          className={`py-1.5 rounded-md text-xs font-mono font-medium transition ${
                            selectedRarityLabel === r.label
                              ? 'bg-indigo-600 text-white font-bold shadow'
                              : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                      <span>Formula Scaled Total Potensial:</span>
                      <span className="font-mono text-indigo-300 font-semibold">
                        Math.floor({formatNum(masterCalculation.rawLevelBase)} &times; {currentRarity.m.toFixed(3)} + {currentRarity.b}) = {formatNum(masterCalculation.scaledTotal)}
                      </span>
                    </div>
                  </div>

                  {/* 3. Level Karakter & Level Link Tree (Sub-Level .0 s/d .9 & LR Cap System) */}
                  <div className="space-y-3 text-xs pt-1 border-t border-slate-800/80">
                    <div className="flex flex-wrap justify-between items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-slate-200">
                          {selectedLevel >= 240 ? 'Level Link Tree (Party Lv Mode):' : 'Level Karakter:'}
                        </span>
                        {selectedLevel >= 240 && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Tree Aktif &bull; Lv {selectedLevel}.{selectedSubLevel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px]">Lv:</span>
                        <input
                          type="number"
                          min={1}
                          max={enforceLrCap && selectedLevel >= 240 ? Math.max(240, 240 + lrCharacterCount * 5) : 1000}
                          value={selectedLevel}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxLimit = enforceLrCap && val >= 240 ? Math.max(240, 240 + lrCharacterCount * 5) : 1000;
                            setSelectedLevel(Math.max(1, Math.min(maxLimit, val)));
                          }}
                          className="w-16 bg-slate-950 border border-indigo-500/50 rounded px-2 py-0.5 text-center font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-400"
                        />
                        {selectedLevel >= 240 && (
                          <span className="text-emerald-400 font-mono font-bold text-sm">
                            .{selectedSubLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Slider Level */}
                    <input
                      type="range"
                      min={1}
                      max={enforceLrCap && selectedLevel >= 240 ? Math.max(240, 240 + lrCharacterCount * 5) : 1000}
                      value={selectedLevel}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setSelectedLevel(val);
                      }}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />

                    {/* Sub-Level Picker (.0 hingga .9) untuk Lv 240+ */}
                    {selectedLevel >= 240 && (
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2">
                        <div className="flex flex-wrap justify-between items-center text-[11px] gap-1">
                          <span className="font-semibold text-emerald-300 flex items-center gap-1">
                            <Network className="w-3.5 h-3.5 text-emerald-400" />
                            Party Sub-Level (EXP Orbs Step .0 s/d .9):
                          </span>
                          <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            Aktif: Lv {selectedLevel}.{selectedSubLevel}
                          </span>
                        </div>
                        <div className="grid grid-cols-10 gap-1">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((sub) => (
                            <button
                              key={sub}
                              onClick={() => setSelectedSubLevel(sub)}
                              className={`py-1 rounded font-mono text-xs font-bold transition ${
                                selectedSubLevel === sub
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-400'
                                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-emerald-950/30 border border-slate-800'
                              }`}
                              title={`Sub-Level .${sub} (Base Param: ${formatNum(getLevelBaseParam(selectedLevel, sub))})`}
                            >
                              .{sub}
                            </button>
                          ))}
                        </div>

                        {/* Penjelasan Mekanisme Sub-Level 240.1 - 240.9 */}
                        <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between text-slate-300 font-medium">
                            <span>Base Parameter Level {selectedLevel}.{selectedSubLevel}:</span>
                            <span className="font-mono text-emerald-300 font-bold">{formatNum(masterCalculation.rawLevelBase)}</span>
                          </div>
                          {selectedLevel === 240 ? (
                            <p className="text-slate-400">
                              💡 <strong>Lv 240.0 s/d 240.9:</strong> Setiap kenaikan sub-level membutuhkan Experience Orbs dan menambah <strong className="text-emerald-300">+6.697</strong> TotalBaseParameter (240.0: 894.911 &rarr; 240.9: 955.184). Melewati 240.9 menuju 241.0 (+60.612 lonjakan) membutuhkan Potential Orbs!
                            </p>
                          ) : (
                            <p className="text-slate-400">
                              💡 <strong>Party Lv {selectedLevel}.0 s/d {selectedLevel}.9:</strong> Setiap sub-level dinaikkan bertahap dengan EXP Orbs (+921 parameter per sub), dan transisi ke level penuh berikutnya membutuhkan Potential Orbs.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Level Link Tree Roster & LR Cap Settings */}
                    {selectedLevel >= 240 && (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-200">
                              Karakter LR Dimiliki (LR Count):
                            </span>
                            <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">
                              Batas Cap: Lv {240 + lrCharacterCount * 5}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEnforceLrCap(!enforceLrCap)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium transition ${
                                enforceLrCap
                                  ? 'bg-amber-600 text-white font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {enforceLrCap ? '🔒 Batas LR Terkunci' : '🔓 Mode Bebas (s/d 1000)'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={5}
                            max={160}
                            value={lrCharacterCount}
                            onChange={(e) => {
                              const cnt = parseInt(e.target.value) || 5;
                              setLrCharacterCount(cnt);
                              if (enforceLrCap) {
                                const newCap = 240 + cnt * 5;
                                if (selectedLevel > newCap) setSelectedLevel(newCap);
                              }
                            }}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={5}
                              max={160}
                              value={lrCharacterCount}
                              onChange={(e) => {
                                const cnt = Math.max(5, Math.min(160, parseInt(e.target.value) || 5));
                                setLrCharacterCount(cnt);
                                if (enforceLrCap) {
                                  const newCap = 240 + cnt * 5;
                                  if (selectedLevel > newCap) setSelectedLevel(newCap);
                                }
                              }}
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-xs text-emerald-300 font-bold"
                            />
                            <span className="text-[10px] text-slate-400">LR</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {[
                            { count: 5, cap: 265, label: '5 LR (Cap 265 - Awal)' },
                            { count: 6, cap: 270, label: '6 LR (Cap 270)' },
                            { count: 7, cap: 275, label: '7 LR (Cap 275)' },
                            { count: 10, cap: 290, label: '10 LR (Cap 290)' },
                            { count: 20, cap: 340, label: '20 LR (Cap 340)' },
                            { count: 152, cap: 1000, label: '152 LR (Cap 1000 Mentok)' }
                          ].map((item) => (
                            <button
                              key={item.count}
                              onClick={() => {
                                setLrCharacterCount(item.count);
                                setSelectedLevel(item.cap);
                                setSelectedSubLevel(0);
                              }}
                              className={`px-2 py-0.5 rounded font-mono transition ${
                                lrCharacterCount === item.count
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <p className="text-[10px] text-slate-500 leading-tight">
                          * Level Link Tree aktif ketika 5 karakter mencapai Lv 240 (LR). Batas awal adalah Lv 265. Setiap tambahan 1 karakter LR menaikkan batas Party Lv sebanyak +5.
                        </p>
                      </div>
                    )}

                    {/* Tombol Pintas Level Karakter & Milestones */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {[
                        { lv: 1, sub: 0, label: 'Lv 1' },
                        { lv: 80, sub: 0, label: 'Lv 80' },
                        { lv: 100, sub: 0, label: 'Lv 100' },
                        { lv: 140, sub: 0, label: 'Lv 140' },
                        { lv: 180, sub: 0, label: 'Lv 180' },
                        { lv: 200, sub: 0, label: 'Lv 200' },
                        { lv: 240, sub: 0, label: 'Lv 240.0' },
                        { lv: 240, sub: 9, label: 'Lv 240.9' },
                        { lv: 241, sub: 0, label: '⚡ Lv 241.0' },
                        { lv: 265, sub: 0, label: '🛡️ Lv 265 (5 LR)' },
                        { lv: 270, sub: 0, label: 'Lv 270 (6 LR)' },
                        { lv: 300, sub: 0, label: 'Lv 300 (Awaken)' },
                        { lv: 500, sub: 0, label: 'Lv 500.0' },
                        { lv: 750, sub: 0, label: 'Lv 750.0' },
                        { lv: 1000, sub: 9, label: '🔥 Lv 1000.9 (MAX Mentok)' },
                      ].map((item) => (
                        <button
                          key={`${item.lv}.${item.sub}`}
                          onClick={() => {
                            setSelectedLevel(item.lv);
                            setSelectedSubLevel(item.sub);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono transition ${
                            selectedLevel === item.lv && (item.lv < 240 || selectedSubLevel === item.sub)
                              ? 'bg-indigo-600 text-white font-bold shadow'
                              : item.lv === 1000
                              ? 'bg-slate-900 text-rose-300 hover:text-white border border-rose-500/50 font-bold'
                              : item.lv >= 240
                              ? 'bg-slate-900 text-emerald-300 hover:text-white border border-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                      <span>Total Base Parameter Game ({selectedLevel}{selectedLevel >= 240 ? `.${selectedSubLevel}` : ''}):</span>
                      <span className="font-mono text-indigo-300 font-bold">{formatNum(masterCalculation.rawLevelBase)}</span>
                    </div>
                  </div>

                  {/* 4. Player Rank Akun (Lengkap Sesuai File Master PlayerRankMB.json) */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Player Rank Level Akun (Mentok Rank 1000):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px]">Rank:</span>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={playerRank}
                          onChange={(e) => setPlayerRank(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                          className="w-16 bg-slate-950 border border-amber-500/50 rounded px-2 py-0.5 text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={1000}
                      value={playerRank}
                      onChange={(e) => setPlayerRank(parseInt(e.target.value) || 1)}
                      className="w-full accent-amber-500 cursor-pointer"
                    />

                    {/* Breakdown Lengkap Bonus Player Rank (HP, ATK, HP%, ATK%, Hit, Crit, Slots) */}
                    <div className="bg-slate-950/90 rounded-xl p-2.5 border border-amber-500/20 space-y-2">
                      <div className="flex justify-between items-center text-[11px] pb-1 border-b border-slate-800">
                        <span className="text-amber-300 font-semibold">Bonus Akun dari Rank {playerRank}:</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Slot Level Link: <strong className="text-indigo-300">{masterCalculation.rankBonus.slots} Slots</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                        {/* Flat ATK */}
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Bonus ATK (Flat):</span>
                          <span className="font-bold text-rose-300">+{formatNum(masterCalculation.rankBonus.atk)}</span>
                        </div>

                        {/* Flat HP */}
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Bonus HP (Flat):</span>
                          <span className="font-bold text-emerald-300">+{formatNum(masterCalculation.rankBonus.hp)}</span>
                        </div>

                        {/* HP % Multiplier */}
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">HP % Bonus:</span>
                          <span className={`font-bold ${masterCalculation.rankBonus.hpPct > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                            {masterCalculation.rankBonus.hpPct > 0 ? `+${masterCalculation.rankBonus.hpPct}%` : '0% (Aktif Rank 290+)'}
                          </span>
                        </div>

                        {/* ATK % Multiplier */}
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">ATK % Bonus:</span>
                          <span className={`font-bold ${masterCalculation.rankBonus.atkPct > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {masterCalculation.rankBonus.atkPct > 0 ? `+${masterCalculation.rankBonus.atkPct}%` : '0% (Aktif Rank 660+)'}
                          </span>
                        </div>

                        {/* Hit / Accuracy */}
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Accuracy / Hit:</span>
                          <span className={`font-bold ${masterCalculation.rankBonus.hit > 0 ? 'text-cyan-300' : 'text-slate-500'}`}>
                            {masterCalculation.rankBonus.hit > 0 ? `+${formatNum(masterCalculation.rankBonus.hit)}` : '0 (Aktif Rank 560+)'}
                          </span>
                        </div>

                        {/* Critical */}
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-sans">Critical:</span>
                          <span className={`font-bold ${masterCalculation.rankBonus.crit > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {masterCalculation.rankBonus.crit > 0 ? `+${formatNum(masterCalculation.rankBonus.crit)}` : '0 (Aktif Rank 760+)'}
                          </span>
                        </div>
                      </div>

                      {/* Info Milestone Aktif */}
                      <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                        {masterCalculation.rankBonus.hpPct > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                            ✨ HP +{masterCalculation.rankBonus.hpPct}% Aktif
                          </span>
                        )}
                        {masterCalculation.rankBonus.atkPct > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                            ✨ ATK +{masterCalculation.rankBonus.atkPct}% Aktif
                          </span>
                        )}
                        {masterCalculation.rankBonus.hit > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                            🎯 Hit +{formatNum(masterCalculation.rankBonus.hit)} Aktif
                          </span>
                        )}
                        {masterCalculation.rankBonus.crit > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-950/80 border border-yellow-500/40 text-yellow-300">
                            💥 Crit +{formatNum(masterCalculation.rankBonus.crit)} Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tombol Pintas Milestone Rank */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {[
                        { rk: 1, label: 'Rank 1' },
                        { rk: 10, label: 'Rank 10' },
                        { rk: 50, label: 'Rank 50' },
                        { rk: 100, label: 'Rank 100' },
                        { rk: 200, label: 'Rank 200' },
                        { rk: 207, label: 'Rank 207 (Kasus)' },
                        { rk: 290, label: 'Rank 290 (HP +10%)' },
                        { rk: 360, label: 'Rank 360 (HP +30%)' },
                        { rk: 560, label: 'Rank 560 (Hit +30k)' },
                        { rk: 660, label: 'Rank 660 (ATK +3%)' },
                        { rk: 760, label: 'Rank 760 (Crit +20k)' },
                        { rk: 860, label: 'Rank 860 (ATK +4%)' },
                        { rk: 960, label: 'Rank 960 (Crit +30k)' },
                        { rk: 1000, label: 'Rank 1000 (MAX Mentok)' },
                      ].map((item) => (
                        <button
                          key={item.rk}
                          onClick={() => setPlayerRank(item.rk)}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono transition ${
                            playerRank === item.rk
                              ? 'bg-amber-600 text-white font-bold shadow'
                              : item.rk === 207
                              ? 'bg-slate-900 text-amber-300 hover:text-white border border-amber-500/50 font-bold'
                              : item.rk === 1000
                              ? 'bg-slate-900 text-rose-300 hover:text-white border border-rose-500/50 font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Extra In-game Adjustments (e.g. Weapon PM DEF Break, Gear HP Drain, dll.) */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-300 block">
                        Penyesuaian Ekstra Akun / Gear (Opsional):
                      </span>
                      <span className="text-[10px] text-slate-500">Stat 0 tetap dihitung</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">PM. DEF Break:</label>
                        <input
                          type="number"
                          value={extraPmDefBreak || ''}
                          onChange={(e) => setExtraPmDefBreak(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Extra ATK:</label>
                        <input
                          type="number"
                          value={extraAtk || ''}
                          onChange={(e) => setExtraAtk(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Extra HP:</label>
                        <input
                          type="number"
                          value={extraHp || ''}
                          onChange={(e) => setExtraHp(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">HP Drain (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={extraHpDrainPct || ''}
                          onChange={(e) => setExtraHpDrainPct(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">P.Crit Cut (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={extraPCritCutPct || ''}
                          onChange={(e) => setExtraPCritCutPct(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">DEF Pen:</label>
                        <input
                          type="number"
                          value={extraDefPen || ''}
                          onChange={(e) => setExtraDefPen(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Debuff RES (Arcana):</label>
                        <input
                          type="number"
                          value={extraDebuffRes || ''}
                          onChange={(e) => setExtraDebuffRes(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Results (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Grand Total CP Display */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/40 p-6 shadow-2xl">
                  <div className="relative z-10 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        Total Combat Power (戦闘力) &bull; {currentChar.nameEn} ({selectedRarityLabel} Lv {selectedLevel})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 uppercase">
                          Player Rank {playerRank}
                        </span>

                        {/* Rounding Mode Toggle */}
                        <div className="flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-lg border border-slate-700/80 text-[10px]">
                          <button
                            onClick={() => setRoundingMode('floor')}
                            className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                              roundingMode === 'floor'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Floor: Truncate ke bawah (aturan default)"
                          >
                            Floor ({formatNum(masterCalculation.floorCp)})
                          </button>
                          <button
                            onClick={() => setRoundingMode('round')}
                            className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                              roundingMode === 'round'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Round: Pembulatan terdekat (+1 jika desimal >= 0.5)"
                          >
                            Round ({formatNum(masterCalculation.roundCp)})
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3">
                      <div className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
                        {formatNum(masterCalculation.totalCalculatedCp)}
                      </div>
                      <span className="text-xl font-bold text-indigo-400 font-mono">CP</span>
                      <span className="text-xs text-slate-400 font-mono">
                        (Nilai floating: {formatDec(masterCalculation.totalCalculatedCpFloat, 2)})
                      </span>
                      {masterCalculation.floorCp !== masterCalculation.roundCp && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          Ada selisih 1 angka antara Floor ({formatNum(masterCalculation.floorCp)}) vs Round ({formatNum(masterCalculation.roundCp)})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <p className="text-xs text-slate-300">
                        Gross: <strong>{currentChar.gross}</strong> &bull; Total Potensial: <strong>{formatNum(masterCalculation.sumPotential)}</strong> &bull; Speed: <strong>{masterCalculation.speed}</strong>
                      </p>

                      <button
                        onClick={copyToCustomCalculator}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow transition"
                      >
                        {copiedNotification ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            Disalin ke Kalkulator!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Salin ke Kalkulator Bebas
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-rose-400 block font-medium">ATK Component</span>
                      <span className="text-sm font-bold font-mono text-slate-100">
                        {formatNum(masterCalculation.atkCp)} CP
                      </span>
                    </div>
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-emerald-400 block font-medium">HP Component</span>
                      <span className="text-sm font-bold font-mono text-slate-100">
                        {formatNum(masterCalculation.hpCp)} CP
                      </span>
                    </div>
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-cyan-400 block font-medium">Speed Coupling</span>
                      <span className="text-sm font-bold font-mono text-cyan-300">
                        {formatNum(masterCalculation.speedCp)} CP
                      </span>
                    </div>
                  </div>
                </div>

                {/* View Mode Switcher: Layar Game Asli (Format Sesuai Gambar) vs Grid Lengkap */}
                <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">Mode Tampilan Status:</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">&bull; Format layar game Memento Mori vs Grid</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
                    <button
                      onClick={() => setDisplayViewStyle('ingame')}
                      className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                        displayViewStyle === 'ingame'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🎮 Layar Game Asli (Format Gambar)</span>
                    </button>
                    <button
                      onClick={() => setDisplayViewStyle('grid')}
                      className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                        displayViewStyle === 'grid'
                          ? 'bg-indigo-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Grid Statistik</span>
                    </button>
                  </div>
                </div>

                {displayViewStyle === 'ingame' ? (
                  <div className="space-y-4">
                    {/* Panel Potensial - Exact In-Game Paired Layout */}
                    <div className="bg-slate-900/95 border border-purple-500/30 rounded-2xl p-4 shadow-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                          <h3 className="font-bold text-xs sm:text-sm text-purple-200 uppercase tracking-wide">
                            Potensial ({currentChar.nameEn})
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-500/30">
                          Total: {formatNum(masterCalculation.sumPotential)} &bull; Gross: {currentChar.gross}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                        {/* STR Block */}
                        <div className="bg-slate-950/80 rounded-xl p-3 border border-rose-500/20 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">STR:</span>
                            <span className="text-base font-extrabold text-rose-300">{formatNum(masterCalculation.str)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">ACC:</span>
                            <span className="text-sm font-bold text-slate-100">{formatNum(masterCalculation.potHit)}</span>
                          </div>
                        </div>

                        {/* DEX Block */}
                        <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/20 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 block text-[10px]">DEX:</span>
                              <span className="text-base font-extrabold text-amber-300">{formatNum(masterCalculation.dex)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">
                                {currentChar.job === 'Sniper' ? 'ATK (Matching):' : 'ATK Substat:'}
                              </span>
                              <span className="text-sm font-bold text-rose-400">{formatNum(masterCalculation.potMatchingAtk)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[11px]">
                            <span>EVD: <strong className="text-slate-100">{formatNum(masterCalculation.potEva)}</strong></span>
                            <span>CRIT: <strong className="text-amber-300">{formatNum(masterCalculation.potCrit)}</strong></span>
                          </div>
                        </div>

                        {/* MAG Block */}
                        <div className="bg-slate-950/80 rounded-xl p-3 border border-indigo-500/20 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">MAG:</span>
                            <span className="text-base font-extrabold text-indigo-300">{formatNum(masterCalculation.mag)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">Debuff ACC:</span>
                            <span className="text-sm font-bold text-purple-300">{formatNum(masterCalculation.potDebuffHit)}</span>
                          </div>
                        </div>

                        {/* STA Block */}
                        <div className="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/20 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 block text-[10px]">STA:</span>
                              <span className="text-base font-extrabold text-emerald-300">{formatNum(masterCalculation.sta)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">HP:</span>
                              <span className="text-sm font-bold text-emerald-300">{formatNum(masterCalculation.potHp)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[11px]">
                            <span className="text-slate-500 text-[10px]">STA Substat:</span>
                            <span>CRIT RES: <strong className="text-emerald-400">{formatNum(masterCalculation.potCritRes)}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Panel Atributes - Exact In-Game 2-Column Paired Layout */}
                    <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-indigo-500/20 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                          <h3 className="font-bold text-xs sm:text-sm text-indigo-100 uppercase tracking-wide">
                            Atributes (Sesuai Tampilan Game)
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          19 Parameter Terverifikasi
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 text-xs font-mono">
                        {/* Row 1: HP & ATK */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">HP:</span>
                          <span className="text-sm font-bold text-emerald-300">{formatNum(masterCalculation.finalHp)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">ATK:</span>
                          <span className="text-sm font-bold text-rose-300">{formatNum(masterCalculation.finalAtk)}</span>
                        </div>

                        {/* Row 2: DEF & DEF Break */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">DEF:</span>
                          <span className="text-sm font-bold text-slate-100">{masterCalculation.finalDef}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">DEF Break:</span>
                          <span className="text-sm font-bold text-slate-100">{formatNum(masterCalculation.finalDefPen)}</span>
                        </div>

                        {/* Row 3: SPD & PM. DEF Break */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">SPD:</span>
                          <span className="text-sm font-bold text-cyan-300">{masterCalculation.speed}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">PM. DEF Break:</span>
                          <span className="text-sm font-bold text-indigo-300">{formatNum(masterCalculation.finalPmDefBreak)}</span>
                        </div>

                        {/* Row 4: P. DEF & M. DEF */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">P. DEF:</span>
                          <span className="text-sm font-bold text-slate-200">{formatNum(masterCalculation.finalPDef)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">M. DEF:</span>
                          <span className="text-sm font-bold text-slate-200">{formatNum(masterCalculation.finalMDef)}</span>
                        </div>

                        {/* Row 5: ACC & EVD */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">ACC:</span>
                          <span className="text-sm font-bold text-slate-200">{formatNum(masterCalculation.finalHit)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">EVD:</span>
                          <span className="text-sm font-bold text-slate-200">{formatNum(masterCalculation.finalEva)}</span>
                        </div>

                        {/* Row 6: CRIT & CRIT RES */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">CRIT:</span>
                          <span className="text-sm font-bold text-amber-300">{formatNum(masterCalculation.finalCrit)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">CRIT RES:</span>
                          <span className="text-sm font-bold text-emerald-400">{formatNum(masterCalculation.finalCritRes)}</span>
                        </div>

                        {/* Row 7: CRIT DMG Boost & P. CRIT DMG Cut */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">CRIT DMG Boost:</span>
                          <span className="text-sm font-bold text-amber-300">{formatDec(masterCalculation.finalCritDmgBoostPct, 1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">P. CRIT DMG Cut:</span>
                          <span className="text-sm font-bold text-amber-400">{formatDec(masterCalculation.finalPCritCutPct, 1)}%</span>
                        </div>

                        {/* Row 8: M. CRIT DMG Cut & Debuff ACC */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">M. CRIT DMG Cut:</span>
                          <span className="text-sm font-bold text-slate-300">{formatDec(masterCalculation.finalMCritCutPct, 1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">Debuff ACC:</span>
                          <span className="text-sm font-bold text-purple-300">{formatNum(masterCalculation.finalDebuffHit)}</span>
                        </div>

                        {/* Row 9: Debuff RES & Counter */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">Debuff RES:</span>
                          <span className="text-sm font-bold text-purple-200">{masterCalculation.finalDebuffRes}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">Counter:</span>
                          <span className="text-sm font-bold text-slate-300">{formatDec(masterCalculation.finalCounterPct, 1)}%</span>
                        </div>

                        {/* Row 10: HP Drain & Info badge */}
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <span className="text-slate-400 font-sans font-medium">HP Drain:</span>
                          <span className="text-sm font-bold text-rose-300">{formatDec(masterCalculation.finalHpDrainPct, 1)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px]">
                          <span>Status Nilai 0:</span>
                          <span className="font-semibold text-emerald-400">Aktif & Tetap Dihitung</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 4 Primary Potential Stats (Grid Mode) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-rose-400 uppercase">STR / 腕力</span>
                          <span className="text-[10px] text-slate-500 font-mono">({currentChar.muscle})</span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-white">
                          {formatNum(masterCalculation.str)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          P.Def: {formatNum(masterCalculation.potPDef)}, Hit: {formatNum(masterCalculation.potHit)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">DEX / 技力</span>
                          <span className="text-[10px] text-slate-500 font-mono">({currentChar.energy})</span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-white">
                          {formatNum(masterCalculation.dex)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Eva: {formatNum(masterCalculation.potEva)}, Crit: {formatNum(masterCalculation.potCrit)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-purple-400 uppercase">MAG / 魔力</span>
                          <span className="text-[10px] text-slate-500 font-mono">({currentChar.intelligence})</span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-white">
                          {formatNum(masterCalculation.mag)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          M.Def: {formatNum(masterCalculation.potMDef)}, Debuff: {formatNum(masterCalculation.potDebuffHit)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">STA / 耐久力</span>
                          <span className="text-[10px] text-slate-500 font-mono">({currentChar.health})</span>
                        </div>
                        <div className="text-xl font-extrabold font-mono text-white">
                          {formatNum(masterCalculation.sta)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          HP: {formatNum(masterCalculation.potHp)}, CritRes: {formatNum(masterCalculation.potCritRes)}
                        </span>
                      </div>
                    </div>

                    {/* Complete Final Panel Attributes (Grid Mode) */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-indigo-400" />
                          Status Lengkap Karakter (Grid Mode):
                        </span>
                        <span className="text-[10px] text-slate-400">19 Parameter Tempur</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">HP:</span>
                          <span className="font-mono font-bold text-emerald-300 text-sm">{formatNum(masterCalculation.finalHp)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">ATK:</span>
                          <span className="font-mono font-bold text-rose-300 text-sm">{formatNum(masterCalculation.finalAtk)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">DEF:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{masterCalculation.finalDef}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Speed:</span>
                          <span className="font-mono font-bold text-cyan-400 text-sm">{masterCalculation.speed}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Physical DEF:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatNum(masterCalculation.finalPDef)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Magic DEF:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatNum(masterCalculation.finalMDef)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">ACC (Hit):</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatNum(masterCalculation.finalHit)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">EVD:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatNum(masterCalculation.finalEva)}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Critical:</span>
                          <span className="font-mono font-bold text-amber-300 text-sm">{formatNum(masterCalculation.finalCrit)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Crit RES:</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">{formatNum(masterCalculation.finalCritRes)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Debuff ACC:</span>
                          <span className="font-mono font-bold text-purple-300 text-sm">{formatNum(masterCalculation.finalDebuffHit)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Debuff RES:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{masterCalculation.finalDebuffRes}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">PM. DEF Break:</span>
                          <span className="font-mono font-bold text-indigo-300 text-sm">{formatNum(masterCalculation.finalPmDefBreak)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">DEF Pen:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatNum(masterCalculation.finalDefPen)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Crit DMG Boost:</span>
                          <span className="font-mono font-bold text-amber-300 text-sm">{formatDec(masterCalculation.finalCritDmgBoostPct, 1)}%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">P.DEF DMG Cut:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatDec(masterCalculation.finalPCritCutPct, 1)}%</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">M.DEF DMG Cut:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatDec(masterCalculation.finalMCritCutPct, 1)}%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">HP Drain:</span>
                          <span className="font-mono font-bold text-rose-300 text-sm">{formatDec(masterCalculation.finalHpDrainPct, 1)}%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Counter:</span>
                          <span className="font-mono font-bold text-slate-200 text-sm">{formatDec(masterCalculation.finalCounterPct, 1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CP Breakdown Table */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-3.5 bg-slate-800/60 border-b border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Rincian Kontribusi CP per Parameter (Formula Game):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Stat bernilai 0 (HP Drain, P.DEF DMG Cut, dll.) tetap diikutsertakan secara penuh
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      19 Parameter Lengkap
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/60 text-xs font-mono max-h-[480px] overflow-y-auto">
                    {masterCalculation.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 flex justify-between items-center transition ${
                          item.val === 0
                            ? 'bg-slate-950/30 text-slate-400 hover:bg-slate-900/40'
                            : item.isSpeed
                            ? 'bg-cyan-950/20 text-cyan-200'
                            : 'bg-slate-950/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={item.val === 0 ? 'text-slate-400' : 'text-slate-200 font-medium'}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({item.isPct ? formatDec(item.val, 1) + '%' : formatNum(item.val)} &times; {item.isSpeed ? formatDec(item.rate, 4) : item.rate.toFixed(item.rate % 1 === 0 ? 1 : 2)})
                          </span>
                          {item.val === 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                              Stat 0 (Tetap Dihitung)
                            </span>
                          )}
                        </div>
                        <span className={`font-bold ${item.val === 0 ? 'text-slate-400' : 'text-slate-100'}`}>
                          {formatDec(item.cp, 2)} CP
                        </span>
                      </div>
                    ))}
                    <div className="p-3 flex justify-between bg-slate-900 text-sm font-bold border-t border-slate-700">
                      <span className="text-white">Total CP Akhir ({roundingMode === 'floor' ? 'Truncate Math.floor' : 'Pembulatan Math.round'})</span>
                      <span className="text-indigo-400 text-base">{formatNum(masterCalculation.totalCalculatedCp)} CP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KALKULATOR BEBAS 19 STAT                                          */}
        {/* ========================================================================= */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Job Tipe:</span>
                  <div className="flex gap-1">
                    {(['Warrior', 'Sniper', 'Sorcerer'] as const).map((cls) => (
                      <button
                        key={cls}
                        onClick={() => setCharClass(cls)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                          charClass === cls
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setStats({
                        hp: 19208,
                        atk: 1912,
                        def: 10,
                        pDef: 1520,
                        mDef: 1695,
                        defPen: 0,
                        pmDefPen: 0,
                        speed: 2894,
                        hit: 760,
                        evasion: 753,
                        crit: 749,
                        critRes: 874,
                        critDmgBoostPct: 0,
                        pCritCutPct: 0,
                        mCritCutPct: 0,
                        debuffHit: 845,
                        debuffRes: 0,
                        counterPct: 0,
                        hpDrainPct: 0,
                        str: 1520,
                        dex: 1501,
                        mag: 1691,
                        sta: 1748,
                      });
                      setCharClass('Sorcerer');
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
                  >
                    Fenrir In-Game
                  </button>
                  <button
                    onClick={() => {
                      setStats({
                        hp: 15211,
                        atk: 2140,
                        def: 10,
                        pDef: 1912,
                        mDef: 1644,
                        defPen: 0,
                        pmDefPen: 4,
                        speed: 2927,
                        hit: 956,
                        evasion: 793,
                        crit: 790,
                        critRes: 659,
                        critDmgBoostPct: 0,
                        pCritCutPct: 0,
                        mCritCutPct: 0,
                        debuffHit: 822,
                        debuffRes: 0,
                        counterPct: 0,
                        hpDrainPct: 0,
                        str: 1912,
                        dex: 1586,
                        mag: 1644,
                        sta: 1319,
                      });
                      setCharClass('Warrior');
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition"
                  >
                    Natasha In-Game
                  </button>
                  <button
                    onClick={() => setStats(DEFAULT_SAMPLE_FLORENCE)}
                    className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition"
                  >
                    Florence Endgame
                  </button>
                  <button
                    onClick={() => setStats(EMPTY_STATS)}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Group 1: Core Combat Stats */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                    <Sword className="w-4 h-4" />
                    Status Tempur Utama
                  </div>
                  <span className="text-[10px] text-slate-500">Bobot: ATK=2, DEF=2.33, Pen=7</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">HP (Hit Points / Darah)</label>
                    <input
                      type="number"
                      value={stats.hp || ''}
                      onChange={(e) => handleStatChange('hp', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">ATK (Attack Power / Serangan)</label>
                    <input
                      type="number"
                      value={stats.atk || ''}
                      onChange={(e) => handleStatChange('atk', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">DEF (Defense Murni)</label>
                    <input
                      type="number"
                      value={stats.def || ''}
                      onChange={(e) => handleStatChange('def', e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">P/M Def Pen (物魔防御貫通 - Bobot 7)</label>
                    <input
                      type="number"
                      value={stats.pmDefPen || ''}
                      onChange={(e) => handleStatChange('pmDefPen', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Defenses & Utility */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <Shield className="w-4 h-4" />
                    Pertahanan & Akurasi
                  </div>
                  <span className="text-[10px] text-slate-500">Bobot: P/M DEF=1.5, Hit/Eva=1.0</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Physical DEF (Bobot 1.5)</label>
                    <input
                      type="number"
                      value={stats.pDef || ''}
                      onChange={(e) => handleStatChange('pDef', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Magic DEF (Bobot 1.5)</label>
                    <input
                      type="number"
                      value={stats.mDef || ''}
                      onChange={(e) => handleStatChange('mDef', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Accuracy / Hit (Bobot 1.0)</label>
                    <input
                      type="number"
                      value={stats.hit || ''}
                      onChange={(e) => handleStatChange('hit', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Evasion / EVA (Bobot 1.0)</label>
                    <input
                      type="number"
                      value={stats.evasion || ''}
                      onChange={(e) => handleStatChange('evasion', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Critical & Potential */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    Critical & 4 Stat Potensial
                  </div>
                  <span className="text-[10px] text-slate-500">Bobot: Crit=3.0, CritRes=3.0</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Critical (x3)</label>
                    <input
                      type="number"
                      value={stats.crit || ''}
                      onChange={(e) => handleStatChange('crit', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Crit RES (x3)</label>
                    <input
                      type="number"
                      value={stats.critRes || ''}
                      onChange={(e) => handleStatChange('critRes', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Debuff ACC (x1)</label>
                    <input
                      type="number"
                      value={stats.debuffHit || ''}
                      onChange={(e) => handleStatChange('debuffHit', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Speed Karakter</label>
                    <input
                      type="number"
                      value={stats.speed || ''}
                      onChange={(e) => handleStatChange('speed', e.target.value)}
                      placeholder="2894"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1.5">
                    Stat Potensial (Digunakan untuk kalkulasi Speed CP: Total Potensial &times; Speed / 8000):
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-rose-400 block font-medium">STR</span>
                      <input
                        type="number"
                        value={stats.str || ''}
                        onChange={(e) => handleStatChange('str', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block font-medium">DEX</span>
                      <input
                        type="number"
                        value={stats.dex || ''}
                        onChange={(e) => handleStatChange('dex', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-400 block font-medium">MAG</span>
                      <input
                        type="number"
                        value={stats.mag || ''}
                        onChange={(e) => handleStatChange('mag', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-medium">STA</span>
                      <input
                        type="number"
                        value={stats.sta || ''}
                        onChange={(e) => handleStatChange('sta', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 4: Special Stats & Percentages (HP Drain, DMG Cut, Counter, etc.) */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Layers className="w-4 h-4" />
                    Status Khusus & Efek Persentase (HP Drain, DMG Cut, Counter, dll.)
                  </div>
                  <span className="text-[10px] text-slate-500">Stat bernilai 0 tetap dihitung penuh</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      HP Drain (HPドレイン - Sedot Darah)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={stats.hpDrainPct || ''}
                        onChange={(e) => handleStatChange('hpDrainPct', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 pr-7"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono">%</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Bobot: 15 per 1%</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      P.DEF DMG Cut / P.Crit Cut (物クリ緩和)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={stats.pCritCutPct || ''}
                        onChange={(e) => handleStatChange('pCritCutPct', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 pr-7"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono">%</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Bobot: 20 per 1%</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      M.DEF DMG Cut / M.Crit Cut (魔クリ緩和)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={stats.mCritCutPct || ''}
                        onChange={(e) => handleStatChange('mCritCutPct', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 pr-7"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono">%</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Bobot: 20 per 1%</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Crit DMG Boost (クリダメ強化)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={stats.critDmgBoostPct || ''}
                        onChange={(e) => handleStatChange('critDmgBoostPct', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 pr-7"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono">%</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Bobot: 20 per 1%</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Counter (カウンタ - Serangan Balik)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={stats.counterPct || ''}
                        onChange={(e) => handleStatChange('counterPct', e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 pr-7"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-mono">%</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Bobot: 15 per 1%</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Debuff RES (弱体効果耐性)
                    </label>
                    <input
                      type="number"
                      value={stats.debuffRes || ''}
                      onChange={(e) => handleStatChange('debuffRes', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">Bobot: 1.0</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      DEF Pen (防御貫通 - Penetrasi Murni)
                    </label>
                    <input
                      type="number"
                      value={stats.defPen || ''}
                      onChange={(e) => handleStatChange('defPen', e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-500">Bobot: 7.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Summary */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/40 p-6 shadow-2xl">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-300 block">
                      Total Combat Power (Kalkulasi Bebas)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-700/80 text-[10px]">
                      <button
                        onClick={() => setRoundingMode('floor')}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                          roundingMode === 'floor'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Floor ({formatNum(fullCalculations.floorCp)})
                      </button>
                      <button
                        onClick={() => setRoundingMode('round')}
                        className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                          roundingMode === 'round'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Round ({formatNum(fullCalculations.roundCp)})
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 font-mono">
                    <div className="text-5xl font-black text-white">{formatNum(fullCalculations.totalCp)}</div>
                    <span className="text-xl font-bold text-rose-400">CP</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Sistem game melakukan truncate <code>Math.floor</code> pada total akhir.
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
                <span className="text-xs font-bold text-slate-200 block">Komposisi Combat Power per Kategori:</span>
                <div className="space-y-2 text-xs font-mono">
                  {Object.entries(fullCalculations.categories).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-300 font-sans font-medium">{cat}</span>
                      <span className="text-slate-100 font-bold">{formatNum(val)} CP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Itemized Breakdown Table for Tab 2 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-3.5 bg-slate-800/60 border-b border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Rincian Kontribusi CP per Parameter (Formula Bebas):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      19 Stat &bull; Nilai 0 (HP Drain, P.Crit Cut, dll.) tetap diikutsertakan
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                    19 Stat
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 text-xs font-mono max-h-[480px] overflow-y-auto">
                  {fullCalculations.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 flex justify-between items-center transition ${
                        item.val === 0
                          ? 'bg-slate-950/30 text-slate-400 hover:bg-slate-900/40'
                          : item.isSpeed
                          ? 'bg-cyan-950/20 text-cyan-200'
                          : 'bg-slate-950/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={item.val === 0 ? 'text-slate-400' : 'text-slate-200 font-medium'}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({item.isPct ? formatDec(item.val, 1) + '%' : formatNum(item.val)} &times; {item.isSpeed ? formatDec(item.rate, 4) : item.rate.toFixed(item.rate % 1 === 0 ? 1 : 2)})
                        </span>
                        {item.val === 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                            Stat 0 (Tetap Dihitung)
                          </span>
                        )}
                      </div>
                      <span className={`font-bold ${item.val === 0 ? 'text-slate-400' : 'text-slate-100'}`}>
                        {formatDec(item.cp, 2)} CP
                      </span>
                    </div>
                  ))}
                  <div className="p-3 flex justify-between bg-slate-900 text-sm font-bold border-t border-slate-700">
                    <span className="text-white">Total CP Akhir ({roundingMode === 'floor' ? 'Truncate Math.floor' : 'Pembulatan Math.round'})</span>
                    <span className="text-rose-400 text-base">{formatNum(fullCalculations.totalCp)} CP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: UJI VALIDASI IN-GAME (FENRIR, NATASHA, MERLYN)                    */}
        {/* ========================================================================= */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/40 shadow-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <h3 className="text-base font-bold text-emerald-300">
                  Semua Sampel In-Game Terbukti 100% Cocok Tanpa Selisih 1 Angka Pun!
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Penemuan aturan pembulatan <strong>Math.floor (Truncate ke bawah)</strong> resmi dari game telah menyempurnakan kalkulasi Fenrir (tepat <strong>19.208 CP</strong>), Natasha (tepat <strong>19.707 CP</strong>), dan Merlyn (tepat <strong>19.176 CP</strong>).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Fenrir */}
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-bold text-white text-base">Fenrir (フェンリル)</h4>
                    <span className="text-xs text-slate-400 font-mono">Sorcerer &bull; SR Lv 1 &bull; Rank 10</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    MATCH 100%
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Hasil In-Game vs Rumus:</span>
                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-2xl font-black text-emerald-400">19.208 CP</span>
                    <span className="text-xs text-slate-400">Selisih: 0 CP</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Potensial (STR/DEX/MAG/STA):</span>
                    <span>1520 / 1501 / 1691 / 1748</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Potensial:</span>
                    <span>6.460</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speed CP (6460 &times; 2894 / 8000):</span>
                    <span className="text-cyan-300">2.336,91 CP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Atribut CP Subtotal:</span>
                    <span>16.871,98 CP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-slate-100">
                    <span>Float CP:</span>
                    <span>19.208,89 &rarr; Math.floor = 19.208</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Natasha */}
              <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-bold text-white text-base">Natasha (ナターシャ)</h4>
                    <span className="text-xs text-slate-400 font-mono">Warrior &bull; SR Lv 1 &bull; Rank 10</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    MATCH 100%
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Hasil In-Game vs Rumus:</span>
                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-2xl font-black text-rose-400">19.707 CP</span>
                    <span className="text-xs text-slate-400">Selisih: 0 CP</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Potensial (STR/DEX/MAG/STA):</span>
                    <span>1912 / 1586 / 1644 / 1319</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PM. DEF Break (4 &times; 7):</span>
                    <span className="text-indigo-300">28,00 CP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speed CP (6461 &times; 2927 / 8000):</span>
                    <span className="text-cyan-300">2.363,92 CP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Atribut CP Subtotal:</span>
                    <span>17.343,88 CP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-slate-100">
                    <span>Float CP:</span>
                    <span>19.707,80 &rarr; Math.floor = 19.707</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Merlyn */}
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-bold text-white text-base">Merlyn (マーリン)</h4>
                    <span className="text-xs text-slate-400 font-mono">Sorcerer &bull; SR Lv 1 &bull; Rank 10</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    MATCH 100%
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Hasil In-Game vs Rumus:</span>
                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-2xl font-black text-purple-400">19.176 CP</span>
                    <span className="text-xs text-slate-400">Selisih: 0 CP</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Potensial (STR/DEX/MAG/STA):</span>
                    <span>1507 / 1507 / 1676 / 1771</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Potensial:</span>
                    <span>6.461</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Speed CP (6461 &times; 2888 / 8000):</span>
                    <span className="text-cyan-300">2.331,68 CP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">HP Akhir (17710 + 2025 + 1):</span>
                    <span className="text-emerald-300">19.736 HP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-slate-100">
                    <span>Float CP:</span>
                    <span>19.176,43 &rarr; Math.floor = 19.176</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Study Section: Hathor (UR+) vs Cordie (LR) & Misteri Arcana Rank 207 */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold font-mono text-sm">
                    IV
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-200">
                      Investigasi & Solusi Kasus: Mengapa Hathor (UR+) Memiliki CP Lebih Tinggi dari Cordie (LR)?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Uji Kasus Player Rank 207 (Bonus HP +942.775, Bonus ATK +105.945) &bull; Level 1 Murni Tanpa Gear/Rune
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Misteri Terpecahkan 100%
                </span>
              </div>

              {/* 2 Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Hathor Card */}
                <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/40 space-y-3.5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">Hathor (UR+) &bull; Sniper Lv 1</h4>
                      <span className="text-[11px] text-amber-300 font-mono">
                        Arcana Aktif: Lynx&apos;s Dance (P. DEF DMG Cut: 7,0%)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      MATCH 100%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Potensial (STR+DEX+MAG+STA):</span>
                      <span>4059 + 4776 + 4012 + 3200 = 16.047</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Speed CP (16047 &times; 3334 / 8000):</span>
                      <span className="text-cyan-300">6.687,52 CP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CP Status Tempur Dasar (Tanpa Arcana):</span>
                      <span>307.384 CP</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-amber-950/30 border border-amber-500/30 font-bold text-amber-300">
                      <span>Bonus Arcana (7,0% P.Crit Cut &times; 2.000):</span>
                      <span>+14.000 CP</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                      <span>Total CP Akhir Game:</span>
                      <span className="text-amber-400 font-black">321.384 CP (Selisih 0)</span>
                    </div>
                  </div>
                </div>

                {/* Cordie Card */}
                <div className="bg-slate-950 p-5 rounded-xl border border-indigo-500/40 space-y-3.5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="font-bold text-white text-base">Cordie (LR) &bull; Sniper Lv 1</h4>
                      <span className="text-[11px] text-indigo-300 font-mono">
                        Arcana Aktif: Ursa&apos;s Insight (Debuff RES: 150)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      MATCH 99.99%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Potensial (STR+DEX+MAG+STA):</span>
                      <span>4592 + 5102 + 4030 + 3520 = 17.244</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Speed CP (17244 &times; 3562 / 8000):</span>
                      <span className="text-cyan-300">7.678,02 CP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CP Status Tempur Dasar (Tanpa Arcana):</span>
                      <span className="text-emerald-300">311.421 CP (Lebih tinggi dari Hathor!)</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-indigo-950/30 border border-indigo-500/30 font-bold text-indigo-300">
                      <span>Bonus Arcana (Debuff RES 150 &times; 1,0):</span>
                      <span>+150 CP</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                      <span>Total CP Akhir Game:</span>
                      <span className="text-indigo-400 font-black">311.574 CP (Selisih &le; 3 CP)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory 3-Point Takeaway */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-300 block">1. Mengapa Hathor UR+ &gt; Cordie LR?</span>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Cordie LR memang memiliki status dasar lebih tinggi (+4.037 CP) berkat rarity LR. Namun Arcana Hathor memberikan <strong>P. DEF DMG Cut 7,0%</strong> yang memiliki bobot resmi sangat masif: <strong>2.000 CP per 1% = +14.000 CP</strong>! Sedangkan Arcana Cordie hanya memberi <strong>Debuff RES +150 = +150 CP</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-indigo-300 block">2. Cara Kerja Arcana / Collection</span>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Di bawah level LR (SR, SSR, UR), Arcana <strong>hanya aktif untuk anggota kelompok (Arcana Group)</strong> yang terdaftar (misal Hathor &amp; Mimi) dan otomatis selalu masuk ke profil karakter. Ketika grup di-ascend ke <strong>LR</strong>, barulah efek pasif global <strong>All Characters</strong> terbuka untuk seluruh karakter akun.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-emerald-300 block">3. Player Rank 207 Dominan (+259k CP)</span>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Pada Rank 207, bonus akun menyumbangkan <strong>+942.775 HP</strong> (&times; 0,05 = 47.138 CP) dan <strong>+105.945 ATK</strong> (&times; 2,0 = 211.890 CP) &rarr; Total <strong>259.028 CP</strong> masuk ke semua karakter akun bahkan di level 1 murni!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DOKUMENTASI RUMUS RESMI                                            */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Arsitektur & Formula Matematis Resmi Memento Mori
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kalkulator ini menerapkan formula reverse-engineering murni dari kode master game Memento Mori (ScobraCK datamine + PlayerRank parameter).
              </p>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-indigo-300">1. Formula Potensial Dasar (Primary Potential)</h4>
                  <pre className="p-3 rounded bg-slate-900 text-slate-200 overflow-x-auto font-mono text-[11px]">
{`scaledTotal = Math.floor(rawLevelBase * rarity.m + rarity.b)

STR = Math.floor((scaledTotal * muscle) / gross)
DEX = Math.floor((scaledTotal * energy) / gross)
MAG = Math.floor((scaledTotal * intelligence) / gross)
STA = Math.floor((scaledTotal * health) / gross)

Total Potential = STR + DEX + MAG + STA`}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-indigo-300">2. Derivasi Atribut Sekunder dari Potensial</h4>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-300">
                    <li><strong>STR</strong> &rarr; Physical DEF = STR, Accuracy (Hit) = Math.floor(STR / 2)</li>
                    <li><strong>DEX</strong> &rarr; Evasion = Math.floor(DEX / 2), Critical = Math.floor(DEX / 2)</li>
                    <li><strong>MAG</strong> &rarr; Magic DEF = MAG, Debuff ACC = Math.floor(MAG / 2)</li>
                    <li><strong>STA</strong> &rarr; Base HP = STA &times; 10, Crit RES = Math.floor(STA / 2)</li>
                    <li><strong>Matching ATK</strong> &rarr; Warrior (STR), Sniper (DEX), Sorcerer (MAG)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-indigo-300">3. Bobot Combat Power (CP Multipliers) Resmi</h4>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">19 Parameter Lengkap</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">HP &times; 0,05</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">ATK &times; 2,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">DEF &times; 7/3 (2,333)</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">Physical DEF &times; 1,5</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">Magic DEF &times; 1,5</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">ACC & EVD &times; 1,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">CRIT &times; 3,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">CRIT RES &times; 3,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">Debuff ACC &times; 1,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">Debuff RES &times; 1,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">PM. DEF Break &times; 7,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-300">DEF Pen &times; 7,0</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-300">Crit DMG Boost &times; 2.000 (per 1%)</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-300">P.DEF DMG Cut &times; 2.000 (per 1%)</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-300">M.DEF DMG Cut &times; 2.000 (per 1%)</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-rose-300">HP Drain &times; 1.500 (per 1%)</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-rose-300">Counter &times; 1.500 (per 1%)</div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-300 col-span-2 sm:col-span-1">Speed Coupling: Potensial &times; SPD / 8000</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-emerald-300">4. Aturan Pembulatan Game Resmi (Kunci Truncate)</h4>
                  <p className="leading-relaxed">
                    Sistem game <strong>menggunakan Math.floor (Truncate / Pembulatan ke bawah)</strong> pada total akhir Combat Power. Jika Anda menemukan karakter tertentu yang terpaut +1 angka, Anda dapat mengganti mode ke <strong>Round (Pembulatan terdekat)</strong> melalui tombol toggle di atas.
                  </p>
                  <pre className="p-3 rounded bg-slate-900 text-emerald-300 font-mono text-[11px]">
Total CP = Math.floor(Sum Atribut CP + Speed CP)
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-amber-300">5. Mekanisme Arcana, Collection &amp; Level Link Slot</h4>
                  <div className="space-y-2 text-[11px] leading-relaxed text-slate-300">
                    <p>
                      <strong>&bull; Arcana di Bawah LR (SR, SSR, UR):</strong> Hanya memberikan bonus stat ke anggota kelompok (<em>Arcana Group</em>) yang bersangkutan (contoh: <em>Lynx&apos;s Dance</em> hanya untuk Hathor &amp; Mimi). Bonus ini otomatis aktif permanen pada atribut karakter.
                    </p>
                    <p>
                      <strong>&bull; Arcana LR (All Characters):</strong> Terbuka ketika seluruh karakter dalam kelompok grup mencapai rarity LR. Memberikan peningkatan atribut global ke <strong>seluruh karakter di akun</strong>, menyebabkan lonjakan ribuan CP di rank tinggi.
                    </p>
                    <p>
                      <strong>&bull; Bobot Ekstrem Damage Cut:</strong> Stat persentase seperti <em>P. DEF DMG Cut (P.Crit Cut)</em> memiliki bobot CP sangat masif yaitu <strong>2.000 CP per 1%</strong> (+14.000 CP untuk 7%). Inilah yang membuat karakter UR+ dengan Arcana ini dapat melampaui karakter LR.
                    </p>
                    <p>
                      <strong>&bull; Player Rank Bonus:</strong> Bonus flat ATK dan HP dari level akun (pada Rank 207: +105.945 ATK dan +942.775 HP) menyumbang lebih dari <strong>259.000 CP</strong> ke setiap karakter akun.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: CARA SIMPAN & JADIKAN APLIKASI (PWA, CLOUD, EXPORT)                 */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cara Menyimpan & Menjadikan Aplikasi</h3>
                  <p className="text-xs text-slate-400">Aplikasi & kode Anda selalu aman dan dapat di-update bersama</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
              <button
                onClick={() => setExportModalTab('pwa')}
                className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  exportModalTab === 'pwa'
                    ? 'bg-rose-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                1. Pasang di HP (PWA)
              </button>
              <button
                onClick={() => setExportModalTab('cloud')}
                className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  exportModalTab === 'cloud'
                    ? 'bg-rose-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                2. Terus Update di AI Studio
              </button>
              <button
                onClick={() => setExportModalTab('local')}
                className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  exportModalTab === 'local'
                    ? 'bg-rose-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                3. Unduh Kode (Local / GitHub)
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-300">
              {/* TAB 1: PWA */}
              {exportModalTab === 'pwa' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/30 space-y-2">
                    <span className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-rose-400" />
                      Install Langsung ke Layar Utama Smartphone Anda (Tanpa Play Store)
                    </span>
                    <p className="text-slate-300">
                      Aplikasi ini sudah dilengkapi dengan <strong>Web App Manifest & PWA Standalone</strong>. Anda bisa memasangnya langsung ke beranda HP seperti aplikasi native:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">A</span>
                        Di Android (Google Chrome):
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                        <li>Buka URL aplikasi ini di Chrome.</li>
                        <li>Tekan tombol menu titik tiga (⋮) di pojok kanan atas.</li>
                        <li>Pilih <strong>"Install app"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                        <li>Ikon kalkulator akan muncul di layar HP Anda dan berjalan full-screen!</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px]">B</span>
                        Di iPhone / iPad (Safari):
                      </span>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                        <li>Buka URL aplikasi ini di browser Safari.</li>
                        <li>Tekan tombol <strong>Share</strong> (ikon kotak dengan panah ke atas di bawah).</li>
                        <li>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong> (+).</li>
                        <li>Beri nama dan tekan <strong>Add</strong>. Selesai!</li>
                      </ol>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">URL Web Aplikasi Anda:</span>
                      <span className="font-mono text-emerald-300 select-all">
                        {window.location.href}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('URL berhasil disalin ke clipboard!');
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                    >
                      Salin Link
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CLOUD AI STUDIO */}
              {exportModalTab === 'cloud' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      Tersimpan Permanen di Akun Google AI Studio Anda
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Kabar baik: <strong>Anda tidak perlu khawatir kehilangan kode ini!</strong> Seluruh kode sumber, master data, dan riwayat obrolan tersimpan otomatis di workspace cloud AI Studio Anda:
                    </p>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400 pt-1">
                      <li><strong>Applet ID</strong>: 9ee7dd70-ce7b-478f-aa03-83896e1644ff</li>
                      <li><strong>Status</strong>: Tersimpan di cloud AI Studio</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200">Cara Melanjutkan & Mengupdate Bersama Saya:</span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                      <li>Cukup simpan bookmark halaman AI Studio Build ini di browser Anda.</li>
                      <li>Kapan pun Anda menemukan data baru (misal: penyesuaian equipment, rune, relic baru, atau formula rank 100+), tinggal ketik pesan di sini.</li>
                      <li>Saya akan langsung membaca codebase yang sudah ada dan memperbarui fitur serta rumusnya sesuai arahan Anda!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB 3: LOCAL / GITHUB */}
              {exportModalTab === 'local' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-amber-400" />
                      Menjalankan Secara Mandiri di Komputer / Laptop Anda
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Aplikasi ini dibangun menggunakan arsitektur modern standar industri: <strong>React 19 + TypeScript + Vite + Tailwind CSS</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-200 block">Langkah-langkah di terminal komputer Anda:</span>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                      <p className="text-slate-500"># 1. Download / Clone folder project ini</p>
                      <p className="text-emerald-400">cd memento-cp-calculator</p>
                      <p className="text-slate-500"># 2. Install dependensi</p>
                      <p className="text-emerald-400">npm install</p>
                      <p className="text-slate-500"># 3. Jalankan server lokal</p>
                      <p className="text-emerald-400">npm run dev</p>
                      <p className="text-slate-500"># 4. Build untuk hosting publik (Vercel / Netlify / GitHub Pages)</p>
                      <p className="text-emerald-400">npm run build</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Folder penting: <code>src/App.tsx</code> dan <code>src/data/mementoData.ts</code></span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
