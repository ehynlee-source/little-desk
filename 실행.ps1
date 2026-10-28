$ErrorActionPreference = 'Stop'
$nodeExe = (Get-Command node -ErrorAction Stop).Source
& $nodeExe (Join-Path $PSScriptRoot 'scripts/build.mjs')
if ($LASTEXITCODE -ne 0) { throw '정적 파일 빌드에 실패했습니다.' }
$hubUrl = 'http://localhost:3101'
try { $null = Invoke-WebRequest -Uri $hubUrl -UseBasicParsing -TimeoutSec 2 } catch {
  Start-Process -FilePath $nodeExe -ArgumentList ('"' + (Join-Path $PSScriptRoot 'scripts/serve.mjs') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  try { $null = Invoke-WebRequest -Uri $hubUrl -UseBasicParsing -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 300 }
}
Start-Process $hubUrl
