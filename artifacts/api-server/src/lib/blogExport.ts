export interface BlogExportResult {
  zip: Buffer;
  postCount: number;
  imageCount: number;
  imageBytes: number;
  skippedImages: number;
  generatedAt: string;
}

export class WordPressDisconnectedError extends Error {
  constructor() {
    super("WordPress integration has been removed. Use the site content and photos backup for saved CMS blogs.");
    this.name = "WordPressDisconnectedError";
  }
}

// This endpoint exported live WordPress content, not saved CMS posts. Retire it
// without touching the CMS database or the independent content/photos backup.
export async function buildBlogExport(): Promise<BlogExportResult> {
  throw new WordPressDisconnectedError();
}