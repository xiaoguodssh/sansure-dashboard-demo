﻿const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR =
  process.env.DASHBOARD_DATA_DIR || 'C:/Users/Sansure/Documents/驾驶舱数据';
const OUTPUT_FILE = path.resolve(
  __dirname,
  '../src/mocks/generated/dashboardData.json',
);

function toNum(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw || raw === '/' || raw === '-' || raw === '"\t-"') {
    return null;
  }
  const cleaned = raw.replace(/,/g, '').replace(/%/g, '').replace(/["\t]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function pct(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n <= 1 && n >= -1 ? n * 100 : n;
}

function fmt(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(digits));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readWorkbook(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    // HR CSV files are encoded with GBK/CP936 in current batch.
    return XLSX.readFile(filePath, { cellDates: true, raw: false, codepage: 936 });
  }
  return XLSX.readFile(filePath, { cellDates: true, raw: false });
}

function readRows(filePath, sheetName) {
  const wb = readWorkbook(filePath);
  const sn = sheetName && wb.Sheets[sheetName] ? sheetName : wb.SheetNames[0];
  const ws = wb.Sheets[sn];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
}

function readObjects(filePath, sheetName) {
  const wb = readWorkbook(filePath);
  const sn = sheetName && wb.Sheets[sheetName] ? sheetName : wb.SheetNames[0];
  const ws = wb.Sheets[sn];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function listDataFiles() {
  return fs
    .readdirSync(DATA_DIR)
    .filter((name) => ['.xlsx', '.csv'].includes(path.extname(name).toLowerCase()))
    .map((name) => {
      const fullPath = path.join(DATA_DIR, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        fullPath,
        ext: path.extname(name).toLowerCase(),
        mtimeMs: stat.mtimeMs,
      };
    });
}

function normalizeName(name) {
  return name.replace(/\s*\(\d+\)/g, '').toLowerCase();
}

function pickFile(files, keyword) {
  const list = files.filter((f) => f.name.includes(keyword));
  if (!list.length) {
    return null;
  }
  list.sort((a, b) => {
    const an = normalizeName(a.name) === a.name.toLowerCase() ? 1 : 0;
    const bn = normalizeName(b.name) === b.name.toLowerCase() ? 1 : 0;
    if (an !== bn) {
      return bn - an;
    }
    return b.mtimeMs - a.mtimeMs;
  });
  return list[0].fullPath;
}

function pickOptionalFile(files, patterns) {
  const matcher = patterns.map((p) =>
    p instanceof RegExp ? p : new RegExp(String(p), 'i'),
  );
  const list = files.filter((f) => matcher.some((m) => m.test(f.name)));
  if (!list.length) {
    return null;
  }
  list.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return list[0].fullPath;
}

function pickFilesByBaseName(files, baseName) {
  const normalizedBase = normalizeName(baseName);
  const list = files.filter((f) => normalizeName(f.name) === normalizedBase);
  if (!list.length) {
    return [];
  }
  list.sort((a, b) => a.mtimeMs - b.mtimeMs);
  return list.map((item) => item.fullPath);
}

const workbookMetaCache = new Map();

function getWorkbookMeta(filePath) {
  if (workbookMetaCache.has(filePath)) {
    return workbookMetaCache.get(filePath);
  }
  let meta = {
    sheetNames: [],
    firstSheetKeys: [],
  };
  try {
    const wb = readWorkbook(filePath);
    const firstSheet = wb.SheetNames[0];
    const firstRows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { defval: null });
    meta = {
      sheetNames: wb.SheetNames,
      firstSheetKeys: firstRows[0] ? Object.keys(firstRows[0]) : [],
    };
  } catch (error) {
    meta = {
      sheetNames: [],
      firstSheetKeys: [],
    };
  }
  workbookMetaCache.set(filePath, meta);
  return meta;
}

function hasKeys(allKeys, required) {
  const set = new Set(allKeys);
  return required.every((k) => set.has(k));
}

function detectRdProjectFile(files) {
  const candidate = files.find((f) => {
    if (f.ext !== '.xlsx') {
      return false;
    }
    const meta = getWorkbookMeta(f.fullPath);
    return hasKeys(meta.firstSheetKeys, ['EID', 'ENAME', 'PERCENTCOMPLETE']);
  });
  return candidate ? candidate.fullPath : null;
}

function detectDivisionFile(files) {
  const candidate = files.find((f) => {
    if (f.ext !== '.xlsx') {
      return false;
    }
    const meta = getWorkbookMeta(f.fullPath);
    const hasSummarySheet = meta.sheetNames.includes('汇总');
    const firstKeys = meta.firstSheetKeys;
    const looksLikeDataCatalog =
      firstKeys.length >= 2 && (firstKeys[0] === '属性' || firstKeys[1] === '值');
    return hasSummarySheet && looksLikeDataCatalog;
  });
  return candidate ? candidate.fullPath : null;
}

function detectHrFiles(files) {
  const result = {
    onJobStat: null,
    resignStat: null,
    internStat: null,
    personnel: null,
    assignment: null,
  };
  for (const f of files) {
    if (f.ext !== '.csv') {
      continue;
    }
    const keys = getWorkbookMeta(f.fullPath).firstSheetKeys;
    const keySet = new Set(keys);
    if (
      keySet.has('ORG_LEVEL1') &&
      keySet.has('EMP_COUNT') &&
      keySet.has('ORG_LEVEL1_1') &&
      !keySet.has('NAME')
    ) {
      result.onJobStat = result.onJobStat || f.fullPath;
      continue;
    }
    if (
      keySet.has('ORG_LEVEL1') &&
      keySet.has('EMP_COUNT') &&
      keySet.has('ORG_LEVEL1_ID')
    ) {
      result.resignStat = result.resignStat || f.fullPath;
      continue;
    }
    if (
      keySet.has('ORG_LEVEL1') &&
      keySet.has('EMP_COUNT') &&
      keySet.has('NAME') &&
      keySet.has('EMP_STATUS')
    ) {
      result.internStat = result.internStat || f.fullPath;
      continue;
    }
    if (
      keySet.has('WORK_STATUS') &&
      keySet.has('DEPT_NAME') &&
      keySet.has('POSITION_NAME')
    ) {
      result.assignment = result.assignment || f.fullPath;
      continue;
    }
    if (keySet.has('AGE') && keySet.has('EDU_LEVEL') && keySet.has('EDU_LEVEL_CODE')) {
      result.personnel = result.personnel || f.fullPath;
    }
  }
  return result;
}

function monthRange(startMonth, endMonth) {
  const [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  const result = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      y += 1;
      m = 1;
    }
  }
  return result;
}

function seeded(idx, salt = 1) {
  const x = Math.sin(idx * 97.13 + salt * 7.37) * 10000;
  return x - Math.floor(x);
}

function fillMonthlySeries(months, latestValue, options = {}) {
  const {
    minFactor = 0.6,
    maxFactor = 1.05,
    volatility = 0.08,
    digits = 2,
    salt = 1,
  } = options;
  const values = months.map((_, idx) => {
    const progress = (idx + 1) / months.length;
    const baseline = minFactor + (maxFactor - minFactor) * progress;
    const noise = (seeded(idx, salt) - 0.5) * volatility;
    return latestValue * (baseline + noise);
  });
  values[values.length - 1] = latestValue;
  return values.map((v) => fmt(v, digits));
}

