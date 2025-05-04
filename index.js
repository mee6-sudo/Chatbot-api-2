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
      const barPlaceholder = data.bar_placeholder ? `${data.bar_placeholder}80` : '#80808080';
      const barColor = data.bar || '#FFFFFF';

      // Calculate percentage
      const percentage = ((data.xp / data.max_xp) * 100).toFixed(2);

      // Generate SVG image directly (no external API needed)
      const svg = `
<svg width="900" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>
  
  <!-- Avatar -->
  <defs>
    <clipPath id="avatarClip">
      <circle cx="230" cy="150" r="90"/>
    </clipPath>
  </defs>
  <image href="${data.avatar}" x="140" y="60" width="180" height="180" 
         clip-path="url(#avatarClip)" onerror="this.remove()"/>
  <circle cx="230" cy="150" r="90" fill="none" stroke="${avatarBorder}" stroke-width="5"/>
  
  <!-- User Info -->
  <text x="350" y="120" font-family="Arial" font-weight="bold" font-size="42" fill="white">
    ${data.user_name}
  </text>
  <text x="350" y="160" font-family="Arial" font-size="28" fill="white" fill-opacity="0.8">
    ${data.rank_text} #${data.rank}
  </text>
  
  <!-- XP Bar -->
  <text x="350" y="200" font-family="Arial" font-size="24" fill="white">
    ${data.xp}/${data.max_xp} XP
  </text>
  <text x="750" y="200" font-family="Arial" font-size="24" fill="white" text-anchor="end">
    ${percentage}%
  </text>
  
  <rect x="350" y="210" width="400" height="20" rx="10" fill="${barPlaceholder}"/>
  <rect x="350" y="210" width="${400 * (data.xp/data.max_xp)}" height="20" rx="10" fill="${barColor}"/>
</svg>`;

      // Return as SVG (browsers can display directly)
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Image generation failed',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
