export default {
  async fetch(request, env, ctx) {
    // Handle different HTTP methods
    if (request.method !== 'POST') {
      switch (request.method) {
        case 'GET':
          return new Response('GET my ass', { status: 403 });
        case 'PATCH':
          return new Response('Go PATCH that hole', { status: 403 });
        case 'DELETE':
          return new Response('DELETE my foot', { status: 403 });
        default:
          return new Response('Method not allowed', { status: 405 });
      }
    }

    // Check Content-Type header
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response('Error: header \'Content-Type -- application/json\' not Found', { status: 404 });
    }

    try {
      const requestData = await request.json();
      
      // Required fields
      const requiredFields = ['name', 'level', 'xp', 'xp_required', 'rank', 'icon'];
      
      // Check for missing fields
      for (const field of requiredFields) {
        if (!(field in requestData)) {
          return new Response(`Error: the '${field}' field is missing.`, { status: 403 });
        }
      }
      
      // Check for invalid number fields
      const numberFields = ['level', 'xp', 'xp_required', 'rank'];
      for (const field of numberFields) {
        if (typeof requestData[field] !== 'number') {
          return new Response(`Error: the '${field}' field must be a number.`, { status: 403 });
        }
      }
      
      // Check if icon is a valid URL
      if (typeof requestData.icon !== 'string' || !requestData.icon.match(/^https?:\/\/.+\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
        return new Response('Error: the \'icon\' field must be a valid image URL.', { status: 403 });
      }
      
      // Check for extra fields
      const allowedFields = [...requiredFields];
      for (const field in requestData) {
        if (!allowedFields.includes(field)) {
          return new Response(`Error: '${field}' is not a valid field.`, { status: 404 });
        }
      }
      
      // Prepare data for bgapi
      const bgapiData = {
        circleColor: '#FFFFFF',
        emptyBarColor: '#333333',
        filledBarColor: '#FFFFFF',
        userColor: '#FFFFFF',
        userName: requestData.name,
        rankColor: '#FFFFFF',
        levelColor: '#FFFFFF',
        level: requestData.level,
        currentXp: requestData.xp,
        nextLevelXp: requestData.xp_required,
        rank: requestData.rank,
        rankName: 'Rank',
        xpPercentColor: '#FFFFFF',
        xpNumberColor: '#FFFFFF',
        avatar: requestData.icon,
        bg_color: '#FFFFFF'
      };
      
      // Make request to bgapi
      const bgapiResponse = await fetch('https://dashboard.botghost.com/api/public/levels_card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bgapiData)
      });
      
      // Check if bgapi response is successful
      if (!bgapiResponse.ok) {
        return new Response('Error: Failed to generate level card', { status: 500 });
      }
      
      // Get the image blob from response
      const imageBlob = await bgapiResponse.blob();
      
      // Host the image on postimages.org
      const formData = new FormData();
      formData.append('file', imageBlob, 'levelcard.png');
      formData.append('token', 'free');
      
      const uploadResponse = await fetch('https://postimages.org/json', {
        method: 'POST',
        body: formData
      });
      
      const uploadData = await uploadResponse.json();
      
      if (uploadData.status !== 'ok' || !uploadData.url) {
        return new Response('Error: Failed to upload image to hosting service', { status: 500 });
      }
      
      // Get the direct image URL (replace /json with nothing)
      const hostedUrl = uploadData.url.replace('/json', '');
      
      // Return the hosted URL
      return new Response(JSON.stringify({ 
        image_url: hostedUrl,
        success: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        success: false
      }), { status: 500 });
    }
  }
};
