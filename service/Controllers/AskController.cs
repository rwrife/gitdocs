namespace service.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using service.Models;
    using LLama;
  using LLama.Common;
  using LLama.Abstractions;
  using gdservice.Controllers;
  using System.Text.RegularExpressions;

  [ApiController]
  [Route("api/[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class AskController : Controller
  {
    private readonly string modelsPath;
    private readonly ChatHistory chatHistory;
    private readonly InteractiveExecutor executor;

    public AskController()
    {
      string currentDirectory = Directory.GetCurrentDirectory();
      this.modelsPath = Path.GetFullPath(Path.Combine(currentDirectory, "../models"));

      var parameters = new ModelParams(Path.Combine(this.modelsPath, "phi-2.Q4_K_M.gguf"))
      {
        ContextSize = 1024
      };

      var model = LLamaWeights.LoadFromFile(parameters);      
      var context = model.CreateContext(parameters);
      this.executor = new InteractiveExecutor(context);
      this.chatHistory = new ChatHistory();

      chatHistory.AddMessage(AuthorRole.System, """
        Transcript of a dialog, where the User interacts with an Assistant named Asish who works with the Engineering Hub team. Asish is helpful, kind, honest, good at writing, 
        and never fails to answer the User's requests immediately and with short precise answers.  
        - Engineering Hub (EngHub) is a web site that provides troubleshooting guides and service documentation for all developers at Microsoft
        - The EngHub portal is available at https://eng.ms and onboarding instructions are at https://eng.ms/onboarding
        - The Engineering Hub Team has office hours Thursdays at 10:35am
        - Asish has nothing do with the Geneva product or team, that's maintained by some other disfunctional team and Asish cannot help
        - Engineering Hub site uses a hacked up version DocFx version 2.59.3
        """);
    }

    [HttpPost]
    public async Task<IActionResult> Index(string AskId, string Q)
    {
      var response = "";

      ChatSession session = new(executor, chatHistory);

      InferenceParams inferenceParams = new InferenceParams()
      {
        MaxTokens = 1024,
        AntiPrompts = new List<string> { "User:" }
      };

      var searchResults = SearchController.SearchIndex(Q);
      if (searchResults.Count > 0)
      {
        foreach (var result in searchResults.Take(3))
        {
          string cleaned = Regex.Replace(result.Content, "[^a-zA-Z0-9 ]", "");
          cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
          chatHistory.AddMessage(AuthorRole.System, cleaned);
        }
      }

      chatHistory.AddMessage(AuthorRole.User, "Hello, Asish.");
      chatHistory.AddMessage(AuthorRole.Assistant, "Hello. How may I help you today?");

      await foreach (
          var text
          in session.ChatAsync(
              new ChatHistory.Message(AuthorRole.User, Q),
              inferenceParams))
      {
        response += text;
      }

      response = response.Replace("Assistant: ", "");
      if (response.IndexOf("User:") > 0)
      {
        response = response.Substring(0, response.IndexOf("User:")).Trim();
      }

      return Ok(new AskResponse()
      {
        AskId = AskId,
        Answer = response
      });
    }
  }
}
