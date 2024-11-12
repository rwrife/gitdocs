export const generateTitle = (name: string, removeExtension: boolean = true): string => {
  // Remove the file extension if needed
  if (removeExtension) {
    name = name.split('.').slice(0, -1).join('.');
  }

  // Replace hyphens with spaces
  name = name.replace(/-/g, " ");

  // Insert spaces before capital letters only if preceded by a lowercase letter
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Remove any multiple spaces and trim the string
  name = name.replace(/\s+/g, " ").trim();

  // Capitalize the first letter of each word
  name = name.replace(/\b\w/g, char => char.toUpperCase());

  // HTML encode special characters (similar to HttpUtility.UrlDecode in C#)
  return decodeURIComponent(name);
}