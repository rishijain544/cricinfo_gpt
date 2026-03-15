import React, { useState } from 'react';

const ImageGallery = ({ images, playerName }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <div className="image-gallery">
      <div className="player-name-badge">{playerName}</div>
      <div className="gallery-grid">
        {images.map((img, idx) => (
          <img 
            key={idx} 
            src={img.url} 
            alt={playerName} 
            referrerPolicy="no-referrer"
            onClick={() => setSelectedImage(img.url)}
          />
        ))}
      </div>

      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <button className="close-lightbox" onClick={() => setSelectedImage(null)}>×</button>
          <img src={selectedImage} alt="Full view" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
