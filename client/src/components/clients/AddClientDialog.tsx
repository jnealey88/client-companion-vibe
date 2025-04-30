import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema, InsertClient, statusOptions, industryOptions } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

export default function AddClientDialog({
  open,
  onOpenChange,
  onClientAdded,
}: AddClientDialogProps) {
  const { toast } = useToast();
  
  const formSchema = insertClientSchema.extend({
    status: z.string().min(1, "Status is required"),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactName: "",
      contactTitle: "",
      email: "",
      phone: "",
      industry: "Technology", // Set a default industry
      status: "Discovery",
      websiteUrl: "",
      projectName: "Website Redesign", // Set a default project name
      projectDescription: "", // This will be used for business description
      projectStatus: "Active",
      projectValue: 5000, // Set a default value
    },
  });
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await apiRequest("POST", "/api/clients", data);
      toast({
        title: "Success",
        description: "Client has been added successfully",
      });
      form.reset();
      onOpenChange(false);
      onClientAdded();
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold text-primary">Add New Client</DialogTitle>
          <DialogDescription className="text-gray-500 mt-1">
            Fill in the client details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-base">Company Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter company name" 
                        className="py-6" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      The name of the company or organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Contact Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter primary contact name" 
                        className="py-5"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Your main contact person at the company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Contact Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter job title" 
                        className="py-5"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Job position or role of the contact
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="contact@example.com" 
                        className="py-5"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Primary email for client communication
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Phone *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(555) 123-4567" 
                        className="py-5"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Contact's business phone number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Industry field hidden but populated automatically */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Project Phase *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-[42px]">
                          <SelectValue placeholder="Select project phase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.slice(1).map((status: string) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs text-gray-500">
                      Current phase in the client relationship
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-base">Website URL (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com" 
                        className="py-5"
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-500">
                      Client's company website address - useful for analysis and research
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Hidden fields required by the database schema */}
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <FormField
                control={form.control}
                name="projectValue"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <FormField
                control={form.control}
                name="projectStatus"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the business operations, goals, and target audience" 
                        className="min-h-[120px]"
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide information about the client's business to help with project planning
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Client</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
