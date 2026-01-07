const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claim_id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  employee_id: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  claim_type: {
    type: String,
    required: true,
    enum: ['Audit', 'Supervision', 'Audit / Supervision', 'Payment Request Form', 'Meeting', 'Misscellaneous', 'Approved Supplier IT (Yearly)', 'Approved Supplier Admin (Yearly)', 'Approved Supplier IT (Monthly)', 'Approved Supplier Admin (Monthly)', 'Approved Supplier Training (Yearly)', 'Approved Supplier Training (Monthly)', 'Approved Supplier Advertisement (Yearly)', 'Approved Supplier Admin (Monthly)']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'GBP'
  },
  receipt_url: {
    type: String,
    trim: true
  },
  receipt_filename: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'approved', 'rejected', 'paid', 'under_review'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: {
    type: Date
  },
  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejected_at: {
    type: Date
  },
  rejection_reason: {
    type: String
  },
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paid_at: {
    type: Date
  },
  payment_reference: {
    type: String
  },
  contact_person: {
    type: String
  },
  contact_email: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Generate claim ID before saving
// claimSchema.pre('save', async function(next) {
//   if (this.isNew && !this.claim_id) {
//     const lastClaim = await this.constructor.findOne().sort('-claim_id');
//     if (!lastClaim) {
//       this.claim_id = 'HFA-C-3001';
//     } else {
//       const lastId = lastClaim.claim_id;
//       const match = lastId.match(/HFA-C-(\d+)/);
//       if (match) {
//         const nextNum = parseInt(match[1]) + 1;
//         this.claim_id = `HFA-C-${nextNum}`;
//       } else {
//         this.claim_id = `HFA-C-${3000 + (await this.constructor.countDocuments()) + 1}`;
//       }
//     }
//   }
//   next();
// });

// Indexes for better query performance
claimSchema.index({ user_id: 1, status: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ date: -1 });
// claimSchema.index({ claim_id: 1 }, { unique: true });

module.exports = mongoose.model('Claim', claimSchema);