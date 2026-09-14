const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');
const { authMiddleware, clubMiddleware } = require('../middleware/authMiddleware');
const { 
  AICTE_CATEGORIES, 
  calculateAictePoints, 
  resolveMemberTier, 
  calculateSemesterForDate 
} = require('../utils/aicteCalculator');

// @route   GET /api/aicte/categories
// @desc    Get the 15 official AICTE Activity Categories
// @access  Public / Authenticated
router.get('/categories', authMiddleware, (req, res) => {
  res.json(AICTE_CATEGORIES);
});

// @route   GET /api/aicte/ledger
// @desc    Get the comprehensive AICTE Activity ledger for logged-in student
// @access  Student
router.get('/ledger', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'AICTE Activity Ledger is only accessible to students' });
    }

    const student = await User.findById(req.user.id).select('name uid email branch currentSem admissionYear graduationYear');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // 1. Find all clubs where this student is assigned as a Core member
    const coreClubs = await Club.find({
      'assignedStudents': {
        $elemMatch: {
          studentId: req.user.id,
          tier: 'Core'
        }
      }
    }).select('_id name assignedStudents');

    // Also check clubs where resolved tier is 'Core' even if tier field wasn't explicitly set
    const allAssignedClubs = await Club.find({
      'assignedStudents.studentId': req.user.id
    }).select('_id name assignedStudents');

    const coreClubIds = new Set();
    allAssignedClubs.forEach(club => {
      const assignment = club.assignedStudents.find(
        m => m.studentId && m.studentId.toString() === req.user.id
      );
      if (assignment) {
        const tier = resolveMemberTier(club.name, assignment.role, assignment.tier);
        if (tier === 'Core') {
          coreClubIds.add(club._id.toString());
        }
      }
    });

    // 2. Fetch all events:
    //    a) Events where student is registered and marked present
    //    b) All events from clubs where this student is a Core member (auto-present by default)
    const [attendedEvents, coreClubEvents] = await Promise.all([
      Event.find({
        'registeredStudents': {
          $elemMatch: {
            studentId: req.user.id,
            attendanceStatus: 'present'
          }
        }
      }).populate('clubId', 'name profilePhoto category'),
      
      coreClubIds.size > 0 
        ? Event.find({
            clubId: { $in: Array.from(coreClubIds) }
          }).populate('clubId', 'name profilePhoto category')
        : Promise.resolve([])
    ]);

    // Combine and deduplicate events by event ID
    const eventMap = new Map();
    [...attendedEvents, ...coreClubEvents].forEach(evt => {
      if (evt && evt._id) {
        eventMap.set(evt._id.toString(), evt);
      }
    });

    const allEvents = Array.from(eventMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Process each event into student's AICTE ledger
    let totalPoints = 0;
    let totalHours = 0;
    const categorySet = new Set();
    const ledger = [];
    const semesterMap = {};

    for (let i = 1; i <= 8; i++) {
      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i - 1];
      const yr = i <= 2 ? 'FE' : i <= 4 ? 'SE' : i <= 6 ? 'TE' : 'BE';
      semesterMap[i] = {
        sem: i,
        label: `${yr} Sem ${roman}`,
        year: yr,
        events: [],
        semPoints: 0,
        semHours: 0
      };
    }

    allEvents.forEach(evt => {
      // Determine student's role and tier in this event
      let tier = 'Member';
      let designation = 'Attendee';

      const isCoreForThisClub = coreClubIds.has(evt.clubId?._id?.toString() || '');
      const registeredEntry = evt.registeredStudents?.find(
        r => r.studentId && r.studentId.toString() === req.user.id
      );

      if (isCoreForThisClub) {
        tier = 'Core';
        // Get the custom role title from the club roster
        const club = allAssignedClubs.find(c => c._id.toString() === evt.clubId?._id?.toString());
        const assignment = club?.assignedStudents?.find(m => m.studentId?.toString() === req.user.id);
        designation = assignment?.role || registeredEntry?.designation || 'Core Member';
      } else if (registeredEntry) {
        tier = registeredEntry.tier || 'Member';
        designation = registeredEntry.designation || 'Member';
      }

      const durationHours = evt.durationHours || 2;
      const pointCalc = calculateAictePoints(durationHours, tier);
      const semInfo = calculateSemesterForDate(student.admissionYear, evt.date);

      const categoryObj = AICTE_CATEGORIES.find(c => c.id === evt.aicteCategory) || {
        id: evt.aicteCategory || 5,
        title: 'Promotion of Appropriate Technologies',
        shortTitle: 'Technology Promotion'
      };

      totalPoints += pointCalc.points;
      totalHours += pointCalc.recordedHours;
      if (evt.aicteCategory) categorySet.add(evt.aicteCategory);

      const ledgerItem = {
        eventId: evt._id,
        title: evt.title,
        clubName: evt.clubId?.name || 'Campus Club',
        clubPhoto: evt.clubId?.profilePhoto || '',
        date: evt.date,
        time: evt.time,
        venue: evt.venue,
        durationHours: durationHours,
        recordedHours: pointCalc.recordedHours,
        basePoints: pointCalc.basePoints,
        multiplier: pointCalc.multiplier,
        pointsAwarded: pointCalc.points,
        tier: tier,
        designation: designation,
        aicteCategory: categoryObj.id,
        categoryTitle: categoryObj.title,
        categoryShortTitle: categoryObj.shortTitle,
        activitySummary: evt.activitySummary || evt.description || '',
        semester: semInfo.sem,
        semesterLabel: semInfo.label,
        semesterYear: semInfo.year,
        isAutoCore: tier === 'Core',
        verified: true
      };

      ledger.push(ledgerItem);

      if (semesterMap[semInfo.sem]) {
        semesterMap[semInfo.sem].events.push(ledgerItem);
        semesterMap[semInfo.sem].semPoints += pointCalc.points;
        semesterMap[semInfo.sem].semHours += pointCalc.recordedHours;
      }
    });

    const isLateralEntry = student.admissionYear && student.graduationYear && 
      (parseInt(student.graduationYear) - parseInt(student.admissionYear) === 3);
    const graduationTarget = isLateralEntry ? 75 : 100;
    const distinctCategoriesCount = categorySet.size;
    const categoryRequirementSatisfied = distinctCategoriesCount >= 4;

    res.json({
      student: {
        id: student._id,
        name: student.name,
        uid: student.uid,
        email: student.email,
        branch: student.branch,
        currentSem: student.currentSem,
        admissionYear: student.admissionYear,
        graduationYear: student.graduationYear,
        isLateralEntry
      },
      summary: {
        totalPoints,
        graduationTarget,
        percentageCompleted: Math.min(100, Math.round((totalPoints / graduationTarget) * 100)),
        totalHours,
        distinctCategoriesCount,
        categoryRequirementSatisfied,
        totalEventsAttended: ledger.length
      },
      semesters: Object.values(semesterMap),
      ledger,
      categories: AICTE_CATEGORIES
    });

  } catch (err) {
    console.error('Error fetching AICTE ledger:', err);
    res.status(500).json({ message: 'Server error retrieving AICTE ledger' });
  }
});

