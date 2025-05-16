"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { MainNav } from "@/components/main-nav"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ImageUploader } from "@/components/image-uploader"
import { CategorySelector } from "@/components/category-selector"
import type { Category } from "@/types/supabase"

export default function EditStoryPage() {
  const params = useParams()
  const storyId = params?.id as string
  const router = useRouter()
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    imageUrl: "",
    published: false,
    featured: false,
    selectedCategories: [] as string[],
  })
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    const fetchData = async () => {
      if (!storyId) return

      setIsLoading(true)
      try {
        // Fetch story
        const { data: story, error: storyError } = await supabase.from("stories").select("*").eq("id", storyId).single()

        if (storyError) throw storyError

        // Fetch categories
        const { data: allCategories, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name")

        if (categoriesError) throw categoriesError

        // Fetch story categories
        const { data: storyCategories, error: storyCategoriesError } = await supabase
          .from("story_categories")
          .select("category_id")
          .eq("story_id", storyId)

        if (storyCategoriesError) throw storyCategoriesError

        setCategories(allCategories || [])
        setFormData({
          title: story.title,
          content: story.content,
          excerpt: story.excerpt || "",
          imageUrl: story.image_url || "",
          published: story.published,
          featured: story.featured,
          selectedCategories: storyCategories.map((sc) => sc.category_id),
        })
      } catch (error: any) {
        toast({
          title: "Error fetching story",
          description: error.message,
          variant: "destructive",
        })
        router.push("/admin")
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchData()
    }
  }, [user, isAdmin, authLoading, storyId, router, toast, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSwitchChange = (id: string, checked: boolean) => {
    setFormData({
      ...formData,
      [id]: checked,
    })
  }

  const handleContentChange = (content: string) => {
    setFormData({
      ...formData,
      content,
    })
  }

  const handleImageUploaded = (url: string) => {
    setFormData({
      ...formData,
      imageUrl: url,
    })
  }

  const handleCategoryChange = (selectedCategories: string[]) => {
    setFormData({
      ...formData,
      selectedCategories,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, saveAsDraft = false) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to update a story.",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your story.",
        variant: "destructive",
      })
      return
    }

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter content for your story.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Update story
      const { error: storyError } = await supabase
        .from("stories")
        .update({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || null,
          image_url: formData.imageUrl || null,
          published: saveAsDraft ? false : formData.published,
          featured: formData.featured,
        })
        .eq("id", storyId)

      if (storyError) throw storyError

      // Delete existing category links
      const { error: deleteError } = await supabase.from("story_categories").delete().eq("story_id", storyId)

      if (deleteError) throw deleteError

      // Add new category links if selected
      if (formData.selectedCategories.length > 0) {
        const categoryLinks = formData.selectedCategories.map((categoryId) => ({
          story_id: storyId,
          category_id: categoryId,
        }))

        const { error: categoryError } = await supabase.from("story_categories").insert(categoryLinks)

        if (categoryError) throw categoryError
      }

      toast({
        title: saveAsDraft ? "Draft saved" : "Story updated",
        description: saveAsDraft
          ? "Your story has been saved as a draft."
          : formData.published
            ? "Your story has been published."
            : "Your story has been updated but is not published yet.",
      })

      router.push("/admin")
    } catch (error: any) {
      toast({
        title: "Error updating story",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <MainNav />
      <main className="flex-1">
        <div className="container px-4 py-8 md:px-6">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Edit Story</h1>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter story title"
                    required
                    className="border-gray-800 bg-gray-900 text-white"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief summary of your story (optional)"
                    className="min-h-[80px] border-gray-800 bg-gray-900 text-white"
                    value={formData.excerpt}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextEditor content={formData.content} onChange={handleContentChange} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <h3 className="mb-4 text-lg font-medium">Story Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="published" className="cursor-pointer">
                        Publish
                      </Label>
                      <Switch
                        id="published"
                        checked={formData.published}
                        onCheckedChange={(checked) => handleSwitchChange("published", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="featured" className="cursor-pointer">
                        Featured
                      </Label>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => handleSwitchChange("featured", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <h3 className="mb-4 text-lg font-medium">Categories</h3>
                  <CategorySelector
                    categories={categories}
                    selectedCategories={formData.selectedCategories}
                    onChange={handleCategoryChange}
                  />
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <h3 className="mb-4 text-lg font-medium">Featured Image</h3>
                  <ImageUploader onImageUploaded={handleImageUploaded} existingImageUrl={formData.imageUrl} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
                onClick={() => {
                  // Create a dummy event object to satisfy handleSubmit's type
                  const fakeEvent = {
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>;
                  handleSubmit(fakeEvent, true);
                }}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button type="submit" className="bg-red-600 text-white hover:bg-red-700" disabled={isSaving}>
                {isSaving ? "Saving..." : formData.published ? "Update & Publish" : "Update"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
