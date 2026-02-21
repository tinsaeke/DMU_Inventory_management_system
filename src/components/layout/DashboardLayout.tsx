import { RoleSidebar } from "./RoleSidebar";
import { PageHeader } from "./PageHeader";
import { Footer } from "./Footer";
import { UserRole } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  userEmail: string;
  collegeName?: string;
  departmentName?: string;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
}

export function DashboardLayout({
  children,
  role,
  userName,
  userEmail,
  collegeName,
  departmentName,
  pageTitle,
  pageSubtitle,
  headerActions,
  showSearch,
  searchPlaceholder,
  onSearch,
  notificationCount,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout(); // Call the actual Supabase logout function
    navigate('/login'); // Redirect after successful logout
  };

  return (
    <div className="min-h-screen bg-background flex">
      <RoleSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        collegeName={collegeName}
        departmentName={departmentName}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col ml-64">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={headerActions}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          notificationCount={notificationCount}
        />
        
        <main className="flex-1 p-6">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
