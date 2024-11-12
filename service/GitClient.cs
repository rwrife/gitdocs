using System;
using System.IO;
using System.Collections.Generic;
using LibGit2Sharp;
using System.Diagnostics;
using System.IO;
using System.Text;

namespace GitDocs
{
  public class GitClient
  {
    public GitClient()
    {
    }

    public string VerifyReposFolder()
    {
      string currentDirectory = Directory.GetCurrentDirectory();
      string reposPath = Path.Combine(currentDirectory, "repos");

      if (!Directory.Exists(reposPath))
      {
        Directory.CreateDirectory(reposPath);
      }

      return reposPath;
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
          if(status != FileStatus.Unaltered)
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


    public void MergeChangesToMaster(string repoPath, string branchName)
    {


      using (var repo = new Repository(repoPath))
      {
        // Ensure the master branch exists
        var masterBranch = repo.Branches["master"];
        if (masterBranch == null)
        {
          throw new Exception("Master branch does not exist.");
        }

        // Get the specified branch
        var branch = repo.Branches[branchName];
        if (branch == null)
        {
          throw new Exception($"Branch '{branchName}' does not exist.");
        }

        // First, merge master into branchName to check for conflicts
        Commands.Checkout(repo, branch);
        var mergeMasterIntoBranchResult = repo.Merge(masterBranch, repo.Config.BuildSignature(DateTimeOffset.Now), new MergeOptions());

        if (mergeMasterIntoBranchResult.Status == MergeStatus.Conflicts)
        {
          // If conflicts arise, create a new work tree for conflict resolution
          string conflictWorkTreePath = Path.Combine(repo.Info.WorkingDirectory, $"{branchName}_conflict_resolve");
          Directory.CreateDirectory(conflictWorkTreePath);
          Repository.Clone(repoPath, conflictWorkTreePath);

          using (var conflictRepo = new Repository(conflictWorkTreePath))
          {
            var conflictBranch = conflictRepo.Branches[branchName];
            var masterInConflictRepo = conflictRepo.Branches["master"];

            // Attempt the merge in the new work tree
            Commands.Checkout(conflictRepo, conflictBranch);
            var conflictMergeResult = conflictRepo.Merge(masterInConflictRepo, conflictRepo.Config.BuildSignature(DateTimeOffset.Now), new MergeOptions());

            if (conflictMergeResult.Status == MergeStatus.Conflicts)
            {
              Console.WriteLine("Merge conflicts detected. Manual resolution needed in the work tree.");
              conflictRepo.Commit("Auto-commit unresolved merge conflicts in work tree",
                  conflictRepo.Config.BuildSignature(DateTimeOffset.Now),
                  conflictRepo.Config.BuildSignature(DateTimeOffset.Now));
            }
            else
            {
              Console.WriteLine("Merge from master to branch completed without conflicts in the work tree.");
              conflictRepo.Commit("Merge master into branch completed in work tree",
                  conflictRepo.Config.BuildSignature(DateTimeOffset.Now),
                  conflictRepo.Config.BuildSignature(DateTimeOffset.Now));
            }
          }

          Console.WriteLine("Merge of master into branchName canceled due to conflicts. Resolve conflicts before merging into master.");
        }
        else
        {
          // If no conflicts in branch, proceed to merge branch into master
          Commands.Checkout(repo, masterBranch);
          var finalMergeResult = repo.Merge(branch, repo.Config.BuildSignature(DateTimeOffset.Now), new MergeOptions());

          if (finalMergeResult.Status == MergeStatus.FastForward || finalMergeResult.Status == MergeStatus.NonFastForward)
          {
            Console.WriteLine("Branch successfully merged into master without conflicts.");
          }
        }
      }

    }

    }
}
