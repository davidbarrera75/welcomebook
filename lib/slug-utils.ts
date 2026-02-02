
export function generateSlug(propertyName: string): string {
  return propertyName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export function isSlugAvailable(slug: string, excludeId?: string): boolean {
  // This will be implemented with database check in API routes
  return true; // Placeholder
}
