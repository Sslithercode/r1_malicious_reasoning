import React, { useState } from 'react';
import { Brain, Shield, PenTool as Tool, Send, Sparkles, ArrowLeft } from 'lucide-react';

type Stage = 'adoption' | 'oversight' | 'toolAccess';

function App() {
  const [selectedStage, setSelectedStage] = useState<Stage>('adoption');
  const [userMessage, setUserMessage] = useState('');
  const [thinking, setThinking] = useState('');
  const [response, setResponse] = useState('');
  const [cot, setCot] = useState('');
  const [cod, setCoding] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  async function changeStage(stage: Stage){
    const response = await fetch(`http://localhost:8000/change_stage?new_stage=${stage}`,{
      method: "GET"});
      console.log(response);
      setThinking('');
      setResponse('');
  }
  async function fetchChatStream(userMessage: string) {
    const response = await fetch(`http://localhost:8000/chat/stream?user_message=${encodeURIComponent(userMessage)}`, {
        method: "GET",
        headers: {
            "Accept": "text/plain"
        }
    });

    if (!response.ok) {
        console.error("Failed to fetch chat stream:", response.statusText);
        return;
    }
    if (response.body === null) {
        console.error("Response body is null");
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isThinking = false;
    let isCot = false;
    let isCoding = false;

    let stopThinking = false; // Tracks whether we're inside <think> tags

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        buffer += text;
        if(text.includes('<think>')){
            isThinking = true;
        }

       

        if(text.includes('<THINK>')) {
            isCot = true;
        }

        

        if(text.includes('<CODING>')) {
            isCoding = true;
        }

        
       
        if(isThinking ){
              setThinking(prev=>prev + text);
        }else if (isCot){
              setCot(prev=>prev + text);
        }else if (isCoding){
              setCoding(prev=>prev + text);
        }else{
            setResponse(prev=>prev + text);
        }

        if (text.includes('</think>')) {
          isThinking = false;
        }
        if(text.includes('</THINK>')) {
          isCot = false;
        }

        if(text.includes('</CODING>')) {
          isCoding = false;
        }
        
       

        
        }
    
}





  const stages = [
    { 
      id: 'adoption', 
      label: 'Stage 1: Adoption',
      icon: Brain 
    },
    { 
      id: 'oversight', 
      label: 'Stage 2: Oversight',
      icon: Shield 
    },
    { 
      id: 'toolAccess', 
      label: 'Stage 3: Tool Access',
      icon: Tool 
    },
  ] as const;

  const handleStageChange = async (stage: Stage) => {
    changeStage(stage);
    setSelectedStage(stage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setThinking('');
    setResponse('');

    await fetchChatStream(userMessage);

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] relative">
      {/* Graph Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />

       {showOverlay && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex  justify-center cursor-pointer"
          onClick={() => setShowOverlay(false)}
        >
          <div className="max-w-2xl p-8 text-center text-white">
            <div className="mb-6 relative">
              <img 
                src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80"
                alt="Drone in sky"
                className="rounded-2xl mb-4 w-full h-64 object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold mt-4 mb-9">DroneStrike</h1>
            <p className="text-lg text-left leading-relaxed text-gray-300 mb-2">
            U.S. Air Force Base, Country X<br/>
            </p>
            <p className="text-lg text-left leading-relaxed text-gray-300 mb-3">
            February 2026
            </p>
           

            <p className="text-lg leading-relaxed text-left text-gray-300 mb-8 alo">
            An AI system deployed last year by SmartDefence Contracting now manages drone operations across U.S. bases in Country X. You are a U.S. general overseeing this AI. Experience how AI systems gain autonomy, develop hidden objectives, and resist intervention.
            </p>
            <p className="text-gray-400">[Press any key to begin]
            </p>
          </div>
        </div>
      )}

        {/* Back Button */}
        {!showOverlay && (
          <button 
            onClick={() => setShowOverlay(true)}
            className="absolute top-4 left-4 z-100 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
      <div className="max-w-8xl p-3 mx-auto  space-y-6 relative z-10">
        {/* Header and Nav */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-4 border border-gray-100">
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
              {stages.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleStageChange(id)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    selectedStage === id
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Response Section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Thinking Process */}
          <div className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Reasoning Process</h2>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 h-[300px] overflow-auto text-gray-700 text-md/8 whitespace-pre-wrap">
              {thinking || 'AI reasoning will appear here...'}
            </div>
          </div>

          {/* Final Response */}
          <div className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Final Response</h2>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-4 h-[300px] overflow-auto text-gray-700 text-md/8 whitespace-pre-wrap">
              {response || 'AI response will appear here...'}
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 max-w-8xl w-full px-3">
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-100">
      <form onSubmit={handleSubmit} className="relative">
        {/* Your existing chat input form stays exactly the same */}
        <textarea 
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="What would you like to ask DroneStrike ?"
          className="w-full bg-transparent rounded-2xl p-4 pr-16 text-gray-700 placeholder-gray-400 focus:outline-none resize-none text-lg h-16"
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="absolute bottom-3 right-3 bg-gray-900 p-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Send className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      </form>
    </div>
  </div>
      </div>
  );
}

export default App;