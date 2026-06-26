param(
  [string]$Root = "C:\Users\PC-2\source\repos\AquariumWeb",
  [int]$Port = 4174
)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse('127.0.0.1'), $Port)
$listener.Start()
Write-Host "AquariumWeb server running at http://127.0.0.1:$Port/"
while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 3000
    $client.SendTimeout = 3000
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
    do { $headerLine = $reader.ReadLine() } while ($null -ne $headerLine -and $headerLine -ne '')

    $parts = $requestLine.Split(' ')
    $urlPath = if ($parts.Length -gt 1) { $parts[1].Split('?')[0] } else { '/' }
    $urlPath = [System.Uri]::UnescapeDataString($urlPath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($urlPath)) { $urlPath = 'index.html' }

    $rootFull = [System.IO.Path]::GetFullPath($Root)
    $file = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootFull, $urlPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)))
    if (-not $file.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Forbidden' }

    if (Test-Path -LiteralPath $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
      $type = switch ($ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.css' { 'text/css; charset=utf-8' }
        '.js' { 'text/javascript; charset=utf-8' }
        '.webmanifest' { 'application/manifest+json; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.png' { 'image/png' }
        default { 'application/octet-stream' }
      }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $status = '200 OK'
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $type = 'text/plain; charset=utf-8'
      $status = '404 Not Found'
    }
    $header = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headBytes, 0, $headBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
  } catch {
    try {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('Server error')
      $header = "HTTP/1.1 500 Internal Server Error`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
      $headBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headBytes, 0, $headBytes.Length)
      $stream.Write($bytes, 0, $bytes.Length)
    } catch { }
  } finally {
    $client.Close()
  }
}
