// index.js
export default {
  async fetch(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST requests allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const data = await request.json();
      
      // Validate required fields
      const requiredFields = ['rank_text', 'rank', 'avatar', 'user_name', 'max_xp', 'xp'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Validate numeric fields
      if (isNaN(data.rank) || isNaN(data.max_xp) || isNaN(data.xp)) {
        return new Response(JSON.stringify({ error: 'Rank, max_xp, and xp must be numbers' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate XP values
      if (Number(data.xp) > Number(data.max_xp)) {
        return new Response(JSON.stringify({ error: 'xp cannot be greater than max_xp' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Set defaults
      const avatarBorder = data.avatar_border || '#FFFFFF';
      const barPlaceholder = data.bar_placeholder || '#808080';
      const barColor = data.bar || '#FFFFFF';

      // Calculate percentage
      const percentage = ((data.xp / data.max_xp) * 100).toFixed(2);

      // Generate HTML that browsers will render as an image
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 900px;
      height: 300px;
      background: linear-gradient(to bottom, #1a1a2e, #16213e);
      display: flex;
      align-items: center;
      font-family: 'Roboto', sans-serif;
      color: white;
    }
    .avatar-container {
      margin-left: 50px;
      position: relative;
    }
    .avatar {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 5px solid ${avatarBorder};
      object-fit: cover;
    }
    .user-info {
      margin-left: 40px;
      width: 600px;
    }
    .username {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .rank {
      font-size: 28px;
      margin-bottom: 30px;
      opacity: 0.8;
    }
    .xp-container {
      margin-bottom: 20px;
    }
    .xp-text {
      font-size: 24px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .progress-bar {
      height: 20px;
      width: 100%;
      background-color: ${barPlaceholder};
      border-radius: 10px;
      overflow: hidden;
      opacity: 0.5;
    }
    .progress {
      height: 100%;
      width: ${percentage}%;
      background-color: ${barColor};
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="avatar-container">
    <img class="avatar" src="${data.avatar}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
  </div>
  <div class="user-info">
    <div class="username">${data.user_name}</div>
    <div class="rank">${data.rank_text} #${data.rank}</div>
    <div class="xp-container">
      <div class="xp-text">
        <span>${data.xp}/${data.max_xp} XP</span>
        <span>${percentage}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
    </div>
  </div>
</body>
</html>`;

      // Return the HTML directly - modern browsers will render it as an image
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=86400'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Request processing failed',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
