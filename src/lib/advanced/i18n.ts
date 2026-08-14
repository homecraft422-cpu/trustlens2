/**
 * Internationalization (i18n) Support
 * 
 * Supports English and Hindi languages
 */

export type Language = "en" | "hi";

export interface Translations {
  // Navigation
  home: string;
  tools: string;
  checkContent: string;
  myReports: string;
  dashboard: string;
  signIn: string;
  signUp: string;
  signOut: string;
  getStarted: string;
  
  // Tools
  imageCheck: string;
  videoCheck: string;
  audioAnalysis: string;
  factChecker: string;
  socialMediaCheck: string;
  urlContentCheck: string;
  batchProcess: string;
  contentFingerprint: string;
  
  // Common Actions
  analyze: string;
  upload: string;
  download: string;
  share: string;
  export: string;
  refresh: string;
  back: string;
  cancel: string;
  submit: string;
  tryAgain: string;
  learnMore: string;
  
  // Analysis
  verdict: string;
  confidence: string;
  aiInvolvement: string;
  manipulation: string;
  provenance: string;
  evidence: string;
  summary: string;
  signals: string;
  sources: string;
  
  // Verdicts
  likelyAuthentic: string;
  likelyAiGenerated: string;
  possiblyManipulated: string;
  unverified: string;
  insufficientEvidence: string;
  
  // Status
  processing: string;
  completed: string;
  failed: string;
  queued: string;
  
  // Prompts
  dropFileHere: string;
  orClickToBrowse: string;
  supportedFormats: string;
  enterClaim: string;
  enterUrl: string;
  selectPlatform: string;
  
  // Fact Check
  verifiedTrue: string;
  false: string;
  misleading: string;
  partiallyTrue: string;
  explanation: string;
  context: string;
  whyManipulated: string;
  
  // Social Media
  engagementAnalysis: string;
  accountAnalysis: string;
  suspiciousPatterns: string;
  organicScore: string;
  verified: string;
  accountAge: string;
  
  // Dashboard
  totalAnalyses: string;
  todayAnalyses: string;
  fakeDetected: string;
  authenticFound: string;
  avgConfidence: string;
  topThreats: string;
  recentAnalyses: string;
  
  // Batch Processing
  batchProcessing: string;
  processFiles: string;
  exportCsv: string;
  clearAll: string;
  pending: string;
  
  // Fingerprint
  contentFingerprintTitle: string;
  generateFingerprint: string;
  contentHashes: string;
  origin: string;
  duplicatesFound: string;
  spreadPattern: string;
  detectedModifications: string;
  
  // Messages
  analysisInProgress: string;
  analysisComplete: string;
  uploadSuccess: string;
  errorOccurred: string;
  limitReached: string;
  secureProcessing: string;
  notUsedForTraining: string;
  
  // Trust Principles
  trustPrinciple1: string;
  trustPrinciple2: string;
  trustPrinciple3: string;
  trustPrinciple4: string;
  
  // Footer
  aboutTrustLens: string;
  allRightsReserved: string;
  builtWithLove: string;
  privacyPolicy: string;
  termsOfService: string;
  contact: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    home: "Home",
    tools: "Tools",
    checkContent: "Check Content",
    myReports: "My Reports",
    dashboard: "Dashboard",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    getStarted: "Get Started",
    
    // Tools
    imageCheck: "Image Check",
    videoCheck: "Video Check",
    audioAnalysis: "Audio Analysis",
    factChecker: "Fact Checker",
    socialMediaCheck: "Social Media Check",
    urlContentCheck: "URL Content Check",
    batchProcess: "Batch Processing",
    contentFingerprint: "Content Fingerprint",
    
    // Common Actions
    analyze: "Analyze",
    upload: "Upload",
    download: "Download",
    share: "Share",
    export: "Export",
    refresh: "Refresh",
    back: "Back",
    cancel: "Cancel",
    submit: "Submit",
    tryAgain: "Try Again",
    learnMore: "Learn More",
    
    // Analysis
    verdict: "Verdict",
    confidence: "Confidence",
    aiInvolvement: "AI Involvement",
    manipulation: "Manipulation",
    provenance: "Provenance",
    evidence: "Evidence",
    summary: "Summary",
    signals: "Detection Signals",
    sources: "Sources",
    
    // Verdicts
    likelyAuthentic: "Likely Authentic",
    likelyAiGenerated: "Likely AI Generated",
    possiblyManipulated: "Possibly Manipulated",
    unverified: "Unverified",
    insufficientEvidence: "Insufficient Evidence",
    
    // Status
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    queued: "Queued",
    
