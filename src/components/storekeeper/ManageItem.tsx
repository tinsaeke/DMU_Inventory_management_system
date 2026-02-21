
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { DataService } from "@/services/DataService";
import { useEffect } from "react";
import { Item } from "@/types";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  serial_number: z.string().optional(),
  asset_tag: z.string().min(1, "Asset tag is required"),
  status: z.enum(["Available", "Allocated", "Under Maintenance", "Damaged"]),
  owner_department_id: z.string().uuid("Invalid department"),
  purchase_date: z.string().optional(),
  purchase_cost: z.coerce.number().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ManageItemProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: ItemFormData) => void;
  item?: Item | null;
  isLoading: boolean;
}

export function ManageItem({
  isOpen,
  onOpenChange,
  onSubmit,
  item,
  isLoading,
}: ManageItemProps) {
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await DataService.supabase
        .from("departments")
        .select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (item) {
      reset({
        ...item,
        purchase_cost: item.purchase_cost ?? undefined,
        purchase_date: item.purchase_date
          ? new Date(item.purchase_date).toISOString().split("T")[0]
          : undefined,
      });
    } else {
      reset({
        name: "",
        description: "",
        serial_number: "",
        asset_tag: "",
        status: "Available",
        owner_department_id: undefined,
        purchase_date: undefined,
        purchase_cost: undefined,
      });
    }
  }, [item, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <Input placeholder="Item Name" {...register("name")} />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
            <Textarea
              placeholder="Description"
              {...register("description")}
            />
            <Input
              placeholder="Serial Number"
              {...register("serial_number")}
            />
            <Input placeholder="Asset Tag" {...register("asset_tag")} />
             {errors.asset_tag && <p className="text-red-500">{errors.asset_tag.message}</p>}

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Allocated">Allocated</SelectItem>
                    <SelectItem value="Under Maintenance">
                      Under Maintenance
                    </SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <Controller
              name="owner_department_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.owner_department_id && <p className="text-red-500">{errors.owner_department_id.message}</p>}

            <Input type="date" {...register("purchase_date")} />
            <Input
              type="number"
              step="0.01"
              placeholder="Purchase Cost"
              {...register("purchase_cost")}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
