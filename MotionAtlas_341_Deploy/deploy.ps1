#requires -Version 5.1
<#
Motion Atlas 341 approved picture-lock deployment.
Run in Windows PowerShell:
  powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy.ps1
Requires an existing `ssh fengz` SSH alias and server-side sudo privileges.
Does NOT automatically edit ccqspace.site's current HTTPS server block.
#>
param(
    [string]$ProjectRoot = 'D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo',
    [string]$SshAlias = 'fengz'
)
$ErrorActionPreference = 'Stop'
if ($SshAlias -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Invalid SSH alias' }
$film = Join-Path $ProjectRoot 'film'
$videoName = 'MA341-DEMO-001-picture-lock.mp4'
$video = Join-Path $film $videoName
$expectedVideo = 'ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6'
$expectedSource = '6a367ff4f8180f2cd0f05fea0a0478e94c1bb465d40dc46ed1ed09afb987206c'
$expectedTimeline = '2a07279233b0c899b7ae8ef417b42494563e7322ae663f3b84032605358b4485'
$package = Split-Path -Parent $MyInvocation.MyCommand.Path
function AssertHash([string]$path, [string]$expected) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing file: $path" }
    $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { throw "SHA256 mismatch ($path): $actual" }
    Write-Host "Verified SHA256: $path"
}
AssertHash $video $expectedVideo
AssertHash (Join-Path $film 'film.html') $expectedSource
AssertHash (Join-Path $film 'timeline.js') $expectedTimeline
foreach ($command in @('ssh','scp')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "Command unavailable: $command" }
}
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ('motion-atlas-341-' + [guid]::NewGuid().ToString('N'))
$localSite = Join-Path $staging 'site'
New-Item -ItemType Directory -Path $localSite -Force | Out-Null
try {
    Copy-Item -LiteralPath (Join-Path $package 'site\index.html') -Destination (Join-Path $localSite 'index.html')
    Copy-Item -LiteralPath $video -Destination (Join-Path $localSite $videoName)
    $releaseJson = @{
        project = 'MA341-DEMO-001'
        title = (-join @([char]0x5B8C, [char]0x6210, [char]0x4E4B, [char]0x540E))
        version = 'p1fix4-picture-lock'
        picture_lock_video_sha256 = $expectedVideo
        source_sha256 = $expectedSource
        timeline_sha256 = $expectedTimeline
        audio_tracks = 0
        resolution = '1920x1080'
        fps = 30
        seconds = 15
    } | ConvertTo-Json -Depth 4
    [System.IO.File]::WriteAllText((Join-Path $localSite 'release.json'), $releaseJson, (New-Object System.Text.UTF8Encoding($false)))
    # Create a poster if ffmpeg is installed; never change the MP4.
    if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
        & ffmpeg -hide_banner -loglevel error -y -ss 12.7 -i $video -frames:v 1 -q:v 3 (Join-Path $localSite 'poster.jpg')
        if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $localSite 'poster.jpg'))) {
            $index = Join-Path $localSite 'index.html'
            $html = [System.IO.File]::ReadAllText($index)
            $html = $html.Replace('id="film" controls', 'id="film" poster="./poster.jpg" controls')
            [System.IO.File]::WriteAllText($index, $html, (New-Object System.Text.UTF8Encoding($false)))
        }
    }
    $remoteStage = 'motion-atlas-341-upload-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    Write-Host "Staging package for $SshAlias into ~/$remoteStage"
    & ssh $SshAlias "mkdir -p ~/$remoteStage"
    if ($LASTEXITCODE -ne 0) { throw 'SSH connection/staging failed' }
    & scp -r $localSite "${SshAlias}:$remoteStage/"
    if ($LASTEXITCODE -ne 0) { throw 'SCP site upload failed' }
    & scp (Join-Path $package 'server-install.sh') (Join-Path $package 'nginx-route.conf') "${SshAlias}:$remoteStage/"
    if ($LASTEXITCODE -ne 0) { throw 'SCP installer upload failed' }
    Write-Host 'Installing local-only Nginx backend. Sudo may request your password.'
    & ssh -tt $SshAlias "sudo bash ~/$remoteStage/server-install.sh ~/$remoteStage"
    if ($LASTEXITCODE -ne 0) { throw 'Remote deployment failed; inspect the above output' }
    Write-Host ''
    Write-Host 'BACKEND INSTALLED. Now insert the route include in the EXISTING HTTPS server block:'
    Write-Host '  include /etc/nginx/snippets/motion-atlas-341-route.conf;'
    Write-Host 'Check: sudo nginx -t && sudo systemctl reload nginx'
    Write-Host 'Then browse: https://ccqspace.site/animation/'
} finally {
    if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Force -Recurse -ErrorAction SilentlyContinue }
}
