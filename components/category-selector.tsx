"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Category } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CategorySelectorProps {
  categories: Category[]
  selectedCategories: string[]
  onChange: (selectedCategories: string[]) => void
}

export function CategorySelector({ categories, selectedCategories, onChange }: CategorySelectorProps) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedCategories, categoryId])
    } else {
      onChange(selectedCategories.filter((id) => id !== categoryId))
    }
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCategoryName.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a name for the new category.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Create slug from name
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-")

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName,
          slug,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Category created",
        description: `The category "${newCategoryName}" has been created.`,
      })

      // Add the new category to selected categories
      onChange([...selectedCategories, data.id])

      // Reset form
      setNewCategoryName("")
      setDialogOpen(false)

      // Note: In a real app, you would update the categories list here
      // For this demo, you might need to refresh the page to see the new category
    } catch (error: any) {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedCategories.length > 0 ? (
          selectedCategories.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId)
            return category ? (
              <Badge key={category.id} variant="secondary" className="bg-gray-800">
                {category.name}
                <button
                  className="ml-1 text-gray-400 hover:text-white"
                  onClick={() => handleCategoryToggle(category.id, false)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null
          })
        ) : (
          <p className="text-sm text-gray-400">No categories selected</p>
        )}
      </div>

      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
            />
            <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
              {category.name}
            </Label>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full border-gray-700 text-white hover:bg-gray-800">
            <Plus className="mr-1 h-3 w-3" />
            Add New Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={createCategory} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="border-gray-800 bg-gray-900 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