function nonEmptyRows(rows) {
  return rows
    .map((row) => row.map((v) => (typeof v === 'string' ? v.trim() : v)))
    .filter((row) => row.some((v) => v !== '' && v !== null && v !== undefined));
}

function parseGroup(filePath) {
  const rows = nonEmptyRows(readRows(filePath));
  const dataRows = rows.slice(2);
  const parsed = dataRows
    .filter((row) => row[0] && typeof row[0] === 'string')
    .map((row) => ({
      name: String(row[0]).trim(),
      monthSales: toNum(row[1]),
      monthTarget: toNum(row[2]),
      monthAchieveRate: toNum(row[3]),
      monthYoy: toNum(row[5]),
      ytdSales: toNum(row[6]),
      ytdTarget: toNum(row[7]),
      ytdAchieveRate: toNum(row[8]),
      ytdYoy: toNum(row[10]),
    }))
    .filter((row) => row.monthSales !== null);

  const total =
    parsed.find((row) => row.name.includes('合计(含海济、红岸)')) ||
    parsed[parsed.length - 1] ||
    null;

  return { rows: parsed, total };
}

function parseLine(filePath) {
  const rows = nonEmptyRows(readRows(filePath));
  const dataRows = rows.slice(2);
  return dataRows
    .filter((row) => row[0] && row[0] !== '合计' && row[0] !== '试剂合计')
    .map((row) => ({
      line: String(row[0]).trim(),
      category: String(row[1] || '').trim(),
      monthSales: toNum(row[2]),
      monthTarget: toNum(row[3]),
      monthAchieveRate: toNum(row[4]),
      ytdSales: toNum(row[7]),
      ytdTarget: toNum(row[8]),
      ytdAchieveRate: toNum(row[9]),
    }))
    .filter((row) => row.monthSales !== null);
}

function parseRegion(filePath) {
  const rows = nonEmptyRows(readRows(filePath));
  const dataRows = rows.slice(2);
  return dataRows
    .filter((row) => row[1] && row[0] !== '合计')
    .map((row) => ({
      category: String(row[0] || '').trim(),
      region: String(row[1] || '').trim(),
      monthTarget: toNum(row[2]),
      monthSales: toNum(row[3]),
      monthAchieveRate: toNum(row[4]),
      monthYoy: toNum(row[6]),
      ytdTarget: toNum(row[7]),
      ytdSales: toNum(row[8]),
      ytdAchieveRate: toNum(row[9]),
      ytdYoy: toNum(row[11]),
    }))
    .filter((row) => row.monthSales !== null);
}

function parseInternational(filePath) {
  const rows = nonEmptyRows(readRows(filePath));
  const dataRows = rows.slice(2);
  return dataRows
    .filter((row) => row[1] && !String(row[0] || '').includes('合计'))
    .map((row) => ({
      group: String(row[0] || '').trim(),
      region: String(row[1] || '').trim(),
      monthSales: toNum(row[2]),
      monthTarget: toNum(row[3]),
      monthAchieveRate: toNum(row[4]),
      monthYoy: toNum(row[6]),
      ytdSales: toNum(row[7]),
      ytdTarget: toNum(row[8]),
      ytdAchieveRate: toNum(row[9]),
      ytdYoy: toNum(row[11]),
    }))
    .filter((row) => row.monthSales !== null);
}

function parseReceivableStat(filePath) {
  const rows = nonEmptyRows(readRows(filePath));
  const dataRows = rows.slice(2);
  return dataRows
    .filter((row) => row[0])
    .map((row) => ({
      department: String(row[0]).trim(),
      systemAmount: toNum(row[1]),
      manualAmount: toNum(row[2]),
      totalAmount: toNum(row[3]),
      momGrowth: toNum(row[5]),
      yoyGrowth: toNum(row[7]),
      ytdAmount: toNum(row[8]),
      ytdYoyGrowth: toNum(row[10]),
    }))
    .filter((row) => row.totalAmount !== null);
}

function parseGrossMargin(filePath) {
  const rows = nonEmptyRows(readRows(filePath));
  const dataRows = rows.slice(4);
  return dataRows
    .filter((row) => row[0])
    .map((row) => ({
      scope: String(row[0]).trim(),
      category: String(row[1] || String(row[0])).trim(),
      income: toNum(row[2]),
      cost: toNum(row[3]),
      predictedGrossMargin: toNum(row[5]),
      actualIncome: toNum(row[6]),
      actualCost: toNum(row[7]),
      actualGrossMargin: toNum(row[9]),
      deviation: toNum(row[10]),
    }))
    .filter((row) => row.income !== null || row.actualIncome !== null);
}

function parseReceivableDetail(filePath) {
  const rows = readObjects(filePath);
  const monthlyMap = new Map();

  for (const row of rows) {
    const d = row['过账日期'] ? new Date(row['过账日期']) : null;
    if (!d || Number.isNaN(d.getTime())) {
      continue;
    }
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amount =
      toNum(row['总帐中更新的金额']) ?? toNum(row['以本币计的金额']) ?? 0;
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + amount);
  }

  return [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, amount]) => ({ month, amount: fmt(amount, 2) }));
}

function parseSubsidiaryTotal(filePath, companyName) {
  const rows = nonEmptyRows(readRows(filePath));
  const targetRow =
    rows.find(
      (row) =>
        typeof row[0] === 'string' &&
        (row[0].includes('合计') || row[0].includes('销售合计')),
    ) || rows[rows.length - 1];

  const nums = targetRow.map(toNum).filter((n) => n !== null);
  return {
    company: companyName,
    monthSales: nums[0] ?? 0,
    monthTarget: nums[1] ?? 0,
    ytdSales: nums[3] ?? nums[2] ?? 0,
    ytdTarget: nums[4] ?? 0,
  };
}

function parseHrOnJobStat(filePath) {
  if (!filePath) {
    return [];
  }
  const rows = readObjects(filePath);
  return rows
    .map((row) => ({
      department:
        String(row.ORG_LEVEL1 || row.ORG_LEVEL1_1 || '').trim() || '未命名组织',
      headcount: toNum(row.EMP_COUNT) ?? toNum(row.EMP_COUNT_1) ?? 0,
    }))
    .filter((row) => row.headcount > 0 && !/(总计|合计)/.test(row.department));
}

function parseHrInternStat(filePath) {
  if (!filePath) {
    return 0;
  }
  const rows = readObjects(filePath);
  return rows.reduce((sum, row) => sum + (toNum(row.EMP_COUNT) ?? toNum(row.EMP_COUNT_1) ?? 0), 0);
}

function parseHrResignStat(filePath) {
  if (!filePath) {
    return 0;
  }
  const rows = readObjects(filePath);
  return rows.reduce((sum, row) => sum + (toNum(row.EMP_COUNT) ?? 0), 0);
}

function parseHrTopDepartments(filePath) {
  if (!filePath) {
    return [];
  }
  const rows = readObjects(filePath);
  const counter = new Map();
  for (const row of rows) {
    const dept = String(row.DEPT_NAME || '').trim();
    if (!dept) {
      continue;
    }
    counter.set(dept, (counter.get(dept) || 0) + 1);
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([department, headcount]) => ({ department, headcount }));
}

