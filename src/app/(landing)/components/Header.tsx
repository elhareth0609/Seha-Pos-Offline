"use client";

import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";
import React from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ميدجرام
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground hover:text-medical-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-medical-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              المميزات
            </a>
            <a href="#about" className="text-foreground hover:text-medical-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-medical-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              من نحن
            </a>
            <a href="#contact" className="text-foreground hover:text-medical-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-medical-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">
              اتصل بنا
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-medium hover:scale-105 transition-transform duration-200">
              تسجيل الدخول
            </Button>
            <Button className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300">
              تواصل معنا
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4 animate-fade-in">
              <a href="#features" className="text-foreground hover:text-medical-primary transition-colors font-medium py-2">
                المميزات
              </a>
              <a href="#about" className="text-foreground hover:text-medical-primary transition-colors font-medium py-2">
                من نحن
              </a>
              <a href="#contact" className="text-foreground hover:text-medical-primary transition-colors font-medium py-2">
                اتصل بنا
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                <Button variant="ghost" className="font-medium justify-start hover:scale-105 transition-transform duration-200">
                  تسجيل الدخول
                </Button>
                <Button className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 justify-start">
                  تواصل معنا
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};