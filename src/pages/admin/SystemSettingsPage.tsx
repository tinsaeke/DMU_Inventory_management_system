import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Settings, Save, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SystemSettings = {
  system_name: string;
  email_notifications: boolean;
  maintenance_mode: boolean;
  session_timeout_minutes: number;
  max_file_size_mb: number;
  backup_retention_days: number;
};

const defaultSettings: SystemSettings = {
  system_name: 'DMU Property Management System',
  email_notifications: true,
  maintenance_mode: false,
  session_timeout_minutes: 30,
  max_file_size_mb: 10,
  backup_retention_days: 30,
};

export default function SystemSettingsPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load system settings
  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      // Since we don't have a system_settings table, return default settings
      // In production, this would fetch from a system_settings table
      return defaultSettings;
    },
  });

  useEffect(() => {
    if (systemSettings) {
      setSettings(systemSettings);
    }
  }, [systemSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      // Simulate saving to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would save to system_settings table
      console.log('Saving system settings:', newSettings);
      
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'System settings have been updated successfully.',
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: 'Failed to save system settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Update document title when system name changes
    if (key === 'system_name') {
      document.title = value || 'DMU Property Management System';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        role="admin"
        userName={profile?.full_name || user?.email || "Admin"}
        userEmail={user?.email || ""}
        pageTitle="System Settings"
        pageSubtitle="Loading system configuration..."
        notificationCount={0}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      userName={profile?.full_name || user?.email || "Admin"}
      userEmail={user?.email || ""}
      pageTitle="System Settings"
      pageSubtitle="Configure system parameters and preferences"
      notificationCount={0}
    >
      <div className="space-y-6">
        {/* Save Changes Banner */}
        {hasChanges && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-700">You have unsaved changes</span>
                </div>
                <Button onClick={handleSave} disabled={saveSettingsMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  value={settings.system_name}
                  onChange={(e) => updateSetting('system_name', e.target.value)}
                  placeholder="Enter system name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="480"
                  value={settings.session_timeout_minutes}
                  onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value) || 30)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_file_size_mb}
                  onChange={(e) => updateSetting('max_file_size_mb', parseInt(e.target.value) || 10)}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Controls */}
          <Card>
            <CardHeader>
              <CardTitle>System Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send email alerts for system events</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Restrict system access for maintenance</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                <Input
                  id="backupRetention"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.backup_retention_days}
                  onChange={(e) => updateSetting('backup_retention_days', parseInt(e.target.value) || 30)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saveSettingsMutation.isPending}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Saving Settings...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}