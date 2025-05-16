"use client"

import Link from "next/link"
import { Edit, Trash2, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Story } from "@/types/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AdminStoryCardProps {
  story: Story
  onDelete: () => void
}

export function AdminStoryCard({ story, onDelete }: AdminStoryCardProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{story.title}</h3>
            <Badge variant={story.published ? "default" : "outline"} className={story.published ? "bg-green-600" : ""}>
              {story.published ? "Published" : "Draft"}
            </Badge>
            {story.featured && (
              <Badge variant="secondary" className="bg-yellow-600">
                Featured
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-400 line-clamp-1">{story.excerpt || "No excerpt available"}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span>{new Date(story.created_at).toLocaleDateString()}</span>
            <span>{story.likes_count || 0} likes</span>
            <span>{story.comments_count || 0} comments</span>
            <div className="flex flex-wrap gap-1">
              {story.categories?.map((cat) => (
                <Badge key={cat.category_id.id} variant="outline" className="text-xs">
                  {cat.category_id.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/stories/${story.id}`}>
            <Button variant="outline" size="sm" className="h-8 border-gray-700 text-white hover:bg-gray-800">
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
          </Link>
          <Link href={`/admin/stories/edit/${story.id}`}>
            <Button variant="outline" size="sm" className="h-8 border-gray-700 text-white hover:bg-gray-800">
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-8">
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the story and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
