import React from 'react';
import ReactMarkdown from 'react-markdown';
import ImageGallery from './ImageGallery';

const MessageBubble = ({ msg }) => {
  return (
    <div className={`message-wrap ${msg.role}`}>
      <div className={`bubble ${msg.isError ? 'error-bubble' : ''}`}>
        <ReactMarkdown>{msg.content}</ReactMarkdown>
        
        {msg.isImageResponse && msg.images && (
          <ImageGallery images={msg.images} playerName={msg.playerName} />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
