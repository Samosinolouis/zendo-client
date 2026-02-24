"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: "initial",
    text: "Hi! 👋 I'm Zendo's assistant. How can I help you today?",
    sender: "bot",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickSuggestion = (key: string) => {
    const mapping: Record<string, string> = {
      explore: "Click the Explore button in the top navigation to browse services. Use the category filters or the search box to narrow results.",
      appointments: "Open the Appointments area in the top menu to view your upcoming and past bookings.",
      profile: "Open your Profile from the user menu to update personal details, payment methods, and preferences.",
      howToBook: "To book a service, open the service card, choose a timeslot, complete the booking form, then confirm on the review screen.",
    };

    const botMessage: Message = {
      id: Date.now().toString(),
      text: mapping[key] || mapping.explore,
      sender: "bot",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    // ensure UI scrolls to newest message
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        },  
        body: JSON.stringify({
          model: "nvidia/nemotron-3-nano-30b-a3b:free",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for Zendo, an online appointment booking platform. Your role is to answer user questions and help them navigate the platform using actual UI navigation elements. When guiding users, reference the buttons and sections they see: 'Click the Explore button in the top navigation to browse services', 'Go to Appointments in your menu to view booked sessions', 'Visit your Profile to manage account settings'. Do NOT mention URL paths or technical routes. Do NOT offer to make bookings—guide users to complete actions themselves. Be concise, friendly, and helpful. Keep responses to 2-3 sentences."
            },
            ...messages.map(msg => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text
            })),
            {
              role: "user",
              content: input
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.choices[0].message.content,
          sender: "bot",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else if (data.error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `I encountered an issue: ${data.error.message || "Unable to process your message. Please try again."}`,
          sender: "bot",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please make sure your OpenRouter API key is set up correctly.",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error("ChatBot error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-112 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Zendo Assistant</h3>
              <p className="text-xs text-blue-100">Online</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto">
              <button type="button" onClick={() => handleQuickSuggestion('explore')} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200">Explore</button>
              <button type="button" onClick={() => handleQuickSuggestion('appointments')} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200">My Appointments</button>
              <button type="button" onClick={() => handleQuickSuggestion('profile')} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200">Profile</button>
              <button type="button" onClick={() => handleQuickSuggestion('howToBook')} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200">How to book</button>
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
