import fs from "fs";
import { parseRecipients } from "./utils/recipients.js";
const fileContents = fs.readFileSync("src/test-data/recipients.csv", "utf-8");
const recipients = parseRecipients(fileContents);
console.log("Detected recipients:");
console.log(recipients);
console.log("Count:", recipients.length);
