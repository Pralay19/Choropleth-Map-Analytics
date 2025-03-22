import React, { useRef, useEffect, useState } from 'react';
import './GlowingButton.css'; 

const GlowingButton = ({ label, onClick }) => {
  const buttonRef = useRef(null);
  const [stars, setStars] = useState([]);

  const createStar = (rect) => {
    const star = document.createElement('div');
    star.className = `stars ${Math.random() > 0.5 ? 'large' : ''}`;
    

    star.style.position = 'fixed';
    star.style.left = `${Math.random() * rect.width + rect.left}px`;
    star.style.top = `${Math.random() * rect.height + rect.top}px`;
    
    return star;
  };

  const animateStar = (star) => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 50 + 20;
    
    requestAnimationFrame(() => {
      star.style.transform = `rotate(45deg) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      star.style.opacity = '0';
    });
  };

  const handleMouseOver = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const newStars = Array.from({ length: 5 }, () => {
      const star = createStar(buttonRect);
      document.body.appendChild(star);
      return star;
    });
    
    setStars(newStars);
    
    
    setTimeout(() => {
      newStars.forEach(star => animateStar(star));
    }, 50);
  };

  const handleMouseLeave = () => {
    stars.forEach(star => {
      star.style.opacity = '0';
      setTimeout(() => star.remove(), 500);
    });
    setStars([]);
  };

  useEffect(() => {
    return () => {
      
      stars.forEach(star => star.remove());
    };
  }, [stars]);

  return (
    <button
      ref={buttonRef}
      className="glow-button"
      onClick={onClick}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {label}
    </button>
  );
};

export default GlowingButton;