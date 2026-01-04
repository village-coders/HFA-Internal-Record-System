const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/user');
const Claim = require('../models/claim');

const migrate = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database for migration');
    
    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Claim.deleteMany({});
    // console.log('Cleared existing data');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@hfa-uk.com' });
    
    if (!adminExists) {
      // Create admin user
      const adminPassword = await bcrypt.hash('Admin@123', 10);
      const admin = new User({
        employee_id: 'HFA-ADMIN-001',
        name: 'Administrator',
        email: 'admin@hfa-uk.com',
        password: adminPassword,
        role: 'admin',
        department: 'Administration',
        phone: '07123 456789',
        status: 'active'
      });
      
      await admin.save();
      console.log('✅ Admin user created');
      console.log('   Email: admin@hfa-uk.com');
      console.log('   Password: Admin@123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Create sample worker users
    const workers = [
      {
        employee_id: 'HFA-W-1001',
        name: 'John Smith',
        email: 'john.smith@hfa-uk.com',
        password: 'Password123',
        role: 'worker',
        department: 'Operations',
        phone: '07123 456789',
        status: 'active'
      },
      {
        employee_id: 'HFA-W-1002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@hfa-uk.com',
        password: 'Password123',
        role: 'worker',
        department: 'Finance',
        phone: '07234 567890',
        status: 'active'
      },
      {
        employee_id: 'HFA-W-1003',
        name: 'Michael Brown',
        email: 'michael.brown@hfa-uk.com',
        password: 'Password123',
        role: 'worker',
        department: 'IT',
        phone: '07345 678901',
        status: 'active'
      }
    ];
    
    for (const workerData of workers) {
      const existingWorker = await User.findOne({ email: workerData.email });
      
      if (!existingWorker) {
        const worker = new User(workerData);
        await worker.save();
        console.log(`✅ Worker created: ${workerData.name}`);
      }
    }
    
    // Create sample claims
    const users = await User.find({ role: 'worker' }).limit(2);
    
    if (users.length >= 2) {
      const sampleClaims = [
        {
          user_id: users[0]._id,
          user_name: users[0].name,
          claim_id: 'SFLFJSD',
          employee_id: users[0].employee_id,
          date: new Date('2023-11-15'),
          description: 'Fixed office chair - replaced wheels and hydraulic lever',
          category: 'Equipment',
          amount: 45.00,
          currency: 'GBP',
          status: 'approved',
          notes: 'Receipt attached',
          approved_by: await User.findOne({ email: 'admin@hfa-uk.com' }).select('_id'),
          approved_at: new Date('2023-11-16T14:20:00Z')
        },
        {
          user_id: users[0]._id,
          user_name: users[0].name,
          claim_id: "JKLSJFKLS",
          employee_id: users[0].employee_id,
          date: new Date('2023-11-18'),
          description: 'Purchased printer toner for office printer',
          category: 'Office Supplies',
          amount: 32.50,
          currency: 'GBP',
          status: 'pending',
          notes: 'Emergency purchase'
        },
        {
          user_id: users[1]._id,
          user_name: users[1].name,
          claim_id: "KSJKFLDF",
          employee_id: users[1].employee_id,
          date: new Date('2023-11-20'),
          description: 'Team lunch for project completion',
          category: 'Meal',
          amount: 120.00,
          currency: 'GBP',
          status: 'new',
          notes: 'Celebration lunch'
        }
      ];
      
      for (const claimData of sampleClaims) {
        const existingClaim = await Claim.findOne({ 
          description: claimData.description,
          amount: claimData.amount 
        });
        
        if (!existingClaim) {
          const claim = new Claim(claimData);
          await claim.save();
          console.log(`✅ Sample claim created: ${claimData.description}`);
        }
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total Users: ${await User.countDocuments()}`);
    console.log(`   Total Claims: ${await Claim.countDocuments()}`);
    
    mongoose.disconnect();
    console.log('\n👋 Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;