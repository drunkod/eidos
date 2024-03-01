import { handleGoogleAI } from "./google"
import { handleOpenAI } from "./openai"
import { handleWebLLM } from "./webllm"

export const pathname = "/api/chat"
export default async function handle(event: FetchEvent) {
  const req = await event.request.json()
  const { model: modelAndProvider } = req
  const [model, provider] = modelAndProvider.split("@")
  switch (provider) {
    case "google":
      return handleGoogleAI(req)
    case "openai":
      return handleOpenAI(req)
    default:
      // local model
      return handleWebLLM(req)
  }
}
