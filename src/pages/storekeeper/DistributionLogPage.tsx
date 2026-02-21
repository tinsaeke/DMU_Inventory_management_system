import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, Package } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DataService } from '@/services/DataService';
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

type Allocation = {
  id: string;
  updated_at: string;
  item_name: string;
  quantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requester: { full_name: string } | null;
  department: { name: string } | null;
  item: { name: string, asset_tag: string } | null;
};

export default function DistributionLogPage() {
  const { profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: allocations = [], isLoading } = useQuery<Allocation[]>({
    queryKey: ['distribution-log'],
    queryFn: async () => {
      // Explicit column relations to avoid FK ambiguity
      const { data, error } = await DataService.supabase
        .from('item_requests')
        .select(`
          id,
          updated_at,
          item_name,
          quantity,
          urgency,
          requester:profiles!requester_id(full_name),
          department:departments!requester_department_id(name),
          item:items!allocated_item_id(name, asset_tag)
        `)
        .eq('status', 'approved')
        .not('allocated_item_id', 'is', null)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching distribution log:", error);
        throw error;
      };
      return data || [];
    },
  });

  const filteredAllocations = allocations.filter(allocation => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      allocation.item_name?.toLowerCase().includes(lowerSearchTerm) ||
      allocation.requester?.full_name?.toLowerCase().includes(lowerSearchTerm) ||
      allocation.department?.name?.toLowerCase().includes(lowerSearchTerm) ||
      allocation.item?.asset_tag?.toLowerCase().includes(lowerSearchTerm)
    );
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(filteredAllocations, 25);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUrgencyBadge = (urgency: string) => {
    switch(urgency) {
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Distribution Log"
      pageSubtitle="Track all item allocations and distributions"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by item, requester, department, asset tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
                icon={<Package className="h-8 w-8 text-blue-600" />}
                label="Total Allocations"
                value={isLoading ? <Skeleton className="h-8 w-20" /> : allocations.length}
            />
            <StatCard
                icon={<User className="h-8 w-8 text-green-600" />}
                label="Unique Requesters"
                value={isLoading ? <Skeleton className="h-8 w-20" /> : new Set(allocations.map(a => a.requester?.full_name)).size}
            />
            <StatCard
                icon={<Calendar className="h-8 w-8 text-purple-600" />}
                label="Today's Allocations"
                value={isLoading ? <Skeleton className="h-8 w-20" /> : allocations.filter(a => new Date(a.updated_at).toDateString() === new Date().toDateString()).length}
            />
        </div>


        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Recent Distributions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated To
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <tr key={i}><td colSpan={5} className="px-2 py-2"><Skeleton className="h-4 w-full" /></td></tr>
                    ))
                ) : paginatedData.map((allocation) => (
                  <tr key={allocation.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <div className="text-sm font-medium text-gray-900">
                        {allocation.item?.name || allocation.item_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {allocation.item?.asset_tag || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="text-sm font-medium text-gray-900">{allocation.requester?.full_name}</div>
                      <div className="text-xs text-gray-500">{allocation.department?.name}</div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="text-xs text-gray-900">
                        {formatDate(allocation.updated_at)}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <Badge className={`${getUrgencyBadge(allocation.urgency)} text-xs`}>
                        {allocation.urgency}
                      </Badge>
                    </td>
                    <td className="px-2 py-1">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Allocated
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredAllocations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                      {searchTerm ? 'No distributions found matching your search.' : 'No distributions recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredAllocations.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg border flex items-center gap-4">
        {icon}
        <div>
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </div>
)