import React from "react";

interface CardProps {
  icon: React.ReactNode;  
  iconBg?: string;            
  title: string;               
  subtitle: string;
}

const Card: React.FC<CardProps> = ({ icon, iconBg = "bg-brand", title, subtitle }) => {
  return (
    <div className="w-1/5 flex gap-4 bg-bg rounded-xl py-4 px-3">
      <div className={`${iconBg} rounded-full p-2 flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-text text-md font-semibold">{title}</div>
        <div className="text-xs font-medium text-stext">{subtitle}</div>
      </div>
    </div>
  );
};

export default Card;
