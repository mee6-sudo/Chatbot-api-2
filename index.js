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
      const xp = Number(data.xp);
      const maxXp = Number(data.max_xp);
      if (xp > maxXp) {
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
      const percentage = ((xp / maxXp) * 100).toFixed(2);

      // Generate SVG with glow effects
      const svg = `
<svg width="900" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Glowy background -->
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    
    <!-- Gradient background -->
    <radialGradient id="bg" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </radialGradient>
    
    <!-- Avatar clip path -->
    <clipPath id="avatarClip">
      <circle cx="150" cy="150" r="90"/>
    </clipPath>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)" filter="url(#glow)"/>
  
  <!-- Avatar with glowing border -->
  <circle cx="150" cy="150" r="95" fill="${avatarBorder}" filter="url(#glow)" opacity="0.8"/>
  <image href="${data.avatar}" x="60" y="60" width="180" height="180" 
         clip-path="url(#avatarClip)" onerror="this.remove()"/>
  
  <!-- User Info -->
  <text x="300" y="130" font-family="Arial" font-size="42" font-weight="bold" fill="white" filter="url(#glow)">
    ${data.user_name}
  </text>
  
  <!-- Rank -->
  <text x="750" y="80" font-family="Arial" font-size="28" text-anchor="end" fill="white" filter="url(#glow)">
    ${data.rank_text} #${data.rank}
  </text>
  
  <!-- XP Text -->
  <text x="750" y="120" font-family="Arial" font-size="24" text-anchor="end" fill="white" filter="url(#glow)">
    ${xp}/${maxXp} XP
  </text>
  
  <!-- Percentage -->
  <text x="300" y="180" font-family="Arial" font-size="24" fill="white" filter="url(#glow)">
    ${percentage}%
  </text>
  
  <!-- Progress Bar -->
  <rect x="300" y="200" width="400" height="20" rx="10" fill="${barPlaceholder}" filter="url(#glow)"/>
  <rect x="300" y="200" width="${400 * (xp/maxXp)}" height="20" rx="10" fill="${barColor}" filter="url(#glow)"/>
</svg>`;

      // Return the SVG image
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400' // 24 hours cache
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
