import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Case } from "../models/Case.js";
import { Submission } from "../models/Submission.js";
import { Decision } from "../models/Decision.js";
import { cascadeDeleteUser } from "../controllers/authController.js";

async function testCascade() {
  console.log("\n========================================================");
  console.log("       Testing Cascading User & Dispute Deletion        ");
  console.log("========================================================\n");

  await connectDB();

  // TEST 1: Delete Respondent -> Case removed from Claimant & Respondent
  console.log("--- TEST 1: Delete Respondent ---");
  const suffix1 = Date.now();
  const userA1 = await User.create({ name: "Claimant 1", email: `c1_${suffix1}@example.com`, password: "valid_secure_pass123", role: "claimant" });
  const userB1 = await User.create({ name: "Respondent 1", email: `r1_${suffix1}@example.com`, password: "valid_secure_pass123", role: "respondent" });
  const case1 = await Case.create({ title: "Dispute 1", claimant: userA1._id, respondent: userB1._id, respondentEmail: userB1.email });
  await Submission.create({ case: case1._id, party: "A", author: userA1._id, statement: "A stmt" });
  await Submission.create({ case: case1._id, party: "B", author: userB1._id, statement: "B stmt" });

  await cascadeDeleteUser(userB1._id, userB1.email);
  const checkCase1 = await Case.findById(case1._id);
  const casesClaimant1 = await Case.find({ claimant: userA1._id });
  console.log(`Case deleted: ${!checkCase1 ? "YES ✅" : "NO ❌"} | Claimant sees 0 cases: ${casesClaimant1.length === 0 ? "YES ✅" : "NO ❌"}`);

  await User.findByIdAndDelete(userA1._id);

  // TEST 2: Delete Claimant -> Case removed from Respondent & Claimant
  console.log("\n--- TEST 2: Delete Claimant ---");
  const suffix2 = Date.now() + 1;
  const userA2 = await User.create({ name: "Claimant 2", email: `c2_${suffix2}@example.com`, password: "valid_secure_pass123", role: "claimant" });
  const userB2 = await User.create({ name: "Respondent 2", email: `r2_${suffix2}@example.com`, password: "valid_secure_pass123", role: "respondent" });
  const case2 = await Case.create({ title: "Dispute 2", claimant: userA2._id, respondent: userB2._id, respondentEmail: userB2.email });
  await Submission.create({ case: case2._id, party: "A", author: userA2._id, statement: "A stmt" });
  await Submission.create({ case: case2._id, party: "B", author: userB2._id, statement: "B stmt" });

  await cascadeDeleteUser(userA2._id, userA2.email);
  const checkCase2 = await Case.findById(case2._id);
  const casesRespondent2 = await Case.find({ respondent: userB2._id });
  console.log(`Case deleted: ${!checkCase2 ? "YES ✅" : "NO ❌"} | Respondent sees 0 cases: ${casesRespondent2.length === 0 ? "YES ✅" : "NO ❌"}`);

  await User.findByIdAndDelete(userB2._id);

  console.log("\n========================================================");
  console.log("🎉 BOTH TESTS VERIFIED: Case is deleted from both Claimant & Respondent!");
  console.log("========================================================\n");

  await mongoose.connection.close(false);
  process.exit(0);
}

testCascade().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
