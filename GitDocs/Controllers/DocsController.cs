namespace GitDocs.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using System.IO;
  using System.Web;

  [ApiController]
  [Route("[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class DocsController : Controller
  {
    private readonly GitClient _gitClient = new GitClient();

    [HttpGet("{DocName}/toc/{*FilePath}")]
    public IActionResult Index(string DocName, string FilePath = "/", string DocVersion = "master", bool ShowHidden = false)
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

      string fullPath = Path.Combine(docPath,FilePath);
      if (!Directory.Exists(fullPath))
      {
        return NotFound(new { message = "Doc folder path not found" });
      }

      // Get directories and markdown files
      var items = new List<object>();

      // Get folders
      var directories = Directory.GetDirectories(fullPath)
          .Where(d => Path.GetFileName(d) != ".git" && (ShowHidden || !Path.GetFileName(d).StartsWith(".")))
          .Select(d => new
          {
            Title = GenerateTitle(Path.GetFileName(d), false),
            Name = Path.GetRelativePath(docPath, d),
            Type = "folder"
          });
      items.AddRange(directories);

      // Get markdown files
      var markdownFiles = Directory.GetFiles(fullPath, ShowHidden ? "" : "*.md").Select(f => new
      {
        Title= GenerateTitle(Path.GetFileName(f)),
        File = Path.GetRelativePath(docPath, f),
        Type = f.EndsWith(".md", StringComparison.OrdinalIgnoreCase) ? "doc" : "file"
      });
      items.AddRange(markdownFiles);

      return Ok(items);
    }


    [HttpGet("{DocName}/versions")]
    public IActionResult GetVersions(string DocName)
    {
      return Ok(_gitClient.GetAllBranches(DocName));
    }

    private string GenerateTitle(string name, bool removeExtension = true)
    {
      // Remove the file extension for files
      if (removeExtension)
      {
        name = Path.GetFileNameWithoutExtension(name);
      }

      // Replace hyphens with spaces
      name = name.Replace("-", " ");

      // Insert spaces before capital letters only if preceded by a lowercase letter
      name = System.Text.RegularExpressions.Regex.Replace(name, "(?<=[a-z])(?=[A-Z])", " ");

      // Remove any multiple spaces and trim the string
      name = System.Text.RegularExpressions.Regex.Replace(name, @"\s+", " ").Trim();

      // Capitalize the first letter of each word
      name = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(name);

      // HTML encode special characters
      return HttpUtility.UrlDecode(name);
    }
  }
}
