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

  static void Main(string[] args)
  {
    string currentDirectory = System.IO.Directory.GetCurrentDirectory();
    watchDirectory = Path.GetFullPath("../../../../service/repos", currentDirectory);
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
      NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite
    };

    watcher.Created += OnNewMarkdownFile;
    watcher.EnableRaisingEvents = true;

    Console.WriteLine("Watching directory for new .md files. Press 'q' to quit.");
    while (Console.Read() != 'q') { }

    // Dispose the writer on exit
    writer.Dispose();
  }

  private static void OnNewMarkdownFile(object sender, FileSystemEventArgs e)
  {
    Console.WriteLine($"New markdown file detected: {e.FullPath}");
    IndexMarkdownFile(e.FullPath);
  }

  private static void IndexMarkdownFile(string filePath)
  {
    try
    {
      // Read file content
      string content = File.ReadAllText(filePath);
      string relativePath = Path.GetRelativePath(watchDirectory, filePath);

      // Create a document and add fields
      Document doc = new Document();
      doc.Add(new Field("content", content, Field.Store.YES, Field.Index.ANALYZED));
      doc.Add(new Field("filepath", relativePath, Field.Store.YES, Field.Index.NO));

      // Add document to index
      writer.AddDocument(doc);
      writer.Flush(triggerMerge: false, false, true);
      Console.WriteLine($"Indexed file: {relativePath}");

    }
    catch (Exception ex)
    {
      Console.WriteLine($"Error indexing file {filePath}: {ex.Message}");
    }
  }
}

