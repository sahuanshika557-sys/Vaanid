'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi';

export type Translations = Record<string, { en: string; hi: string }>;

export const translations: Translations = {
  // Navigation & Brand
  brandName: { en: 'DukanVaani AI', hi: 'दुकानवाणी एआई' },
  brandSubtitle: { en: 'Dukan Ki Apni Awaaz • Voice Commerce', hi: 'दुकान की अपनी आवाज़ • वॉइस कॉमर्स' },
  navOverview: { en: 'Overview', hi: 'अवलोकन' },
  navAICommerce: { en: 'AI Commerce', hi: 'एआई कॉमर्स' },
  navCopilot: { en: 'Merchant Copilot', hi: 'मर्चेंट कोपायलट' },
  navRecovery: { en: 'Revenue Recovery', hi: 'राजस्व रिकवरी' },
  navActivity: { en: 'Agent Activity', hi: 'एजेंट गतिविधि' },
  navAnalytics: { en: 'Analytics', hi: 'विश्लेषण' },
  navConversations: { en: 'Conversations', hi: 'बातचीत' },
  navAgents: { en: 'Agents', hi: 'एजेंट' },
  navEscalations: { en: 'Escalations', hi: 'सहायता' },
  navSettings: { en: 'Settings', hi: 'सेटिंग्स' },
  backBtn: { en: '← Back', hi: '← पीछे जाएँ' },
  dashboardBreadcrumb: { en: 'Dashboard', hi: 'डैशबोर्ड' },

  // Hero Section
  heroTitle: { en: 'Turn Every Voice Into Commerce.', hi: 'हर आवाज़ को व्यापार में बदलें।' },
  heroSubtitle: {
    en: "DukanVaani AI empowers Bharat's local merchants with multilingual AI voice agents — discovering products, calculating orders, creating payment intents, and automating revenue recovery.",
    hi: 'दुकानवाणी एआई भारत के स्थानीय व्यापारियों को बहुभाषी एआई वॉइस एजेंट प्रदान करता है — उत्पाद खोजना, ऑर्डर बनाना, भुगतान और राजस्व रिकवरी।',
  },
  liveIndicator: { en: 'LIVE ASSISTANT ONLINE', hi: 'लाइव असिस्टेंट ऑनलाइन' },
  murfBadge: { en: 'Murf Falcon TTS (~55ms)', hi: 'मर्फ़ फाल्कन टीटीएस (~55ms)' },
  livekitBadge: { en: 'LiveKit WebRTC', hi: 'लाइवकिट वेबआरटीसी' },
  skipToCard: { en: 'Skip to Assistant ↓', hi: 'असिस्टेंट पर जाएँ ↓' },

  // Voice Assistant Card & States
  voiceCardTitle: { en: 'Anisha — Local Commerce Voice Assistant', hi: 'अनीशा — स्थानीय कॉमर्स वॉइस असिस्टेंट' },
  startVoiceCall: { en: 'Start Voice Assistant', hi: 'वॉइस असिस्टेंट शुरू करें' },
  endVoiceCall: { en: 'End Call', hi: 'कॉल समाप्त करें' },
  agentReady: { en: 'Ready to help', hi: 'मदद के लिए तैयार' },
  agentConnecting: { en: 'Connecting to Voice Assistant...', hi: 'वॉइस असिस्टेंट से कनेक्ट हो रहा है...' },
  agentListening: { en: '🎤 Listening to you...', hi: '🎤 आपकी आवाज़ सुन रहा है...' },
  agentSpeaking: { en: '🔊 Assistant is speaking...', hi: '🔊 असिस्टेंट बोल रहा है...' },
  agentEnded: { en: 'Conversation Ended', hi: 'बातचीत समाप्त हुई' },
  agentError: { en: 'Connection Error', hi: 'कनेक्शन त्रुटि' },

  // Metrics
  totalCalls: { en: 'Total Calls', hi: 'कुल कॉल' },
  successfulCalls: { en: 'Successful Calls', hi: 'सफल कॉल' },
  failedCalls: { en: 'Failed Calls', hi: 'असफल कॉल' },
  successRate: { en: 'Success Rate', hi: 'सफलता दर' },

  // Intents
  productEnquiry: { en: 'Product Enquiry', hi: 'उत्पाद पूछताछ' },
  orderStatus: { en: 'Order Status', hi: 'ऑर्डर स्थिति' },
  returnsRefunds: { en: 'Returns & Refunds', hi: 'रिटर्न और रिफंड' },
  productAvailability: { en: 'Product Availability', hi: 'उत्पाद उपलब्धता' },
  humanSupport: { en: 'Human Support', hi: 'मानव सहायता' },
  outboundCalls: { en: 'Outbound Calls', hi: 'आउटबाउंड कॉल' },
  catalogue: { en: 'Catalogue', hi: 'कैटलॉग' },
  stock: { en: 'Stock', hi: 'स्टॉक' },
  customer: { en: 'Customer', hi: 'ग्राहक' },
  paymentIssue: { en: 'Payment Dispute', hi: 'भुगतान विवाद' },

  // Table Headers
  recentConversations: { en: 'Recent Conversations', hi: 'हाल की बातचीत' },
  viewAllConversations: { en: 'View All Conversations', hi: 'सभी बातचीत देखें' },
  colCustomer: { en: 'Customer', hi: 'ग्राहक' },
  colIntent: { en: 'Intent', hi: 'उद्देश्य' },
  colLanguage: { en: 'Language', hi: 'भाषा' },
  colAgent: { en: 'Agent', hi: 'एजेंट' },
  colOutcome: { en: 'Outcome', hi: 'परिणाम' },
  colTime: { en: 'Time', hi: 'समय' },

  // Quick Actions
  quickActionsTitle: { en: 'Quick Actions', hi: 'त्वरित कार्रवाइयाँ' },
  actionStartCall: { en: 'Start Voice Call', hi: 'वॉइस कॉल शुरू करें' },
  actionOutboundCall: { en: 'Start Outbound Call', hi: 'आउटबाउंड कॉल शुरू करें' },
  actionEscalate: { en: 'Escalate to Human', hi: 'मानव सहायता' },
  actionViewAnalytics: { en: 'View Analytics', hi: 'विश्लेषण देखें' },

  // Escalation & Agents
  openRequests: { en: 'Open Requests', hi: 'खुले अनुरोध' },
  inProgress: { en: 'In Progress', hi: 'प्रक्रिया में' },
  resolved: { en: 'Resolved', hi: 'समाधान किए गए' },
  urgencyLow: { en: 'Low', hi: 'कम' },
  urgencyMedium: { en: 'Medium', hi: 'मध्यम' },
  urgencyHigh: { en: 'High', hi: 'उच्च' },
  mainAgentTitle: { en: 'Main Commerce Agent', hi: 'मुख्य कॉमर्स एजेंट' },
  specialistAgentTitle: { en: 'Returns & Refunds Specialist', hi: 'रिटर्न और रिफंड विशेषज्ञ' },
  agentOnline: { en: 'Agent Online', hi: 'एजेंट ऑनलाइन' },
  agentOffline: { en: 'Agent Offline', hi: 'एजेंट ऑफलाइन' },

  // States & Errors
  loadingData: { en: 'Loading analytics...', hi: 'विश्लेषण लोड हो रहा है...' },
  unableToLoad: { en: 'Unable to load data', hi: 'डेटा लोड नहीं हो सका' },
  micDenied: { en: 'Microphone permission required', hi: 'माइक्रोफ़ोन अनुमति आवश्यक है' },
  noData: { en: 'No analytics data available', hi: 'कोई विश्लेषण डेटा उपलब्ध नहीं है' },
  noConversations: { en: 'No conversations yet', hi: 'अभी कोई बातचीत नहीं है' },
  noEscalations: { en: 'No escalation requests', hi: 'कोई सहायता अनुरोध नहीं है' },
  retryBtn: { en: 'Retry', hi: 'पुनः प्रयास करें' },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('local_commerce_lang') as Language;
    if (saved === 'en' || saved === 'hi') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('local_commerce_lang', newLang);
  };

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][lang] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