const extractDivision = (uid) => {
  if (!uid) return '';
  const matchHyphen = uid.match(/^\d{2}-[A-Za-z]+([A-Za-z])\d+-\d{2}$/i);
  if (matchHyphen) return matchHyphen[1].toUpperCase();
  const matchAlpha = uid.match(/^[0-9]+[A-Z]+([A-Z0-9])/i);
  if (matchAlpha) return matchAlpha[1].toUpperCase();
  return '';
};

// @route   GET /api/aicte/club-matrix/:clubId
// @desc    Generate cross-tabulated year-end report matrix like CSI_AICTE_Points_24-25 Final.xlsx
// @access  Club / Admin
router.get('/club-matrix/:clubId', authMiddleware, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const club = await Club.findById(clubId)
      .populate('assignedStudents.studentId', 'name uid email branch division rollNo currentSem admissionYear graduationYear');

    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Ensure authorized club or admin
    if (req.user.role === 'club' && req.user.id !== club._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this club matrix' });
    }

    const events = await Event.find({ clubId: club._id })
      .sort({ date: 1 })
      .populate('registeredStudents.studentId', 'name uid branch division rollNo currentSem');

    // Build unique list of all participating students (assigned members + attendees)
    const studentMap = new Map();

    // Add all assigned club members
    club.assignedStudents.forEach(m => {
      if (m.studentId) {
        const tier = resolveMemberTier(club.name, m.role, m.tier);
        studentMap.set(m.studentId._id.toString(), {
          studentId: m.studentId._id.toString(),
          name: m.studentId.name,
          uid: m.studentId.uid,
          branch: m.studentId.branch,
          division: m.studentId.division || extractDivision(m.studentId.uid) || '',
          rollNo: m.studentId.rollNo || '',
          currentSem: m.studentId.currentSem,
          admissionYear: m.studentId.admissionYear,
          role: m.role || 'Member',
          tier: tier, // 'Core', 'WC', 'Member'
          events: {},
          totalHours: 0,
          totalPoints: 0
        });
      }
    });

    // Add any non-member students who registered and attended
    events.forEach(evt => {
      evt.registeredStudents.forEach(reg => {
        if (reg.studentId && reg.attendanceStatus === 'present') {
          const sId = reg.studentId._id.toString();
          if (!studentMap.has(sId)) {
            studentMap.set(sId, {
              studentId: sId,
              name: reg.studentId.name,
              uid: reg.studentId.uid,
              branch: reg.studentId.branch,
              division: reg.studentId.division || extractDivision(reg.studentId.uid) || '',
              rollNo: reg.studentId.rollNo || '',
              currentSem: reg.studentId.currentSem,
              admissionYear: reg.studentId.admissionYear,
              role: 'Attendee',
              tier: 'Member',
              events: {},
              totalHours: 0,
              totalPoints: 0
            });
          }
        }
      });
    });

    // Cross-tabulate event hours for each student
    const studentRows = Array.from(studentMap.values());

    studentRows.forEach(student => {
      const isCore = student.tier === 'Core';

      events.forEach(evt => {
        const evtId = evt._id.toString();
        const durationHours = evt.durationHours || 2;
        const reg = evt.registeredStudents.find(r => r.studentId?._id?.toString() === student.studentId);

        // Core members are automatically present for ALL events of their club!
        const isPresent = isCore || (reg && reg.attendanceStatus === 'present');

        if (isPresent) {
          const pointCalc = calculateAictePoints(durationHours, student.tier);
          student.events[evtId] = {
            attended: true,
            hours: pointCalc.recordedHours,
            points: pointCalc.points
          };
          student.totalHours += pointCalc.recordedHours;
          student.totalPoints += pointCalc.points;
        } else {
          student.events[evtId] = {
            attended: false,
            hours: null,
            points: null
          };
        }
      });
    });

    // Sort rows: Core first, then WC, then Members
    studentRows.sort((a, b) => {
      const tierRank = { 'Core': 1, 'WC': 2, 'Member': 3 };
      const rankA = tierRank[a.tier] || 4;
      const rankB = tierRank[b.tier] || 4;
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json({
      club: {
        id: club._id,
        name: club.name,
        category: club.category
      },
      events: events.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        durationHours: e.durationHours || 2,
        aicteCategory: e.aicteCategory || 5
      })),
      matrix: studentRows
    });

  } catch (err) {
    console.error('Error generating club matrix:', err);
    res.status(500).json({ message: 'Server error generating club matrix' });
  }
});

