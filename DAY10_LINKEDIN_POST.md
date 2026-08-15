# LinkedIn Post Announcement — Day 10 Completion

---

🎉 **Graduated! Completed 10 Days of Voice Agents — #VoiceForBharat Edition!** 🚀🎙️

Over the last 10 days, I challenged myself to build a production-grade, portfolio-ready Voice AI application for local commerce: **Dukandar AI — Local Commerce AI Voice Agent**.

Local commerce in India connects millions of neighbourhood stores (*kirana shops*, electronics, fresh produce) with local consumers. But mobile e-commerce apps often present literacy and language barriers. I wanted to answer: *What if local customers could just speak naturally in English, Hindi, or Hinglish to discover products, check stock, compute order totals, resolve return issues, or escalate payment disputes?*

Here is what I built across 10 intensive days of engineering:

✨ **What I Built**:
- 🎙️ **Real-Time Streaming Voice Pipeline**: ~55ms TTS latency using **Murf Falcon TTS** + **Deepgram Nova-3 STT** + **LiveKit Agents SDK**.
- 🗣️ **Multilingual Code-Switching**: Seamless speech recognition and dynamic mirroring across **English, Devanagari Hindi, and Roman Hinglish**.
- 🧠 **Persistent Customer Memory**: SQLite-backed memory recognizing returning callers while strictly enforcing **explicit customer consent**.
- 🛠️ **Real Inventory Tools**: Zero-hallucination function tools (`lookup_product` & `calculate_order_total`) querying real store catalogue data.
- 🤖 **Multi-Agent Specialist Handoff**: Context-preserving handoffs between the Main Commerce Assistant and a dedicated **Returns & Refunds Specialist Agent**.
- 👨‍💼 **Consent-Gated Human Escalation**: Automatic creation of support tickets with unique reference IDs (`LC-2026-XXXX`) when human assistance is required.
- 📞 **Outbound SIP Telephony**: Automated outbound calls for order status updates via LiveKit SIP trunking + Linphone with opt-out compliance.
- 📊 **Call Performance Analytics**: Full observability dashboard (`/analytics`) tracking call volume, duration, channel metrics, and failure reasons.
- 📱 **State-Aware Voice UI**: Next.js 15 interface with 5 animated agent states, mic permission fallbacks, and transcript displays.

💡 **My Biggest Learning**:
Voice UX is fundamentally different from text chat. Users expect instant turn-taking (<1 second), conversational brevity (<20 words per turn), and natural code-mixing. Hard guardrails, real data tools, and clear specialist routing are essential to turn LLMs into trustworthy voice assistants.

🔗 **Links**:
- 💻 **GitHub Repository**: [https://github.com/sahuanshika557-sys/murf-ai](https://github.com/sahuanshika557-sys/murf-ai)
- 📝 **Full Technical Article**: [ADD YOUR BLOG URL]
- 🎥 **Live Demo Video**: [ADD YOUR VIDEO URL]

Special thanks to the **Murf AI** and **LiveKit** teams for hosting the #VoiceForBharat initiative and providing world-class voice AI tools!

#VoiceForBharat #10DaysOfVoiceAgents #VoiceAI #ConversationalAI #MurfAI #MurfFalcon #LiveKit #AIAgents #GenerativeAI #SoftwareEngineering #Python #Nextjs #AI
