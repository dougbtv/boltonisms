#!/usr/bin/env node
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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
  const lastEdit = row[11]?.trim();
  const featured = row[12]?.trim();

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
  if (lastEdit) {
    // Try to parse the lastEdit timestamp
    try {
      const parsedDate = new Date(lastEdit);
      if (!isNaN(parsedDate.getTime())) {
        entry.lastEdit = parsedDate.toISOString();
      }
    } catch (e) {
      // If parsing fails, just ignore it
    }
  }
  if (featured) {
    // Parse as boolean - TRUE, true, 1, yes, etc.
    const featuredLower = featured.toLowerCase();
    entry.featured = featuredLower === 'true' || featuredLower === '1' || featuredLower === 'yes';
  }

  entry.createdAt = now;
  entry.updatedAt = now;

  return entry;
}

async function extractCellImages(sheets, spreadsheetId) {
  console.log('🖼️  Checking for in-cell images...');

  try {
    // Get full spreadsheet data including images
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true
    });

    const imageMap = {}; // Map of row numbers to image URLs

    // Look for images in the first sheet
    const sheet = metadata.data.sheets[0];
    if (!sheet) {
      console.log('  No sheet data available');
      return imageMap;
    }

    console.log(`  Sheet: "${sheet.properties.title}"`);

    // Check for images in rowData
    if (sheet.data && sheet.data[0] && sheet.data[0].rowData) {
      const rowData = sheet.data[0].rowData;

      rowData.forEach((row, rowIndex) => {
        if (!row.values || rowIndex === 0) return; // Skip header row

        const imageCell = row.values[9]; // Column J (Image column, 0-indexed)


        // Check various ways an image URL might be stored
        if (imageCell) {
          let imageUrl = null;

          // Check userEnteredValue
          if (imageCell.userEnteredValue) {
            if (imageCell.userEnteredValue.stringValue) {
              imageUrl = imageCell.userEnteredValue.stringValue;
            } else if (imageCell.userEnteredValue.formulaValue) {
              // Could be =IMAGE("url") formula
              const match = imageCell.userEnteredValue.formulaValue.match(/IMAGE\("([^"]+)"\)/i);
              if (match) {
                imageUrl = match[1];
              }
            }
          }

          // Check effectiveValue
          if (!imageUrl && imageCell.effectiveValue && imageCell.effectiveValue.stringValue) {
            imageUrl = imageCell.effectiveValue.stringValue;
          }

          // Check hyperlink
          if (!imageUrl && imageCell.hyperlink) {
            imageUrl = imageCell.hyperlink;
          }

          if (imageUrl && (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || imageUrl.startsWith('http'))) {
            imageMap[rowIndex + 1] = imageUrl;
            console.log(`  Found image in row ${rowIndex + 1}: ${imageUrl.substring(0, 60)}...`);
          }
        }
      });
    }

    // Check for overlaid images (these are positioned over cells)
    // Note: These don't map cleanly to rows, so we'll skip for now
    // but log if we find any
    if (sheet.merges || sheet.conditionalFormats || sheet.filterViews) {
      console.log('  Note: Sheet has additional formatting/overlays');
    }

    const imageCount = Object.keys(imageMap).length;
    console.log(`  Found ${imageCount} image(s)`);

    if (imageCount === 0) {
      console.log('\n  💡 TIP: To add images to the dictionary:');
      console.log('     1. Use the =IMAGE("https://...") formula in the Image column, OR');
      console.log('     2. Paste an image URL as plain text in the Image column');
      console.log('     Note: Images inserted via "Insert > Image" are not accessible via API\n');
    }

    return imageMap;
  } catch (error) {
    console.warn('  Warning: Could not extract cell images:', error.message);
    console.warn('  Stack:', error.stack);
    return {};
  }
}

async function pullSheet() {
  console.log('🔍 Loading credentials...');

  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Credentials file not found at: ${CREDENTIALS_PATH}`);
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`📊 Fetching sheet: ${SHEET_ID}...`);

  // First, get the cell values
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A:M',
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('No data found in sheet');
  }

  console.log(`✓ Fetched ${rows.length} rows`);

  // Try to extract in-cell images
  const imageMap = await extractCellImages(sheets, SHEET_ID);

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

      // If there's an image in the imageMap for this row, add it to the row data
      if (imageMap[rowIndex]) {
        row[9] = imageMap[rowIndex]; // Set column J (Image) to the extracted image URL
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

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(
    `${OUTPUT_DIR}/boltonisms.json`,
    JSON.stringify(entries, null, 2),
    'utf8'
  );
  console.log(`✓ Wrote ${OUTPUT_DIR}/boltonisms.json`);

  const index = entries.map(e => {
    const indexEntry = {
      term: e.term,
      slug: e.slug,
      type: e.type,
      firstDef: e.definitions[0],
      seeAlso: e.seeAlso || []
    };
    if (e.lastEdit) {
      indexEntry.lastEdit = e.lastEdit;
    }
    if (e.featured) {
      indexEntry.featured = e.featured;
    }
    return indexEntry;
  });

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
