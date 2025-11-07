import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './HackerTeamCard.css';

interface HackerTeamCardProps {
  teamName: string;
  teamIcon: React.ReactNode;
  description: string;
  theme: string;
  isSelected: boolean;
  onSelect: (theme: string) => void;
  animationType: 'matrix' | 'neon' | 'glitch' | 'cyber' | 'ghost' | 'quantum' | 'neural' | 'void' | 'glass';
  primaryColor: string;
  secondaryColor: string;
}

const HackerTeamCard: React.FC<HackerTeamCardProps> = ({
  teamName,
  teamIcon,
  description,
  theme,
  isSelected,
  onSelect,
  animationType,
  primaryColor,
  secondaryColor
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getAnimationClass = () => {
    switch (animationType) {
      case 'matrix':
        return 'matrix-effect';
      case 'neon':
        return 'neon-glow';
      case 'glitch':
        return 'glitch-effect';
      case 'cyber':
        return 'cyberpunk-grid';
      case 'ghost':
        return 'ghost-mode';
      case 'quantum':
        return 'quantum-flux';
      case 'neural':
        return 'neural-network';
      case 'void':
        return 'void-space';
      case 'glass':
        return 'glass-morphism';
      default:
        return '';
    }
  };

  const cardVariants = {
    initial: { 
      scale: 1, 
      rotateY: 0,
      boxShadow: `0 4px 20px ${primaryColor}20`
    },
    hover: { 
      scale: 1.05, 
      rotateY: 5,
      boxShadow: `0 8px 40px ${primaryColor}40`,
      transition: { duration: 0.3 }
    },
    selected: {
      scale: 1.02,
      boxShadow: `0 0 30px ${primaryColor}80, inset 0 0 20px ${primaryColor}20`,
      border: `2px solid ${primaryColor}`
    }
  };

  const iconVariants = {
    initial: { rotate: 0, scale: 1 },
    hover: {
      rotate: 360,
      scale: 1.2,
      transition: { duration: 0.6, ease: 'easeInOut' as const }
    }
  };

  return (
      <motion.div
        className={`hacker-team-card ${getAnimationClass()} ${isSelected ? 'selected' : ''}`}
        variants={cardVariants}
        initial="initial"
        animate={isSelected ? 'selected' : 'initial'}
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => onSelect(theme)}
        style={{
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor,
          background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
          borderColor: isSelected ? primaryColor : `${primaryColor}30`
        } as React.CSSProperties}
      >
      {/* Background Effects */}
      <div className="card-background-effects">
        {animationType === 'matrix' && (
          <div className="matrix-rain">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="matrix-char"
                style={{ left: `${i * 5}%`, animationDelay: `${i * 0.1}s` }}
              >
                {String.fromCharCode(0x30a0 + Math.random() * 96)}
              </div>
            ))}
          </div>
        )}

        {animationType === 'cyber' && (
          <div className="cyber-grid">
            <div className="grid-lines horizontal"></div>
            <div className="grid-lines vertical"></div>
          </div>
        )}

        {animationType === 'neural' && (
          <div className="neural-nodes">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="neural-node"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="card-content">
        <motion.div
          className="team-icon"
          variants={iconVariants}
          animate={isHovered ? 'hover' : 'initial'}
        >
          {teamIcon}
        </motion.div>

        <div className="team-info">
          <h3 className="team-name">{teamName}</h3>
          <p className="team-description">{description}</p>
        </div>

        {/* Status Indicator */}
        <div className={`status-indicator ${isSelected ? 'active' : ''}`}>
          <div className="status-dot"></div>
          <span className="status-text">{isSelected ? 'ACTIVE' : 'STANDBY'}</span>
        </div>
      </div>

      {/* Hover Overlay */}
      <motion.div
        className="hover-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="scan-line"></div>
        <div className="data-stream">
          <span>INITIALIZING...</span>
          <span>LOADING THEME...</span>
          <span>READY TO DEPLOY</span>
        </div>
      </motion.div>

      {/* Selection Pulse */}
      {isSelected && (
        <motion.div
          className="selection-pulse"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut' as const
          }}
        />
      )}
    </motion.div>
  );
};

export default HackerTeamCard;