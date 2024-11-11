namespace GitDocs.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using System.IO;
  using System.Web;
  using LibGit2Sharp;

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


      using (var repo = new Repository(docPath))
      {
        // Find the branch by name without switching the active branch
        Branch branch = repo.Branches[DocVersion];
        if (branch == null)
        {
          return NotFound(new { message = $"Branch '{DocVersion}' not found." });
        }

        // Get the tree from the branch tip (commit)
        Tree directoryTree = branch.Tip.Tree;

        var pathSegments = FilePath.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries);
        foreach (var segment in pathSegments)
        {
          var treeEntry = directoryTree[segment];
          if (treeEntry == null || treeEntry.TargetType != TreeEntryTargetType.Tree)
          {
            return NotFound(new { message = "Specified path not found in the branch." });
          }
          directoryTree = (Tree)treeEntry.Target;
        }

        // Get directories and markdown files
        var items = new List<object>();

        // Get folders
        var directories = directoryTree.Where(x => x.TargetType == TreeEntryTargetType.Tree)
            .Where(d => d.Name != ".git" && (ShowHidden || !d.Name.StartsWith(".")))
            .Select(d => new
            {
              Title = GenerateTitle(d.Name, false),
              Name = d.Path,
              Type = "folder"
            });
        items.AddRange(directories);

        // Get markdown files
        var markdownFiles = directoryTree
            .Where(x => x.TargetType == TreeEntryTargetType.Blob && (ShowHidden || x.Name.EndsWith(".md")))
          .Select(f => new
          {
            Title = GenerateTitle(f.Name),
            File = f.Path,
            Type = f.Name.EndsWith(".md", StringComparison.OrdinalIgnoreCase) ? "doc" : "file"
          });

        items.AddRange(markdownFiles);

        return Ok(items);
      }
    }


    [HttpGet("{DocName}/versions")]
    public IActionResult GetVersions(string DocName)
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

      return Ok(_gitClient.GetAllBranches(docPath));
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