function parseHrKeyTalentRate(filePath) {
  if (!filePath) {
    return null;
  }
  const rows = readObjects(filePath);
  if (!rows.length) {
    return null;
  }
  let total = 0;
  let keyTalent = 0;
  for (const row of rows) {
    const edu = String(row.EDU_LEVEL || '').trim();
    if (!edu) {
      continue;
    }
    total += 1;
    if (/(本科|硕士|博士)/.test(edu)) {
      keyTalent += 1;
    }
  }
  if (!total) {
    return null;
  }
  return fmt((keyTalent / total) * 100, 2);
}

function parseDivisionDetailSheetFromWorkbook(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    return null;
  }
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!rows.length) {
    return null;
  }

  const meta = {
    domain: String(rows[1]?.[1] || '').trim(),
    tableName: String(rows[2]?.[1] || '').trim(),
    tableComment: String(rows[3]?.[1] || '').trim(),
    generatedAt: String(rows[4]?.[1] || '').trim(),
    totalRows: toNum(rows[5]?.[1]) ?? 0,
    exportRows: toNum(rows[6]?.[1]) ?? 0,
    filter: String(rows[7]?.[1] || '').trim(),
  };

  const schemaStart = 10;
  let dataStart = schemaStart;
  for (let i = schemaStart; i < Math.min(rows.length, 2000); i += 1) {
    const first = rows[i]?.[0];
    if (typeof first === 'number') {
      dataStart = i;
      break;
    }
    if (typeof first === 'string' && /^\d+$/.test(first.trim())) {
      dataStart = i;
      break;
    }
  }

  const fields = [];
  for (let i = schemaStart; i < dataStart; i += 1) {
    const f = String(rows[i]?.[0] || '').trim();
    if (/^[A-Z0-9_]+$/.test(f)) {
      fields.push(f);
    }
  }

  const records = [];
  for (let i = dataStart; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || !row.some((v) => v !== null && v !== undefined && String(v).trim() !== '')) {
      continue;
    }
    const record = {};
    for (let c = 0; c < fields.length; c += 1) {
      record[fields[c]] = row[c] ?? null;
    }
    records.push(record);
  }

  return {
    sheet: sheetName,
    meta,
    fields,
    records,
  };
}

function parseDivisionOperationData(filePath) {
  if (!filePath) {
    return [];
  }
  let wb = null;
  try {
    wb = readWorkbook(filePath);
  } catch (error) {
    return [];
  }

  const parsed = [];
  for (const sheetName of wb.SheetNames) {
    if (sheetName === '汇总') {
      continue;
    }
    const detail = parseDivisionDetailSheetFromWorkbook(wb, sheetName);
    if (detail) {
      parsed.push(detail);
    }
  }
  return parsed;
}

function findDivisionSheet(parsedSheets, tableName, options = {}) {
  const { filterContains = null } = options;
  return (
    parsedSheets.find((item) => {
      if (item.meta.tableName !== tableName) {
        return false;
      }
      if (!filterContains) {
        return true;
      }
      return String(item.meta.filter || '').includes(filterContains);
    }) || null
  );
}

function toDist(records, field, options = {}) {
  const { limit = 8, mapValue = null } = options;
  const counter = new Map();
  for (const row of records || []) {
    let raw = row[field];
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      continue;
    }
    if (mapValue) {
      raw = mapValue(raw);
    }
    const key = String(raw).trim();
    if (!key) {
      continue;
    }
    counter.set(key, (counter.get(key) || 0) + 1);
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function mapCode(raw, dictionary, fallbackPrefix = '类型') {
  const key = String(raw).trim();
  if (dictionary[key]) {
    return dictionary[key];
  }
  return `${fallbackPrefix}-${key}`;
}

function ageBucket(raw) {
  const n = toNum(raw);
  if (n === null) {
    return '未知';
  }
  if (n < 18) return '0-17';
  if (n < 30) return '18-29';
  if (n < 45) return '30-44';
  if (n < 60) return '45-59';
  return '60+';
}

function normalizeKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '');
}

function pickField(row, aliases) {
  const entries = Object.entries(row || {});
  for (const [k, v] of entries) {
    if (v === null || v === undefined || v === '') {
      continue;
    }
    const nk = normalizeKey(k);
    if (aliases.some((a) => nk.includes(normalizeKey(a)))) {
      return v;
    }
  }
  return null;
}

function pickNumber(row, aliases, fallback = null) {
  const v = pickField(row, aliases);
  const n = toNum(v);
  return n === null ? fallback : n;
}

function pickText(row, aliases, fallback = '') {
  const v = pickField(row, aliases);
  if (v === null || v === undefined || String(v).trim() === '') {
    return fallback;
  }
  return String(v).trim();
}

function readOptionalObjects(filePath) {
  if (!filePath) {
    return [];
  }
  try {
    return readObjects(filePath).filter((row) =>
      Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== ''),
    );
  } catch (error) {
    return [];
  }
}

function buildRdData(months, options = {}) {
  const { rdRows = [], latestMilestoneRate = 95.4 } = options;
  const defaultProjects = [
    { project: '呼吸道多联检升级', stage: '临床验证' },
    { project: '耐药基因快检平台', stage: '注册申报' },
    { project: '海外本地化试剂', stage: '小试转中试' },
    { project: 'POCT 便携新品', stage: '产品定义' },
    { project: '肿瘤伴随诊断项目', stage: '临床入组' },
    { project: '自动化提取耗材优化', stage: '量产导入' },
    { project: '猴痘检测方案', stage: '上市维护' },
    { project: '数字PCR扩展项目', stage: '样机验证' },
  ];

  const projects =
    rdRows.length > 0
      ? [...rdRows]
          .sort((a, b) => {
            const av = toNum(a.UPDATETIME) ?? 0;
            const bv = toNum(b.UPDATETIME) ?? 0;
            return bv - av;
          })
          .slice(0, 12)
          .map((row, idx) => {
            const planTime = pickNumber(row, ['PLANTIME', 'plantime', '计划工时', '预算']) || 0;
            const actTime = pickNumber(row, ['ACTTIME', 'acttime', '实际工时', '实际']) || 0;
            const budgetByTime = planTime > 0 ? planTime * (18 + seeded(idx, 181) * 8) : 0;
            const actualByTime = actTime > 0 ? actTime * (18 + seeded(idx, 182) * 8) : 0;

            const budget =
              pickNumber(row, ['预算', '预算金额', 'BUDGET', '计划投入']) ||
              (budgetByTime > 0 ? budgetByTime : fmt(620 + seeded(idx, 91) * 900, 2));
            const actual =
              pickNumber(row, ['实际', '实际投入', 'ACTUAL', '已投入']) ||
              (actualByTime > 0 ? actualByTime : fmt(budget * (0.68 + seeded(idx, 93) * 0.3), 2));

            const progressRaw =
              pickNumber(row, [
                'PERCENTCOMPLETE',
                'PLANSCHEDULE',
                '完成率',
                '进度',
                '达成率',
                'progress',
              ]) || fmt(52 + seeded(idx, 97) * 42, 2);
            const deviation = Math.abs(
              pickNumber(row, ['PLANDEVIATIONRATE', '偏差率', '风险']) ?? (15 + seeded(idx, 98) * 70),
            );
            const riskFromState = String(row.PLANSTATE || '').includes('Delay') ? 20 : 0;

            return {
              project:
                pickText(
                  row,
                  ['XMQCH', 'ENAME', '项目', '项目名称', '研发项目', 'project'],
                  '',
                ) || `研发项目-${idx + 1}`,
              stage:
                pickText(
                  row,
                  ['CURRENTSTAGE', 'STAGESTATEID', 'PLANSTATE', '阶段', '状态', 'stage'],
                  '',
                ) || '研发中',
              budget: fmt(budget, 2),
              actual: fmt(actual, 2),
              progress: fmt(Math.min(100, Math.max(0, pct(progressRaw) ?? 0)), 2),
              risk: fmt(Math.min(100, deviation + riskFromState), 2),
            };
          })
      : defaultProjects.map((item, idx) => {
          const budget = fmt(640 + seeded(idx, 101) * 980, 2);
          const actual = fmt(budget * (0.66 + seeded(idx, 102) * 0.32), 2);
          return {
            project: item.project,
            stage: item.stage,
            budget,
            actual,
            progress: fmt(50 + seeded(idx, 103) * 45, 2),
            risk: fmt(18 + seeded(idx, 104) * 72, 2),
          };
        });

  const stages = [...new Set(projects.map((p) => p.stage))];
  const stageDistribution = stages.map((stage) => ({
    stage,
    count: projects.filter((p) => p.stage === stage).length,
  }));

  const totalBudget = projects.reduce((sum, row) => sum + row.budget, 0);
  const totalActual = projects.reduce((sum, row) => sum + row.actual, 0);
  const budgetExecutionRate = totalBudget > 0 ? fmt((totalActual / totalBudget) * 100, 2) : 0;

  const activeProjects = projects.length;
  const milestoneRate = fmt(latestMilestoneRate, 2);
  const registrationNodeOnTimeRate = fmt(88 + seeded(activeProjects, 105) * 10, 2);

  const milestoneTrend = months.map((month, idx) => {
    const planned = Math.max(6, Math.round(activeProjects * 0.7 + seeded(idx, 106) * 5));
    const completed = Math.min(planned, Math.round(planned * (0.82 + seeded(idx, 107) * 0.2)));
    return {
      month,
      planned,
      completed,
      completionRate: fmt((completed / planned) * 100, 2),
    };
  });
  if (milestoneTrend.length) {
    milestoneTrend[milestoneTrend.length - 1].completionRate = milestoneRate;
  }

  return {
    kpis: {
      activeProjects,
      milestoneOnTimeRate: milestoneRate,
      budgetExecutionRate,
      registrationNodeOnTimeRate,
    },
    milestoneTrend,
    stageDistribution,
    projects,
  };
}

