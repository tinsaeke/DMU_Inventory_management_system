import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportReportProps {
  reportType: 'inventory' | 'requests' | 'transfers' | 'audit';
  filters?: {
    departmentId?: string;
    collegeId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

const generateInventoryReport = async (filters?: any) => {
  const query = supabase
    .from('items')
    .select(`
      asset_tag,
      name,
      description,
      serial_number,
      status,
      purchase_date,
      purchase_cost,
      departments(name, colleges(name)),
      profiles(full_name)
    `);

  if (filters?.departmentId) {
    query.eq('owner_department_id', filters.departmentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data?.map(item => ({
    'Asset Tag': item.asset_tag,
    'Item Name': item.name,
    'Description': item.description || '',
    'Serial Number': item.serial_number || '',
    'Status': item.status,
    'Department': item.departments?.name || '',
    'College': item.departments?.colleges?.name || '',
    'Current Custodian': item.profiles?.full_name || 'Unassigned',
    'Purchase Date': item.purchase_date || '',
    'Purchase Cost': item.purchase_cost || '',
  }));
};

const generateRequestsReport = async (filters?: any) => {
  const query = supabase
    .from('item_requests')
    .select(`
      item_name,
      item_description,
      quantity,
      status,
      created_at,
      profiles!requester_id(full_name),
      departments(name, colleges(name))
    `);

  if (filters?.dateFrom) {
    query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data?.map(request => ({
    'Item Name': request.item_name,
    'Description': request.item_description || '',
    'Quantity': request.quantity,
    'Status': request.status,
    'Requester': request.profiles?.full_name || '',
    'Department': request.departments?.name || '',
    'College': request.departments?.colleges?.name || '',
    'Request Date': new Date(request.created_at).toLocaleDateString(),
  }));
};

const generateTransfersReport = async (filters?: any) => {
  const query = supabase
    .from('item_transfers')
    .select(`
      status,
      created_at,
      items(name, asset_tag),
      initiator:profiles!initiator_id(full_name),
      receiver:profiles!receiver_id(full_name)
    `);

  if (filters?.dateFrom) {
    query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data?.map(transfer => ({
    'Item Name': transfer.items?.name || '',
    'Asset Tag': transfer.items?.asset_tag || '',
    'From': transfer.initiator?.full_name || '',
    'To': transfer.receiver?.full_name || '',
    'Status': transfer.status,
    'Transfer Date': new Date(transfer.created_at).toLocaleDateString(),
  }));
};

const generateAuditReport = async (filters?: any) => {
  const query = supabase
    .from('audit_log')
    .select(`
      timestamp,
      action,
      target_resource_type,
      details,
      profiles(full_name, role)
    `);

  if (filters?.dateFrom) {
    query.gte('timestamp', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query.lte('timestamp', filters.dateTo);
  }

  const { data, error } = await query.order('timestamp', { ascending: false }).limit(1000);
  if (error) throw new Error(error.message);

  return data?.map(log => ({
    'Timestamp': new Date(log.timestamp).toLocaleString(),
    'User': log.profiles?.full_name || 'System',
    'Role': log.profiles?.role || '',
    'Action': log.action,
    'Resource Type': log.target_resource_type || '',
    'Details': JSON.stringify(log.details || {}),
  }));
};

export default function ExportReport({ reportType, filters }: ExportReportProps) {
  const handleExport = async () => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (reportType) {
        case 'inventory':
          data = await generateInventoryReport(filters) || [];
          filename = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'requests':
          data = await generateRequestsReport(filters) || [];
          filename = `requests_report_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'transfers':
          data = await generateTransfersReport(filters) || [];
          filename = `transfers_report_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'audit':
          data = await generateAuditReport(filters) || [];
          filename = `audit_report_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
      }

      if (data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available for the selected criteria.',
          variant: 'destructive',
        });
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
      }));
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, reportType.charAt(0).toUpperCase() + reportType.slice(1));

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export Successful',
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
    </Button>
  );
}