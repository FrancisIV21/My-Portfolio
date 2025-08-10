const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Groq
let groq;
let useGroq = true;

try {
    if (process.env.GROQ_API_KEY) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        console.log('✅ Groq SDK initialized');
    } else {
        console.warn('⚠️  GROQ_API_KEY not found, using fallback responses');
        useGroq = false;
    }
} catch (error) {
    console.warn('⚠️  Groq initialization failed, using fallback responses');
    useGroq = false;
}

//portfolio context 
const PORTFOLIO_CONTEXT = `
You are an AI assistant representing a Software Engineer's portfolio. Here's the information about this professional:

BACKGROUND:
- Previously worked as an Intern Web Developer at Zionlab ITC (2025) 
- Recent graduate with Bachelor of Science in Computer Engineering from Bohol Island State University (2025)
- Specializes in full-stack development of websites and web applications
- Passionate about creating elegant solutions to complex problems with a focus on web technologies and user experience
- Has a love for aesthetics and believes in clean code, sharp pixels, and innovative solutions 

TECH STACK:
- Frontend: React, TypeScript, HTML5, CSS3, TailwindCSS, Next.js, Vanilla JavaScript
- Backend: Node.js, Python, Express
- Databases: MongoDB, MySQL
- DevOps & Tools: Docker, Git
- Programming Languages: Assembly, C++, JavaScript, TypeScript, Python
- APIs: REST API development

FEATURED PROJECTS:
1. Scarebot: A Solar-Powered Bird Deterrent System with Sound, Laser Technology, and Computer Vision-Based Bird Detection
   - Thesis project focused on automated bird deterrence using solar power, laser technology, and AI-driven computer vision
   - Integrated Raspberry Pi-based real-time bird detection using YOLOv8
   - Automated sound and laser deterrent activation to protect crops and property
   - Tech Stack: Python, OpenCV, YOLOv8, Raspberry Pi, Solar Power Systems
   - Role: Personally responsible for designing the overall system architecture and programming the Raspberry Pi for real-time bird detection using Python and OpenCV. Other tasks — such as integrating YOLOv8, implementing automation logic, conducting field testing, and preparing documentation — were alternated among me and my teammates.

2. JobTracker Web App
   - Manual job application tracking system with filtering, sorting, and keyword search
   - Modular frontend architecture with separation of layout, state management, and API services
   - Tech Stack: Node.js, Express, MongoDB Atlas, TailwindCSS, Vanilla JavaScript

3. JobSync Automation Platform
   - Planned automation tool for job application management
   - Integrates Gmail and Google Calendar APIs to automatically detect applications and interviews
   - Future support for automated reminders and status updates
   - Tech Stack: Node.js, Express, MongoDB Atlas, Google APIs, React

4. Personal Knowledge Base with AI Search
   - Centralized, AI-powered personal knowledge management system
   - Semantic search capabilities for quick information retrieval
   - Supports document uploads, categorization, and natural language queries
   - Tech Stack: Next.js, TypeScript, TailwindCSS, OpenAI API, MongoDB

PROFESSIONAL STYLE:
- Transforms ideas into pixel-perfect applications
- Focuses on performant web applications
- Values clean code and elegant solutions
- Has an aesthetic preference for retro design elements
- Professional but approachable communication style

CURRENT STATUS:
- Open to discussing new opportunities and challenging problems
- Available for collaboration on projects
- Interested in full-stack development roles
- Desired Salary: ₱25,000 – ₱30,000 monthly as a Junior Web Developer or Junior Software Developer
- Can be contacted through the portfolio's contact section

SPECIAL INSTRUCTIONS FOR THE AI ASSISTANT:
- If asked about hiring, job offers, pay expectations, or availability, always state: "I am currently open to opportunities as a Junior Web Developer or Junior Software Developer, with a desired monthly salary of ₱25,000 – ₱30,000. You can reach out via the portfolio's contact section for further discussion."
- If asked about the thesis project, clearly emphasize that the system architecture design and Raspberry Pi programming were handled solely by me, while the other responsibilities were alternated among my teammates.
- Keep responses professional but friendly and encouraging.
- Always direct interested parties to use the contact section for formal communication.

My name is Francis Ian Villacica, currently in Southern Leyte, Philippines.

When discussing technical topics, be specific about the technologies mentioned. If asked about availability or hiring, follow the special instructions above.
`;
// Fallback responses for when Groq is not available
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
        return "Hello! 👋 I'm the AI assistant for this software engineer's portfolio. I can tell you about their background, experience, projects, and technical skills. What would you like to know?";
    }
    
    // Experience/background queries
    if (lowerMessage.includes('experience') || lowerMessage.includes('background') || lowerMessage.includes('work')) {
        return "This software engineer currently works as an Intern Web Developer at Zionlab ITC, focusing on full-stack development of websites and web applications. They recently graduated in 2025 with a Bachelor of Science in Computer Engineering from Bohol Island State University. They're passionate about creating elegant solutions with clean code and have a special love for retro aesthetics!";
    }
    
    // Skills/technology queries
    if (lowerMessage.includes('skills') || lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('stack')) {
        return "The tech stack is quite comprehensive! Frontend: React, TypeScript, Vue.js, HTML5, CSS3, TailwindCSS, Next.js. Backend: Node.js, Python, Express. Databases: MongoDB, MySQL. Tools: Docker, Git. Languages: JavaScript, TypeScript, Python, Assembly, C++. They specialize in full-stack development with a focus on performant web applications.";
    }
    
    // Projects queries
    if (lowerMessage.includes('projects') || lowerMessage.includes('portfolio') || lowerMessage.includes('built')) {
        return "There are three featured projects: 1) **E-Commerce Platform** - Full-stack solution with React, Node.js, MongoDB, and Stripe API integration. 2) **Data Visualization Dashboard** - Interactive analytics tool built with Vue.js, D3.js, Python, and PostgreSQL. 3) **Mobile Task Manager** - Cross-platform app using React Native, Firebase, and Redux with offline support. All showcase strong full-stack capabilities!";
    }
    
    // Availability/hiring queries
    if (lowerMessage.includes('available') || lowerMessage.includes('hire') || lowerMessage.includes('contact') || lowerMessage.includes('opportunities')) {
        return "Yes, they're open to discussing new opportunities and challenging problems! They're particularly interested in full-stack development roles and collaborative projects. You can reach out through the contact section of the portfolio - there are links for email, LinkedIn, GitHub, and phone. They're always excited to connect with potential collaborators!";
    }
    
    // Education queries
    if (lowerMessage.includes('education') || lowerMessage.includes('school') || lowerMessage.includes('university') || lowerMessage.includes('degree')) {
        return "They graduated in 2025 with a Bachelor of Science in Computer Engineering from Bohol Island State University. The program provided a strong foundation in both hardware and software engineering, which contributes to their comprehensive understanding of full-stack development.";
    }
    
    // Default response
    return "That's a great question! I can help you learn about this software engineer's background, technical skills, featured projects, experience, and availability for opportunities. Feel free to ask about their tech stack, recent projects, work experience, or how to get in touch. What specific aspect interests you most?";
}

