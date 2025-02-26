import { Metadata } from 'next';
import SchemaEditorClient from './schema-editor-client';
import { templates } from '@/lib/schema-templates';

export const metadata: Metadata = {
  title: 'Schema Editor - SchemaForge',
  description: 'Edit and visualize your database schema',
};

// Generate all possible static paths including template-based IDs
export function generateStaticParams() {
  const paths = [];
  
  // Add fixed routes
  paths.push({ id: 'new' });
  
  // Add template IDs
  Object.keys(templates).forEach(templateId => {
    paths.push({ id: templateId });
  });

  // Add a range of dynamic IDs for each template
  const dynamicIds = [
    'ecommerce-1740533122917',
    'blog-1740533122917',
    'inventory-1740533122917',
    // Add more variations as needed
  ];

  dynamicIds.forEach(id => {
    paths.push({ id });
  });

  return paths;
}

export default function SchemaEditorPage() {
  return <SchemaEditorClient />;
}