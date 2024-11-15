namespace service.Controllers
{
  using Microsoft.AspNetCore.Mvc;
  using Microsoft.Identity.Web.Resource;
  using service.Models;
  using System.Text;

  [ApiController]
  [Route("api/[controller]")]
  [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
  public class AskController : Controller
  {
    [HttpPost]
    public IActionResult Index(string AskId, string Q)
    {
      if(Q.ToLower().Contains("office hours"))
      {
        return Ok(new AskResponse()
        {
          AskId = AskId,
          Answer = "The Engineering Hub team office hours are on Thursdays at 10:35am."
          
        });
      }
      return Ok(new AskResponse()
      {
        AskId= AskId,
        Answer = "Sorry, I do not know."
      } );
    }
  }
}
