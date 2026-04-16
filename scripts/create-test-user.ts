import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

admin.initializeApp({
  projectId: config.projectId,
});

async function createTestUser() {
  const email = 'corbacicengizusta@gmail.com';
  const password = 'password123';
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('User already exists:', user.uid);
    // Make sure password is correct
    await admin.auth().updateUser(user.uid, { password });
    console.log('Password updated');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const user = await admin.auth().createUser({
        email,
        password,
        emailVerified: true,
        displayName: 'Test User'
      });
      console.log('Created test user:', user.uid);
    } else {
      console.error('Error:', error);
    }
  }
}

createTestUser();
