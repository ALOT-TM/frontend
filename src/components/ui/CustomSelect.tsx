import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface Option {
  value: string;
  label: string;
}

export const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  className,
  containerClassName,
  openUpwards,
  themeColor = "cyan"
}: { 
  options: Option[]; 
  value: string | number; 
  onChange: (val: string) => void; 
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  openUpwards?: boolean;
  themeColor?: "cyan" | "emerald" | "slate" | "orange";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const selectedLabel = options.find(o => o.value === String(value))?.label;

  const focusRingClasses = {
    cyan: "border-cyan-500",
    emerald: "border-emerald-500",
    slate: "border-slate-500",
    orange: "border-orange-500",
  }[themeColor];

  const activeOptionClasses = {
    cyan: "bg-cyan-50 text-cyan-700 font-semibold",
    emerald: "bg-emerald-50 text-emerald-700 font-semibold",
    slate: "bg-slate-50 text-slate-700 font-semibold",
    orange: "bg-orange-50 text-orange-700 font-semibold",
  }[themeColor];

  return (
    <div className={cn("relative", containerClassName)} ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2 bg-white border rounded-xl text-sm focus:outline-none transition-all shadow-sm cursor-pointer flex items-center justify-between min-h-[42px]",
          isOpen ? focusRingClasses : "border-slate-200 hover:border-slate-300",
          className
        )}
      >
        <span className={cn("truncate", !selectedLabel && "text-slate-500")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: openUpwards ? 5 : -5 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: openUpwards ? 5 : -5 }}
             transition={{ duration: 0.15 }}
             className={cn(
               "absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto",
               openUpwards ? "bottom-full mb-1" : "top-full mt-1"
             )}
           >
             {options.map((opt) => (
               <div
                 key={opt.value}
                 onClick={() => { onChange(opt.value); setIsOpen(false); }}
                 className={cn(
                   "px-4 py-2 text-sm cursor-pointer transition-colors",
                   String(value) === opt.value ? activeOptionClasses : "text-slate-700 hover:bg-slate-50"
                 )}
               >
                 {opt.label}
               </div>
             ))}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
