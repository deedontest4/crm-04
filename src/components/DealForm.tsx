
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "active" | "inactive" | "prospect";
}

interface DealFormProps {
  onClose: () => void;
  onSubmit: (deal: {
    title: string;
    value: number;
    stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
    contact: string;
    probability: number;
    closeDate: string;
  }) => void;
  contacts: Contact[];
}

export const DealForm = ({ onClose, onSubmit, contacts }: DealFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    stage: "lead" as "lead" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost",
    contact: "",
    probability: "",
    closeDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.value && formData.contact && formData.closeDate) {
      onSubmit({
        title: formData.title,
        value: parseFloat(formData.value),
        stage: formData.stage,
        contact: formData.contact,
        probability: parseInt(formData.probability) || 50,
        closeDate: formData.closeDate,
      });
      setFormData({
        title: "",
        value: "",
        stage: "lead",
        contact: "",
        probability: "",
        closeDate: "",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>
            Enter the deal details below to add them to your pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Value *
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleChange("value", e.target.value)}
                className="col-span-3"
                placeholder="0"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact *
              </Label>
              <Select
                value={formData.contact}
                onValueChange={(value) => handleChange("contact", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.name}>
                      {contact.name} - {contact.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage" className="text-right">
                Stage
              </Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => handleChange("stage", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="probability" className="text-right">
                Probability %
              </Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleChange("probability", e.target.value)}
                className="col-span-3"
                placeholder="50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="closeDate" className="text-right">
                Close Date *
              </Label>
              <Input
                id="closeDate"
                type="date"
                value={formData.closeDate}
                onChange={(e) => handleChange("closeDate", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Deal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
