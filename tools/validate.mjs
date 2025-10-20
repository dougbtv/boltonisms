#!/usr/bin/env node
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';

const OUTPUT_DIR = process.env.OUTPUT_DIR || './dist';
const SCHEMA_PATH = './schema/entry.schema.json';

async function validate() {
  console.log('🔍 Loading schema...');
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

  console.log('📊 Loading data...');
  const entries = JSON.parse(readFileSync(`${OUTPUT_DIR}/boltonisms.json`, 'utf8'));

  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);

  const validateEntry = ajv.compile(schema);

  console.log(`✓ Validating ${entries.length} entries...`);

  const errors = [];
  entries.forEach((entry, idx) => {
    const valid = validateEntry(entry);
    if (!valid) {
      errors.push({
        index: idx,
        term: entry.term || '(unknown)',
        errors: validateEntry.errors
      });
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ Validation errors:\n');
    errors.forEach(({ index, term, errors: errs }) => {
      console.error(`Entry ${index} ("${term}"):`);
      errs.forEach(err => {
        console.error(`  - ${err.instancePath || '/'}: ${err.message}`);
      });
    });
    throw new Error(`Validation failed with ${errors.length} invalid entries`);
  }

  console.log('✅ All entries valid!');
  return true;
}

async function main() {
  try {
    await validate();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

main();