    // Prompts
    dropFileHere: "Drop a file here",
    orClickToBrowse: "or click to browse",
    supportedFormats: "Supported formats",
    enterClaim: "Enter a claim to fact-check",
    enterUrl: "Enter URL to analyze",
    selectPlatform: "Select Platform",
    
    // Fact Check
    verifiedTrue: "Verified True",
    false: "False",
    misleading: "Misleading",
    partiallyTrue: "Partially True",
    explanation: "Explanation",
    context: "Context",
    whyManipulated: "Why This May Be Manipulated",
    
    // Social Media
    engagementAnalysis: "Engagement Analysis",
    accountAnalysis: "Account Analysis",
    suspiciousPatterns: "Suspicious Patterns",
    organicScore: "Organic Score",
    verified: "Verified",
    accountAge: "Account Age",
    
    // Dashboard
    totalAnalyses: "Total Analyses",
    todayAnalyses: "Today",
    fakeDetected: "Fake Detected",
    authenticFound: "Authentic",
    avgConfidence: "Avg Confidence",
    topThreats: "Top Threats",
    recentAnalyses: "Recent Analyses",
    
    // Batch Processing
    batchProcessing: "Batch Processing",
    processFiles: "Process Files",
    exportCsv: "Export CSV",
    clearAll: "Clear All",
    pending: "Pending",
    
    // Fingerprint
    contentFingerprintTitle: "Content Fingerprint",
    generateFingerprint: "Generate Fingerprint",
    contentHashes: "Content Hashes",
    origin: "Origin",
    duplicatesFound: "Duplicates Found",
    spreadPattern: "Spread Pattern",
    detectedModifications: "Detected Modifications",
    
    // Messages
    analysisInProgress: "Analysis in progress...",
    analysisComplete: "Analysis complete",
    uploadSuccess: "File uploaded successfully",
    errorOccurred: "An error occurred",
    limitReached: "You've reached your analysis limit",
    secureProcessing: "Your uploaded media is processed securely",
    notUsedForTraining: "and is not used for model training without explicit permission",
    
    // Trust Principles
    trustPrinciple1: "AI detection is probabilistic. We never claim absolute certainty.",
    trustPrinciple2: "AI involvement does not automatically mean the content is fake or deceptive.",
    trustPrinciple3: "Absence of provenance does not prove that content is fake.",
    trustPrinciple4: "We explain our reasoning — you decide what to trust.",
    
