using System;
using System.IO;
using System.Collections.Generic;
using LibGit2Sharp;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace service.Models
{
  public class GitClient
  {
    public GitClient()
    {
    }

    public string GetReposFolder()
    {
      string currentDirectory = Directory.GetCurrentDirectory();
      string reposPath = Path.GetFullPath(Path.Combine(currentDirectory, "../repos"));

      return reposPath;
    }

    public string VerifyReposFolder()
    {
      string reposPath = GetReposFolder();

      if (!Directory.Exists(reposPath))
      {
        Directory.CreateDirectory(reposPath);
      }

      return reposPath;
    }

    public string GetLatestCommitId(string repoPath, string branchName)
    {
      using (var repo = new Repository(repoPath))
      {
        var branch = repo.Branches[branchName];

        if (branch == null || branch.Tip == null)
        {
          throw new ArgumentException($"Branch '{branchName}' does not exist or has no commits.");
        }

        return branch.Tip.Sha;
      }
    }

    public void GitInit(string path)
    {
      Repository.Init(path);  // Initialize repository using LibGit2Sharp
      using (var repo = new Repository(path))
      {
        // Create an initial commit with an empty tree.
        var signature = new Signature("Initial Commit", "noreply@example.com", DateTimeOffset.Now);
        repo.Commit("Initial commit", signature, signature, new CommitOptions { AllowEmptyCommit = true });
      }
    }

    public void GitCreateBranch(string repoPath, string branchName)
    {
      using (var repo = new Repository(repoPath))
      {
        var branch = repo.Branches[branchName] ?? repo.CreateBranch(branchName);
      }
    }

    public bool BranchExists(string repoPath, string branchName)
    {
      using (var repo = new Repository(repoPath))
      {
        return repo.Branches[branchName] != null;
      }
    }

    public string[] GetAllBranches(string repoPath)
    {
      using (var repo = new Repository(repoPath))
      {
        List<string> branches = new List<string>();
        foreach (var branch in repo.Branches)
        {
          branches.Add(branch.FriendlyName);
        }
        return branches.ToArray();
      }
    }

    public void UpdateFile(string repoPath, string branchName, string fileName, byte[] fileContent)
    {

      var _repoPath = repoPath;
      var commitMessage = $"Updated {fileName}";
      var filePath = Path.Combine(repoPath, fileName);

      // Create a temporary directory for the worktree
      string worktreePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

      try
      {
        // Step 1: Create the worktree for the target branch
        CreateWorktree(_repoPath, worktreePath, branchName);

        // Step 2: Write the file in the worktree directory
        string targetFilePath = Path.Combine(worktreePath, fileName);
        Directory.CreateDirectory(Path.GetDirectoryName(targetFilePath));
        File.WriteAllBytes(targetFilePath, fileContent);

        // Step 3: Commit the changes in the worktree
        using (var repo = new Repository(worktreePath))
        {
          Commands.Stage(repo, fileName); // Explicitly stage the specific file
          var author = new Signature("Author Name", "email@example.com", DateTimeOffset.Now);
          repo.Commit(commitMessage, author, author);
        }

        // Step 4: Update the target branch in the main repository
        using (var repo = new Repository(_repoPath))
        {
          Branch targetBranch = repo.Branches[branchName];
          if (targetBranch == null)
          {
            throw new Exception($"Branch '{branchName}' does not exist.");
          }
          var latestCommit = new Repository(worktreePath).Head.Tip;
          repo.Refs.UpdateTarget(targetBranch.Reference, latestCommit.Id);

          // Check the status of the file in the repository
          var status = repo.RetrieveStatus(fileName);
          if (status != FileStatus.Unaltered)
          {
            //DiscardFileChanges(repo, fileName );
          }
        }

      }
      finally
      {
        // Clean up the worktree directory
        Directory.Delete(worktreePath, true);
      }
    }


    public void DiscardFileChanges(Repository repo, string filePath)
    {
      var options = new CheckoutOptions { CheckoutModifiers = CheckoutModifiers.Force };
      repo.CheckoutPaths(repo.Head.FriendlyName, new[] { filePath }, options);
    }

    private void CreateWorktree(string repoPath, string worktreePath, string branchName)
    {
      if (!Directory.Exists(worktreePath))
      {
        Directory.CreateDirectory(worktreePath);
      }

      // Initialize the worktree using a Git command
      var process = new Process
      {
        StartInfo = new ProcessStartInfo
        {
          FileName = "git",
          Arguments = $"worktree add --detach \"{worktreePath}\" {branchName}",
          WorkingDirectory = repoPath,
          RedirectStandardOutput = true,
          RedirectStandardError = true,
          UseShellExecute = false,
          CreateNoWindow = true
        }
      };

      process.Start();
      process.WaitForExit();

      if (process.ExitCode != 0)
      {
        throw new Exception($"Failed to create worktree: {process.StandardError.ReadToEnd()}");
      }
    }

    private void ExtractTreeToDirectory(Tree tree, string outputDirectory)
    {
      // Ensure the target output directory exists
      Directory.CreateDirectory(outputDirectory);

      foreach (var entry in tree)
      {
        string outputPath = Path.Combine(outputDirectory, entry.Path);
        if (entry.TargetType == TreeEntryTargetType.Blob)
        {
          var blob = (Blob)entry.Target;

          // Write the blob content to the filesystem at the specified path
          Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
          using (var contentStream = blob.GetContentStream())
          using (var fileStream = new FileStream(outputPath, FileMode.Create, FileAccess.Write))
          {
            contentStream.CopyTo(fileStream);
          }
        }
        else if (entry.TargetType == TreeEntryTargetType.Tree)
        {
          // Recursively handle subdirectories
          ExtractTreeToDirectory((Tree)entry.Target, Path.Combine(outputDirectory, entry.Path));
        }
      }
    }

    public void MergeBranchIntoMaster(string repoPath, string branchName)
    {
      using (var repo = new Repository(repoPath))
      {
        // Ensure the master branch exists
        var masterBranch = repo.Branches["master"];
        if (masterBranch == null)
        {
          throw new Exception("Master branch does not exist.");
        }

        // Ensure the target branch exists
        var branch = repo.Branches[branchName];
        if (branch == null)
        {
          throw new Exception($"Branch '{branchName}' does not exist.");
        }

        try
        {
          // Checkout the master branch to merge into
          Console.WriteLine("Checking out 'master' branch...");
          Commands.Checkout(repo, masterBranch);

          // Merge branchName into master
          Console.WriteLine($"Merging '{branchName}' into 'master'...");
          var mergeResult = repo.Merge(branch, repo.Config.BuildSignature(DateTimeOffset.Now), new MergeOptions());

          if (mergeResult.Status == MergeStatus.Conflicts)
          {
            Console.WriteLine("Conflicts detected. Resolving conflicts using 'branchName' (Ours) version...");

            foreach (var conflict in repo.Index.Conflicts)
            {
              Console.WriteLine($"Resolving conflict for: {conflict.Theirs.Path}");

              // Get the path for the conflicted file
              string filePath = Path.Combine(repo.Info.WorkingDirectory, conflict.Theirs.Path);

              // Get the "Ours" (branchName) version content
              var oursBlob = repo.Lookup<Blob>(conflict.Ours.Id);

              // Write the "Ours" content to the working tree file
              using (var oursStream = oursBlob.GetContentStream())
              using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
              {
                oursStream.CopyTo(fileStream);
              }

              // Stage the resolved file
              Commands.Stage(repo, conflict.Theirs.Path);
            }

            // Ensure index changes are written
            repo.Index.Write();

            // Validate all conflicts are resolved
            if (repo.Index.Conflicts.Any())
            {
              throw new Exception("Failed to resolve all conflicts. Some conflicts remain.");
            }

            Console.WriteLine("All conflicts resolved. Staging all changes...");
          }

          // Stage all unconflicted changes
          Commands.Stage(repo, "*");

          // Commit the merge result
          Console.WriteLine("Committing merge changes to 'master'...");
          repo.Commit($"Merged '{branchName}' into 'master', resolving conflicts using '{branchName}' version",
              repo.Config.BuildSignature(DateTimeOffset.Now),
              repo.Config.BuildSignature(DateTimeOffset.Now));

          Console.WriteLine("Merge into 'master' completed successfully.");
        }
        catch (Exception ex)
        {
          Console.WriteLine($"An error occurred during the merge: {ex.Message}");
          throw;
        }
      }
    }



    private void HardResetRepo(string repoPath)
    {
      try
      {
        var process = new Process
        {
          StartInfo = new ProcessStartInfo
          {
            FileName = "git",
            Arguments = $"reset --hard",
            WorkingDirectory = repoPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
          }
        };

        process.Start();
        process.WaitForExit();
      }
      catch { }
    }

  }
}
