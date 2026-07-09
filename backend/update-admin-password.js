const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

async function updatePassword() {
  try {
    const email = 'admin@company.com';
    const password = 'Admin@123';
    
    console.log(`Generating hash for ${password}...`);
    const hash = await bcrypt.hash(password, 10);
    
    console.log(`Updating password in database...`);
    const [result] = await db.query('UPDATE employees SET password_hash = ? WHERE email = ?', [hash, email]);
    
    if (result.affectedRows > 0) {
      console.log('Successfully updated the admin password! You can now log in.');
    } else {
      console.log('Could not find the admin user. Make sure you have imported the schema.sql file.');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    process.exit();
  }
}

updatePassword();
