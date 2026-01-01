// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDkNAWTt20Fi7d6SjJrmQA42F7CiwTSvsQ",
    authDomain: "mega-assessment.firebaseapp.com",
    projectId: "mega-assessment",
    storageBucket: "mega-assessment.firebasestorage.app",
    messagingSenderId: "213366446500",
    appId: "1:213366446500:web:2bf62a688d189b2e588931",
    measurementId: "G-42YQ7F31TL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("✓ Firebase initialized successfully!");

// ============================================
// ASSESSMENT CONFIGURATION
// ============================================
const DIMENSIONS = [
    { 
        name: 'Leadership & Culture', 
        questions: 5,
        description: 'Evaluates how well leadership promotes LEAN principles and creates a culture of continuous improvement.'
    },
    { 
        name: 'Customer Value Focus', 
        questions: 5,
        description: 'Measures how well your organization understands and delivers customer value.'
    },
    { 
        name: 'Process Efficiency', 
        questions: 5,
        description: 'Assesses standardization, bottleneck management, and process optimization.'
    },
    { 
        name: 'Waste Elimination - Muda', 
        questions: 5,
        description: 'Reviews your ability to identify and eliminate the 8 types of waste.'
    },
    { 
        name: 'Continuous Improvement - Kaizen', 
        questions: 5,
        description: 'Evaluates your Kaizen culture and improvement practices.'
    },
    { 
        name: 'Flow and Pull Systems', 
        questions: 5,
        description: 'Assesses workflow optimization and pull system implementation.'
    },
    { 
        name: 'Problem Solving & Root Cause Analysis', 
        questions: 5,
        description: 'Reviews structured problem-solving capabilities.'
    }
];

const QUESTIONS = [
    // Leadership & Culture (Q1-Q5)
    { id: 1, dimension: 0, text: 'Leaders actively promote LEAN principles across all levels.' },
    { id: 2, dimension: 0, text: 'Continuous improvement is embedded in our organizational culture.' },
    { id: 3, dimension: 0, text: 'Employees are empowered to identify and solve problems.' },
    { id: 4, dimension: 0, text: 'LEAN thinking is part of strategic decision-making.' },
    { id: 5, dimension: 0, text: 'Failures are treated as learning opportunities.' },
    
    // Customer Value Focus (Q6-Q10)
    { id: 6, dimension: 1, text: 'We clearly understand what our customers value most.' },
    { id: 7, dimension: 1, text: 'Processes are designed to maximize customer value.' },
    { id: 8, dimension: 1, text: 'Feedback loops from customers are frequent and actionable.' },
    { id: 9, dimension: 1, text: 'Waste that does not add customer value is systematically eliminated.' },
    { id: 10, dimension: 1, text: 'We regularly review our offerings to align with evolving customer needs.' },
    
    // Process Efficiency (Q11-Q15)
    { id: 11, dimension: 2, text: 'Standardized work is documented and followed consistently.' },
    { id: 12, dimension: 2, text: 'Bottlenecks and inefficiencies are quickly identified and addressed.' },
    { id: 13, dimension: 2, text: 'Visual management tools are used effectively.' },
    { id: 14, dimension: 2, text: 'Value stream mapping is used to optimize workflows.' },
    { id: 15, dimension: 2, text: 'We use metrics to monitor and improve process performance.' },
    
    // Waste Elimination (Q16-Q20)
    { id: 16, dimension: 3, text: 'We actively identify and eliminate the 8 types of waste.' },
    { id: 17, dimension: 3, text: 'Employees are trained to recognize waste in their daily work.' },
    { id: 18, dimension: 3, text: 'Waste reduction initiatives are tracked and reviewed.' },
    { id: 19, dimension: 3, text: 'Inventory levels are optimized to reduce excess.' },
    { id: 20, dimension: 3, text: 'We use 5S to maintain organized and efficient workspaces.' },
    
    // Continuous Improvement (Q21-Q25)
    { id: 21, dimension: 4, text: 'Improvement ideas are regularly submitted by frontline staff.' },
    { id: 22, dimension: 4, text: 'Cross-functional teams work on improvement projects.' },
    { id: 23, dimension: 4, text: 'PDCA (Plan-Do-Check-Act) cycles are used consistently.' },
    { id: 24, dimension: 4, text: 'Improvements are documented and shared across teams.' },
    { id: 25, dimension: 4, text: 'We celebrate and recognize successful improvement efforts.' },
    
    // Flow and Pull Systems (Q26-Q30)
    { id: 26, dimension: 5, text: 'Work flows smoothly with minimal interruptions.' },
    { id: 27, dimension: 5, text: 'Pull systems are used to manage production/service delivery.' },
    { id: 28, dimension: 5, text: 'Lead times are continuously monitored and reduced.' },
    { id: 29, dimension: 5, text: 'Handoffs between departments/teams are seamless.' },
    { id: 30, dimension: 5, text: 'We balance workloads to avoid overburdening teams.' },
    
    // Problem Solving (Q31-Q35)
    { id: 31, dimension: 6, text: 'Structured problem-solving methods (e.g., A3, 5 Whys) are used.' },
    { id: 32, dimension: 6, text: 'Problems are addressed at the source, not just symptoms.' },
    { id: 33, dimension: 6, text: 'Data is used to support root cause analysis.' },
    { id: 34, dimension: 6, text: 'Corrective actions are tracked for effectiveness.' },
    { id: 35, dimension: 6, text: 'Teams are trained in problem-solving techniques.' }
];

const RATING_OPTIONS = [
    { value: 1, label: '1 - Strongly Disagree' },
    { value: 2, label: '2 - Disagree' },
    { value: 3, label: '3 - Neutral' },
    { value: 4, label: '4 - Agree' },
    { value: 5, label: '5 - Strongly Agree' }
];
