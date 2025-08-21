
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Calendar, Search, Plus, Filter } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { DealForm } from "@/components/DealForm";

interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "active" | "inactive" | "prospect";
}

interface Deal {
  id: number;
  title: string;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  contact: string;
  probability: number;
  closeDate: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Sample data
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 1, name: "John Doe", email: "john@company.com", company: "Tech Corp", phone: "+1-555-0123", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@startup.io", company: "Startup Inc", phone: "+1-555-0124", status: "prospect" },
    { id: 3, name: "Bob Johnson", email: "bob@enterprise.com", company: "Enterprise Ltd", phone: "+1-555-0125", status: "active" },
  ]);

  const [deals, setDeals] = useState<Deal[]>([
    { id: 1, title: "Software License", value: 50000, stage: "proposal", contact: "John Doe", probability: 75, closeDate: "2024-09-15" },
    { id: 2, title: "Consulting Service", value: 25000, stage: "negotiation", contact: "Jane Smith", probability: 60, closeDate: "2024-09-30" },
    { id: 3, title: "Hardware Purchase", value: 15000, stage: "qualified", contact: "Bob Johnson", probability: 40, closeDate: "2024-10-15" },
  ]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDealsValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter(deal => deal.stage === "closed-won");
  const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const conversionRate = contacts.length > 0 ? Math.round((wonDeals.length / contacts.length) * 100) : 0;

  const addContact = (newContact: Omit<Contact, 'id'>) => {
    setContacts([...contacts, { ...newContact, id: Date.now() }]);
    setShowContactForm(false);
  };

  const addDeal = (newDeal: Omit<Deal, 'id'>) => {
    setDeals([...deals, { ...newDeal, id: Date.now() }]);
    setShowDealForm(false);
  };

  const getStageColor = (stage: Deal['stage']) => {
    switch (stage) {
      case "lead": return "bg-gray-100 text-gray-800";
      case "qualified": return "bg-blue-100 text-blue-800";
      case "proposal": return "bg-yellow-100 text-yellow-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closed-won": return "bg-green-100 text-green-800";
      case "closed-lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "prospect": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">CRM Dashboard</h1>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === "contacts" ? "default" : "ghost"}
                onClick={() => setActiveTab("contacts")}
              >
                Contacts
              </Button>
              <Button
                variant={activeTab === "deals" ? "default" : "ghost"}
                onClick={() => setActiveTab("deals")}
              >
                Deals
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contacts.length}</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalDealsValue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{conversionRate}%</div>
                  <p className="text-xs text-muted-foreground">+2% from last month</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.slice(0, 3).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.company}</p>
                        </div>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Deals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deals.slice(0, 3).map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-muted-foreground">{deal.contact}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${deal.value.toLocaleString()}</p>
                          <Badge className={getStageColor(deal.stage)}>
                            {deal.stage}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Contacts</h2>
              <Button onClick={() => setShowContactForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.company}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === "deals" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Deals</h2>
              <Button onClick={() => setShowDealForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Close Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell>{deal.contact}</TableCell>
                      <TableCell>${deal.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{deal.probability}%</TableCell>
                      <TableCell>{deal.closeDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>

      {/* Forms */}
      {showContactForm && (
        <ContactForm
          onClose={() => setShowContactForm(false)}
          onSubmit={addContact}
        />
      )}

      {showDealForm && (
        <DealForm
          onClose={() => setShowDealForm(false)}
          onSubmit={addDeal}
          contacts={contacts}
        />
      )}
    </div>
  );
};

export default Index;
