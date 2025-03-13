"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Database, 
  Edit, 
  FileJson,
  Filter, 
  Loader2, 
  Plus, 
  Search, 
  Square,
  Tag, 
  Trash, 
  X,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useSchemasCollection } from "@/hooks/use-schemas-collection";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function BrowseUI() {
  const [showNewSchemaDialog, setShowNewSchemaDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<string | null>(null);
  const [schemaToDeleteName, setSchemaToDeleteName] = useState("");
  const [schemaName, setSchemaName] = useState("");
  const [schemaDescription, setSchemaDescription] = useState("");
  const [schemaTags, setSchemaTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'modified' | 'created' | 'name'>('modified');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const router = useRouter();
  const { schemas, addSchema, deleteSchema } = useSchemasCollection();
  
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCreateSchema = async () => {
    if (schemaName.trim() === "") return;
    
    setIsCreating(true);
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const schemaId = addSchema({ 
        title: schemaName, 
        description: schemaDescription,
        tags: schemaTags
      });
      
      setSchemaName("");
      setSchemaDescription("");
      setSchemaTags([]);
      setCurrentTag("");
      setShowNewSchemaDialog(false);
      
      toast.success("Schema created successfully!", {
        description: "Your new schema is ready to edit.",
        icon: <Database className="h-4 w-4 text-green-500" />
      });
      
      // Redirect to the editor with the new schema ID
      router.push(`/schemas/editor/${schemaId}`);
    } catch (error) {
      toast.error("Failed to create schema");
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim() !== '') {
      e.preventDefault();
      if (!schemaTags.includes(currentTag.trim())) {
        setSchemaTags([...schemaTags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setSchemaTags(schemaTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleDeleteClick = (id: string) => {
    const schema = schemas.find(s => s.id === id);
    setSchemaToDelete(id);
    setSchemaToDeleteName(schema?.title || "this schema");
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (schemaToDelete) {
      setIsDeleting(true);
      
      try {
        // Brief delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        deleteSchema(schemaToDelete);
        toast.success("Schema deleted successfully", {
          description: "The schema has been permanently removed.",
          icon: <Trash className="h-4 w-4 text-red-500" />
        });
      } catch (error) {
        toast.error("Failed to delete schema");
      } finally {
        setIsDeleting(false);
        setShowDeleteDialog(false);
        setSchemaToDelete(null);
        setSchemaToDeleteName("");
      }
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Filter and search schemas
  const filteredSchemas = schemas.filter(schema => {
    const matchesSearch = searchQuery === '' || 
      schema.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      schema.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTag = filterTag === null || schema.tags?.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });
  
  // Sort schemas
  const sortedSchemas = [...filteredSchemas].sort((a, b) => {
    if (sortBy === 'modified') {
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    } else if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  // Extract all unique tags for filtering
  const allTags = Array.from(
    new Set(schemas.flatMap(schema => schema.tags || []))
  ).filter(Boolean);
  
  return (
    <div className="container py-8 max-w-7xl mx-auto relative z-10">
      <div className={`sticky top-0 z-20 pt-4 pb-6 bg-background/80 backdrop-blur transition-all duration-200 ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Your Schemas
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage your database schemas</p>
          </div>
          
          <Dialog open={showNewSchemaDialog} onOpenChange={setShowNewSchemaDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" size="lg">
                <Plus className="h-4 w-4" />
                New Schema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Create New Schema
                </DialogTitle>
                <DialogDescription>
                  Enter the details for your new database schema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Schema Name*</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter schema name" 
                    value={schemaName} 
                    onChange={(e) => setSchemaName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter schema description" 
                    value={schemaDescription} 
                    onChange={(e) => setSchemaDescription(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {schemaTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input 
                    id="tags" 
                    placeholder="Add tag and press Enter" 
                    value={currentTag} 
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <span className="text-xs text-muted-foreground">
                    Press Enter to add a tag
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSchemaName("");
                    setSchemaDescription("");
                    setSchemaTags([]);
                    setCurrentTag("");
                    setShowNewSchemaDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSchema}
                  disabled={!schemaName.trim() || isCreating}
                  className="gap-2"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreating ? 'Creating...' : 'Create Schema'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search schemas..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        
        </div>
        
        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-4 pt-2">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm mr-2">Filter by tag:</span>
            </div>
            
            {filterTag && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilterTag(null)}
                className="h-8 gap-1"
              >
                Clear
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant={filterTag === tag ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Schema count summary */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {sortedSchemas.length} of {schemas.length} schemas
          {filterTag && <span> tagged with <Badge variant="outline">{filterTag}</Badge></span>}
          {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
        </div>
        
        {(filterTag || searchQuery) && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterTag(null);
            }}
            className="h-8 text-xs gap-1"
          >
            <X className="h-3 w-3" /> Clear filters
          </Button>
        )}
      </div>
      
      {/* Schemas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton loading state
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 rounded-md mb-2" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-3">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <div className="flex gap-2 mt-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </CardFooter>
            </Card>
          ))
        ) : sortedSchemas.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              {searchQuery || filterTag ? (
                <Search className="h-8 w-8 text-primary/60" />
              ) : (
                <Database className="h-8 w-8 text-primary/60" />
              )}
            </div>
            
            <h3 className="text-xl font-medium mb-2">
              {searchQuery || filterTag ? "No schemas found" : "No schemas yet"}
            </h3>
            
            <p className="text-muted-foreground max-w-md mb-6">
              {searchQuery || filterTag 
                ? "Try adjusting your search or filters to find what you're looking for" 
                : "Create your first schema to get started designing your database"
              }
            </p>
            
            {(searchQuery || filterTag) ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setFilterTag(null);
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" /> Clear filters
              </Button>
            ) : (
              <Button 
                onClick={() => setShowNewSchemaDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Create Your First Schema
              </Button>
            )}
          </div>
        ) : (
          sortedSchemas.map((schema) => (
            <Card 
              key={schema.id} 
              className="group overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-primary/5 hover:border-primary/20 relative"
            >
              {/* Card highlight effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 to-primary/10"></div>
                <div className="absolute right-0 inset-y-0 w-1 bg-gradient-to-b from-primary/10 to-primary/40"></div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/10 to-primary/40"></div>
                <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-primary/40 to-primary/10"></div>
              </div>
              
              {/* Card content */}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Database className="h-4 w-4" />
                  {schema.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {schema.description || "No description"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <Calendar className="h-3.5 w-3.5" /> 
                    <span className="flex gap-1">
                      <span>Modified:</span>
                      <span>{formatDate(schema.lastModified)}</span>
                    </span>
                    <Clock className="h-3.5 w-3.5 ml-1" /> 
                    <span>{formatTime(schema.lastModified)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    {schema.nodes && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Square className="h-3 w-3" />
                              {schema.nodes.length} {schema.nodes.length === 1 ? 'Table' : 'Tables'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {schema.nodes.length} database {schema.nodes.length === 1 ? 'table' : 'tables'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {schema.edges && schema.edges.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              {schema.edges.length} Relations
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {schema.edges.length} table relationships
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {schema.tags && schema.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {schema.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs px-2 py-0 h-5"
                          onClick={(e) => {
                            e.stopPropagation();  
                            setFilterTag(filterTag === tag ? null : tag);
                          }}
                        >
                          <Tag className="h-3 w-3 mr-1" /> {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(schema.id);
                        }}
                        className="gap-1.5 opacity-70 hover:opacity-100"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete schema permanently</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => router.push(`/schemas/editor/${schema.id}`)}
                  className="gap-1.5 shadow-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                  <ArrowRight className="ml-1 h-3 w-3 opacity-70" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium">"{schemaToDeleteName}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              All schema data including tables, relationships, and SQL definitions will be permanently removed.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSchemaToDelete(null);
                setSchemaToDeleteName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="gap-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-3.5 w-3.5" />
                  Delete Schema
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
