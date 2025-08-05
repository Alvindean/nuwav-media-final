"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Menu,
  X,
  Sun,
  Moon,
  ShoppingCart,
  User,
  Search,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Headphones,
  Users,
  Award,
  Globe,
  Zap,
  Target
} from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const heroSlides = [
    {
      title: "Amplify Your Brand's Voice",
      subtitle:
        "We create powerful narratives for sports, podcasts, real estate, legal firms, healthcare, and luxury brands",
      cta: "Discover Our Services"
    },
    {
      title: "Premium Professional Marketing",
      subtitle:
        "Specialized marketing for law firms, medical practices, financial advisors, and high-end service providers",
      cta: "Explore Premium Services"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "dark bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          darkMode
            ? "bg-gray-900/95 backdrop-blur-sm"
            : "bg-white/95 backdrop-blur-sm"
        } border-b ${darkMode ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NU WAV Media
              </span>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden pt-16">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
            }}
          >
            <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
              <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 opacity-90">
                  {slide.subtitle}
                </p>
                <button className="bg-black/30 backdrop-blur-md hover:bg-black/40 border-2 border-white/50 hover:border-yellow-400/70 text-white px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105">
                  {slide.cta}{" "}
                  <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Services Section */}
      <section className={`py-20 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Premium Industry Solutions</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Specialized marketing expertise for high-value industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? "bg-gray-900 border border-gray-700"
                  : "bg-white shadow-lg"
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real Estate Marketing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Premium marketing solutions for luxury real estate agents and
                developers.
              </p>
            </div>

            <div
              className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? "bg-gray-900 border border-gray-700"
                  : "bg-white shadow-lg"
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Legal Firm Marketing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ethical marketing strategies for law firms and legal professionals.
              </p>
            </div>

            <div
              className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
                darkMode
                  ? "bg-gray-900 border border-gray-700"
                  : "bg-white shadow-lg"
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Healthcare Marketing</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                HIPAA-compliant marketing for medical practices and healthcare
                providers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
