import Image from "next/image"
import Link from "next/link"
import { Heart, MessageSquare } from "lucide-react"
import type { Story } from "@/types/supabase"

interface StoryCardProps {
  story: Story
}

export function StoryCard({ story }: StoryCardProps) {
  // Format date
  const formattedDate = new Date(story.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Link href={`/stories/${story.id}`}>
      <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950 transition-all hover:border-gray-700 hover:bg-gray-900">
        <div className="relative h-[200px] w-full">
          <Image
            src={story.image_url || "/placeholder.svg?height=300&width=500"}
            alt={story.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <div className="mb-1 text-xs text-gray-400">{formattedDate}</div>
          <h3 className="mb-2 text-xl font-bold text-white">{story.title}</h3>
          <p className="mb-3 text-sm text-gray-400 line-clamp-2">{story.excerpt || ""}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-gray-400">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm">{typeof story.likes_count !== "undefined" ? story.likes_count : 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{typeof story.comments_count !== "undefined" ? story.comments_count : 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
