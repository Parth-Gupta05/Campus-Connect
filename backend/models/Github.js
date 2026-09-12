const mongoose = require('mongoose');

const GithubSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    login: { type: String, default: '' },
    name: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    html_url: { type: String, default: '' },
    bio: { type: String, default: null },
    company: { type: String, default: null },
    location: { type: String, default: null },
    public_repos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    profile_readme: { type: String, default: null }
  },
  repositories: [{
    name: { type: String, default: '' },
    description: { type: String, default: null },
    html_url: { type: String, default: '' },
    language: { type: String, default: null },
    stargazers_count: { type: Number, default: 0 },
    forks_count: { type: Number, default: 0 },
    default_branch: { type: String, default: 'main' },
    readme: { type: String, default: null }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Github', GithubSchema);
