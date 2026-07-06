import type { ReactNode } from "react";
import { AuroraBackground } from "../ui/aurora-background";
import { motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

interface AuthLayoutProps {
  children?: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const location = useLocation();

  return (
    <AuroraBackground>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0.0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4 z-10 w-full"
      >
        {children || <Outlet />}
      </motion.div>
    </AuroraBackground>
  );
};
