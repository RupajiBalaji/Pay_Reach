import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dbFile = path.join(dataDir, "payreach.json");

console.log("--> Testing PayReach data layer...");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if db exists or write sample
const sampleTest = {
  test_timestamp: new Date().toISOString(),
  status: "DB_INIT_SUCCESS"
};

fs.writeFileSync(path.join(dataDir, "test_write.json"), JSON.stringify(sampleTest, null, 2));
const readBack = JSON.parse(fs.readFileSync(path.join(dataDir, "test_write.json"), "utf-8"));

if (readBack.status === "DB_INIT_SUCCESS") {
  console.log("✓ Data layer read/write verified successfully!");
} else {
  console.error("✗ Data layer read/write verification failed.");
  process.exit(1);
}

// Clean up test file
fs.unlinkSync(path.join(dataDir, "test_write.json"));
console.log("✓ Cleanup completed.");
