const mongoose = require('mongoose');

const LinkedInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  id: { type: String, default: '' },
  publicIdentifier: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  emails: [{ type: String }],
  headline: { type: String, default: '' },
  openToWork: { type: Boolean, default: false },
  hiring: { type: Boolean, default: false },
  premium: { type: Boolean, default: false },
  influencer: { type: Boolean, default: false },
  memorialized: { type: Boolean, default: false },
  creator: { type: Boolean, default: false },
  location: {
    linkedinText: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    parsed: {
      text: { type: String, default: '' },
      countryCode: { type: String, default: '' },
      regionCode: { type: String, default: null },
      country: { type: String, default: '' },
      countryFull: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' }
    }
  },
  objectUrn: { type: String, default: '' },
  registeredAt: { type: String, default: '' },
  topSkills: [{ type: String }],
  connectionsCount: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  about: { type: String, default: '' },
  currentPosition: [{ type: mongoose.Schema.Types.Mixed }],
  profileTopEducation: [{ type: mongoose.Schema.Types.Mixed }],
  profilePicture: {
    url: { type: String, default: '' },
    sizes: [{
      url: { type: String },
      width: { type: Number },
      height: { type: Number }
    }]
  },
  coverPicture: { type: String, default: null },
  photo: { type: String, default: '' },
  profileLocales: [{
    country: { type: String },
    language: { type: String }
  }],
  primaryLocale: {
    country: { type: String },
    language: { type: String }
  },
  multiLocaleHeadline: [{
    headline: { type: String },
    locale: { type: String }
  }],
  services: { type: mongoose.Schema.Types.Mixed, default: null },
  experience: [{
    position: { type: String, default: '' },
    location: { type: String, default: '' },
    employmentType: { type: String, default: '' },
    workplaceType: { type: String, default: '' },
    companyName: { type: String, default: '' },
    companyLinkedinUrl: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' },
    skills: { type: mongoose.Schema.Types.Mixed, default: null },
    startDate: {
      month: { type: String },
      year: { type: Number },
      text: { type: String }
    },
    endDate: {
      month: { type: String },
      year: { type: Number },
      text: { type: String }
    }
  }],
  education: [{
    schoolName: { type: String, default: '' },
    schoolLinkedinUrl: { type: String, default: '' },
    schoolId: { type: String, default: '' },
    degree: { type: String, default: '' },
    fieldOfStudy: { type: String, default: '' },
    period: { type: String, default: '' },
    startDate: {
      month: { type: String },
      year: { type: Number },
      text: { type: String }
    },
    endDate: {
      month: { type: String },
      year: { type: Number },
      text: { type: String }
    },
    schoolLogo: {
      url: { type: String },
      sizes: [{
        url: { type: String },
        width: { type: Number },
        height: { type: Number }
      }]
    }
  }],
  certifications: [{
    title: { type: String, default: '' },
    issuedBy: { type: String, default: '' },
    issuedAt: { type: String, default: '' },
    link: { type: String, default: '' },
    issuedByLink: { type: String, default: '' },
    issuedByLogo: {
      url: { type: String },
      sizes: [{
        url: { type: String },
        width: { type: Number },
        height: { type: Number }
      }]
    }
  }],
  projects: [{
    title: { type: String, default: '' },
    duration: { type: String, default: null },
    startDate: { type: mongoose.Schema.Types.Mixed, default: null },
    endDate: { type: mongoose.Schema.Types.Mixed, default: null },
    description: { type: String, default: '' }
  }],
  volunteering: [{ type: mongoose.Schema.Types.Mixed }],
  receivedRecommendations: [{ type: mongoose.Schema.Types.Mixed }],
  skills: [{
    name: { type: String }
  }],
  publications: [{ type: mongoose.Schema.Types.Mixed }],
  courses: [{ type: mongoose.Schema.Types.Mixed }],
  patents: [{ type: mongoose.Schema.Types.Mixed }],
  honorsAndAwards: [{ type: mongoose.Schema.Types.Mixed }],
  languages: [{ type: mongoose.Schema.Types.Mixed }],
  organizations: [{ type: mongoose.Schema.Types.Mixed }],
  causes: [{ type: mongoose.Schema.Types.Mixed }],
  featured: { type: mongoose.Schema.Types.Mixed, default: null },
  composeOptionType: { type: String, default: '' },
  moreProfiles: [{
    id: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    position: { type: String },
    publicIdentifier: { type: String },
    linkedinUrl: { type: String }
  }],
  interests: [{
    interestName: { type: String },
    elements: [{
      title: { type: String },
      subtitle: { type: String, default: null },
      link: { type: String },
      caption: { type: String },
      image: {
        url: { type: String }
      }
    }]
  }],
  originalQuery: {
    url: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('LinkedIn', LinkedInSchema);