function buildHrData(months, options = {}) {
  const {
    hrRows = [],
    revenueSeries = [],
    keyTalentRateOverride = null,
    monthlyTurnoverRateOverride = null,
  } = options;
  const defaultDepartments = ['研发中心', '国内营销', '国际营销', '制造中心', '供应链', '职能平台'];

  const sourceDepartments =
    hrRows.length > 0
      ? hrRows.map((row, idx) => {
          const headcount =
            pickNumber(row, [
              '人数',
              '在岗',
              '人力',
              '编制',
              'headcount',
              'EMP_COUNT',
              'EMP_COUNT_1',
            ]) ||
            Math.round(90 + seeded(idx, 131) * 160);
          const target =
            pickNumber(row, ['目标', '编制目标', 'target', '预算人数', 'TARGET']) ||
            Math.round(headcount * (1 + seeded(idx, 132) * 0.14));
          const turnoverRate =
            pickNumber(row, [
              '离职率',
              '流失率',
              'turnover',
              'attrition',
              'TURNOVER_RATE',
            ]) ||
            fmt(5 + seeded(idx, 133) * 7, 2);
          return {
            department:
              pickText(
                row,
                ['部门', '部门名称', '组织', 'team', '中心', 'ORG_LEVEL1', 'ORG_LEVEL1_1', 'department'],
                '',
              ) ||
              `部门-${idx + 1}`,
            headcount: Math.round(headcount),
            target: Math.round(target),
            turnoverRate: fmt(pct(turnoverRate), 2),
          };
        })
      : defaultDepartments.map((department, idx) => {
          const headcount = Math.round(110 + seeded(idx, 134) * 220);
          const target = Math.round(headcount * (1 + seeded(idx, 135) * 0.1));
          return {
            department,
            headcount,
            target,
            turnoverRate: fmt(5.5 + seeded(idx, 136) * 5.5, 2),
          };
        });
  const sortedDepartments = [...sourceDepartments].sort((a, b) => b.headcount - a.headcount);
  const departmentStructure = sortedDepartments.slice(0, 8);

  const latestHeadcount = sourceDepartments.reduce((sum, row) => sum + row.headcount, 0);
  const calculatedTurnover = fmt(
    departmentStructure.reduce((sum, row) => sum + row.turnoverRate, 0) /
      departmentStructure.length,
    2,
  );
  const latestTurnover =
    monthlyTurnoverRateOverride !== null
      ? fmt(monthlyTurnoverRateOverride, 2)
      : calculatedTurnover;
  const latestKeyTalentRate =
    keyTalentRateOverride !== null
      ? fmt(keyTalentRateOverride, 2)
      : fmt(18 + seeded(latestHeadcount, 137) * 10, 2);
  const latestRevenuePerCapita = fmt(
    40 + ((revenueSeries[revenueSeries.length - 1] || 22) * 1.6 + seeded(latestHeadcount, 138) * 8),
    2,
  );

  const headcountSeries = fillMonthlySeries(months, latestHeadcount, {
    minFactor: 0.86,
    maxFactor: 1,
    volatility: 0.04,
    digits: 0,
    salt: 139,
  });
  const keyTalentSeries = fillMonthlySeries(months, Math.round((latestHeadcount * latestKeyTalentRate) / 100), {
    minFactor: 0.84,
    maxFactor: 1,
    volatility: 0.06,
    digits: 0,
    salt: 140,
  });
  const revenuePerCapitaSeries = fillMonthlySeries(months, latestRevenuePerCapita, {
    minFactor: 0.82,
    maxFactor: 1,
    volatility: 0.08,
    digits: 2,
    salt: 141,
  });

  const headcountTrend = months.map((month, idx) => ({
    month,
    headcount: Math.round(headcountSeries[idx]),
    keyTalent: Math.round(keyTalentSeries[idx]),
    revenuePerCapita: fmt(revenuePerCapitaSeries[idx], 2),
  }));

  return {
    kpis: {
      totalHeadcount: latestHeadcount,
      keyTalentRate: latestKeyTalentRate,
      monthlyTurnoverRate: latestTurnover,
      revenuePerCapita: latestRevenuePerCapita,
    },
    headcountTrend,
    departmentStructure,
  };
}

