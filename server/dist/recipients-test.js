import { parseRecipients } from "./utils/recipients.js";
const input = `
  John@example.com
  sarah@example.com
  john@example.com
  invalid-email
  bob@example.com,
  Sarah@Example.com
`;
const recipients = parseRecipients(input);
console.log("Recipients:", recipients);
console.log("Count:", recipients.length);