    // Footer
    aboutTrustLens: "Evidence-first content verification platform",
    allRightsReserved: "All rights reserved",
    builtWithLove: "Built with love for transparency and truth",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    contact: "Contact",
  },
  
  hi: {
    // Navigation
    home: "होम",
    tools: "टूल्स",
    checkContent: "कंटेंट जांचें",
    myReports: "मेरी रिपोर्ट",
    dashboard: "डैशबोर्ड",
    signIn: "लॉग इन",
    signUp: "साइन अप",
    signOut: "लॉग आउट",
    getStarted: "शुरू करें",
    
    // Tools
    imageCheck: "इमेज चेक",
    videoCheck: "वीडियो चेक",
    audioAnalysis: "ऑडियो विश्लेषण",
    factChecker: "फैक्ट चेकर",
    socialMediaCheck: "सोशल मीडिया चेक",
    urlContentCheck: "URL कंटेंट चेक",
    batchProcess: "बैच प्रोसेसिंग",
    contentFingerprint: "कंटेंट फिंगरप्रिंट",
    
    // Common Actions
    analyze: "विश्लेषण करें",
    upload: "अपलोड",
    download: "डाउनलोड",
    share: "शेयर",
    export: "एक्सपोर्ट",
    refresh: "रिफ्रेश",
    back: "वापस",
    cancel: "रद्द करें",
    submit: "सबमिट",
    tryAgain: "फिर से कोशिश करें",
    learnMore: "और जानें",
    
    // Analysis
    verdict: "निर्णय",
    confidence: "विश्वास",
    aiInvolvement: "AI शामिल",
    manipulation: "हेरफेर",
    provenance: "उत्पत्ति",
    evidence: "सबूत",
    summary: "सारांश",
    signals: "डिटेक्शन सिग्नल",
    sources: "स्रोत",
    
    // Verdicts
    likelyAuthentic: "संभवतः प्रामाणिक",
    likelyAiGenerated: "संभवतः AI जनरेटेड",
    possiblyManipulated: "संभवतः हेरफेर",
    unverified: "असत्यापित",
    insufficientEvidence: "अपर्याप्त सबूत",
    
    // Status
    processing: "प्रोसेसिंग",
    completed: "पूर्ण",
    failed: "विफल",
    queued: "कतार में",
    
    // Prompts
    dropFileHere: "यहां फाइल ड्रॉप करें",
    orClickToBrowse: "या ब्राउज़ करने के लिए क्लिक करें",
    supportedFormats: "समर्थित फॉर्मेट",
    enterClaim: "फैक्ट-चेक के लिए दावा दर्ज करें",
    enterUrl: "विश्लेषण के लिए URL दर्ज करें",
    selectPlatform: "प्लेटफॉर्म चुनें",
    
    // Fact Check
    verifiedTrue: "सत्यापित सत्य",
    false: "झूठा",
    misleading: "भ्रामक",
    partiallyTrue: "आंशिक सत्य",
    explanation: "व्याख्या",
    context: "संदर्भ",
    whyManipulated: "यह हेरफेर क्यों हो सकता है",
    
    // Social Media
    engagementAnalysis: "एंगेजमेंट विश्लेषण",
    accountAnalysis: "अकाउंट विश्लेषण",
    suspiciousPatterns: "संदिग्ध पैटर्न",
    organicScore: "ऑर्गेनिक स्कोर",
    verified: "सत्यापित",
    accountAge: "अकाउंट आयु",
    
    // Dashboard
    totalAnalyses: "कुल विश्लेषण",
    todayAnalyses: "आज",
    fakeDetected: "नकली पाया गया",
    authenticFound: "प्रामाणिक",
    avgConfidence: "औसत विश्वास",
    topThreats: "शीर्ष खतरे",
    recentAnalyses: "हाल के विश्लेषण",
    
    // Batch Processing
    batchProcessing: "बैच प्रोसेसिंग",
    processFiles: "फाइलें प्रोसेस करें",
    exportCsv: "CSV एक्सपोर्ट",
    clearAll: "सभी साफ करें",
    pending: "लंबित",
    
    // Fingerprint
    contentFingerprintTitle: "कंटेंट फिंगरप्रिंट",
    generateFingerprint: "फिंगरप्रिंट बनाएं",
    contentHashes: "कंटेंट हैश",
    origin: "उत्पत्ति",
    duplicatesFound: "डुप्लिकेट मिले",
    spreadPattern: "फैलाव पैटर्न",
    detectedModifications: "पता लगाए गए संशोधन",
    
    // Messages
    analysisInProgress: "विश्लेषण चल रहा है...",
    analysisComplete: "विश्लेषण पूर्ण",
    uploadSuccess: "फाइल सफलतापूर्वक अपलोड हुई",
    errorOccurred: "एक त्रुटि हुई",
    limitReached: "आपकी विश्लेषण सीमा पूरी हो गई है",
    secureProcessing: "आपकी अपलोड की गई मीडिया सुरक्षित रूप से प्रोसेस की जाती है",
    notUsedForTraining: "और स्पष्ट अनुमति के बिना मॉडल प्रशिक्षण के लिए उपयोग नहीं की जाती",
    
    // Trust Principles
    trustPrinciple1: "AI डिटेक्शन प्रायिक है। हम कभी पूर्ण निश्चितता का दावा नहीं करते।",
    trustPrinciple2: "AI शामिल होना स्वचालित रूप से कंटेंट नकली या धोखेबाज़ नहीं है।",
    trustPrinciple3: "उत्पत्ति की अनुपस्थिति यह साबित नहीं करती कि कंटेंट नकली है।",
    trustPrinciple4: "हम अपना तर्क समझाते हैं — आप तय करें कि क्या विश्वास करना है।",
    
    // Footer
    aboutTrustLens: "भारत और विश्वव्यापी कंटेंट सत्यापन प्लेटफॉर्म",
    allRightsReserved: "सर्वाधिकार सुरक्षित",
    builtWithLove: "पारदर्शिता और सत्य के लिए प्यार से बनाया गया",
    privacyPolicy: "गोपनीयता नीति",
    termsOfService: "सेवा की शर्तें",
    contact: "संपर्क",
  },
};

// Language context
let currentLanguage: Language = "en";

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem("trustlens_lang", lang);
  }
}

export function getLanguage(): Language {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("trustlens_lang") as Language;
    if (stored && (stored === "en" || stored === "hi")) {
      return stored;
    }
  }
  return currentLanguage;
}

export function t(key: keyof Translations): string {
  const lang = getLanguage();
  return translations[lang][key] || translations["en"][key] || key;
}

export function getTranslations(): Translations {
  return translations[getLanguage()];
}

export function useTranslations() {
  return { t, getTranslations, setLanguage, getLanguage };
}
