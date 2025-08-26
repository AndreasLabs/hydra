import React, { useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useDeployments, useCreateFlowRun } from '@/hooks/prefect';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const schema = z.object({
	deploymentId: z.string().min(1, 'Select a deployment'),
	name: z.string().optional(),
	tags: z.string().optional(), // comma-separated
	scheduled_start_time: z.string().optional(), // ISO string
	parametersJson: z
		.string()
		.refine((val) => {
			try { JSON.parse(val || '{}'); return true; } catch { return false; }
		}, { message: 'Must be valid JSON' }),
});

export type RunWorkflowDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (flowRunId: string) => void;
};

type FormValues = z.infer<typeof schema>;

export function RunWorkflowDialog({ open, onOpenChange, onSuccess }: RunWorkflowDialogProps) {
	const { data: deployments = [], isLoading: deploymentsLoading } = useDeployments({ sort: 'CREATED_DESC', limit: 100 });
	const createFlowRun = useCreateFlowRun();
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			deploymentId: '',
			name: '',
			tags: '',
			scheduled_start_time: '',
			parametersJson: '{\n  \n}',
		},
	});

	const onSubmit = async (values: FormValues) => {
		setSubmitting(true);
		try {
			const parameters = values.parametersJson ? JSON.parse(values.parametersJson) : {};
			const tags = values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
			const scheduled = values.scheduled_start_time && values.scheduled_start_time.trim().length > 0
				? new Date(values.scheduled_start_time).toISOString()
				: undefined;

			const result = await createFlowRun.mutateAsync({
				deploymentId: values.deploymentId,
				options: {
					parameters,
					name: values.name?.trim() || undefined,
					tags,
					scheduled_start_time: scheduled ?? null,
				},
			});
			if (result?.id) onSuccess?.(result.id);
			onOpenChange(false);
			form.reset();
		} catch (err) {
			// eslint-disable-next-line no-alert
			alert('Failed to create flow run');
		} finally {
			setSubmitting(false);
		}
	};

	const disabled = submitting || deploymentsLoading;

	return (
		<Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Run Workflow</DialogTitle>
					<DialogDescription>Select a deployment, optionally set parameters, and start a run.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="deploymentId"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Deployment</FormLabel>
									<Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={deploymentsLoading ? 'Loading deployments...' : 'Select deployment'} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{deployments.map((d) => (
												<SelectItem key={d.id} value={d.id}>
													{d.name ?? d.id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								name="name"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Run name (optional)</FormLabel>
										<FormControl>
											<Input placeholder="My run" {...field} disabled={disabled} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="tags"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tags (comma separated)</FormLabel>
										<FormControl>
											<Input placeholder="etl, nightly" {...field} disabled={disabled} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							name="scheduled_start_time"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Scheduled start time (ISO, optional)</FormLabel>
									<FormControl>
										<Input placeholder="2025-01-01T12:00:00Z" {...field} disabled={disabled} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="parametersJson"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Parameters (JSON)</FormLabel>
									<FormControl>
										<Textarea rows={8} placeholder='{"bucket_name": "my-bucket"}' {...field} disabled={disabled} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
								Cancel
							</Button>
							<Button type="submit" disabled={disabled}>
								{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Run
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}