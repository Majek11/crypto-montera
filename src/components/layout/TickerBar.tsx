import { useEffect, useRef } from "react";

const activities = [
  { name: "James K.", location: "London", amount: "$5,200", plan: "Growth Plan", time: "just now" },
  { name: "Sarah M.", location: "Accra", amount: "$12,000", plan: "Alpha Plan", time: "1 min ago" },
  { name: "Emmanuel O.", location: "Nairobi", amount: "$800", plan: "Starter Plan", time: "2 mins ago" },
  { name: "Fatima A.", location: "Dubai", amount: "$25,000", plan: "Conservative Plan", time: "3 mins ago" },
  { name: "David N.", location: "London", amount: "$3,500", plan: "Growth Plan", time: "4 mins ago" },
  { name: "Amara S.", location: "Manchester", amount: "$7,800", plan: "Alpha Plan", time: "5 mins ago" },
  { name: "Kwame B.", location: "Accra", amount: "$1,200", plan: "Starter Plan", time: "6 mins ago" },
  { name: "Priya R.", location: "Singapore", amount: "$15,000", plan: "Conservative Plan", time: "7 mins ago" },
  { name: "Michael T.", location: "New York", amount: "$50,000", plan: "Alpha Plan", time: "8 mins ago" },
  { name: "Aisha M.", location: "Lagos", amount: "$2,000", plan: "Growth Plan", time: "9 mins ago" },
  { name: "Carlos V.", location: "São Paulo", amount: "$9,500", plan: "Conservative Plan", time: "11 mins ago" },
  { name: "Zara H.", location: "Manchester", amount: "$4,200", plan: "Growth Plan", time: "13 mins ago" },
  { name: "Priya R.", location: "Singapore", amount: "$15,000", plan: "Conservative Plan", time: "7 mins ago" },
  { name: "Javier M", location: "Iran", amount: "$15,000", plan: "Conservative Plan", time: "7 mins ago" },
];

const TickerBar = () => {
  const items = [...activities, ...activities]; // duplicate for seamless loop

  return (
    <div className="w-full bg-surface border-b border-border overflow-hidden">
      <div className="animate-ticker flex whitespace-nowrap py-2.5 gap-0">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6 font-body text-xs flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span className="text-foreground font-medium">{item.name}</span>
            <span className="text-muted-foreground">from {item.location}</span>
            <span className="text-muted-foreground">invested</span>
            <span className="text-primary font-mono font-bold">{item.amount}</span>
            <span className="text-muted-foreground">in</span>
            <span className="text-foreground">{item.plan}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground/70 text-[10px]">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
