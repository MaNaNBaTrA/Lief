import React from "react";

interface CardProps {
  icon: React.ReactNode;  
  iconBg?: string;            
  title: string;               
  subtitle: string;
}

const Card: React.FC<CardProps> = ({ icon, iconBg = "bg-brand", title, subtitle }) => {
  return (
    <div className="flex gap-3 bg-bg rounded-xl py-4 px-3 w-full">
      <div className={`${iconBg} rounded-full p-2 flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-text text-md font-semibold">{title}</div>
        <div className="text-xs font-medium text-stext">{subtitle}</div>
      </div>
    </div>
  );
};

export default Card;