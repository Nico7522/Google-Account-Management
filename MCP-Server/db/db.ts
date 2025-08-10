import * as fs from "fs";
import * as path from "path";

// Always write/read the fake DB in the package's db directory, not under dist
// Navigate up from dist/db or db to the project root, then to db/fake_db.json
const isInDist = __dirname.includes("dist");
const projectRoot = isInDist
  ? path.resolve(__dirname, "..", "..") // from dist/db to project root
  : path.resolve(__dirname, ".."); // from db to project root
const FAKE_DB = path.resolve(projectRoot, "db", "fake_db.json");

/**
 * Read the fake db file
 * @returns The fake db file
 */
function readFakeDb(): Record<string, any> {
  try {
    // Ensure target directory exists
    fs.mkdirSync(path.dirname(FAKE_DB), { recursive: true });
    if (!fs.existsSync(FAKE_DB)) {
      fs.writeFileSync(FAKE_DB, "{}", "utf-8");
    }
    const data = fs.readFileSync(FAKE_DB, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading tokens file:", err);
    return {};
  }
}

/**
 * Write into the fake db file
 * @param fakeDb The fake db file
 */
function writeIntoFakeDb(fakeDb: Record<string, any>) {
  try {
    // Ensure target directory exists
    fs.mkdirSync(path.dirname(FAKE_DB), { recursive: true });
    fs.writeFileSync(FAKE_DB, JSON.stringify(fakeDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing tokens file:", err);
  }
}

/**
 * Get the fake db file
 * @returns The fake db file
 */
export function getFakeDb(): Record<string, any> {
  return readFakeDb();
}

/**
 * Set a value in the fake db file
 * @param key The key to set
 * @param value The value to set
 */
export function setFakeDb(
  key: string,
  value: {
    accesToken: string;
    refreshToken: string;
  }
) {
  const fakeDb = readFakeDb();
  fakeDb[key] = value;
  writeIntoFakeDb(fakeDb);
}

/**
 * Remove a value from the fake db file
 * @param key The key to remove
 */
export function removeFakeDb(key: string) {
  const fakeDb = readFakeDb();
  delete fakeDb[key];
  writeIntoFakeDb(fakeDb);
}
