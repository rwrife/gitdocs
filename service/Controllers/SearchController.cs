namespace gdservice.Controllers
{
  using Lucene.Net.Analysis.Standard;
  using Lucene.Net.QueryParsers;
  using Lucene.Net.Search;
  using Lucene.Net.Store;
  using Lucene.Net.Util;
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;

  [ApiController]
  [Route("api/[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class SearchController : Controller
  {
    static string currentDirectory = System.IO.Directory.GetCurrentDirectory();
    string luceneIndexPath = Path.GetFullPath("../index", currentDirectory);

    [HttpGet]
    public IActionResult Search(string q)
    {
      FSDirectory directory = FSDirectory.Open(luceneIndexPath);

      // Instantiate the searcher
      using (IndexSearcher searcher = new IndexSearcher(directory, readOnly: true))
      {
        // Define the analyzer and parser
        var analyzer = new StandardAnalyzer(Version.LUCENE_30);
        var parser = new QueryParser(Version.LUCENE_30, "content", analyzer);

        // Parse the query
        Query query = parser.Parse(q);

        // Execute the search
        TopDocs topDocs = searcher.Search(query, 10); 
        Console.WriteLine($"Found {topDocs.TotalHits} hits.");

        var results = new List<SearchResult>();

        // Display results
        foreach (ScoreDoc scoreDoc in topDocs.ScoreDocs)
        {
          // Retrieve the document
          var doc = searcher.Doc(scoreDoc.Doc);

          results.Add(new SearchResult()
          {
            FilePath = doc.Get("filepath"),
            Content = doc.Get("content").Substring(0, doc.Get("content").Length > 100 ? 100 : doc.Get("content").Length)
          });
        }

        return Ok(results);
      }
    }
  }
}

/*

class Program
{
    static void Main()
    {
        string indexPath = @"path\to\your\index"; // Set the path to your local index
        string searchTerm = "data";               // The term to search for

        // Open the directory containing the index
        FSDirectory directory = FSDirectory.Open(indexPath);
        
        // Instantiate the searcher
        using (IndexSearcher searcher = new IndexSearcher(directory, readOnly: true))
        {
            // Define the analyzer and parser
            var analyzer = new StandardAnalyzer(LuceneVersion.LUCENE_30);
            var parser = new QueryParser(LuceneVersion.LUCENE_30, "content", analyzer);

            // Parse the query
            Query query = parser.Parse(searchTerm);

            // Execute the search
            TopDocs topDocs = searcher.Search(query, 10); // Fetch top 10 results
            Console.WriteLine($"Found {topDocs.TotalHits} hits.");

            // Display results
            foreach (ScoreDoc scoreDoc in topDocs.ScoreDocs)
            {
                // Retrieve the document
                var doc = searcher.Doc(scoreDoc.Doc);
                
                // Output fields you are interested in
                Console.WriteLine("Document ID: " + scoreDoc.Doc);
                Console.WriteLine("Content: " + doc.Get("content")); // Adjust field names as needed
                Console.WriteLine("Score: " + scoreDoc.Score);
                Console.WriteLine();
            }
        }
    }
}
*/