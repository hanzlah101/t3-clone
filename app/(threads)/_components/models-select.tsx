"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/nextjs"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useCookieState } from "@/hooks/use-cookie-storage"
import {
  ChevronDownIcon,
  FileTextIcon,
  GlobeIcon,
  ImagesIcon,
  InfoIcon,
  type LucideIcon
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { type Id } from "@/convex/_generated/dataModel"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  getModelById,
  MODELS_BY_PROVIDER,
  PROVIDER_CONFIGS,
  type ModelId
} from "@/lib/models"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

export function ModelsSelect({
  textAreaRef,
  initialState
}: {
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>
  initialState: ModelId
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [isOpen, setIsOpen] = useState(false)
  const { threadId }: { threadId?: Id<"threads"> } = useParams()

  const [localModelId, setLocalModelId] = useCookieState<ModelId>(
    "model_id",
    initialState
  )

  const { isSignedIn } = useAuth()
  const modelId = useQuery(
    api.threads.getThreadModel,
    isSignedIn ? { threadId } : "skip"
  )

  const updateModel = useMutation(
    api.threads.updateThreadModel
  ).withOptimisticUpdate((store, { modelId }) => {
    store.setQuery(api.threads.getThreadModel, { threadId }, modelId as ModelId)
  })

  const model = useMemo(() => {
    return getModelById(modelId ?? localModelId)
  }, [localModelId, modelId])

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) setTimeout(() => textAreaRef.current?.focus(), 0)
  }

  function handleSelect(modelId: ModelId) {
    setLocalModelId(modelId)
    if (threadId) updateModel({ threadId, modelId })
    handleOpenChange(false)
  }

  const trigger = (
    <Button
      size="sm"
      variant="ghost"
      className="text-foreground/80 h-auto px-2 py-1 font-normal"
    >
      {model?.name}
      <ChevronDownIcon className="size-4 opacity-50" />
    </Button>
  )

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          className="bg-popover/60 w-auto p-0 backdrop-blur-md"
          onCloseAutoFocus={(evt) => evt.preventDefault()}
        >
          <ModelsSelectContent onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <ModelsSelectContent onSelect={handleSelect} />
      </DrawerContent>
    </Drawer>
  )
}

function ModelsSelectContent({
  onSelect
}: {
  onSelect: (modelId: ModelId) => void
}) {
  return (
    <Command className="text-foreground bg-transparent">
      <CommandInput
        wrapperClassName="h-12"
        className="h-12"
        placeholder="Search models..."
      />
      <CommandList className="max-h-[calc(100vh-10rem)]">
        <CommandEmpty>No models found.</CommandEmpty>

        {MODELS_BY_PROVIDER.map(([provider, models]) => {
          const { name, icon: Icon } = PROVIDER_CONFIGS[provider]

          return (
            <CommandGroup
              key={provider}
              className="[&_[cmdk-group-heading]]:font-mono"
              heading={name}
            >
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  className="justify-between gap-20 px-4 py-3"
                  onSelect={() => onSelect(model.id)}
                  keywords={[
                    model.name,
                    name,
                    provider,
                    model.id,
                    model.supportsSearch ? "web search" : "",
                    model.supportsImageUploads ? "image upload" : "",
                    model.supportsPDFUploads ? "pdf upload" : ""
                  ].filter(Boolean)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="text-primary size-4.5" />
                    {model.name}

                    <Tooltip>
                      <TooltipTrigger className="ml-1">
                        <InfoIcon className="text-primary size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>{model.description}</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="ml-auto flex items-center gap-1">
                    {model.supportsSearch && (
                      <FeatureTip
                        icon={GlobeIcon}
                        tooltip="Uses live search to answer questions"
                      />
                    )}

                    {model.supportsImageUploads && (
                      <FeatureTip
                        icon={ImagesIcon}
                        tooltip="Supports image upload & analysis"
                      />
                    )}

                    {model.supportsPDFUploads && (
                      <FeatureTip
                        icon={FileTextIcon}
                        tooltip="Supports PDF upload & analysis"
                      />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </Command>
  )
}

function FeatureTip({
  icon: Icon,
  tooltip
}: {
  icon: LucideIcon
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger className="bg-accent rounded-md p-1">
        <Icon className="text-accent-foreground/60 size-4" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
