import { useState, useEffect } from "react";
import { dummySchemas } from "./data";
import { Schema } from "./types";

export const useBrowseState = () => {
  const [schemas, setSchemas] = useState<Schema[]>(dummySchemas);
  const addSchema = (newSchema: Schema) => {
    setSchemas([...schemas, newSchema]);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filteredSchemas, setFilteredSchemas] = useState<Schema[]>(schemas);
  const [isCreating, setIsCreating] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState<string | null>(null);

  // Get all unique tags from schemas and templates
  const allTags = Array.from(new Set([
    ...schemas?.flatMap(schema => schema.tags),
    ...dummySchemas.flatMap(template => template.tags)
  ]));

  useEffect(() => {
    // Filter and sort schemas
    let result = [...schemas];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(schema => 
        schema?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schema?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schema?.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply tag filter
    if (filterTag !== "all") {
      result = result.filter(schema => 
        schema.tags.includes(filterTag)
      );
    }
    
    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredSchemas(result);
  }, [schemas, searchTerm, filterTag, sortBy]);

  return { 
    schemas, 
    setSchemas, 
    addSchema, 
    searchTerm, 
    setSearchTerm, 
    filterTag, 
    setFilterTag, 
    sortBy, 
    setSortBy, 
    filteredSchemas, 
    setFilteredSchemas,
    isCreating, 
    setIsCreating,
    showTemplateInfo, 
    setShowTemplateInfo,
    allTags
  };
};