function buildDivisionData(options = {}) {
  const { divisionSheets = [] } = options;

  const sampleSheet =
    findDivisionSheet(divisionSheets, 'poct_sample', { filterContains: 'JD' }) ||
    findDivisionSheet(divisionSheets, 'poct_sample');
  const normalSampleSheet =
    findDivisionSheet(divisionSheets, 'poct_sample') ||
    sampleSheet;
  const jdSampleSheet = divisionSheets.find(
    (item) =>
      item.meta.tableName === 'poct_sample' && String(item.meta.filter || '').includes('JD'),
  );
  const rawTaskSheet = findDivisionSheet(divisionSheets, 'poct_task_raw_data');
  const analysisSheet = findDivisionSheet(divisionSheets, 'poct_task_analysis_result');
  const qcResultSheet = findDivisionSheet(divisionSheets, 'dip_qc_task_result');
  const reportSheet = findDivisionSheet(divisionSheets, 'poct_sample_report');
  const reportDetailSheet = findDivisionSheet(divisionSheets, 'poct_report_detail');
  const patientSheet = findDivisionSheet(divisionSheets, 'poct_patient');
  const geneSheet = findDivisionSheet(divisionSheets, 'poct_gene');
  const cdcPointSheet = findDivisionSheet(divisionSheets, 'poct_sample_point');

  const zero = [];

  const overview = {
    sampleCount: normalSampleSheet?.meta.totalRows || 0,
    experimentCount: rawTaskSheet?.meta.totalRows || 0,
    experimentAnalysisCount: analysisSheet?.meta.totalRows || 0,
    qcResultCount: qcResultSheet?.meta.totalRows || 0,
    reportCount: reportSheet?.meta.totalRows || 0,
    patientCount: patientSheet?.meta.totalRows || 0,
    pathogenCount: geneSheet?.meta.totalRows || 0,
    cdcPointCount: cdcPointSheet?.meta.totalRows || 0,
    jdSampleCount: jdSampleSheet?.meta.totalRows || 0,
  };

  const sheetVolumes = divisionSheets
    .filter((item) => item.meta.totalRows > 0)
    .map((item) => ({
      sheet: item.sheet,
      domain: item.meta.domain || '未分类',
      tableName: item.meta.tableName || 'unknown',
      totalRows: item.meta.totalRows || 0,
      exportRows: item.meta.exportRows || 0,
    }))
    .sort((a, b) => b.totalRows - a.totalRows);

  const sampleTypeDict = {
    '1': '样本类型-1',
    '3': '样本类型-3',
    '7': '样本类型-7',
    '8': '样本类型-8',
    '30': '样本类型-30',
    '31': '样本类型-31',
    '33': '样本类型-33',
  };
  const resultDict = {
    '0': '阴性',
    '1': '阳性',
    '2': '可疑',
    '3': '异常',
    '7': '弱阳',
  };
  const sexDict = { '1': '男', '2': '女', 男: '男', 女: '女' };
  const riskDict = { '0': '低风险', '1': '高风险' };
  const reportStatusDict = { '0': '未出报告', '1': '处理中', '2': '已出报告', '3': '已审核', '6': '已作废' };

  const sampleTypeDist = toDist(normalSampleSheet?.records || zero, 'SAMPLE_TYPE', {
    mapValue: (v) => mapCode(v, sampleTypeDict, '样本类型'),
  });
  const detectionResultDist = toDist(normalSampleSheet?.records || zero, 'DETECTION_RESULT', {
    mapValue: (v) => mapCode(v, resultDict, '检测结果'),
  });

  const experimentTypeDist = toDist(normalSampleSheet?.records || zero, 'DETECTION_TYPE', {
    limit: 10,
  });
  const experimentStatusDist = toDist(rawTaskSheet?.records || zero, 'TASK_STATUS', {
    mapValue: (v) => mapCode(v, { finished: '已完成', started: '已开始', working: '进行中', exception: '异常' }, '任务状态'),
  });

  const qcResultDist = toDist(qcResultSheet?.records || zero, 'RESULT', {
    mapValue: (v) => mapCode(v, resultDict, '质控结果'),
  });
  const qcValueTypeDist = toDist(qcResultSheet?.records || zero, 'VALUE_TYPE');

  const reportTypeDist = toDist(reportSheet?.records || zero, 'TASK_TYPE', {
    mapValue: (v) => mapCode(v, {}, '报告类型'),
  });
  const reportStatusDist = toDist(reportSheet?.records || zero, 'REPORT_STATUS', {
    mapValue: (v) => mapCode(v, reportStatusDict, '报告状态'),
  });

  const patientSexDist = toDist(patientSheet?.records || zero, 'SEX', {
    mapValue: (v) => mapCode(v, sexDict, '性别'),
  });
  const patientAgeDist = toDist(patientSheet?.records || zero, 'AGE', {
    mapValue: (v) => ageBucket(v),
    limit: 6,
  });
  const patientRegionDist = toDist(patientSheet?.records || zero, 'REGION', {
    limit: 8,
  });

  const pathogenClassDist = toDist(geneSheet?.records || zero, 'CLASS_TYPE_NAME', {
    limit: 8,
  });
  const pathogenRiskDist = toDist(geneSheet?.records || zero, 'RISK', {
    mapValue: (v) => mapCode(v, riskDict, '风险'),
  });

  const cdcPointTypeDist = toDist(cdcPointSheet?.records || zero, 'POINT_TYPE', {
    mapValue: (v) => mapCode(v, {}, '点位类型'),
  });
  const cdcRegionDist = toDist(cdcPointSheet?.records || zero, 'REGION', {
    limit: 8,
  });

  const jdDetectionTypeDist = toDist(jdSampleSheet?.records || zero, 'DETECTION_TYPE', {
    limit: 8,
  });
  const jdSampleTypeDist = toDist(jdSampleSheet?.records || zero, 'SAMPLE_TYPE', {
    mapValue: (v) => mapCode(v, sampleTypeDict, '样本类型'),
    limit: 8,
  });
  const jdReportStatusDist = toDist(jdSampleSheet?.records || zero, 'REPORT_STATUS', {
    mapValue: (v) => mapCode(v, reportStatusDict, '报告状态'),
  });

  // Fallback to analysis/report detail when sample sheet coverage is low.
  if (!detectionResultDist.length) {
    const fromAnalysis = toDist(analysisSheet?.records || zero, 'REPORT_RESULT_NAME', { limit: 8 });
    if (fromAnalysis.length) {
      detectionResultDist.push(...fromAnalysis);
    }
  }
  if (!reportTypeDist.length) {
    reportTypeDist.push(
      ...toDist(reportDetailSheet?.records || zero, 'CHANNEL', { limit: 8 }),
    );
  }

  return {
    overview,
    sheetVolumes,
    sampleTypeDist,
    detectionResultDist,
    experimentTypeDist,
    experimentStatusDist,
    qcResultDist,
    qcValueTypeDist,
    reportTypeDist,
    reportStatusDist,
    patientSexDist,
    patientAgeDist,
    patientRegionDist,
    pathogenClassDist,
    pathogenRiskDist,
    cdcPointTypeDist,
    cdcRegionDist,
    jdDetectionTypeDist,
    jdSampleTypeDist,
    jdReportStatusDist,
  };
}

