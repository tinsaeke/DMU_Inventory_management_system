import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-white">Debre Markos University</span>
          </div>
          
          <div className="text-xs text-gray-400">
            University Asset Guardian © {new Date().getFullYear()} - All rights reserved
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>info@dmu.edu.et</span>
            <span>•</span>
            <span>+251-58-771-1021</span>
          </div>
        </div>
      </div>
    </footer>
  );
}