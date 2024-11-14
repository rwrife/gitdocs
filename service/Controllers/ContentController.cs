namespace GitDocs.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using System.Web;
  using System.IO;
  using System.Net.Mime;
  using LibGit2Sharp;

  [ApiController]
  [Route("api/[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class ContentController : Controller
  {
    [HttpGet("{DocName}/{*FilePath}")]
    public IActionResult GetContent(string DocName, string FilePath, string DocVersion = "master")
    {
      string basePath = Directory.GetCurrentDirectory();

      string reposPath = Path.Combine(basePath, "repos");
      if (!Directory.Exists(reposPath))
      {
        return NotFound(new { message = "Repos path not found" });
      }

      string docPath = Path.Combine(reposPath, DocName);
      if (!Directory.Exists(docPath))
      {
        return NotFound(new { message = "Doc repo path not found" });
      }

      FilePath = HttpUtility.UrlDecode(FilePath);
      FilePath = FilePath.Replace('/', Path.DirectorySeparatorChar);
      FilePath = FilePath.StartsWith(Path.DirectorySeparatorChar) ? FilePath.Substring(1) : FilePath;

      string fullPath = Path.Combine(docPath, FilePath);
      try
      {
        using (var repo = new Repository(docPath))
        {
          // Find the branch or tag
          Branch branch = repo.Branches[DocVersion];
          if (branch == null)
          {
            return NotFound(new { message = "Branch or tag not found" });
          }

          // Resolve the tree for the branch's latest commit
          Tree tree = branch.Tip.Tree;
          TreeEntry entry = tree[FilePath.Replace(Path.DirectorySeparatorChar, '/')];
          if (entry == null || entry.TargetType != TreeEntryTargetType.Blob)
          {
            return NotFound(new { message = "File not found in the specified branch" });
          }

          // Get file content from the blob
          var blob = (Blob)entry.Target;
          byte[] fileData;
          using (var contentStream = blob.GetContentStream())
          using (var memoryStream = new MemoryStream())
          {
            contentStream.CopyTo(memoryStream);
            fileData = memoryStream.ToArray();
          }

          // Determine MIME type
          string mimeType = GetMimeType(FilePath);

          // Return file content with MIME type
          return File(fileData, mimeType);
        }
      }
      catch (Exception ex)
      {
        // Handle errors (e.g., repository access issues)
        return StatusCode(500, new { message = "Error accessing repository", details = ex.Message });
      }

    }


    private string GetMimeType(string filePath)
    {
      string extension = Path.GetExtension(filePath).ToLowerInvariant();

      return extension switch
      {
        ".txt" => MediaTypeNames.Text.Plain,
        ".md" => "text/markdown",
        ".html" => MediaTypeNames.Text.Html,
        ".json" => "application/json",
        ".xml" => MediaTypeNames.Text.Xml,
        ".jpg" => MediaTypeNames.Image.Jpeg,
        ".jpeg" => MediaTypeNames.Image.Jpeg,
        ".png" => "image/png",
        ".gif" => MediaTypeNames.Image.Gif,
        ".pdf" => MediaTypeNames.Application.Pdf,
        _ => "application/octet-stream", // Default binary type
      };
    }
  }
}
