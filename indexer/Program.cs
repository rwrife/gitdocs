using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.Store;
using Document = Lucene.Net.Documents.Document;

class Program
{
  private static string watchDirectory;
  private static string luceneIndexPath;
  private static IndexWriter? writer;

  private static bool keepRunning = true;

  public static async Task MonitorForReindexKey()
  {
    Console.WriteLine("Press 'R' to reindex files or 'Q' to quit.");
    while (keepRunning)
    {
      if (Console.KeyAvailable)
      {
        var key = Console.ReadKey(intercept: true).Key;
        if (key == ConsoleKey.R)
        {
          Console.WriteLine("Reindexing all files...");
          await ReindexAllFiles();
        }
        else if (key == ConsoleKey.Q)
        {
          Console.WriteLine("Exiting...");
          keepRunning = false;
        }
      }
      await Task.Delay(100);  // Polling delay
    }
  }

  public static async Task ReindexAllFiles()
  {
    writer.DeleteAll();  // Clear existing indexes
    IndexFiles(watchDirectory);  // Reindex all files in watchDirectory
    writer.Commit();  // Save changes
    Console.WriteLine("Reindexing completed.");
  }


  static async Task Main(string[] args)
  {
    string currentDirectory = System.IO.Directory.GetCurrentDirectory();
    watchDirectory = Path.GetFullPath("../../../../repos", currentDirectory);
    luceneIndexPath = Path.GetFullPath("../../../../index", currentDirectory);

    // Initialize Lucene index writer
    var analyzer = new StandardAnalyzer(Lucene.Net.Util.Version.LUCENE_30);
    System.IO.Directory.CreateDirectory(luceneIndexPath);
    var indexDir = FSDirectory.Open(luceneIndexPath);

    writer = new IndexWriter(indexDir, analyzer, new IndexWriter.MaxFieldLength(IndexWriter.DEFAULT_MAX_FIELD_LENGTH));

    
    // Set up the FileSystemWatcher
    FileSystemWatcher watcher = new FileSystemWatcher
    {
      Path = watchDirectory,
      Filter = "*.md",
      IncludeSubdirectories = true,
      NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName | NotifyFilters.CreationTime | NotifyFilters.Size,
    };

    watcher.Changed += MarkdownFileChange;
    watcher.Created += MarkdownFileChange;
    watcher.Renamed += MarkdownFileChange;
    watcher.Deleted += MarkdownFileDelete;
    watcher.EnableRaisingEvents = true;

    var monitorTask = MonitorForReindexKey();
    await monitorTask;

    // Dispose the writer on exit
    writer.Dispose();
  }

  private static void MarkdownFileDelete(object sender, FileSystemEventArgs e)
  {
    Console.WriteLine($"Deleting index for {e.Name}");
    writer.DeleteDocuments(new Term("fullpath", e.FullPath));
    writer.Commit();
  }

  private static void MarkdownFileRename(object sender, RenamedEventArgs e)
  {
    Console.WriteLine($"Updating index for {e.Name}");
    writer.DeleteDocuments(new Term("fullpath", e.OldFullPath));
    writer.Commit();
    IndexFileWithRetry(e.FullPath);
  }

  private static void MarkdownFileChange(object sender, FileSystemEventArgs e)
  {
    Console.WriteLine($"New markdown file detected: {e.FullPath}");
    IndexFileWithRetry(e.FullPath);
  }

  private static void IndexFiles(string directoryPath)
  {
    var rootDirectory = new DirectoryInfo(directoryPath);
    foreach (var file in rootDirectory.GetFiles("*.md", SearchOption.AllDirectories))
    {
      IndexFileWithRetry(file.FullName);
    }
  }

  public static async Task IndexFileWithRetry(string filePath)
  {
    int maxRetries = 3;
    int delay = 1000;  // 1-second delay
    int attempt = 0;

    while (attempt < maxRetries)
    {
      try
      {        
        IndexFile(filePath);
        Console.WriteLine($"Indexed {filePath}");
        break;
      }
      catch (IOException ex)
      {
        Console.WriteLine($"File {filePath} is locked, retrying in 1 second...");
      }
      attempt++;
    }
  }

  private static void IndexFile(string filePath)
  {
    var file = new FileInfo(filePath);
    Console.WriteLine($"Indexing {file.Name}...");
    var relativeRoot = Path.GetRelativePath(watchDirectory, file.DirectoryName); // Root folder relative to watchDirectory
    var reponame = relativeRoot.Split(System.IO.Path.DirectorySeparatorChar)[0];
    var relativePath = Path.GetRelativePath(Path.Combine(watchDirectory, reponame), file.FullName);

    try
    {
      string content;

      using (var fileStream = new FileStream(file.FullName, FileMode.Open, FileAccess.Read, FileShare.Read))
      using (var reader = new StreamReader(fileStream))
      {
        char[] buffer = new char[1024]; // Buffer for 1 KB
        int bytesRead = reader.Read(buffer, 0, buffer.Length);
        content = new string(buffer, 0, bytesRead);
      }

      Document doc = new Document();
      doc.Add(new Field("content", content, Field.Store.YES, Field.Index.ANALYZED));
      doc.Add(new Field("fullpath", file.FullName, Field.Store.YES, Field.Index.NO));
      doc.Add(new Field("filepath", relativePath, Field.Store.YES, Field.Index.NO));
      doc.Add(new Field("reponame", reponame, Field.Store.YES, Field.Index.NO));

      writer.AddDocument(doc);
    }
    catch (Exception ex)
    {
      Console.WriteLine("Could not index file, try again later.");

    }
  }
}
