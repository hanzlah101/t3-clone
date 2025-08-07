import { z } from "zod"
import { tool } from "ai"
import { Exa } from "exa-js"

import { env } from "@/env"

export const exa = new Exa(env.EXA_API_KEY)

export const webSearch = tool({
  description:
    "Search the web for current, up-to-date, and factual information. Use this tool for: recent news, current events, latest product information, real-time data, statistics, technical documentation, or any query that requires current information beyond your training data.",
  parameters: z.object({
    query: z
      .string()
      .min(1)
      .max(100)
      .describe("The search query - be specific and focused")
  }),
  execute: async ({ query }) => {
    const { results } = await exa.searchAndContents(query, {
      livecrawl: "always",
      numResults: 5
    })
    console.log(
      results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text.slice(0, 1000),
        publishedDate: result.publishedDate
      }))
    )

    return results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.text.slice(0, 1000),
      publishedDate: result.publishedDate
    }))
  }
})