// @route   POST /api/aicte/sync-club-events
// @desc    Sync Core members as present across all events for the club
// @access  Club / Admin
router.post('/sync-club-events', authMiddleware, async (req, res) => {
  try {
    const clubId = req.user.role === 'admin' ? req.body.clubId : req.user.id;
    if (!clubId) return res.status(400).json({ message: 'Club ID required' });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Find all Core members
    const coreMembers = club.assignedStudents.filter(m => {
      const tier = resolveMemberTier(club.name, m.role, m.tier);
      return tier === 'Core';
    });

    const events = await Event.find({ clubId: club._id });
    let updatedCount = 0;

    for (const evt of events) {
      let modified = false;
      const durationHours = evt.durationHours || 2;
      const pointCalc = calculateAictePoints(durationHours, 'Core');

      for (const core of coreMembers) {
        const existingIdx = evt.registeredStudents.findIndex(
          r => r.studentId && r.studentId.toString() === core.studentId.toString()
        );

        if (existingIdx === -1) {
          evt.registeredStudents.push({
            studentId: core.studentId,
            attendanceStatus: 'present',
            designation: core.role || 'Core Member',
            tier: 'Core',
            aicteHours: pointCalc.recordedHours,
            aictePoints: pointCalc.points,
            qrCode: `AUTO_CORE_${evt._id}_${core.studentId}`
          });
          modified = true;
        } else if (evt.registeredStudents[existingIdx].attendanceStatus !== 'present') {
          evt.registeredStudents[existingIdx].attendanceStatus = 'present';
          evt.registeredStudents[existingIdx].tier = 'Core';
          evt.registeredStudents[existingIdx].designation = core.role || 'Core Member';
          evt.registeredStudents[existingIdx].aicteHours = pointCalc.recordedHours;
          evt.registeredStudents[existingIdx].aictePoints = pointCalc.points;
          modified = true;
        }
      }

      if (modified) {
        await evt.save();
        updatedCount++;
      }
    }

    res.json({ message: `Successfully synchronized ${updatedCount} events for Core committee members.` });
  } catch (err) {
    console.error('Error syncing club events:', err);
    res.status(500).json({ message: 'Server error syncing club events' });
  }
});

module.exports = router;
