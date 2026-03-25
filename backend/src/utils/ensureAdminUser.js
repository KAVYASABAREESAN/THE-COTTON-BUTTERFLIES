const User = require('../models/User');

const ensureAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD missing; skipping admin bootstrap');
    return;
  }

  const normalizedEmail = adminEmail.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!existingUser) {
    await User.create({
      name: 'Admin',
      email: normalizedEmail,
      password: adminPassword,
      role: 'admin'
    });
    console.log(`Admin user created: ${normalizedEmail}`);
    return;
  }

  if (existingUser.role !== 'admin') {
    existingUser.role = 'admin';
    await existingUser.save();
    console.log(`User promoted to admin: ${normalizedEmail}`);
  }

  const shouldSyncPassword =
    process.env.NODE_ENV !== 'production' || process.env.ADMIN_SYNC_PASSWORD === 'true';

  if (shouldSyncPassword) {
    const isPasswordMatch = await existingUser.comparePassword(adminPassword);
    if (!isPasswordMatch) {
      existingUser.password = adminPassword;
      await existingUser.save();
      console.log(`Admin password synced from env for: ${normalizedEmail}`);
    }
  }
};

module.exports = ensureAdminUser;
