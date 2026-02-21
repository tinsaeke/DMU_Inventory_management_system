import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataStatCard } from "@/components/ui/data-stat-card";
import { ApprovalQueueTable } from "@/components/tables/ApprovalQueueTable";
import { ItemsTable } from "@/components/tables/ItemsTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCheck,
  Package,
  Users,
  ClipboardList,
  AlertCircle,
  Plus,
} from "lucide-react";
import { ApprovalQueueItem, Item } from "@/types";

// Mock data
const pendingApprovals: ApprovalQueueItem[] = [
  {
    id: '1',
    type: 'request',
    requesterName: 'W/ro Meron Assefa',
    requesterDepartment: 'Computer Science',
    itemName: 'Office Chair - Ergonomic',
    category: 'Office Furniture',
    justification: 'Current chair is broken and causing back pain. Need replacement for productivity.',
    urgency: 'medium',
    submittedAt: new Date('2024-01-18T09:00:00'),
    previousApprovals: [
      { role: 'Dept. Head', status: 'pending' },
      { role: 'Dean', status: 'pending' },
      { role: 'Store', status: 'pending' },
    ],
  },
  {
    id: '2',
    type: 'request',
    requesterName: 'Ato Dawit Mengistu',
    requesterDepartment: 'Computer Science',
    itemName: null,
    category: 'IT Equipment',
    justification: 'Request for external monitor for software development. Dual screen setup improves productivity.',
    urgency: 'low',
    submittedAt: new Date('2024-01-17T14:30:00'),
    previousApprovals: [
      { role: 'Dept. Head', status: 'pending' },
      { role: 'Dean', status: 'pending' },
      { role: 'Store', status: 'pending' },
    ],
  },
];

const departmentItems: (Item & { categoryName: string; custodianName: string })[] = [
  {
    id: '1',
    assetTag: 'DMU-IT-001245',
    name: 'Dell OptiPlex 7090',
    categoryId: '1',
    categoryName: 'IT Equipment',
    departmentId: 'cs',
    status: 'allocated',
    custodianId: '1',
    custodianName: 'W/ro Meron Assefa',
    condition: 'good',
    acquisitionDate: new Date('2023-06-15'),
    serialNumber: 'CN0XYZ123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    assetTag: 'DMU-OF-000892',
    name: 'Executive Office Desk',
    categoryId: '2',
    categoryName: 'Office Furniture',
    departmentId: 'cs',
    status: 'allocated',
    custodianId: '2',
    custodianName: 'Dr. Tigist Hailu',
    condition: 'excellent',
    acquisitionDate: new Date('2022-09-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    assetTag: 'DMU-IT-001567',
    name: 'HP LaserJet Pro',
    categoryId: '1',
    categoryName: 'IT Equipment',
    departmentId: 'cs',
    status: 'available',
    custodianName: '',
    condition: 'good',
    acquisitionDate: new Date('2023-03-20'),
    serialNumber: 'VN123XY789',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    assetTag: 'DMU-LAB-000234',
    name: 'Projector - Epson EB-X51',
    categoryId: '3',
    categoryName: 'Lab Equipment',
    departmentId: 'cs',
    status: 'under_maintenance',
    custodianName: '',
    condition: 'fair',
    acquisitionDate: new Date('2021-11-10'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function DepartmentHeadDashboard() {
  const handleApprove = (id: string) => console.log('Approving:', id);
  const handleReject = (id: string) => console.log('Rejecting:', id);
  const handleView = (id: string) => console.log('Viewing:', id);
  const handleViewItem = (id: string) => console.log('View item:', id);
  const handleEditItem = (id: string) => console.log('Edit item:', id);
  const handleViewHistory = (id: string) => console.log('View history:', id);

  return (
    <DashboardLayout
      role="department_head"
      userName="Dr. Tigist Hailu"
      userEmail="head@dmu.edu.et"
      collegeName="Technology College"
      departmentName="Computer Science"
      pageTitle="Department Management"
      pageSubtitle="Computer Science Department"
      showSearch
      searchPlaceholder="Search items, staff..."
      notificationCount={8}
    >
      <div className="space-y-6">
        {/* Alert */}
        {pendingApprovals.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-info shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {pendingApprovals.length} staff requests need your review
              </p>
              <p className="text-xs text-muted-foreground">
                Review and forward to College Dean for approval
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataStatCard
            title="Pending Approvals"
            value={pendingApprovals.length}
            subtitle="Staff requests"
            icon={FileCheck}
            variant="warning"
          />
          <DataStatCard
            title="Department Items"
            value={127}
            subtitle="23 available"
            icon={Package}
            variant="primary"
          />
          <DataStatCard
            title="Staff Members"
            value={18}
            subtitle="Active personnel"
            icon={Users}
            variant="info"
          />
          <DataStatCard
            title="Open Requests"
            value={6}
            subtitle="In approval pipeline"
            icon={ClipboardList}
            variant="default"
          />
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="approvals" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="approvals" className="gap-2">
                <FileCheck className="h-4 w-4" />
                Pending Approvals
                {pendingApprovals.length > 0 && (
                  <span className="ml-1 rounded-full bg-warning/20 text-warning px-1.5 py-0.5 text-xs font-medium">
                    {pendingApprovals.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="items" className="gap-2">
                <Package className="h-4 w-4" />
                Department Items
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2">
                <Users className="h-4 w-4" />
                Staff
              </TabsTrigger>
            </TabsList>

            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          <TabsContent value="approvals" className="mt-4">
            <ApprovalQueueTable
              items={pendingApprovals}
              onApprove={handleApprove}
              onReject={handleReject}
              onView={handleView}
            />
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <ItemsTable
              items={departmentItems}
              onView={handleViewItem}
              onEdit={handleEditItem}
              onViewHistory={handleViewHistory}
              showDepartment={false}
            />
          </TabsContent>

          <TabsContent value="staff" className="mt-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Position</th>
                    <th>Items Assigned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'W/ro Meron Assefa', email: 'meron@dmu.edu.et', position: 'Lecturer', items: 4, status: 'Active' },
                    { name: 'Ato Dawit Mengistu', email: 'dawit@dmu.edu.et', position: 'Assistant Lecturer', items: 2, status: 'Active' },
                    { name: 'Dr. Yonas Bekele', email: 'yonas@dmu.edu.et', position: 'Associate Professor', items: 5, status: 'Active' },
                    { name: 'W/rt Hanna Tadesse', email: 'hanna@dmu.edu.et', position: 'Lab Technician', items: 12, status: 'Active' },
                  ].map((staff, index) => (
                    <tr key={index}>
                      <td className="font-medium">{staff.name}</td>
                      <td className="text-muted-foreground">{staff.email}</td>
                      <td>{staff.position}</td>
                      <td>{staff.items}</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
                          {staff.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
