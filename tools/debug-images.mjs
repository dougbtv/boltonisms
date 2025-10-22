#!/usr/bin/env node
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

const SHEET_ID = '1x5WcMlprvYs3IHSbhI2rzt9xEZxAgi6w97Pu7UdHISI';
const CREDENTIALS_PATH = './goat-jargon-file-b455b2682342.json';

async function debugImages() {
  console.log('🔍 Loading credentials...');
  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  console.log('📊 Fetching full spreadsheet metadata...');

  // Get EVERYTHING
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    includeGridData: true
  });

  const sheet = response.data.sheets[0];

  console.log('\n=== SHEET INFO ===');
  console.log('Title:', sheet.properties.title);
  console.log('Row count:', sheet.properties.gridProperties.rowCount);
  console.log('Column count:', sheet.properties.gridProperties.columnCount);

  // Check for developer metadata (sometimes images stored here)
  if (sheet.developerMetadata) {
    console.log('\n=== DEVELOPER METADATA ===');
    console.log(JSON.stringify(sheet.developerMetadata, null, 2));
  }

  // Check for embedded objects (THIS is where inserted images live!)
  if (sheet.data && sheet.data[0] && sheet.data[0].rowMetadata) {
    console.log('\n=== ROW METADATA ===');
    console.log(JSON.stringify(sheet.data[0].rowMetadata.slice(0, 5), null, 2));
  }

  // Most importantly: check for embedded objects
  console.log('\n=== CHECKING FOR EMBEDDED OBJECTS ===');
  if (response.data.sheets[0].data) {
    response.data.sheets[0].data.forEach((gridData, idx) => {
      console.log(`Grid ${idx}:`);
      console.log('  Start row:', gridData.startRow);
      console.log('  Start column:', gridData.startColumn);
      console.log('  Row count:', gridData.rowData?.length);

      // Check if there are any embedded objects positioned over cells
      if (gridData.rowData) {
        gridData.rowData.forEach((row, rowIdx) => {
          if (row.values) {
            row.values.forEach((cell, colIdx) => {
              // Check for any unusual properties
              if (cell.note || cell.hyperlink || cell.textFormatRuns) {
                console.log(`  Cell [${rowIdx}, ${colIdx}] has special properties:`, {
                  note: !!cell.note,
                  hyperlink: !!cell.hyperlink,
                  textFormatRuns: !!cell.textFormatRuns
                });
              }
            });
          }
        });
      }
    });
  }

  // Save full response for manual inspection
  writeFileSync('./debug-sheet-full.json', JSON.stringify(response.data, null, 2));
  console.log('\n✓ Full response saved to debug-sheet-full.json');

  // Try to get file metadata from Drive API
  console.log('\n=== CHECKING DRIVE API ===');
  try {
    const driveFile = await drive.files.get({
      fileId: SHEET_ID,
      fields: 'id,name,thumbnailLink,exportLinks'
    });
    console.log('Drive file info:', driveFile.data);
  } catch (err) {
    console.log('Drive API error:', err.message);
  }
}

debugImages().catch(console.error);
