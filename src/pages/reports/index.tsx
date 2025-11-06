import { useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  useEffect(() => {
    document.title = "Reports | RealThingks";
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Reports"
        description="Generate and view reports"
        icon={BarChart3}
      />

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The Reports page is set up and secured by access control. Content will be added next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
