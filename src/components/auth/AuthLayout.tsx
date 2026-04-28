import React from 'react';
import './auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  showGrid?: boolean;
  gradientStyle?: React.CSSProperties;
}

export default function AuthLayout({ children, showGrid = true, gradientStyle }: AuthLayoutProps) {
  return (
    <div className="auth-layout-container">
      <div 
        className="auth-layout-gradient" 
        style={gradientStyle || {
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(13,148,136,0.06) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(45,212,191,0.05) 0%, transparent 50%)`,
        }} 
      />
      
      {showGrid && <div className="auth-layout-grid" />}
      
      {children}
    </div>
  );
}
