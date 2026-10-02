const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Club = require('../models/Club');
const PlacementPost = require('../models/PlacementPost');

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

router.get('/club/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const club = await Club.findById(id);

    if (!club) {
      return res.status(404).send('Club not found');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/clubs/${id}`;
    const name = club.name;
    const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random';
    const avatar = club.profilePhoto || defaultAvatar;
    const description = club.description 
      ? club.description.substring(0, 150) + '...'
      : `Check out ${name} on Campus Connect.`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name} | Campus Connect</title>
        
        <!-- Open Graph / Facebook / LinkedIn -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${redirectUrl}">
        <meta property="og:title" content="${name}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${avatar}">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${redirectUrl}">
        <meta property="twitter:title" content="${name}">
        <meta property="twitter:description" content="${description}">
        <meta property="twitter:image" content="${avatar}">

        <!-- Client-side Redirect -->
        <meta http-equiv="refresh" content="0; url=${redirectUrl}">
        <script>
          window.location.href = "${redirectUrl}";
        </script>
      </head>
      <body>
        <p>Redirecting to <a href="${redirectUrl}">${name}</a>...</p>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Share Route Error (Club):', error);
    res.status(500).send('Server Error');
  }
});

router.get('/placement/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await PlacementPost.findById(id).populate('author', 'name avatarUrl');

    if (!post) {
      return res.status(404).send('Post not found');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/placements/${id}`;
    const title = post.title || \`\${post.company?.name || 'Company'} - \${post.role || 'Role'}\`;
    
    // Attempt to use the company logo, otherwise fallback to author avatar, otherwise default
    const companyName = post.company?.name || 'Company';
    const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(companyName) + '&background=random';
    const avatar = post.company?.logoUrl || post.author?.avatarUrl || defaultAvatar;
    
    const authorName = post.author?.name || 'a student';
    const description = post.content 
      ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
      : \`Placement experience shared by \${authorName} at \${companyName}.\`;

    const html = \`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>\${title} | Campus Connect</title>
        
        <!-- Open Graph / Facebook / LinkedIn -->
        <meta property="og:type" content="article">
        <meta property="og:url" content="\${redirectUrl}">
        <meta property="og:title" content="\${title}">
        <meta property="og:description" content="\${description}">
        <meta property="og:image" content="\${avatar}">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="\${redirectUrl}">
        <meta property="twitter:title" content="\${title}">
        <meta property="twitter:description" content="\${description}">
        <meta property="twitter:image" content="\${avatar}">

        <!-- Client-side Redirect -->
        <meta http-equiv="refresh" content="0; url=\${redirectUrl}">
        <script>
          window.location.href = "\${redirectUrl}";
        </script>
      </head>
      <body>
        <p>Redirecting to <a href="\${redirectUrl}">\${title}</a>...</p>
      </body>
      </html>
    \`;

    res.send(html);
  } catch (error) {
    console.error('Share Route Error (Placement):', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
