namespace GitDocs.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using System.IO;
  using LibGit2Sharp;
  using System.Linq;
  using service.Models;
  using System.Diagnostics;

  [ApiController]
  [Route("api/[controller]")]
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
          var description = _gitClient.GetMetadataValue(folder, "description");
          var title = _gitClient.GetMetadataValue(folder, "title");
          var tags = _gitClient.GetMetadataValue(folder, "tags");
          var docRoot = _gitClient.GetMetadataValue(folder, "docroot");

          repoDetails.Add(new
          {
            name = Path.GetFileName(folder),
            description,
            title,
            tags,
            docRoot
          });

        }
      }

      return Ok(repoDetails);
    }

    [HttpPost]
    public ActionResult CreateManagedRepo(string repoName, string title, string description = "", string tags = "")
    {
      repoName = repoName.Trim();
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

    [HttpPost("import")]
    public ActionResult ImportManagedrepo(string repoName, string title, string repoUrl, string description = "", string branchName = "master", string defaultFolder = "/", string tags = "")
    {
      repoName = repoName.Trim();
      var reposPath = _gitClient.VerifyReposFolder();

      string repoPath = Path.Combine(reposPath, repoName);

      if (Directory.Exists(repoPath))
      {
        return Conflict();
      }

      try
      {
        CloneOptions options = new CloneOptions
        {
          Checkout = true,
          IsBare = false,
          RecurseSubmodules = true,
        };

        var credentials = GetGitCredentials(repoUrl);

        options.FetchOptions.CredentialsProvider = (url, usernameFromUrl, types) =>
        {
          return new UsernamePasswordCredentials
          {
            Username = credentials.Username,
            Password = credentials.Password
          };
        };

        Repository.Clone(repoUrl, repoPath, options);

        _gitClient.SetMetadataValue(repoPath, "description", description);
        _gitClient.SetMetadataValue(repoPath, "title", string.IsNullOrEmpty(title) ? repoName : title);
        _gitClient.SetMetadataValue(repoPath, "tags", tags);
        _gitClient.SetMetadataValue(repoPath, "docroot", defaultFolder);

        Task.Run(() =>
        {
          using (var repo = new Repository(repoPath))
          {
            var remote = repo.Network.Remotes["origin"];
            Commands.Fetch(repo, remote.Name, remote.FetchRefSpecs.Select(x => x.Specification), options.FetchOptions, null);
            Commands.Checkout(repo, branchName);
          }
        });



        return Ok(new { Message = "Repository successfully cloned", RepositoryPath = repoPath });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { Error = "An error occurred while cloning the repository", Details = ex.Message });
      }
    }

    private (string Username, string Password) GetGitCredentials(string gitUri)
    {
      var process = new Process
      {
        StartInfo = new ProcessStartInfo
        {
          FileName = "git",
          Arguments = "credential fill",
          RedirectStandardInput = true,
          RedirectStandardOutput = true,
          UseShellExecute = false,
          CreateNoWindow = true
        }
      };

      process.Start();

      // Write the input to the Git credential helper
      using (var writer = process.StandardInput)
      {
        writer.WriteLine($"protocol=https");
        writer.WriteLine($"host={new Uri(gitUri).Host}");
        writer.WriteLine(); // Empty line to end input
      }

      // Read the output from the Git credential helper
      string username = null;
      string password = null;
      using (var reader = process.StandardOutput)
      {
        string line;
        while ((line = reader.ReadLine()) != null)
        {
          if (line.StartsWith("username="))
          {
            username = line.Substring("username=".Length);
          }
          else if (line.StartsWith("password="))
          {
            password = line.Substring("password=".Length);
          }
        }
      }

      process.WaitForExit();

      if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
      {
        throw new InvalidOperationException("Failed to retrieve credentials from Git Credential Manager.");
      }

      return (username, password);
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
        }
        catch (EmptyCommitException e)
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

      try
      {
        _gitClient.MergeBranchIntoMaster(repoPath, branchName);
      }
      catch { }

      return Ok();
    }


  }
}
