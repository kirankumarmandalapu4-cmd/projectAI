'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ChatWindow } from '../../components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </div>
    </ProtectedRoute>
  );
}
