const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/student/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).send('User not found');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/student/${uid}`;
    const name = user.name || user.uid;
    const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random';
    const avatar = user.avatarUrl || defaultAvatar;
    const description = user.resumeDetails?.about 
      ? user.resumeDetails.about.substring(0, 150) + '...'
      : `Check out ${name}'s portfolio on Campus Connect.`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name}'s Portfolio | Campus Connect</title>
        
        <!-- Open Graph / Facebook / LinkedIn -->
        <meta property="og:type" content="profile">
        <meta property="og:url" content="${redirectUrl}">
        <meta property="og:title" content="${name}'s Portfolio">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${avatar}">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${redirectUrl}">
        <meta property="twitter:title" content="${name}'s Portfolio">
        <meta property="twitter:description" content="${description}">
        <meta property="twitter:image" content="${avatar}">

        <!-- Client-side Redirect -->
        <meta http-equiv="refresh" content="0; url=${redirectUrl}">
        <script>
          window.location.href = "${redirectUrl}";
        </script>
      </head>
      <body>
        <p>Redirecting to <a href="${redirectUrl}">${name}'s Portfolio</a>...</p>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Share Route Error:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
