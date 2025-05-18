import Image from "next/image"
import Link from "next/link"
import { Heart, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Story } from "@/types/supabase"

interface FeaturedStoryProps {
  story: Story
}

export function FeaturedStory({ story }: FeaturedStoryProps) {
  // Format date
  const formattedDate = new Date(story.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <div className="relative h-[300px] w-full sm:h-[400px]">
        <Image
          src={story.image_url || "/placeholder.svg?height=400&width=800"}
          alt={story.title}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="p-6">
        <div className="mb-2 text-sm text-gray-400">{formattedDate}</div>
        <h3 className="mb-2 text-2xl font-bold text-white">{story.title}</h3>
        <p className="mb-4 text-gray-400">{story.excerpt || ""}</p>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-400">
            <Heart className="h-4 w-4 text-red-500" />
            <span>{typeof story.likes_count !== "undefined" ? story.likes_count : 0}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <MessageSquare className="h-4 w-4" />
            <span>{typeof story.comments_count !== "undefined" ? story.comments_count : 0}</span>
          </div>
        </div>
        <Link href={`/stories/${story.id}`}>
          <Button className="w-full bg-red-600 text-white hover:bg-red-700">Read Full Story</Button>
        </Link>
      </div>
    </div>
  )
}
