import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SystemUpdatesTab from "./components/SystemUpdatesTab";
import MaintenanceTab from "./components/MaintenanceTab";
import BackupsTab from "./components/BackupsTab";

const Updates = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Windows & System Updates</h1>
          <p className="text-muted-foreground">Manage system updates, maintenance, and backups</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <Tabs defaultValue="updates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="updates">System Updates</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="space-y-4">
            <SystemUpdatesTab />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceTab />
          </TabsContent>

          <TabsContent value="backups" className="space-y-4">
            <BackupsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Updates;
