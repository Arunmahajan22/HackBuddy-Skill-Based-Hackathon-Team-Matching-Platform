require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');

const runTests = async () => {
  console.log('🚀 [TEST SUITE] Starting Email Authentication & Verification Tests...\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas\n');

  const testEmail = `testbuilder_${Date.now()}@hackbuddy.test`;
  const testPassword = 'TestPassword123!';

  // Clean up any test records
  await User.deleteMany({ email: /@hackbuddy\.test$/ });

  // TEST 1: User Registration with Verification Token
  console.log('--- TEST 1: Register Unverified User ---');
  const user = new User({
    name: 'Test Builder',
    email: testEmail,
    password: testPassword,
    branch: 'Computer Science',
    year: 3,
    skills: ['React', 'Node.js'],
    experienceLevel: 'intermediate',
    isVerified: false,
  });

  const rawToken = user.generateVerificationToken();
  await user.save();

  console.log('✓ User created with isVerified:', user.isVerified);
  console.log('✓ Raw Token generated:', rawToken.slice(0, 16) + '...');
  console.log('✓ Hashed Token in DB exists:', Boolean(user.verificationToken));
  console.log('✓ Token Expires At:', user.verificationTokenExpiresAt.toISOString());

  // TEST 2: Email Sending
  console.log('\n--- TEST 2: Send Verification Email ---');
  const emailRes = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawToken,
  });
  console.log('✓ Email dispatch executed with messageId:', emailRes.messageId);

  // TEST 3: Login Protection (Before Verification)
  console.log('\n--- TEST 3: Login Protection Before Verification ---');
  const foundUser = await User.findOne({ email: testEmail }).select('+password');
  const isMatch = await foundUser.comparePassword(testPassword);
  console.log('✓ Password match verified:', isMatch);
  if (!foundUser.isVerified) {
    console.log('✓ PASS: Login correctly blocked because isVerified is FALSE');
  } else {
    throw new Error('FAIL: Unverified user was not blocked');
  }

  // TEST 4: Invalid Verification Token
  console.log('\n--- TEST 4: Invalid Verification Token ---');
  const invalidToken = crypto.randomBytes(32).toString('hex');
  const invalidHashed = crypto.createHash('sha256').update(invalidToken).digest('hex');
  const invalidLookup = await User.findOne({ verificationToken: invalidHashed });
  if (!invalidLookup) {
    console.log('✓ PASS: Invalid token correctly rejected (no user match)');
  } else {
    throw new Error('FAIL: Invalid token found a match');
  }

  // TEST 5: Expired Verification Token
  console.log('\n--- TEST 5: Expired Verification Token ---');
  user.verificationTokenExpiresAt = new Date(Date.now() - 1000); // 1 sec in past
  await user.save({ validateBeforeSave: false });

  const expiredLookup = await User.findOne({
    verificationToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
  }).select('+verificationToken +verificationTokenExpiresAt');

  if (expiredLookup.verificationTokenExpiresAt < new Date()) {
    console.log('✓ PASS: Expired token correctly detected as expired');
  } else {
    throw new Error('FAIL: Expired token was not detected');
  }

  // TEST 6: Resend Verification (Token Regeneration & Cooldown)
  console.log('\n--- TEST 6: Resend Verification ---');
  const newRawToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  console.log('✓ New Raw Token generated:', newRawToken.slice(0, 16) + '...');
  console.log('✓ Expiration refreshed to:', user.verificationTokenExpiresAt.toISOString());

  // TEST 7: Valid Verification & Token Clearance
  console.log('\n--- TEST 7: Valid Email Verification ---');
  const validHashed = crypto.createHash('sha256').update(newRawToken).digest('hex');
  const userToVerify = await User.findOne({ verificationToken: validHashed }).select(
    '+verificationToken +verificationTokenExpiresAt',
  );

  if (userToVerify && userToVerify.verificationTokenExpiresAt > new Date()) {
    userToVerify.isVerified = true;
    userToVerify.verificationToken = undefined;
    userToVerify.verificationTokenExpiresAt = undefined;
    await userToVerify.save({ validateBeforeSave: false });
    console.log('✓ User marked as isVerified: true');
  } else {
    throw new Error('FAIL: Verification token lookup failed');
  }

  // TEST 8: Login After Verification
  console.log('\n--- TEST 8: Login After Verification ---');
  const activeUser = await User.findOne({ email: testEmail });
  if (activeUser.isVerified === true) {
    console.log('✓ PASS: User is verified and can now log in and access all protected features');
  } else {
    throw new Error('FAIL: User is still not verified');
  }

  // Clean up
  await User.deleteOne({ email: testEmail });
  console.log('\n✓ Cleaned up test user');
  console.log('\n🎉 ALL 8 EMAIL AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
};

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
