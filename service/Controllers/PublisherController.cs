namespace GitDocs.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using System.IO;
  using GitDocs;
  using LibGit2Sharp;

  [ApiController]
  [Route("[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class PublisherController : Controller
  {

    private readonly GitClient _gitClient = new GitClient();

    [HttpGet]
    public ActionResult<string[]> GetAllManagedRepos()
    {
      var reposPath = _gitClient.VerifyReposFolder();

      string[] childFolders = Directory.GetDirectories(reposPath).Select(
        x => Path.GetRelativePath(reposPath, x)).ToArray();

      return Ok(childFolders);
    }

    [HttpPost]
    public ActionResult CreateManagedRepo(string repoName)
    {
      var reposPath = _gitClient.VerifyReposFolder();

      string repoPath = Path.Combine(reposPath, repoName);

      if (Directory.Exists(repoPath))
      {
        return Conflict();
      }

      Directory.CreateDirectory(repoPath);
      _gitClient.GitInit(repoPath);

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
