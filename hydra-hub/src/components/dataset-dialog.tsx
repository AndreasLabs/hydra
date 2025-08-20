import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import adze from 'adze';

const logger = adze.namespace('components').namespace('dataset-dialog');

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100, 'Key too long'),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

type FormData = z.infer<typeof formSchema>;

export type Dataset = {
  key: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  queries: Array<{
    query: string;
    type: 'objectstore/path' | 'objectstore/object' | 'objectstore/bucket';
    exclude: boolean;
  }>;
};

interface DatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset?: Dataset | null;
  onSave: () => void;
}

export function DatasetDialog({ open, onOpenChange, dataset, onSave }: DatasetDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!dataset;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: dataset?.key || '',
      name: dataset?.name || '',
      description: dataset?.description || '',
    },
  });

  // Reset form when dataset changes
  React.useEffect(() => {
    if (dataset) {
      form.reset({
        key: dataset.key,
        name: dataset.name,
        description: dataset.description,
      });
    } else {
      form.reset({
        key: '',
        name: '',
        description: '',
      });
    }
  }, [dataset, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = '/api/datasets';
      const method = 'POST'; // We only support creating new datasets for now

      const requestBody = {
        key: data.key,
        name: data.name,
        description: data.description || '',
        queries: [], // Start with empty queries, user can add them later
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        onSave();
        form.reset();
        onOpenChange(false);
      } else {
        const error = await response.json();
        logger.error('Failed to save dataset', { error });
        alert('Failed to save dataset: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Failed to save dataset', { error });
      alert('Failed to save dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Dataset' : 'Create Dataset'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the dataset information below.'
              : 'Create a new dataset to organize and query your data.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-dataset-key"
                      {...field}
                      disabled={isEditing} // Keys cannot be changed after creation
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditing 
                      ? 'Dataset keys cannot be changed after creation.'
                      : 'A unique identifier for this dataset (lowercase, hyphens allowed).'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Dataset" {...field} />
                  </FormControl>
                  <FormDescription>
                    A human-readable name for this dataset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this dataset contains and how it's used..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the dataset's purpose and contents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
