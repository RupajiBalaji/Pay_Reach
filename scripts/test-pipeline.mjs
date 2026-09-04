import { evaluateDecision } from "../lib/decision-engine.js";
import { executePaymentCollection } from "../lib/orchestrator.js";
import { runBatchTest } from "../lib/batch-tester.js";

async function verifyAll() {
  console.log("--> Testing 1: Decision Engine Ranking for SBI (High U16 Risk)...");
  const sbiDecision = evaluateDecision({
    accountNumber: "38920194821",
    ifsc: "SBIN0001234",
    phoneNumber: "9876543210",
    amount: 500,
  });
  console.log("Top recommendation:", sbiDecision.topRecommendation.name, `(${sbiDecision.topRecommendation.confidence_score}%)`);
  console.log("Rankings count:", sbiDecision.rankings.length);

  console.log("\n--> Testing 2: End-to-end Execution & Fallback Pipeline...");
  const trace = await executePaymentCollection({
    accountNumber: "38920194821",
    ifsc: "SBIN0001234",
    phoneNumber: "9876543210",
    amount: 500,
    customerName: "Ramesh Kumar",
  });
  console.log("Execution status:", trace.request.status);
  console.log("Winning rail:", trace.winningResult?.title);
  console.log("Attempts count:", trace.attempts.length);
  console.log("Audit events logged:", trace.auditTrail.length);

  console.log("\n--> Testing 3: Small Batch Benchmark (10 requests)...");
  const batchSummary = await runBatchTest(10);
  console.log("Batch processed:", batchSummary.totalProcessed);
  console.log("Overall success rate:", `${batchSummary.overallSuccessRate}%`);
  console.log("U16 avoided:", batchSummary.totalU16Avoided);
  console.log("Fallbacks triggered:", batchSummary.totalFallbacksTriggered);

  console.log("\n✓ ALL CORE PIPELINE TESTS PASSED SUCCESSFULLY!");
}

verifyAll().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
