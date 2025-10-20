#!/usr/bin/env node
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const SHEET_ID = process.env.SHEET_ID || '1x5WcMlprvYs3IHSbhI2rzt9xEZxAgi6w97Pu7UdHISI';
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './goat-jargon-file-b455b2682342.json';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './dist';

const KNOWN_TYPES = ['noun', 'verb', 'adjective', 'adverb', 'exclamation', 'place', 'phrase', 'slang', 'other'];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseExamples(exampleText) {
  if (!exampleText || !exampleText.trim()) return [];

  return exampleText
    .split(/\n\n+/)
    .map(ex => ex.trim().replace(/^["']|["']$/g, ''))
    .filter(ex => ex.length > 0);
}

function parseSeeAlso(seeAlsoText) {
  if (!seeAlsoText || !seeAlsoText.trim()) return [];

  return [...new Set(
    seeAlsoText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  )];
}

function parseOtherForms(otherFormsText) {
  if (!otherFormsText || !otherFormsText.trim()) return [];

  return otherFormsText
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function normalizeRow(row, rowIndex, seenSlugs) {
  const term = row[0]?.trim();
  if (!term) {
    throw new Error(`Row ${rowIndex}: Missing required field "Term"`);
  }

  const type = row[1]?.trim() || 'other';
  const def1 = row[2]?.trim();
  const def2 = row[3]?.trim();
  const def3 = row[4]?.trim();
  const otherForms = row[5]?.trim();
  const history = row[6]?.trim();
  const seeAlso = row[7]?.trim();
  const examples = row[8]?.trim();
  const imageUrl = row[9]?.trim();
  const attribution = row[10]?.trim();

  const definitions = [def1, def2, def3].filter(d => d && d.length > 0);

  if (definitions.length === 0) {
    throw new Error(`Row ${rowIndex}: At least one definition is required for term "${term}"`);
  }

  let slug = slugify(term);
  let uniqueSlug = slug;
  let counter = 2;
  while (seenSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  seenSlugs.add(uniqueSlug);

  const id = createHash('md5').update(`${term}-${rowIndex}`).digest('hex').substring(0, 12);
  const now = new Date().toISOString();

  const entry = {
    id,
    term,
    slug: uniqueSlug,
    type,
    definitions,
    sourceRow: rowIndex
  };

  if (otherForms) entry.otherForms = parseOtherForms(otherForms);
  if (history) entry.history = history;
  if (seeAlso) entry.seeAlso = parseSeeAlso(seeAlso);
  if (examples) entry.examples = parseExamples(examples);
  if (imageUrl) {
    entry.image = {
      url: imageUrl,
      alt: term
    };
  }
  if (attribution) entry.attribution = attribution;

  entry.createdAt = now;
  entry.updatedAt = now;

  return entry;
}

async function pullSheet() {
  console.log('🔍 Loading credentials...');

  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`📊 Fetching sheet: ${SHEET_ID}...`);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A:K',
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('No data found in sheet');
  }

  console.log(`✓ Fetched ${rows.length} rows`);

  const header = rows[0];
  const dataRows = rows.slice(1);

  console.log(`📝 Header: ${header.join(' | ')}`);
  console.log(`📚 Processing ${dataRows.length} entries...`);

  const seenSlugs = new Set();
  const entries = [];
  const errors = [];

  dataRows.forEach((row, idx) => {
    const rowIndex = idx + 2;
    try {
      if (row.length === 0 || !row[0]?.trim()) {
        return;
      }
      const entry = normalizeRow(row, rowIndex, seenSlugs);
      entries.push(entry);
    } catch (err) {
      errors.push({ row: rowIndex, error: err.message });
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ Validation errors:');
    errors.forEach(({ row, error }) => {
      console.error(`  Row ${row}: ${error}`);
    });
    throw new Error(`Failed with ${errors.length} validation error(s)`);
  }

  console.log(`✓ Normalized ${entries.length} valid entries`);
  return { entries, etag: response.headers.etag };
}

async function writeOutputs(data) {
  const { entries, etag } = data;

  writeFileSync(
    `${OUTPUT_DIR}/boltonisms.json`,
    JSON.stringify(entries, null, 2),
    'utf8'
  );
  console.log(`✓ Wrote ${OUTPUT_DIR}/boltonisms.json`);

  const index = entries.map(e => ({
    term: e.term,
    slug: e.slug,
    type: e.type,
    firstDef: e.definitions[0],
    seeAlso: e.seeAlso || []
  }));

  writeFileSync(
    `${OUTPUT_DIR}/index.json`,
    JSON.stringify(index),
    'utf8'
  );
  console.log(`✓ Wrote ${OUTPUT_DIR}/index.json`);

  const meta = {
    buildTime: new Date().toISOString(),
    entryCount: entries.length,
    sheetEtag: etag
  };

  writeFileSync(
    `${OUTPUT_DIR}/meta.json`,
    JSON.stringify(meta, null, 2),
    'utf8'
  );
  console.log(`✓ Wrote ${OUTPUT_DIR}/meta.json`);
}

async function main() {
  try {
    const data = await pullSheet();
    await writeOutputs(data);
    console.log('\n✅ Pull complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

main();
