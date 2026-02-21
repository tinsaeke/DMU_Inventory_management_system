import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { UserRole } from "@/types";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  FileText,
  ClipboardList,
  ArrowLeftRight,
  Settings,
  Bell,
  History,
  BarChart3,
  Shield,
  Database,
  FolderTree,
  UserCheck,
  PackageSearch,
  Warehouse,
  FileCheck,
  ChevronDown,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

interface RoleSidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  collegeName?: string;
  departmentName?: string;
  onLogout: () => void;
}

const roleNavigation: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Colleges', href: '/admin/colleges', icon: Building2 },
    { label: 'Departments', href: '/admin/departments', icon: FolderTree },
    { label: 'Role Assignment', href: '/admin/roles', icon: Shield },
    { label: 'System Settings', href: '/admin/settings', icon: Settings },
    { label: 'Database Backup', href: '/admin/backup', icon: Database },
  ],
  college_dean: [
    { label: 'Dashboard', href: '/dean', icon: LayoutDashboard },
    { label: 'Pending Approvals', href: '/dean/approvals', icon: FileCheck },
    { label: 'Departments', href: '/dean/departments', icon: FolderTree },
    { label: 'College Inventory', href: '/dean/inventory', icon: Package },
    { label: 'Transfer Requests', href: '/dean/transfers', icon: ArrowLeftRight },
    { label: 'Incoming Transfers', href: '/dean/incoming-transfers', icon: ArrowLeftRight },
    { label: 'Reports', href: '/dean/reports', icon: BarChart3 },
    { label: 'Notifications', href: '/dean/notifications', icon: Bell },
  ],
  department_head: [
    { label: 'Dashboard', href: '/department', icon: LayoutDashboard },
    { label: 'My Items', href: '/department/my-items', icon: Package },
    { label: 'Pending Approvals', href: '/department/approvals', icon: FileCheck },
    { label: 'Transfer Approvals', href: '/department/transfer-approvals', icon: ArrowLeftRight },
    { label: 'Staff Members', href: '/department/staff', icon: Users },
    { label: 'Department Items', href: '/department/items', icon: Package },
    { label: 'Item Requests', href: '/department/requests', icon: ClipboardList },
    { label: 'Transfer Item', href: '/department/transfer', icon: ArrowLeftRight },
    { label: 'Incoming Transfers', href: '/department/incoming-transfers', icon: ArrowLeftRight },
    { label: 'Transfers', href: '/department/transfers', icon: ArrowLeftRight },
    { label: 'Reports', href: '/department/reports', icon: BarChart3 },
    { label: 'Notifications', href: '/department/notifications', icon: Bell },
  ],
  storekeeper: [
    { label: 'Dashboard', href: '/store', icon: LayoutDashboard },
    { label: 'Pending Allocations', href: '/store/allocations', icon: FileCheck },
    { label: 'Inventory', href: '/store/inventory', icon: Warehouse },
    { label: 'Item Registry', href: '/store/registry', icon: PackageSearch },
    { label: 'Distribution Log', href: '/store/distribution', icon: FileText },
    { label: 'Transfer Approvals', href: '/store/transfers', icon: ArrowLeftRight },
    { label: 'Transfer History', href: '/store/transfer-history', icon: History },
    { label: 'Return Requests', href: '/store/returns', icon: ArrowLeftRight },
    { label: 'Reports', href: '/store/reports', icon: BarChart3 },
    { label: 'Notifications', href: '/store/notifications', icon: Bell },
  ],
  staff: [
    { label: 'My Dashboard', href: '/staff', icon: LayoutDashboard },
    { label: 'My Items', href: '/staff/items', icon: Package },
    { label: 'Request Item', href: '/staff/request', icon: ClipboardList },
    { label: 'My Requests', href: '/staff/requests', icon: FileText },
    { label: 'Transfer Item', href: '/staff/transfer', icon: ArrowLeftRight },
    { label: 'Incoming Transfers', href: '/staff/incoming-transfers', icon: ArrowLeftRight },
    { label: 'Transfer History', href: '/staff/transfer-history', icon: History },
    { label: 'Notifications', href: '/staff/notifications', icon: Bell },
  ],
};

const roleLabels: Record<UserRole, string> = {
  admin: 'System Administrator',
  college_dean: 'College Dean',
  department_head: 'Department Head',
  storekeeper: 'Store Keeper',
  staff: 'Staff Member',
};

export function RoleSidebar({
  role,
  userName,
  userEmail,
  collegeName,
  departmentName,
  onLogout,
}: RoleSidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const navItems = roleNavigation[role];

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / Header */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg">
          <img 
            src="/images/dmu-logo.png" 
            alt="DMU Logo" 
            className="h-6 w-6 object-contain"
            onError={(e) => {
              // Fallback to graduation cap if logo fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <GraduationCap className="h-5 w-5 hidden text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">DMU</span>
          <span className="text-[10px] text-sidebar-foreground/60">Inventory Management</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{roleLabels[role]}</p>
          </div>
        </div>
        {(collegeName || departmentName) && (
          <div className="mt-2 space-y-0.5">
            {collegeName && (
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                <span className="font-medium">College:</span> {collegeName}
              </p>
            )}
            {departmentName && (
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                <span className="font-medium">Department:</span> {departmentName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label);

            return (
              <li key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "text-sidebar-foreground/80"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-3">
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                location.pathname === child.href
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <child.icon className="h-3.5 w-3.5" />
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
