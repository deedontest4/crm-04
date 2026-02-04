import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, FileText, Palette } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AuditLogsSettings from "@/components/settings/AuditLogsSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user-management");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - fixed height matching sidebar */}
      <div className="flex-shrink-0 h-16 border-b bg-background px-6 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1">
            <TabsTrigger value="user-management" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">User Management</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Audit & Logs</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user-management" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="audit-logs" className="mt-6">
            <AuditLogsSettings />
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <AppearanceSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
