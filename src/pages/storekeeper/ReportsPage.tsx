import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, BarChart3, TrendingUp, Package, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import ExportReport from '@/components/shared/ExportReport';

export default function ReportsPage() {
  const { profile, user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from('items')
        .select('status, purchase_cost');
      
      if (error) throw error;
      
      const stats = {
        total: items.length,
        available: items.filter(i => i.status === 'Available').length,
        allocated: items.filter(i => i.status === 'Allocated').length,
        maintenance: items.filter(i => i.status === 'Under Maintenance').length,
        damaged: items.filter(i => i.status === 'Damaged').length,
        totalValue: items.reduce((sum, item) => sum + (item.purchase_cost || 0), 0)
      };
      
      return stats;
    }
  });

  const { data: requestStats } = useQuery({
    queryKey: ['request-stats', selectedPeriod],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));
      
      const { data: requests, error } = await supabase
        .from('item_requests')
        .select('status, created_at, urgency')
        .gte('created_at', daysAgo.toISOString());
      
      if (error) throw error;
      
      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status.includes('pending')).length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        critical: requests.filter(r => r.urgency === 'critical').length,
        high: requests.filter(r => r.urgency === 'high').length
      };
      
      return stats;
    }
  });

  const { data: departmentStats } = useQuery({
    queryKey: ['department-stats'],
    queryFn: async () => {
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          items:items(id),
          requests:item_requests(id)
        `);
      
      if (error) throw error;
      
      return departments.map(dept => ({
        name: dept.name,
        itemCount: dept.items?.length || 0,
        requestCount: dept.requests?.length || 0
      }));
    }
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('item_requests')
        .select(`
          *,
          requester:profiles!requester_id(full_name),
          department:departments(name)
        `)
        .order('updated_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return requests || [];
    }
  });

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Reports & Analytics"
      pageSubtitle="Comprehensive inventory and request analytics"
      headerActions={
        <div className="flex gap-2">
          <ExportReport reportType="inventory" />
          <ExportReport reportType="requests" />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Period Selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Report Period:</span>
          <div className="flex gap-2">
            {['7', '30', '90'].map((days) => (
              <Button
                key={days}
                variant={selectedPeriod === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(days)}
              >
                {days} days
              </Button>
            ))}
          </div>
        </div>

        {/* Inventory Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inventoryStats?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{inventoryStats?.available || 0}</div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{inventoryStats?.allocated || 0}</div>
                <div className="text-sm text-gray-600">Allocated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{inventoryStats?.maintenance || 0}</div>
                <div className="text-sm text-gray-600">Maintenance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{inventoryStats?.damaged || 0}</div>
                <div className="text-sm text-gray-600">Damaged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${inventoryStats?.totalValue || 0}</div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Request Statistics (Last {selectedPeriod} days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{requestStats?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{requestStats?.pending || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{requestStats?.approved || 0}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{requestStats?.rejected || 0}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{requestStats?.critical || 0}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{requestStats?.high || 0}</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentStats?.slice(0, 5).map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-gray-600">{dept.requestCount} requests</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{dept.itemCount}</div>
                      <div className="text-sm text-gray-600">items</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{activity.item_name}</div>
                      <div className="text-sm text-gray-600">
                        {activity.requester?.full_name} • {activity.department?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(activity.urgency)}>
                        {activity.urgency}
                      </Badge>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}