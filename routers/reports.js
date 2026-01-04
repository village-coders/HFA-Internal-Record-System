const express = require('express');
const router = express.Router();
const moment = require('moment');
const Claim = require('../models/claim');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
const auth = require('../middlewares/auth');

// @route   GET /api/reports/summary
// @desc    Get system summary report
// @access  Private (Admin only)
router.get('/summary', auth.verifyToken, auth.checkRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Get user stats
    const totalUsers = await User.countDocuments({ status: 'active' });
    const usersByRole = await User.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // Get claim stats
    const totalClaims = await Claim.countDocuments();
    const monthlyClaims = await Claim.countDocuments({ created_at: { $gte: startOfMonth } });
    const yearlyClaims = await Claim.countDocuments({ created_at: { $gte: startOfYear } });
    
    // Get financial stats
    const financialStats = await Claim.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          monthlyAmount: {
            $sum: {
              $cond: [{ $gte: ['$created_at', startOfMonth] }, '$amount', 0]
            }
          },
          yearlyAmount: {
            $sum: {
              $cond: [{ $gte: ['$created_at', startOfYear] }, '$amount', 0]
            }
          }
        }
      }
    ]);
    
    // Get claims by status
    const claimsByStatus = await Claim.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent activity
    const recentActivity = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action user_name user_role entity_type entity_id details timestamp');
    
    // Get claims by department
    const claimsByDepartment = await Claim.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } }
    ]);
    
    // Get monthly trend for current year
    const monthlyTrend = await Claim.aggregate([
      {
        $match: {
          created_at: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$created_at' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);
    
    // Format monthly trend
    const monthlyTrendFormatted = Array(12).fill(0).map((_, index) => {
      const monthData = monthlyTrend.find(m => m._id.month === index + 1);
      return {
        month: moment().month(index).format('MMM'),
        count: monthData?.count || 0,
        amount: monthData?.amount || 0
      };
    });
    
    const summary = {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      claims: {
        total: totalClaims,
        monthly: monthlyClaims,
        yearly: yearlyClaims
      },
      financial: financialStats[0] || {
        totalAmount: 0,
        monthlyAmount: 0,
        yearlyAmount: 0
      },
      claimsByStatus,
      claimsByDepartment,
      monthlyTrend: monthlyTrendFormatted,
      recentActivity
    };
    
    // Log activity
    await auth.logActivity(req, 'view', 'system', 'reports', 'Viewed system summary report');
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/monthly
// @desc    Get monthly report
// @access  Private (Admin only)
router.get('/monthly', auth.verifyToken, auth.checkRole('admin'), async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Get claims for the month
    const claims = await Claim.find({
      created_at: { $gte: startDate, $lte: endDate }
    }).populate('user_id', 'name department employee_id');
    
    // Get summary stats
    const summary = await Claim.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $in: ['$status', ['new', 'pending', 'recommendation']] }, '$amount', 0]
            }
          }
        }
      }
    ]);
    
    // Get claims by user
    const claimsByUser = await Claim.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user_id',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 }
    ]);
    
    // Populate user names
    const userIds = claimsByUser.map(item => item._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name department employee_id');
    
    const claimsByUserWithNames = claimsByUser.map(item => {
      const user = users.find(u => u._id.toString() === item._id.toString());
      return {
        user: user || { name: 'Unknown User' },
        count: item.count,
        amount: item.amount
      };
    });
    
    // Get daily trend
    const dailyTrend = await Claim.aggregate([
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$created_at' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.day': 1 } }
    ]);
    
    // Format daily trend
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const dailyTrendFormatted = Array(daysInMonth).fill(0).map((_, index) => {
      const day = index + 1;
      const dayData = dailyTrend.find(d => d._id.day === day);
      return {
        day,
        count: dayData?.count || 0,
        amount: dayData?.amount || 0
      };
    });
    
    const report = {
      period: {
        year: targetYear,
        month: targetMonth,
        monthName: moment().month(targetMonth - 1).format('MMMM'),
        startDate,
        endDate
      },
      summary: summary[0] || {
        totalClaims: 0,
        totalAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        pendingAmount: 0
      },
      claims: claims,
      claimsByUser: claimsByUserWithNames,
      dailyTrend: dailyTrendFormatted
    };
    
    // Log activity
    await auth.logActivity(req, 'view', 'system', 'reports', 
      `Viewed monthly report for ${targetYear}-${targetMonth}`);
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/export
// @desc    Export claims data (CSV/Excel)
// @access  Private (Admin only)
router.get('/export', auth.verifyToken, auth.checkRole('admin'), async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) query.created_at.$gte = new Date(startDate);
      if (endDate) query.created_at.$lte = new Date(endDate);
    }
    
    // Get claims with user details
    const claims = await Claim.find(query)
      .populate('user_id', 'name department employee_id')
      .populate('approved_by', 'name employee_id')
      .populate('rejected_by', 'name employee_id')
      .populate('paid_by', 'name employee_id')
      .sort({ date: -1 });
    
    // Prepare data based on format
    if (format === 'json') {
      res.json({
        success: true,
        data: claims
      });
      return;
    }
    
    // CSV format
    const csvHeaders = [
      'Claim ID', 'Date', 'Employee ID', 'Employee Name', 'Department',
      'Description', 'Category', 'Amount', 'Currency', 'Status',
      'Approved By', 'Approved At', 'Paid By', 'Paid At',
      'Payment Reference', 'Notes'
    ];
    
    const csvRows = claims.map(claim => {
      const user = claim.user_id || {};
      return [
        claim.claim_id,
        moment(claim.date).format('DD/MM/YYYY'),
        user.employee_id || '',
        user.name || '',
        user.department || '',
        claim.description,
        claim.category,
        claim.amount,
        claim.currency,
        claim.status,
        claim.approved_by?.name || '',
        claim.approved_at ? moment(claim.approved_at).format('DD/MM/YYYY HH:mm') : '',
        claim.paid_by?.name || '',
        claim.paid_at ? moment(claim.paid_at).format('DD/MM/YYYY HH:mm') : '',
        claim.payment_reference || '',
        claim.notes || ''
      ];
    });
    
    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Set headers for file download
    const filename = `claims_export_${moment().format('YYYY-MM-DD_HH-mm')}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
    
    // Log activity
    await auth.logActivity(req, 'export', 'system', 'reports', 
      `Exported claims data in ${format} format`);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;