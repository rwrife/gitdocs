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
            Title = Path.GetFileNameWithoutExtension(doc.Get("filepath")),
            RepoName = doc.Get("reponame"),
            FilePath = doc.Get("filepath"),
            Content = doc.Get("content").Substring(0, doc.Get("content").Length > 500 ? 500 : doc.Get("content").Length)
          });
        }

        return Ok(results);
      }
    }
  }
}
