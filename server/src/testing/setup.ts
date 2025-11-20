import { dbService } from '../services/database.service';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const TEST_DB_PATH = path.join(__dirname, 'test.db');

export function setupTestDatabase() {
  try {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-shm`);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    }
  } catch (e) {
    // Ignore cleanup errors on setup
  }
  
  dbService.initialize(TEST_DB_PATH);
}

export function teardownTestDatabase() {
  try {
    dbService.close();
  } catch (e) {
    // Ignore errors
  }
}

export function getTestDb(): Database.Database {
  return dbService.getDatabase();
}
