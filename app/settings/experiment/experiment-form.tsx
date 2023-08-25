"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/react-hook-form/form"

import { useConfigStore } from "../store"

const experimentFormSchema = z.object({
  // type: z.enum(["all", "mentions", "none"], {
  //   required_error: "You need to select a notification type.",
  // }),
  aiChat: z.boolean().default(false),
  undoRedo: z.boolean().default(false),
  enableAICompletionInDoc: z.boolean().default(false),
})

export type ExperimentFormValues = z.infer<typeof experimentFormSchema>

// This can come from your database or API.
const defaultValues: Partial<ExperimentFormValues> = {
  aiChat: false,
  undoRedo: false,
  enableAICompletionInDoc: false,
}

export function ExperimentForm() {
  const { experiment, setExperiment } = useConfigStore()
  const form = useForm<ExperimentFormValues>({
    resolver: zodResolver(experimentFormSchema),
    defaultValues: {
      ...defaultValues,
      ...experiment,
    },
  })

  function onSubmit(data: ExperimentFormValues) {
    setExperiment(data)
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="mb-4 text-lg font-medium">Feature</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="undoRedo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Table undo/redo(beta🚀)
                    </FormLabel>
                    <FormDescription>
                      Undo and redo your actions in table.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aiChat"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">AI Chat(beta🚀)</FormLabel>
                    <FormDescription>
                      Chat with AI. generate SQL from natural language.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableAICompletionInDoc"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      AI Completion for Doc(alpha 🔨)
                    </FormLabel>
                    <FormDescription>Just like github copilot</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">Update experiment</Button>
      </form>
    </Form>
  )
}