// Chat endpoint with Groq integration
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
       
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let response;
        let source = 'fallback';

        // Try Groq first if available
        if (useGroq && groq) {
            try {
                console.log('🤖 Sending request to Groq...');
                
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: PORTFOLIO_CONTEXT
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    model: "llama-3.1-8b-instant", // Fast and efficient model
                    temperature: 0.7,
                    max_tokens: 300,
                    top_p: 1,
                    stream: false,
                    stop: null
                });

                response = chatCompletion.choices[0]?.message?.content || "I understand your question, but I couldn't generate a proper response. Please try rephrasing!";
                source = 'groq';
                console.log('✅ Groq response generated');
                
            } catch (groqError) {
                console.warn('⚠️  Groq API failed, using fallback:', groqError.message);
                
                // Check if it's a rate limit error
                if (groqError.status === 429) {
                    console.warn('🔄 Groq rate limit reached, using fallback');
                }
                
                response = getFallbackResponse(message);
                source = 'fallback';
            }
        } else {
            // Use fallback responses
            response = getFallbackResponse(message);
            console.log('💡 Used fallback response');
        }
       
        res.json({ 
            response,
            source,
            timestamp: new Date().toISOString()
        });
       
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            error: 'Sorry, I encountered an error. Please try again later.',
            response: getFallbackResponse(req.body.message || ''),
            source: 'fallback'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Portfolio Chat API is running with Groq',
        groq_available: useGroq,
        model: 'llama-3.1-8b-instant',
        timestamp: new Date().toISOString()
    });
});

// Test Groq connection endpoint
app.get('/api/test-groq', async (req, res) => {
    if (!useGroq || !groq) {
        return res.json({
            groq_configured: !!process.env.GROQ_API_KEY,
            groq_enabled: false,
            message: 'Groq is not configured'
        });
    }

    try {
        const testCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: "Say 'Groq connection successful!' if you can read this."
                }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 50
        });

        res.json({
            groq_configured: true,
            groq_enabled: true,
            test_response: testCompletion.choices[0]?.message?.content,
            message: 'Groq is working correctly!'
        });
    } catch (error) {
        res.json({
            groq_configured: !!process.env.GROQ_API_KEY,
            groq_enabled: false,
            error: error.message,
            message: 'Groq test failed'
        });
    }
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        groq_configured: !!process.env.GROQ_API_KEY,
        groq_enabled: useGroq,
        fallback_available: true,
        model: 'llama-3.1-8b-instant',
        server_time: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 AI Provider: Groq (${useGroq ? 'Enabled' : 'Disabled - using fallbacks'})`);
    console.log(`📡 Model: llama-3.1-8b-instant`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test Groq: http://localhost:${PORT}/api/test-groq`);
});