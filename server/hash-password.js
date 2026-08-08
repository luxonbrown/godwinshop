const bcrypt = require("bcrypt");

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.log("Usage: node hash-password.js YourPassword");
    process.exit(1);
  }

  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  console.log("\nPassword:", password);
  console.log("Bcrypt hash:");
  console.log(hash);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});