function buildFinanceData(
  months,
  grossMarginsByFile,
  receivableStatByFile,
  receivableMonthlyRaw,
  revenueRateLatest,
) {
  function normalizeRevenueCost(revenue, cost) {
    let normalizedRevenue = revenue;
    let normalizedCost = cost;
    if (normalizedRevenue > 0 && normalizedCost > 0) {
      if (normalizedRevenue < 1000 && normalizedCost > 10000000) {
        normalizedRevenue *= 100000000;
      }
      if (normalizedCost < 1000 && normalizedRevenue > 10000000) {
        normalizedCost *= 100000000;
      }
      while (normalizedCost / normalizedRevenue > 8 && normalizedRevenue < 1000000000000) {
        normalizedRevenue *= 10;
      }
      while (normalizedRevenue / normalizedCost > 8 && normalizedCost < 1000000000000) {
        normalizedCost *= 10;
      }
    }
    return {
      revenue: normalizedRevenue,
      cost: normalizedCost,
    };
  }

  function ensurePositiveMargin(revenue, cost, seed) {
    const safeRevenue = revenue > 0 ? revenue : 0;
    const dynamicRatio = 0.7 + seeded(seed, 77) * 0.16;
    if (safeRevenue <= 0) {
      return { revenue: 0, cost: 0 };
    }
    if (cost <= 0 || cost >= safeRevenue) {
      return {
        revenue: safeRevenue,
        cost: fmt(safeRevenue * dynamicRatio, 2),
      };
    }
    return {
      revenue: safeRevenue,
      cost: fmt(Math.min(safeRevenue * 0.96, Math.max(cost, safeRevenue * 0.55)), 2),
    };
  }

  const grossSnapshots = grossMarginsByFile
    .map((rows, fileIdx) => {
      const rawRevenue = fmt(
        rows.reduce((sum, item) => sum + (toNum(item.actualIncome ?? item.income) ?? 0), 0),
        2,
      );
      const rawCost = fmt(
        rows.reduce((sum, item) => sum + (toNum(item.actualCost ?? item.cost) ?? 0), 0),
        2,
      );
      const normalized = normalizeRevenueCost(rawRevenue, rawCost);
      const positive = ensurePositiveMargin(normalized.revenue, normalized.cost, fileIdx + 1);
      const revenue = fmt(positive.revenue, 2);
      const cost = fmt(positive.cost, 2);
      if (revenue <= 0 && cost <= 0) {
        return null;
      }
      return {
        revenue,
        cost,
        grossProfit: fmt(revenue - cost, 2),
      };
    })
    .filter(Boolean);

  const receivableSnapshots = receivableStatByFile
    .map((rows) => rows.find((item) => item.department === '合计') || rows[0] || null)
    .filter(Boolean)
    .map((item) => ({
      totalAmount: toNum(item.totalAmount) ?? 0,
      ytdAmount: toNum(item.ytdAmount) ?? 0,
    }))
    .filter((item) => item.totalAmount > 0 || item.ytdAmount > 0);

  const latestGross =
    grossSnapshots[grossSnapshots.length - 1] || {
      revenue: fmt(Math.max((revenueRateLatest || 20) * 28000000, 180000000), 2),
      cost: 0,
      grossProfit: 0,
    };
  const latestPositive = ensurePositiveMargin(latestGross.revenue, latestGross.cost, 999);
  latestGross.revenue = latestPositive.revenue;
  latestGross.cost = latestPositive.cost;
  latestGross.grossProfit = fmt(latestGross.revenue - latestGross.cost, 2);
  const latestReceivable =
    receivableSnapshots[receivableSnapshots.length - 1] || {
      totalAmount: fmt(latestGross.revenue * 0.9, 2),
      ytdAmount: fmt(latestGross.revenue * 0.9, 2),
    };

  const grossMarginRateLatest =
    latestGross.revenue > 0 ? fmt((latestGross.grossProfit / latestGross.revenue) * 100, 2) : 0;
  const profitRateLatest = fmt(clamp(grossMarginRateLatest * 0.72, 8, 99), 2);

  const revenueSeries = fillMonthlySeries(months, latestGross.revenue, {
    minFactor: 0.72,
    maxFactor: 1,
    volatility: 0.11,
    digits: 2,
    salt: 91,
  });
  const costSeries = fillMonthlySeries(months, latestGross.cost, {
    minFactor: 0.74,
    maxFactor: 1,
    volatility: 0.1,
    digits: 2,
    salt: 92,
  });
  const receivableSeries = fillMonthlySeries(months, latestReceivable.totalAmount, {
    minFactor: 0.78,
    maxFactor: 1.02,
    volatility: 0.08,
    digits: 2,
    salt: 93,
  });
  const collectionRateSeries = fillMonthlySeries(months, 92, {
    minFactor: 0.94,
    maxFactor: 1.02,
    volatility: 0.04,
    digits: 2,
    salt: 94,
  }).map((item) => clamp(item, 82, 102));

  for (let i = 0; i < grossSnapshots.length; i += 1) {
    const monthIndex = months.length - grossSnapshots.length + i;
    if (monthIndex < 0 || monthIndex >= months.length) {
      continue;
    }
    const normalized = ensurePositiveMargin(grossSnapshots[i].revenue, grossSnapshots[i].cost, 200 + i);
    revenueSeries[monthIndex] = normalized.revenue;
    costSeries[monthIndex] = normalized.cost;
  }
  for (let i = 0; i < receivableSnapshots.length; i += 1) {
    const monthIndex = months.length - receivableSnapshots.length + i;
    if (monthIndex < 0 || monthIndex >= months.length) {
      continue;
    }
    const monthRevenue = fmt(revenueSeries[monthIndex], 2);
    const targetRate = collectionRateSeries[monthIndex] || 92;
    const fromFile = fmt(receivableSnapshots[i].totalAmount, 2);
    if (fromFile > 0 && monthRevenue > 0) {
      receivableSeries[monthIndex] = fmt(
        clamp(fromFile, monthRevenue * 0.75, monthRevenue * 1.05),
        2,
      );
    } else {
      receivableSeries[monthIndex] = fmt((monthRevenue * targetRate) / 100, 2);
    }
  }

  const receivableMap = new Map(receivableMonthlyRaw.map((x) => [x.month, x.amount]));
  const monthly = months.map((month, idx) => {
    const revenue = fmt(Math.max(revenueSeries[idx], 10000000), 2);
    const cost = fmt(Math.min(costSeries[idx], revenue * 0.96), 2);
    const grossProfit = fmt(revenue - cost, 2);
    const fallbackReceivable = fmt((revenue * (collectionRateSeries[idx] || 92)) / 100, 2);
    const fromDetail = receivableMap.has(month) ? fmt(receivableMap.get(month), 2) : 0;
    const isRecent12 = idx >= months.length - 12;
    const receivable =
      !isRecent12 && fromDetail > 0
        ? fmt(clamp(fromDetail, revenue * 0.75, revenue * 1.05), 2)
        : fallbackReceivable;
    const collectionRate = revenue > 0 ? fmt(clamp((receivable / revenue) * 100, 82, 105), 2) : 0;
    return {
      month,
      revenue,
      cost,
      grossProfit,
      grossMarginRate: revenue > 0 ? fmt((grossProfit / revenue) * 100, 2) : 0,
      receivable,
      collectionRate,
      operatingCashFlow: fmt(receivable / 10000000, 2),
    };
  });

  const latestMonthly = monthly[monthly.length - 1] || {
    grossMarginRate: grossMarginRateLatest,
    collectionRate: 92,
    operatingCashFlow: 62,
  };

  return {
    kpis: {
      revenue: fmt(monthly[monthly.length - 1]?.revenue || latestGross.revenue, 2),
      cost: fmt(monthly[monthly.length - 1]?.cost || latestGross.cost, 2),
      grossProfit: fmt(monthly[monthly.length - 1]?.grossProfit || latestGross.grossProfit, 2),
      grossMarginRate: fmt(Math.max(latestMonthly.grossMarginRate, 6), 2),
      profitRate: fmt(Math.max(profitRateLatest, 8), 2),
      operatingCashFlow: fmt(latestMonthly.operatingCashFlow, 2),
      collectionRate: fmt(latestMonthly.collectionRate, 2),
    },
    monthly,
  };
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Data directory not found: ${DATA_DIR}`);
  }

  const files = listDataFiles();
  const hrDetected = detectHrFiles(files);

  const fileMap = {
    group: pickFile(files, '集团-月报'),
    domesticLine: pickFile(files, '国内产线-月报'),
    domesticRegion: pickFile(files, '国内大区-月报'),
    domesticProvince: pickFile(files, '国内省区-月报'),
    international: pickFile(files, '大国际-月报'),
    receivableStatFiles: pickFilesByBaseName(files, '05回款数据统计表-填报_回款数据填报表.xlsx'),
    grossMarginFiles: pickFilesByBaseName(files, '3-预测毛利率.xlsx'),
    receivableDetail: pickFile(files, '回款明细_回款明细.xlsx'),
    ansai: pickFile(files, '安赛销售情况-月报.xlsx'),
    hongan: pickFile(files, '红岸基元-月报.xlsx'),
    haiji: pickFile(files, '圣湘海济-月报.xlsx'),
    shengweier: pickFile(files, '圣维尔-月报.xlsx'),
    rdProject: detectRdProjectFile(files),
    division: detectDivisionFile(files),
    hrOnJob: hrDetected.onJobStat,
    hrResign: hrDetected.resignStat,
    hrIntern: hrDetected.internStat,
    hrPersonnel: hrDetected.personnel,
    hrAssignment: hrDetected.assignment,
  };

  const requiredFileKeys = [
    'group',
    'domesticLine',
    'domesticRegion',
    'domesticProvince',
    'international',
    'receivableStatFiles',
    'grossMarginFiles',
    'receivableDetail',
    'ansai',
    'hongan',
    'haiji',
    'shengweier',
  ];
  for (const k of requiredFileKeys) {
    const v = fileMap[k];
    if (!v || (Array.isArray(v) && v.length === 0)) {
      throw new Error(`Missing required file for ${k}`);
    }
  }

  const group = parseGroup(fileMap.group);
  const domesticLines = parseLine(fileMap.domesticLine);
  const domesticRegions = parseRegion(fileMap.domesticRegion);
  const domesticProvinces = parseRegion(fileMap.domesticProvince);
  const internationalRegions = parseInternational(fileMap.international);
  const receivableStatByFile = fileMap.receivableStatFiles.map((filePath) =>
    parseReceivableStat(filePath),
  );
  const grossMarginsByFile = fileMap.grossMarginFiles.map((filePath) => parseGrossMargin(filePath));
  const receivableStat = receivableStatByFile.flat();
  const grossMargins = grossMarginsByFile.flat();
  const receivableMonthlyRaw = parseReceivableDetail(fileMap.receivableDetail);
  const rdRows = readOptionalObjects(fileMap.rdProject);
  const divisionSheets = parseDivisionOperationData(fileMap.division);

  const hrOnJobRows = parseHrOnJobStat(fileMap.hrOnJob);
  const hrTopDepartmentRows = parseHrTopDepartments(fileMap.hrAssignment);
  const hrRows =
    hrOnJobRows.length > 0
      ? hrOnJobRows
      : hrTopDepartmentRows.map((row) => ({
          department: row.department,
          headcount: row.headcount,
        }));
  const totalHeadcountFromFile = hrOnJobRows.reduce((sum, row) => sum + row.headcount, 0);
  const internTotal = parseHrInternStat(fileMap.hrIntern);
  if (internTotal > 0 && hrRows.length > 0) {
    hrRows.push({ department: '实习生', headcount: internTotal });
  }
  const annualResignTotal = parseHrResignStat(fileMap.hrResign);
  const monthlyTurnoverRateOverride =
    totalHeadcountFromFile > 0
      ? fmt(((annualResignTotal / totalHeadcountFromFile) * 100) / 12, 2)
      : null;
  const keyTalentRateOverride = parseHrKeyTalentRate(fileMap.hrPersonnel);

  const subsidiaries = [
    parseSubsidiaryTotal(fileMap.ansai, '安赛'),
    parseSubsidiaryTotal(fileMap.hongan, '红岸基元'),
    parseSubsidiaryTotal(fileMap.haiji, '海济'),
    parseSubsidiaryTotal(fileMap.shengweier, '圣维尔'),
  ];

  const latestMonth = '2026-03';
  const months = monthRange('2024-01', latestMonth);

  const total = group.total || {
    monthAchieveRate: 0.22,
    ytdAchieveRate: 0.13,
    monthSales: 5000,
  };
  const revenueLatest = pct(total.monthAchieveRate) ?? 22.16;
  const financeData = buildFinanceData(
    months,
    grossMarginsByFile,
    receivableStatByFile,
    receivableMonthlyRaw,
    revenueLatest,
  );
  const profitLatest = financeData.kpis.profitRate;
  const cashLatest = financeData.kpis.operatingCashFlow;
  const collectionLatest = financeData.kpis.collectionRate;
  const rdLatest = fmt(93 + seeded(4, 6) * 6, 2);

  const revenueSeries = fillMonthlySeries(months, revenueLatest, {
    minFactor: 0.68,
    maxFactor: 1,
    volatility: 0.12,
    digits: 2,
    salt: 11,
  });
  const profitSeries = fillMonthlySeries(months, profitLatest, {
    minFactor: 0.7,
    maxFactor: 1,
    volatility: 0.11,
    digits: 2,
    salt: 22,
  });
  const cashSeries = fillMonthlySeries(months, cashLatest, {
    minFactor: 0.5,
    maxFactor: 1,
    volatility: 0.2,
    digits: 2,
    salt: 33,
  });
  const collectionSeries = fillMonthlySeries(months, collectionLatest, {
    minFactor: 0.8,
    maxFactor: 1,
    volatility: 0.08,
    digits: 2,
    salt: 44,
  });
  const rdSeries = fillMonthlySeries(months, rdLatest, {
    minFactor: 0.9,
    maxFactor: 1,
    volatility: 0.05,
    digits: 2,
    salt: 55,
  });

  const trend = months.map((month, idx) => ({
    month,
    revenueRate: revenueSeries[idx],
    profitRate: profitSeries[idx],
    operatingCashFlow: cashSeries[idx],
    collectionRate: collectionSeries[idx],
    rdMilestoneRate: rdSeries[idx],
  }));

  const contributionRows = group.rows.filter((row) => {
    const n = row.name;
    return ['国内营销', '大国际', '圣维尔(湖南/上海)', '安赛', '海济', '红岸基元'].some((k) =>
      n.includes(k),
    );
  });

  const contribution = contributionRows.map((row) => ({
    name: row.name,
    value: fmt(row.monthSales || 0, 2),
  }));

  const alerts = [];
  for (const item of domesticRegions.concat(internationalRegions).slice(0, 18)) {
    if (item.monthAchieveRate === null) {
      continue;
    }
    const rate = pct(item.monthAchieveRate);
    if (rate === null || rate >= 100) {
      continue;
    }
    const level = rate < 90 ? '红' : '黄';
    alerts.push({
      module: '销售',
      org: item.region,
      metric: '月度达成率',
      value: fmt(rate, 2),
      threshold: level === '红' ? '< 90%' : '90% - 100%',
      level,
      reason: level === '红' ? '目标达成明显偏离' : '目标达成低于预期',
    });
  }

  const receivableMonthly = financeData.monthly.map((item) => ({
    month: item.month,
    amount: item.receivable,
  }));

  const rdData = buildRdData(months, {
    rdRows,
    latestMilestoneRate: rdLatest,
  });
  const hrData = buildHrData(months, {
    hrRows,
    revenueSeries,
    keyTalentRateOverride,
    monthlyTurnoverRateOverride,
  });
  const divisionData = buildDivisionData({
    divisionSheets,
  });

  const domesticSalesTotal = domesticLines.reduce((sum, item) => sum + (item.monthSales || 0), 0);
  const domesticTargetTotal = domesticLines.reduce((sum, item) => sum + (item.monthTarget || 0), 0);
  const internationalSalesTotal = internationalRegions.reduce(
    (sum, item) => sum + (item.monthSales || 0),
    0,
  );
  const internationalTargetTotal = internationalRegions.reduce(
    (sum, item) => sum + (item.monthTarget || 0),
    0,
  );
  const salesAchieveRate =
    domesticTargetTotal + internationalTargetTotal > 0
      ? fmt(
          ((domesticSalesTotal + internationalSalesTotal) /
            (domesticTargetTotal + internationalTargetTotal)) *
            100,
          2,
        )
      : fmt(revenueLatest, 2);

  const strategyModel = {
    northStar: {
      name: '经营性现金创造能力',
      description: '以经营性现金流和回款质量衡量增长质量与经营安全边界',
      unit: '分',
      current: fmt(financeData.kpis.operatingCashFlow * 0.55 + financeData.kpis.collectionRate * 0.45, 2),
      target: 100,
    },
    dimensions: [
      {
        key: 'growth',
        name: '增长',
        objective: '稳增长并优化结构贡献',
        weight: 30,
        kpis: [
          {
            name: '营收达成率',
            unit: '%',
            current: fmt(revenueLatest, 2),
            target: 102,
            route: '/sales#kpi-month-achieve',
          },
          {
            name: '销售达成率',
            unit: '%',
            current: salesAchieveRate,
            target: 101,
            route: '/sales#kpi-month-achieve',
          },
        ],
      },
      {
        key: 'profit',
        name: '盈利',
        objective: '提升利润达成和毛利结构质量',
        weight: 25,
        kpis: [
          {
            name: '利润达成率',
            unit: '%',
            current: fmt(financeData.kpis.profitRate, 2),
            target: 14,
            route: '/finance#kpi-profit-rate',
          },
          {
            name: '毛利率',
            unit: '%',
            current: fmt(financeData.kpis.grossMarginRate, 2),
            target: 18,
            route: '/finance#kpi-gross-margin-rate',
          },
        ],
      },
      {
        key: 'cash',
        name: '现金',
        objective: '保障现金安全线并提升回款效率',
        weight: 30,
        kpis: [
          {
            name: '经营性现金流',
            unit: '百万元',
            current: fmt(financeData.kpis.operatingCashFlow, 2),
            target: 130,
            route: '/finance#kpi-operating-cashflow',
          },
          {
            name: '回款达成率',
            unit: '%',
            current: fmt(financeData.kpis.collectionRate, 2),
            target: 95,
            route: '/finance#kpi-collection-rate',
          },
        ],
      },
      {
        key: 'capability',
        name: '能力',
        objective: '强化研发交付与组织能力支撑',
        weight: 15,
        kpis: [
          {
            name: '研发里程碑达成率',
            unit: '%',
            current: fmt(rdData.kpis.milestoneOnTimeRate, 2),
            target: 98,
            route: '/rd#kpi-milestone-rate',
          },
          {
            name: '关键人才占比',
            unit: '%',
            current: fmt(hrData.kpis.keyTalentRate, 2),
            target: 22,
            route: '/production#kpi-total-headcount',
          },
        ],
      },
    ],
  };

  if (rdData.kpis.milestoneOnTimeRate < 90) {
    alerts.push({
      module: '研发',
      org: '研发中心',
      metric: '里程碑按期达成率',
      value: rdData.kpis.milestoneOnTimeRate,
      threshold: '< 90%',
      level: '红',
      reason: '研发节点延期风险偏高',
    });
  } else if (rdData.kpis.milestoneOnTimeRate < 100) {
    alerts.push({
      module: '研发',
      org: '研发中心',
      metric: '里程碑按期达成率',
      value: rdData.kpis.milestoneOnTimeRate,
      threshold: '90% - 100%',
      level: '黄',
      reason: '里程碑达成低于预期节奏',
    });
  }

  if (hrData.kpis.monthlyTurnoverRate > 10) {
    alerts.push({
      module: '人力',
      org: '集团人力',
      metric: '月离职率',
      value: hrData.kpis.monthlyTurnoverRate,
      threshold: '> 10%',
      level: '红',
      reason: '组织稳定性存在风险',
    });
  } else if (hrData.kpis.monthlyTurnoverRate > 8) {
    alerts.push({
      module: '人力',
      org: '集团人力',
      metric: '月离职率',
      value: hrData.kpis.monthlyTurnoverRate,
      threshold: '8% - 10%',
      level: '黄',
      reason: '关键岗位流失率需关注',
    });
  }

  const dataset = {
    meta: {
      generatedAt: new Date().toISOString(),
      dataDir: DATA_DIR,
      startMonth: months[0],
      latestMonth,
      sourceFiles: Object.fromEntries(
        Object.entries(fileMap).map(([k, v]) => [
          k,
          Array.isArray(v)
            ? v.map((item) => path.basename(item))
            : v
              ? path.basename(v)
              : null,
        ]),
      ),
      note: '缺失时间和字段已按业务规则补齐 mock 数据。',
    },
    overview: {
      kpis: {
        revenueRate: fmt(revenueLatest, 2),
        profitRate: fmt(profitLatest, 2),
        operatingCashFlow: fmt(cashLatest, 2),
        collectionRate: fmt(collectionLatest, 2),
        rdMilestoneRate: fmt(rdLatest, 2),
      },
      trend,
      contribution,
      anomalies: alerts.slice(0, 8),
      strategy: strategyModel,
    },
    sales: {
      domesticLines,
      domesticRegions,
      domesticProvinces,
      internationalRegions,
      regionMappings: [
        { region: '西欧区域', regionGroup: '法国分公司', effectiveFrom: '2025-01-01' },
        { region: '独联体区域', regionGroup: '法国分公司', effectiveFrom: '2025-01-01' },
        { region: '中东非洲区域', regionGroup: '大国际-中东非', effectiveFrom: '2025-01-01' },
        { region: '泰越区域', regionGroup: '大国际-泰越', effectiveFrom: '2025-01-01' },
      ],
      subsidiaries,
      grossMargins,
      receivableStat,
      receivableMonthly,
    },
    finance: financeData,
    rd: rdData,
    hr: hrData,
    division: divisionData,
    alerts: alerts.slice(0, 50),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`Generated: ${OUTPUT_FILE}`);
  console.log(`Months: ${months[0]} ~ ${months[months.length - 1]} (${months.length})`);
  console.log(`Alerts: ${dataset.alerts.length}`);
}

main();
