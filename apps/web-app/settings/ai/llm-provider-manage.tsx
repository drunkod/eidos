import { SlidersHorizontalIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  NewLLMProviderForm,
  UpdateLLMProviderForm,
} from "./new-llm-provider-form"
import { AIFormValues, LLMProvider } from "./store"

interface ILLMProviderManageProps {
  value: AIFormValues["llmProviders"]
  onChange: (value: AIFormValues["llmProviders"]) => void
}

export const LLMProviderManage = ({
  value,
  onChange,
}: ILLMProviderManageProps) => {
  const handleAdd = (data: LLMProvider) => {
    const newData = [...value, data]
    onChange(newData)
  }

  const handleUpdate = (index: number) => (data: LLMProvider) => {
    const newData = value.map((provider, i) => (i === index ? data : provider))
    onChange(newData)
  }
  const handleRemove = (index: number) => {
    const newData = value.filter((_, i) => i !== index)
    onChange(newData)
  }
  if (value.length === 0) {
    return <NewLLMProviderForm onAdd={handleAdd} />
  }
  return (
    <div>
      <div className="flex max-w-xs flex-col gap-2">
        {value.map((provider, index) => (
          <div className="group flex w-full justify-between gap-2 rounded-sm p-1 hover:ring">
            <div>
              {provider.name} - {provider.type}
            </div>
            <div className="flex gap-2 opacity-70">
              <Button
                onClick={() => handleRemove(index)}
                size="xs"
                variant="ghost"
                className=" opacity-0 group-hover:opacity-100"
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <UpdateLLMProviderForm
                value={provider}
                onChange={handleUpdate(index)}
              >
                <Button size="xs" variant="ghost">
                  <SlidersHorizontalIcon className="h-4 w-4" />
                </Button>
              </UpdateLLMProviderForm>
            </div>
          </div>
        ))}
        <NewLLMProviderForm onAdd={handleAdd} />
      </div>
    </div>
  )
}
