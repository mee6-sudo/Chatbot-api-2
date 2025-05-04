export default {
  async fetch(request) {
    // Block non-POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST requests allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Parse input with validation
      const data = await request.json();
      const required = ['rank_text', 'rank', 'avatar', 'user_name', 'max_xp', 'xp'];
      for (const field of required) {
        if (!data[field]) throw new Error(`Missing ${field}`);
      }

      // Calculate percentage
      const percentage = ((data.xp / data.max_xp) * 100).toFixed(2);
      
      // Mobile-optimized HTML template
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      width: 900px;
      height: 300px;
      background: linear-gradient(#1a1a2e, #16213e);
      display: flex;
      align-items: center;
      font-family: Arial, sans-serif;
      color: white;
    }
    .avatar {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 5px solid ${data.avatar_border || "#FFFFFF"};
      margin-left: 50px;
      object-fit: cover;
    }
    .user-info {
      margin-left: 40px;
    }
    .username {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .progress-container {
      margin-top: 20px;
    }
    .progress-bar {
      height: 20px;
      width: 100%;
      background-color: ${data.bar_placeholder || "#80808080"};
      border-radius: 10px;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      width: ${percentage}%;
      background-color: ${data.bar || "#FFFFFF"};
    }
  </style>
</head>
<body>
  <img class="avatar" src="${data.avatar}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
  <div class="user-info">
    <div class="username">${data.user_name}</div>
    <div style="font-size: 28px; opacity: 0.8">${data.rank_text} #${data.rank}</div>
    <div class="progress-container">
      <div style="font-size: 24px; margin-bottom: 8px">
        ${data.xp}/${data.max_xp} XP • ${percentage}%
      </div>
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
    </div>
  </div>
</body>
</html>`;

      // Convert to image using Cloudflare's built-in HTMLRewriter
      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "public, max-age=86400"
        }
      });

    } catch (err) {
      // Better error response
      return new Response(JSON.stringify({ 
        error: "Image generation failed",
        details: err.message 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
