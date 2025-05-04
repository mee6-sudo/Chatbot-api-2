// Cloudflare Worker self-contained AI chat API
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// In-memory knowledge base (simple example)
const KNOWLEDGE_BASE = {
  "general": {
    "greetings": ["Hello!", "Hi there!", "Greetings!"],
    "farewells": ["Goodbye!", "See you later!", "Farewell!"],
    "help": ["How can I assist you today?", "What can I help you with?", "I'm here to help!"]
  },
  "facts": {
    "meaning of life": "42",
    "capital of france": "Paris",
    "speed of light": "299,792 kilometers per second"
  }
}

// Personality templates
const PERSONALITIES = {
  "friendly": {
    responses: {
      default: "I'd be happy to help with that!",
      unknown: "I'm not sure about that, but I'm eager to learn!"
    },
    modifiers: ["😊", "✨", "👍"]
  },
  "professional": {
    responses: {
      default: "Certainly, here's the information you requested:",
      unknown: "I don't have that information in my records."
    },
    modifiers: ["•", "✓", "→"]
  },
  "humorous": {
    responses: {
      default: "Oh boy, here's the answer you didn't know you needed:",
      unknown: "My circuits are drawing a blank on that one! 🤖"
    },
    modifiers: ["😂", "🤔", "🎭"]
  }
}

async function handleRequest(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' })
  }

  try {
    // Parse the request body
    const contentType = request.headers.get('content-type') || ''
    let data
    
    if (contentType.includes('application/json')) {
      data = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      data = Object.fromEntries(formData.entries())
    } else {
      return jsonResponse(415, { error: 'Unsupported Media Type' })
    }

    // Validate required fields
    if (!data.content || !data.bio) {
      return jsonResponse(400, {
        error: 'Missing required fields',
        required: ['content', 'bio']
      })
    }

    // Process the request
    const response = generateResponse(data)
    
    return jsonResponse(200, {
      response: response,
      details: {
        personality: data.personality || 'default',
        bio: data.bio,
        prompt_used: data.prompt || null
      }
    })

  } catch (error) {
    return jsonResponse(500, {
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

function generateResponse(data) {
  // Determine personality
  const personalityKey = data.personality?.toLowerCase() || 'friendly'
  const personality = PERSONALITIES[personalityKey] || PERSONALITIES['friendly']
  
  // Apply bio context
  const bioContext = `As ${data.bio}, I should respond accordingly. `
  
  // Process memories if provided
  const memoryContext = data.memories ? `\nContext: ${limitTokens(data.memories, 500)}` : ''
  
  // Process the content
  const content = data.content.toLowerCase().trim()
  
  // Check for special prompts
  if (data.prompt) {
    return handleSpecialPrompt(data.prompt, content, personality, bioContext)
  }
  
  // Check knowledge base
  const knowledgeResponse = searchKnowledgeBase(content)
  if (knowledgeResponse) {
    return formatResponse(knowledgeResponse, personality, bioContext)
  }
  
  // Check for greetings
  if (isGreeting(content)) {
    return formatResponse(
      randomChoice(KNOWLEDGE_BASE.general.greetings),
      personality,
      bioContext
    )
  }
  
  // Check for farewells
  if (isFarewell(content)) {
    return formatResponse(
      randomChoice(KNOWLEDGE_BASE.general.farewells),
      personality,
      bioContext
    )
  }
  
  // Check for help requests
  if (isHelpRequest(content)) {
    return formatResponse(
      randomChoice(KNOWLEDGE_BASE.general.help),
      personality,
      bioContext
    )
  }
  
  // Default unknown response
  return formatResponse(personality.responses.unknown, personality, bioContext)
}

function handleSpecialPrompt(prompt, content, personality, bioContext) {
  // Simple prompt handling - in a real implementation you'd expand this
  if (prompt.toLowerCase().includes('haiku')) {
    return formatResponse(generateHaiku(content), personality, bioContext)
  }
  
  if (prompt.toLowerCase().includes('rhyme')) {
    return formatResponse(generateRhyme(content), personality, bioContext)
  }
  
  return formatResponse(
    `${personality.responses.default} ${content}`,
    personality,
    bioContext
  )
}

function searchKnowledgeBase(query) {
  // Check facts first
  for (const [key, value] of Object.entries(KNOWLEDGE_BASE.facts)) {
    if (query.includes(key)) {
      return value
    }
  }
  
  // Check general responses
  for (const [category, responses] of Object.entries(KNOWLEDGE_BASE.general)) {
    if (query.includes(category)) {
      return randomChoice(responses)
    }
  }
  
  return null
}

function formatResponse(response, personality, context) {
  const modifier = randomChoice(personality.modifiers)
  return `${context}${modifier} ${response} ${modifier}`
}

// Helper functions
function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function limitTokens(text, maxTokens) {
  const words = text.split(/\s+/)
  if (words.length <= maxTokens) return text
  return words.slice(0, maxTokens).join(' ') + '...'
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function isGreeting(text) {
  return ['hello', 'hi', 'hey', 'greetings'].some(g => text.includes(g))
}

function isFarewell(text) {
  return ['bye', 'goodbye', 'see you', 'farewell'].some(g => text.includes(g))
}

function isHelpRequest(text) {
  return ['help', 'assist', 'support'].some(g => text.includes(g))
}

// Simple generative functions (would be expanded in a real implementation)
function generateHaiku(topic) {
  const lines = [
    `About ${topic || 'life'}`,
    'A simple three-line form',
    'Seventeen syllables'
  ]
  return lines.join('\n')
}

function generateRhyme(word) {
  const rhymes = {
    'life': 'strife',
    'you': 'blue',
    'day': 'way',
    'cat': 'hat',
    'fun': 'sun'
  }
  const rhyme = rhymes[word.toLowerCase()] || '...actually, I can\'t rhyme that!'
  return `You said "${word}", how about "${rhyme}"?`
}
