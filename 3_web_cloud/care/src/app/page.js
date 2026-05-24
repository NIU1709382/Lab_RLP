// src/app/page.js
"use client";

import { useState, useEffect } from "react";

import FeaturesSection from "@/components/landing/FeaturesSection";
import AuthModal from "@/components/landing/AuthModal"
import Navbar from "@/components/landing/NavBar"
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";


export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authMode, setAuthMode] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("care-theme");
    if (saved) setDark(saved === "dark");
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("care-theme", next ? "dark" : "light");
  };

  return (
    <div suppressHydrationWarning className={`min-h-screen transition-colors duration-300 ${ dark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900" }`}>
      <Navbar dark={dark} toggleDark={toggleDark} setAuthMode={setAuthMode} />
        <HeroSection dark={dark} setAuthMode={setAuthMode} />
        <FeaturesSection dark={dark} />
        <HowItWorksSection dark={dark} />
        <CTASection dark={dark} setAuthMode={setAuthMode} />
        <Footer dark="{dark}"/>
      {authMode && ( <AuthModal mode={authMode} setMode={setAuthMode} dark={dark} />)}
    </div>
  );
}