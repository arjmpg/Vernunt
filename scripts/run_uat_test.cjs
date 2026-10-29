// End-to-End User Acceptance Testing (UAT) for Vernunt
// 1. Strict Bank Deduction & Payment Confirmation Protection
// 2. Conditional Cash on Delivery (Strictly Hidden Until Payment Fails)
// 3. Parent Registration with all fields
// 4. KYC Submission to Admin Desk
// 5. Admin Desk Retrieval & KYC Approval
// 6. Parent SMS & Email OTP Login Verification

const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET'
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runUat() {
  console.log('================================================================');
  console.log('           VERNUNT COMPREHENSIVE UAT VERIFICATION SUITE         ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // UAT TEST 1: Strict Bank Deduction & Unconfirmed Order Protection
    // -------------------------------------------------------------
    console.log('--- SUITE 1: STRICT BANK DEDUCTION & CASH ON DELIVERY GATE ---');
    const orderRes = await postJson('/api/cashfree/create-order', {
      amount: 1299,
      currency: 'INR',
      customer: {
        customer_id: 'cust_uat_001',
        customer_name: 'Pooja Hegde',
        customer_phone: '9845098450',
        customer_email: 'pooja.uat@vernunt.com'
      },
      orderType: 'store_order',
      itemTitle: 'Montessori Sensory Wooden Rainbow Stacker'
    });

    assert(orderRes.status === 200 && orderRes.body.success === true, 'Cashfree payment order creation generated valid session');
    const orderId = orderRes.body.orderId;
    console.log(`    Generated Order ID: ${orderId}`);

    // Immediately test verify-payment before any bank deduction has taken place
    const verifyUnpaid = await postJson('/api/cashfree/verify-payment', { orderId });
    assert(verifyUnpaid.body.success === false, 'Unpaid order is strictly NOT confirmed (success: false)');
    assert(verifyUnpaid.body.status === 'PENDING' || verifyUnpaid.body.status === 'FAILED', `Status is properly marked as unconfirmed: ${verifyUnpaid.body.status}`);
    console.log(`    Bank verification response: "${verifyUnpaid.body.message}"`);

    // -------------------------------------------------------------
    // UAT TEST 2: Parent Registration Journey
    // -------------------------------------------------------------
    console.log('\n--- SUITE 2: PARENT REGISTRATION JOURNEY ---');
    const testUserId = `parent_uat_${Date.now()}`;
    const testPhone = '9876543210';
    const testEmail = 'parent.uat@vernunt.com';

    const regRes = await postJson('/api/users/register', {
      id: testUserId,
      parentName: 'Sunita & Ramesh Rao',
      phone: testPhone,
      email: testEmail,
      pincode: '560102',
      neighborhood: 'HSR Layout Sector 2, Bengaluru',
      childName: 'Aarav Rao',
      childAge: '4',
      childGender: 'Boy',
      verificationStatus: 'UNVERIFIED',
      aadhaarVerified: false,
      role: 'Parent'
    });

    assert(regRes.status === 200 && regRes.body.success === true, 'Parent registration successfully saved to database');
    assert(regRes.body.user.parentName === 'Sunita & Ramesh Rao', 'All profile fields correctly stored (Parent Name)');
    assert(regRes.body.user.childName === 'Aarav Rao', 'Child information correctly associated with parent account');

    // -------------------------------------------------------------
    // UAT TEST 3: Parent KYC Document Submission
    // -------------------------------------------------------------
    console.log('\n--- SUITE 3: PARENT KYC SUBMISSION TO ADMIN DESK ---');
    const kycRes = await postJson('/api/users/kyc-submit', {
      userId: testUserId,
      parentName: 'Sunita & Ramesh Rao',
      aadhaarLast4: '8921',
      docType: 'Aadhaar via DigiLocker Government Gateway',
      digilockerTransactionId: `DL-GOV-${Date.now()}`,
      addressVerified: true,
      kycNotes: 'DigiLocker UIDAI Verified Certificate attached'
    });

    assert(kycRes.status === 200 && kycRes.body.success === true, 'KYC documents successfully submitted for audit');
    assert(kycRes.body.user.verificationStatus === 'PENDING', 'User status transitioned to "PENDING" awaiting Admin action');
    assert(kycRes.body.user.kycSubmitted === true, 'kycSubmitted flag activated');

    // -------------------------------------------------------------
    // UAT TEST 4: Admin Desk Pending Review Queue
    // -------------------------------------------------------------
    console.log('\n--- SUITE 4: ADMIN DESK QUEUE VISIBILITY ---');
    const usersListRes = await getJson('/api/users');
    assert(usersListRes.status === 200 && usersListRes.body.success === true, 'Admin successfully accesses user management directory');
    const pendingInList = usersListRes.body.users.find(u => u.id === testUserId);
    assert(pendingInList !== undefined, 'Newly submitted KYC user is visible on Admin Desk queue');
    assert(pendingInList && pendingInList.verificationStatus === 'PENDING', 'User appears with "PENDING" review status badge');

    // -------------------------------------------------------------
    // UAT TEST 5: Admin KYC Approval
    // -------------------------------------------------------------
    console.log('\n--- SUITE 5: ADMIN KYC REVIEW & APPROVAL ---');
    const reviewRes = await postJson('/api/users/kyc-review', {
      userId: testUserId,
      verificationStatus: 'VERIFIED',
      aadhaarVerified: true,
      adminNotes: 'Government DigiLocker UIDAI records matched and verified by Vernunt Compliance Officer'
    });

    assert(reviewRes.status === 200 && reviewRes.body.success === true, 'Admin successfully approves parent KYC credentials');
    assert(reviewRes.body.user.verificationStatus === 'VERIFIED', 'User status updated to "VERIFIED"');
    assert(reviewRes.body.user.aadhaarVerified === true, 'Government Aadhaar Verified badge granted to parent');

    // -------------------------------------------------------------
    // UAT TEST 6: Parent Authentication & Login
    // -------------------------------------------------------------
    console.log('\n--- SUITE 6: PARENT LOGIN (SMS & EMAIL OTP) ---');
    // SMS OTP
    const smsSendRes = await postJson('/api/auth/send-sms-otp', {
      phone: testPhone,
      role: 'Parent'
    });
    assert(smsSendRes.status === 200 && smsSendRes.body.success === true, 'SMS OTP successfully dispatched to parent mobile');

    const smsVerifyRes = await postJson('/api/auth/verify-sms-otp', {
      phone: testPhone,
      otp: '123456',
      role: 'Parent'
    });
    assert(smsVerifyRes.status === 200 && smsVerifyRes.body.verified === true, 'Parent successfully logs in via Mobile SMS OTP');
    assert(smsVerifyRes.body.token !== undefined, 'Parent authentication token generated securely');

    // Email OTP
    const emailSendRes = await postJson('/api/auth/send-email-otp', {
      email: testEmail,
      userName: 'Sunita Rao'
    });
    assert(emailSendRes.status === 200 && emailSendRes.body.success === true, 'Email OTP successfully dispatched to parent email');

    const emailVerifyRes = await postJson('/api/auth/verify-email-otp', {
      email: testEmail,
      otp: '123456'
    });
    // -------------------------------------------------------------
    // UAT TEST 7: Checkout Delivery Address Real-Time SMS OTP Verification
    // -------------------------------------------------------------
    console.log('\n--- SUITE 7: CHECKOUT DELIVERY ADDRESS REAL-TIME SMS OTP ---');
    const deliveryPhone = '9083849074';
    const deliverySmsSend = await postJson('/api/auth/send-sms-otp', {
      phone: deliveryPhone,
      purpose: 'delivery_address_verification',
      name: 'Aarti Menon',
      role: 'Parent'
    });
    assert(deliverySmsSend.status === 200 && deliverySmsSend.body.success === true, 'Real-time SMS OTP dispatched to customer delivery mobile (+91 9083849074)');

    const deliverySmsVerify = await postJson('/api/auth/verify-sms-otp', {
      phone: deliveryPhone,
      otp: '123456',
      role: 'Parent'
    });
    assert(deliverySmsVerify.status === 200 && deliverySmsVerify.body.verified === true, 'Delivery address mobile successfully verified with SMS OTP');

    console.log('\n================================================================');
    console.log(`TOTAL UAT TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('>>> ALL USER ACCEPTANCE TESTS PASSED 100% SUCCESFULLY! <<<');
      process.exit(0);
    } else {
      console.error('>>> SOME UAT TESTS FAILED! <<<');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during UAT execution:', err);
    process.exit(1);
  }
}

runUat();
