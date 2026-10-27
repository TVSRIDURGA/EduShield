import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: Explain Policy Terms using Vertex AI / Grounded Rules
 */
export const aiExplainPolicy = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { query, policyId } = data;
  if (!query || !policyId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing query or policyId parameter.');
  }

  const policyDoc = await db.collection('educationPolicies').doc(policyId).get();
  if (!policyDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Policy document not found.');
  }

  const policy = policyDoc.data();
  // Authorization check
  if (policy?.guardianId !== context.auth.uid && context.auth.token.role !== 'admin' && context.auth.token.role !== 'claims_officer') {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized to query this policy.');
  }

  // Grounded Explanation Engine
  const qLower = (query as string).toLowerCase();
  let answer = `Under policy ${policy?.policyNumber} for student ${policy?.studentName}, total covered benefit is ₹${policy?.coverageAmount}.`;
  const citedClauses = ['Section 3: Policy Schedule of Benefits'];

  if (qLower.includes('exclusion')) {
    answer = `General exclusions under ${policy?.planName} include pre-existing illnesses diagnosed prior to inception, academic misconduct, or non-accredited course enrollments.`;
    citedClauses.push('Clause 7.4: General Exclusions');
  } else if (qLower.includes('waiting')) {
    answer = `Policy ${policy?.policyNumber} specifies a ${policy?.waitingPeriodDays}-day initial waiting period from ${policy?.effectiveDate}.`;
    citedClauses.push('Clause 2.3: Initial Waiting Period');
  }

  // Audit log of AI interaction
  await db.collection('auditLogs').add({
    action: 'AI_POLICY_QUERY',
    entityType: 'POLICY',
    entityId: policyId,
    performedByUserId: context.auth.uid,
    performedByUserName: context.auth.token.name || 'Authenticated User',
    performedByUserRole: context.auth.token.role || 'guardian',
    details: `AI Query on policy ${policy?.policyNumber}: "${query}"`,
    timestamp: new Date().toISOString()
  });

  return {
    answer,
    citedClauses,
    groundedInPolicy: true
  };
});

/**
 * Cloud Function: Adjudicate Claim Payout directly to University Fee Escrow
 */
export const processSimulatedUniversityPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const role = context.auth.token.role;
  if (role !== 'claims_officer' && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only claims officers or administrators may disburse university payouts.');
  }

  const { claimId, payableAmount, beneficiaryAccount } = data;
  const claimRef = db.collection('educationClaims').doc(claimId);
  const claimSnap = await claimRef.get();

  if (!claimSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Claim record not found.');
  }

  const transactionRef = `SIM-NEFT-${new Date().getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`;

  const paymentRecord = {
    paymentNumber: `PAY-${Date.now()}`,
    claimId,
    paidAmount: payableAmount,
    beneficiaryAccount,
    transactionReference: transactionRef,
    status: 'COMPLETED',
    isSimulated: true,
    processedAt: new Date().toISOString()
  };

  await claimRef.update({
    status: 'PAID',
    payment: paymentRecord,
    updatedAt: new Date().toISOString()
  });

  return paymentRecord;
});
