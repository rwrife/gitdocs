# Define the directory containing the markdown files
$SourceDir = "C:\Users\ryrife\projects\GitDocs\repos\osg-wiki"

# Define the number of files per folder
$FilesPerFolder = 100

# Get all markdown files in the directory
$Files = Get-ChildItem -Path $SourceDir -Filter "*.md" | Sort-Object Name

# Create a mapping to track new file locations
$FileLocationMap = @{}

# Organize files into subfolders
$GroupIndex = 1
$FileCount = 0
$TargetDir = ""

foreach ($File in $Files) {
  if ($FileCount % $FilesPerFolder -eq 0) {
    $TargetDir = Join-Path $SourceDir "Group_$GroupIndex"
    if (!(Test-Path -Path $TargetDir)) {
      New-Item -ItemType Directory -Path $TargetDir | Out-Null
    }
    $GroupIndex++
  }

  $NewPath = Join-Path $TargetDir $File.Name
  Move-Item -Path $File.FullName -Destination $NewPath

  # Store the new location for the file
  $FileLocationMap[$File.Name] = $NewPath

  $FileCount++
}

# Update links in each file to reflect new paths
foreach ($FilePath in $FileLocationMap.Values) {
  $Content = Get-Content -Path $FilePath -Raw

  # Find markdown links to .md files
  $UpdatedContent = $Content -replace "\[(.*?)\]\((.*?\.md)\)", {
    param($match)
    $LinkText = $match[1]
    $LinkedFile = $match[2]

    # Extract file name from the link
    $FileName = Split-Path -Leaf $LinkedFile
    if ($FileLocationMap.ContainsKey($FileName)) {
      # Calculate the relative path
      $NewRelativePath = Resolve-Path -Relative -Path $FileLocationMap[$FileName] -RelativeTo (Split-Path $FilePath)
      return "[$LinkText]($NewRelativePath)"
    }
    else {
      return $match.Value  # Keep the link unchanged if the target file is missing
    }
  }

  # Save the updated content back to the file
  Set-Content -Path $FilePath -Value $UpdatedContent -Encoding UTF8 -Force
}

Write-Host "Markdown files organized and links updated successfully."
