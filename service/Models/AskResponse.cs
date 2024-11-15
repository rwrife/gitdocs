namespace service.Models
{
  public class AskResponse
  {
    public string AskId { get; set; } = "";
    public string Answer { get; set; } = "";
    public string[]? References { get; set; }
  }
}
