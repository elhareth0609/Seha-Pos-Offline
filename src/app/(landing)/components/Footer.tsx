import { Heart, Mail, Phone, MapPin, MessageCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-black text-white py-16" dir="rtl">
      <div className="container mx-auto px-6 animate-fade-in">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4 animate-fade-in" style={{animationDelay: "0.2s"}}>
            <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">ميدجرام</span>
            </div>
            <p className="text-gray-300 leading-relaxed hover:text-white transition-colors duration-300">
              نظام إدارة الصيدليات الأكثر تطوراً في المنطقة. نساعدك في تحويل صيدليتك إلى مركز متكامل للكفاءة والربحية.
            </p>
          </div>

          {/* Contact */}
          <div className="animate-fade-in" style={{animationDelay: "0.4s"}}>
            <h4 className="text-lg font-semibold mb-4 text-white">تواصل معنا</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                <Phone className="h-5 w-5 text-medical-primary" />
                <span className="text-gray-300 hover:text-white transition-colors duration-300">+964 770 123 4567</span>
              </div>
              <div className="flex items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                <Mail className="h-5 w-5 text-medical-primary" />
                <span className="text-gray-300 hover:text-white transition-colors duration-300">support@medgram.iq</span>
              </div>
              <div className="flex items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                <MapPin className="h-5 w-5 text-medical-primary" />
                <span className="text-gray-300 hover:text-white transition-colors duration-300">العراق - بغداد</span>
              </div>
            </div>
            
            {/* Social Media Buttons */}
            <div className="mt-6">
              <h5 className="text-base font-medium mb-3 text-white">تابعنا على</h5>
              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:scale-110 transition-all duration-300"
                  onClick={() => window.open('https://wa.me/9647762244627', '_blank')}
                >
                  <MessageCircle className="h-4 w-4" />
                  واتساب
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:scale-110 transition-all duration-300"
                  onClick={() => window.open('https://www.instagram.com/midgram.iq?igsh=cWZvcHhpbWE4Ym41', '_blank')}
                >
                  <Instagram className="h-4 w-4" />
                  انستغرام
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-muted-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm hover:text-white transition-colors duration-300">
              © 2025 ميدجرام. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
                سياسة الخصوصية
              </a>
              <a href="#terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                شروط الاستخدام
              </a>
              <a href="#cookies" className="text-gray-400 hover:text-white transition-colors duration-300">
                سياسة ملفات تعريف الارتباط
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};