
"use client";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { About } from "./components/About";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ThemeProvider } from "next-themes";

const Index = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={['light', 'dark']}>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main>
          <Hero />
          <Features />
          <About />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default Index;
