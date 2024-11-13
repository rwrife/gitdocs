namespace GitDocs.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using System.IO;
  using GitDocs;
  using LibGit2Sharp;
  using System.Linq;

  [ApiController]
  [Route("[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class PublisherController : Controller
  {

    private readonly GitClient _gitClient = new GitClient();

    [HttpGet]
    public ActionResult<List<object>> GetAllManagedRepos()
    {
      var reposPath = _gitClient.VerifyReposFolder();
      var childFolders = Directory.GetDirectories(reposPath);

      var repoDetails = new List<object>();

      foreach (var folder in childFolders)
      {
        var gitPath = Path.Combine(folder, ".git");

        if (Directory.Exists(gitPath))
        {
          using (var repo = new Repository(folder))
          {
            var description = repo.Config.FirstOrDefault(c => c.Key == "repository.description")?.Value?.ToString() ?? "";
            var title = repo.Config.FirstOrDefault(c => c.Key == "repository.title")?.Value?.ToString() ?? Path.GetFileName(folder);
            var tags = repo.Config.FirstOrDefault(c => c.Key == "repository.tags")?.Value?.ToString() ?? "";

            repoDetails.Add(new
            {
              name = Path.GetFileName(folder),
              description,
              title,
              tags
            });
          }
        }
      }

      return Ok(repoDetails);
    }

    [HttpPost]
    public ActionResult CreateManagedRepo(string repoName, string title, string description = "", string tags = "")
    {
      var reposPath = _gitClient.VerifyReposFolder();

      string repoPath = Path.Combine(reposPath, repoName);

      if (Directory.Exists(repoPath))
      {
        return Conflict();
      }

      Directory.CreateDirectory(repoPath);
      _gitClient.GitInit(repoPath);

      try
      {
        using (var repo = new Repository(repoPath))
        {
          repo.Config.Set("repository.description", description);

          // Use the provided title or default to the repo name if no title is given
          repo.Config.Set("repository.title", string.IsNullOrEmpty(title) ? repoName : title);
          repo.Config.Set("repository.tags", tags);
        }
      }
      catch (LibGit2SharpException ex)
      {
        Console.Write(ex);
      }

      return Ok();
    }


    [HttpGet("branch")]
    public ActionResult<string[]> GetAllBranches(string repoName)
    {
      var reposPath = _gitClient.VerifyReposFolder();
      string repoPath = Path.Combine(reposPath, repoName);

      if (!Directory.Exists(repoPath))
      {
        return NotFound();
      }

      return Ok(_gitClient.GetAllBranches(repoPath).Where(x => x != "master" && x != "main"));
    }

    [HttpPost("branch")]
    public ActionResult CreateNewBranch(string repoName, string branchName)
    {
      var reposPath = _gitClient.VerifyReposFolder();
      string repoPath = Path.Combine(reposPath, repoName);

      if (!Directory.Exists(repoPath))
      {
        return NotFound();
      }

      _gitClient.GitCreateBranch(repoPath, branchName);

      return Ok();
    }

    [HttpPost("file/{*FilePath}")]
      public ActionResult UpdateFileInBranch(string repoName, string branchName, string FilePath, IFormFile file)
    {
      if (file == null || file.Length == 0)
      {
        return BadRequest("File data is empty.");
      }

      using (var memoryStream = new MemoryStream())
      {
        file.CopyTo(memoryStream);
        byte[] fileData = memoryStream.ToArray();

        // Process the file data as needed (e.g., save or analyze it)

        var reposPath = _gitClient.VerifyReposFolder();
        string repoPath = Path.Combine(reposPath, repoName);

        if (!Directory.Exists(repoPath))
        {
          return NotFound();
        }
        try
        {
          _gitClient.UpdateFile(repoPath, branchName, FilePath, fileData);
        } catch (EmptyCommitException e)
        {
          return new EmptyResult();
        }

      }

      return Ok();
    }


    [HttpPost("publish")]
    public ActionResult MergeBranchToMaster(string repoName, string branchName)
    {
      var reposPath = _gitClient.VerifyReposFolder();
      string repoPath = Path.Combine(reposPath, repoName);

      if (!Directory.Exists(repoPath))
      {
        return NotFound();
      }

      _gitClient.MergeChangesToMaster(repoPath, branchName);

      return Ok();
    }


  }
}
