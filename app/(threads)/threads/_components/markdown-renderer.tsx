"use client"

import { memo } from "react"
import { type BundledLanguage } from "shiki"
import ReactMarkdown, { type Options } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

import "katex/dist/katex.min.css"

import { cn } from "@/lib/utils"
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
  type CodeBlockProps
} from "@/components/code-block"

export type MarkdownRendererProps = React.HTMLAttributes<HTMLDivElement> & {
  options?: Options
  children: Options["children"]
}

const components: Options["components"] = {
  pre: ({ children }) => <div>{children}</div>,
  ol: ({ node: _, children, className, ...props }) => (
    <ol
      className={cn(
        "marker:text-primary ml-4 list-outside list-decimal",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ node: _, children, className, ...props }) => (
    <li className={cn("py-1.5", className)} {...props}>
      {children}
    </li>
  ),
  ul: ({ node: _, children, className, ...props }) => (
    <ul
      className={cn(
        "marker:text-primary ml-4 list-outside list-disc",
        className
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  strong: ({ node: _, className, ...props }) => (
    <span className={cn("font-semibold", className)} {...props} />
  ),
  a: ({ node: _, className, ...props }) => (
    <a
      className={cn("text-primary font-medium underline", className)}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  h1: ({ node: _, className, ...props }) => (
    <h1
      className={cn("mt-6 mb-2 text-3xl font-semibold", className)}
      {...props}
    />
  ),
  h2: ({ node: _, className, ...props }) => (
    <h2
      className={cn("mt-6 mb-2 text-2xl font-semibold", className)}
      {...props}
    />
  ),
  h3: ({ node: _, className, ...props }) => (
    <h3
      className={cn("mt-6 mb-2 text-xl font-semibold", className)}
      {...props}
    />
  ),
  h4: ({ node: _, className, ...props }) => (
    <h4
      className={cn("mt-6 mb-2 text-lg font-semibold", className)}
      {...props}
    />
  ),
  h5: ({ node: _, className, ...props }) => (
    <h5
      className={cn("mt-6 mb-2 text-base font-semibold", className)}
      {...props}
    />
  ),
  h6: ({ node: _, className, ...props }) => (
    <h6
      className={cn("mt-6 mb-2 text-sm font-semibold", className)}
      {...props}
    />
  ),
  p: ({ node: _, className, ...props }) => (
    <p
      className={cn("text-[15px] leading-6 whitespace-pre-wrap", className)}
      {...props}
    />
  ),
  hr: ({ node: _, className, ...props }) => (
    <hr
      className={cn("bg-border my-4 h-px w-full shrink-0", className)}
      {...props}
    />
  ),
  table: ({ node: _, className, ...props }) => (
    <table
      className={cn("w-full overflow-y-auto rounded-md text-[15px]", className)}
      {...props}
    />
  ),
  th: ({ node: _, className, ...props }) => (
    <th
      className={cn(
        "bg-base-200 dark:bg-base-900 px-4 py-2 text-left font-semibold first:rounded-l-md last:rounded-r-md [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  td: ({ node: _, className, ...props }) => (
    <td
      className={cn(
        "overflow-hidden px-4 py-2 text-left first:rounded-l-md last:rounded-r-md [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
      {...props}
    />
  ),
  tr: ({ node: _, className, ...props }) => (
    <tr
      className={cn(
        "even:bg-base-200/60 even:dark:bg-base-900/70 m-0 p-0",
        className
      )}
      {...props}
    />
  ),
  blockquote: ({ node: _, className, ...props }) => (
    <blockquote
      className={cn(
        "border-l-primary my-2 border-l-4 pl-3 text-[15px] italic",
        className
      )}
      {...props}
    />
  ),
  code: function Code({ node: _, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "")
    const langMatch = match ? match[1] : null
    const code = String(children).replace(/\n$/, "")

    const isTreeStructure =
      code.includes("├──") ||
      code.includes("└──") ||
      code.includes("│") ||
      (code.includes("/") && code.includes("\n") && code.match(/^[\s├└│─]+/m))

    if (!langMatch && !isTreeStructure) {
      return (
        <code
          className={cn(
            "[:not(pre)>&]:bg-base-200 [:not(pre)>&]:text-base-600 dark:[:not(pre)>&]:text-base-300 dark:[:not(pre)>&]:bg-base-900 font-mono text-sm [:not(pre)>&]:rounded-sm [:not(pre)>&]:px-1.5 [:not(pre)>&]:py-0.5"
          )}
          {...props}
        >
          {children}
        </code>
      )
    }

    const language = langMatch || (isTreeStructure ? "text" : "text")
    const filename = langMatch || (isTreeStructure ? "tree" : "code")

    const data: CodeBlockProps["data"] = [
      {
        code,
        language,
        filename
      }
    ]

    return (
      <CodeBlock
        className={cn("my-2", className)}
        data={data}
        defaultValue={data[0].language}
      >
        <CodeBlockHeader>
          <CodeBlockFiles>
            {(item) => (
              <CodeBlockFilename key={item.language} value={item.language}>
                {item.filename}
              </CodeBlockFilename>
            )}
          </CodeBlockFiles>

          <CodeBlockCopyButton />
        </CodeBlockHeader>
        <CodeBlockBody>
          {(item) => (
            <CodeBlockItem key={item.language} value={item.language}>
              <CodeBlockContent language={item.language as BundledLanguage}>
                {item.code}
              </CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
      </CodeBlock>
    )
  }
}

export const MarkdownRenderer = memo(
  ({ className, options, children, ...props }: MarkdownRendererProps) => (
    <div
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        {...options}
      >
        {children}
      </ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
)
MarkdownRenderer.displayName = "MarkdownRenderer"
