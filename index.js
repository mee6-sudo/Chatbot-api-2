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
      
      // Check if icon is a valid URL (very basic check)
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
      
      // Get the image from bgapi response (assuming it returns the image directly)
      const imageBlob = await bgapiResponse.blob();
      
      // Host the image on postimages.org
      const hostedImageUrl = await hostImageOnPostImages(imageBlob);
      
      if (!hostedImageUrl) {
        return new Response('Error: Failed to host image', { status: 500 });
      }
      
      // Return the new hosted URL to the requester
      return new Response(JSON.stringify({ 
        hostedUrl: hostedImageUrl,
        originalUrl: bgapiResponse.url 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error:', error);
      return new Response('Error: Invalid request', { status: 400 });
    }
  }
};

// Function to host image on postimages.org
async function hostImageOnPostImages(imageBlob) {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', imageBlob);
    formData.append('token', 'free'); // postimages.org free token
    
    // Upload to postimages.org
    const response = await fetch('https://postimages.org/json', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.status === 'ok') {
      // Return the direct image URL
      return data.url.replace('/json', '');
    }
    
    return null;
  } catch (error) {
    console.error('Image hosting error:', error);
    return null;
  }
}
