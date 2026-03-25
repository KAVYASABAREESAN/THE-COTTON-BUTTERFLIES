const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Testing .env loading...');
console.log('Current directory:', __dirname);
console.log('.env path:', path.resolve(__dirname, '.env'));
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ Not found');

if (!process.env.MONGODB_URI) {
  console.log('\n❌ .env file not loaded properly');
  console.log('Please check:');
  console.log('1. Does .env file exist in backend folder?');
  console.log('2. Does it contain MONGODB_URI?');
  console.log('3. Try copying this to console:');
  console.log('   type .env');
} else {
  console.log('\n✅ .env loaded successfully!');
}