import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(3); // Default to pic4 (index 3)

  const campusImages = [
    '/images/pic1.jpg',
    '/images/pic2.jpg', 
    '/images/pic3.jpg',
    '/images/pic4.jpg',
    '/images/pic5.jpg'
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % campusImages.length);
  };

  // Fetch real statistics
  const { data: stats } = useQuery({
    queryKey: ['login-stats'],
    queryFn: async () => {
      const [itemsResult, collegesResult, departmentsResult] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact', head: true }),
        supabase.from('colleges').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true })
      ]);
      
      return {
        items: itemsResult.count || 0,
        colleges: collegesResult.count || 0,
        departments: departmentsResult.count || 0
      };
    },
    refetchInterval: 60000
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    if (!authData.user) {
      setError("An unexpected error occurred: user data not found after login.");
      setIsLoading(false);
      return;
    }

    // 2. Immediately check for a corresponding profile to prevent users getting stuck
    const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();
    
    if (profileError) {
        setError("Authentication successful, but your user profile was not found. Please contact an administrator to have it created.");
        // Log the user out to prevent a confusing state where they are half-logged-in
        await supabase.auth.signOut(); 
        setIsLoading(false);
        return;
    }

    // 3. If we are here, auth succeeded and a profile exists.
    // The onAuthStateChange listener in useAuth will now take over and 
    // the PublicRoute will redirect to the correct dashboard.
    // The isLoading spinner will remain until the page component unmounts.
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden cursor-pointer" onClick={nextImage}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={campusImages[currentImageIndex]} 
            alt="DMU Campus" 
            className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
            onError={(e) => {
              console.log('Image failed to load:', campusImages[currentImageIndex]);
              // Show a colored background instead of hiding
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => console.log('Image loaded:', campusImages[currentImageIndex])}
          />
          {/* Fallback background if image fails */}
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-20" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/30 to-primary/50" />
        
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <img 
                src="/images/dmu-logo.png" 
                alt="DMU Logo" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  console.log('Logo failed to load');
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log('Logo loaded successfully')}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Debre Markos University</h1>
              <p className="text-sm text-white/70">Property Management System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white mb-4">
              Enterprise-Grade 
              Inventory Management
            </h2>
            <p className="text-white/80 leading-relaxed">
              Comprehensive inventory tracking, multi-level approval workflows, 
              and complete audit trails for institutional accountability.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{stats?.items?.toLocaleString() || '0'}</p>
                <p className="text-sm text-white/70">Items Tracked</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{stats?.colleges || '0'}</p>
                <p className="text-sm text-white/70">Colleges</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-2xl font-bold text-white">{stats?.departments || '0'}</p>
                <p className="text-sm text-white/70">Departments</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-sm text-white/70">Audit Coverage</p>
              </div>
            </div>

            {/* Image Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {campusImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Debre Markos University. All rights reserved.
            </p>
            <p className="text-xs text-white/60">
              Click to view campus images
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <img 
                src="/images/dmu-logo.png" 
                alt="DMU Logo" 
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <GraduationCap className="h-6 w-6 text-primary-foreground hidden" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">DMU</h1>
              <p className="text-xs text-muted-foreground">Inventory Management</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access the Inventory Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@dmu.edu.et"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
