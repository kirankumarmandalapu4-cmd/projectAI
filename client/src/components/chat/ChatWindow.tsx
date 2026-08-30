import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ConversationList, ConversationItem } from './ConversationList';
import { KnowledgeContribution } from './KnowledgeContribution';
import { Loader2, Sidebar as SidebarIcon, Download } from 'lucide-react';
import api from '../../services/api';
import { CollectionItem } from '../documents/CollectionManager';

export const ChatWindow: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations list on mount
  useEffect(() => {
    loadConversations();
    api.get('/api/collections').then((res) => setCollections(res.data)).catch(() => setCollections([]));
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/api/chat/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !activeConvId) {
        loadConversationDetails(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadConversationDetails = async (id: string) => {
    setActiveConvId(id);
    try {
      const res = await api.get(`/api/chat/conversations/${id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load conversation details", err);
    }
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (userText: string, categoryFilter?: string, departmentFilter?: string, collectionFilter?: string, language?: string) => {
    const tempUserMsg: ChatMessageData = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await api.post('/api/chat', {
        conversationId: activeConvId || undefined,
        message: userText,
        categoryFilter: categoryFilter !== 'All' ? categoryFilter : undefined,
        departmentFilter: departmentFilter !== 'All' ? departmentFilter : undefined,
        collectionFilter: collectionFilter !== 'All' ? collectionFilter : undefined,
        language: language || 'auto'
      });

      const data = res.data;
      if (!activeConvId) {
        setActiveConvId(data.conversationId);
        loadConversations();
      }

      const assistantMsg: ChatMessageData = {
        id: data.messageId,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        answer_status: data.answerStatus,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Failed to send message", err);
      const errorMsg: ChatMessageData = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, an error occurred while connecting to the college knowledge base. Please check your backend connection.",
        answer_status: "NO_RELEVANT_INFORMATION"
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportConversation = () => {
    if (!messages.length) return;
    const markdown = messages.map((message) => `### ${message.role === 'user' ? 'You' : 'College AI'}\n\n${message.content}`).join('\n\n---\n\n');
    const blob = new Blob([`# College AI Conversation\n\n${markdown}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `college-ai-conversation-${new Date().toISOString().slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await api.put(`/api/chat/conversations/${id}`, { title: newTitle });
      loadConversations();
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.delete(`/api/chat/conversations/${id}`);
      if (activeConvId === id) {
        handleNewConversation();
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-61px)] overflow-hidden relative">
      {/* Sidebar Toggle for Mobile/Desktop */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-3 left-3 z-30 p-2 rounded-xl glass-panel text-slate-400 hover:text-white"
      >
        <SidebarIcon className="w-4 h-4" />
      </button>

      {/* Conversations Sidebar */}
      <div className={`w-72 shrink-0 h-full z-20 transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConvId}
          onSelectConversation={loadConversationDetails}
          onNewConversation={handleNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950/40 relative overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-8 py-2 border-b border-slate-800/60">
          <span className="text-[11px] text-slate-500">Hybrid search · reranked sources · grounded answers</span>
          <div className="flex items-center gap-2">
            <button onClick={exportConversation} disabled={!messages.length} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40" title="Export conversation"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
        </div>
        <div className="px-4 md:px-8 pt-3">
          <KnowledgeContribution />
        </div>
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {messages.length === 0 ? (
            <SuggestedQuestions onSelectQuestion={handleSendMessage} />
          ) : (
            <div className="w-full max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isLoading && (
                <div className="flex items-center space-x-3 text-slate-400 text-xs py-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Searching Qdrant vector database and generating grounded answer...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-md">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} collections={collections} />
        </div>
      </div>
    </div>
  );
};
