const { PDFDocument } = require('pdf-lib');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Standard attendee division extractor helper
 */
const extractDivision = (student) => {
  if (student?.division && String(student.division).trim()) {
    return String(student.division).trim().toUpperCase();
  }
  const uid = student?.uid || (typeof student === 'string' ? student : '');
  if (!uid) return '';
  const matchHyphen = uid.match(/^\d{2}-[A-Za-z]+([A-Za-z])\d+-\d{2}$/i);
  if (matchHyphen) return matchHyphen[1].toUpperCase();
  const matchAlpha = uid.match(/^[0-9]+[A-Z]+([A-Z0-9])/i);
  if (matchAlpha) return matchAlpha[1].toUpperCase();
  return '';
};

/**
 * Deterministic attendee sorting matching the exported Excel roster
 * Primary: Division, Secondary: UID
 */
const sortAttendees = (attendees) => {
  return [...attendees].sort((a, b) => {
    const divA = a.studentId?.division || extractDivision(a.studentId);
    const divB = b.studentId?.division || extractDivision(b.studentId);
    if (divA && divB && divA !== divB) {
      return divA.localeCompare(divB, undefined, { numeric: true });
    }
    const uidA = a.studentId?.uid || '';
    const uidB = b.studentId?.uid || '';
    return uidA.localeCompare(uidB);
  });
};

/**
 * Pure 1:1 Sequential Slicing and Mapping:
 * Page 1 in PDF maps directly to Row 1 (Attendee 1) in the exported order sheet.
 * Page 2 maps to Row 2 (Attendee 2), etc.
 * Eliminates all OCR, font rendering, vector flattening, or Canva Pro dependencies.
 * 
 * @param {Buffer} pdfBuffer - Multi-page PDF buffer
 * @param {Array} attendees - Array of event registration records with populated studentId
 * @returns {Promise<Object>} Sliced pages with matched attendee and metadata
 */
const splitAndMatchCertificates = async (pdfBuffer, attendees) => {
  const sortedAttendees = sortAttendees(attendees);
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages !== sortedAttendees.length) {
    throw new Error(
      `PDF page count mismatch: The uploaded PDF has ${totalPages} page(s), but there are ${sortedAttendees.length} recipients in the roster. Exactly 1 page per recipient is required (Page 1 = Row 1 in Excel, Page 2 = Row 2, etc.). Ensure there are no extra blank pages, cover sheets, or skipped attendees.`
    );
  }

  const pages = [];

  // Slice each page into a standalone 1-page PDF buffer and map sequentially
  for (let i = 0; i < sortedAttendees.length; i++) {
    const singleDoc = await PDFDocument.create();
    const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(copiedPage);
    const pdfBytes = await singleDoc.save();
    const pageBuffer = Buffer.from(pdfBytes);

    pages.push({
      pageIndex: i,
      pageNumber: i + 1,
      buffer: pageBuffer,
      matchedStudent: sortedAttendees[i],
      matchType: 'sequential_roster_order'
    });
  }

  return {
    totalPages,
    totalAttendees: sortedAttendees.length,
    matchedCount: pages.length,
    unassignedAttendeesCount: 0,
    pages
  };
};

/**
 * Uploads a single certificate PDF buffer to Cloudinary.
 * @param {Buffer} buffer - 1-page PDF buffer
 * @param {string} publicId - unique publicId in Cloudinary
 * @returns {Promise<string>} Secure URL of uploaded PDF
 */
const uploadCertificateToCloudinary = async (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'event_certificates',
        resource_type: 'auto',
        public_id: publicId,
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Uploads an array of certificate buffers in parallel chunks to avoid timeouts.
 * @param {Array<{ buffer: Buffer, publicId: string }>} items 
 * @param {number} concurrency - Default 5 concurrent uploads
 * @returns {Promise<Array<string>>} Array of uploaded secure URLs
 */
const uploadCertificatesInBatches = async (items, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => uploadCertificateToCloudinary(item.buffer, item.publicId))
    );
    results.push(...batchResults);
  }
  return results;
};

module.exports = {
  extractDivision,
  sortAttendees,
  splitAndMatchCertificates,
  uploadCertificateToCloudinary,
  uploadCertificatesInBatches
};
