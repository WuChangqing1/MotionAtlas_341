#requires -Version 5.1
<#
  MA341-DEMO-001 picture-lock encoder.
  Run in a normal Windows PowerShell (Medium integrity), NOT in the DSH Low sandbox.

  Usage:
    powershell -ExecutionPolicy Bypass -File .\encode-film.ps1
#>
$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$filmDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$framesDir = Join-Path $filmDir 'frames'
$manifestPath = Join-Path $filmDir 'frame-manifest.json'
$outPath = Join-Path $filmDir 'MA341-DEMO-001-picture-lock.mp4'
$reportPath = Join-Path $filmDir 'encode-report.json'

if (!(Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'ffmpeg not found on PATH' }
if (!(Get-Command ffprobe -ErrorAction SilentlyContinue)) { throw 'ffprobe not found on PATH' }
if (!(Test-Path -LiteralPath $manifestPath)) { throw "Missing frame manifest: $manifestPath" }

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($manifest.complete -ne $true) { throw 'frame-manifest.json is not complete; rerun capture-frames.cjs' }
if ($manifest.expected_frames -ne 450) { throw "Expected 450 frames, manifest says $($manifest.expected_frames)" }
if ($manifest.frames.Count -ne 450) { throw "Manifest frame count is $($manifest.frames.Count), expected 450" }

$sourceSha = (Get-FileHash -LiteralPath (Join-Path $filmDir 'film.html') -Algorithm SHA256).Hash.ToLower()
$timelineSha = (Get-FileHash -LiteralPath (Join-Path $filmDir 'timeline.js') -Algorithm SHA256).Hash.ToLower()
if ($sourceSha -ne $manifest.source_sha256) { throw "film.html changed since frames were exported ($sourceSha != $($manifest.source_sha256))" }
if ($timelineSha -ne $manifest.timeline_sha256) { throw "timeline.js changed since frames were exported ($timelineSha != $($manifest.timeline_sha256))" }

# Verify all 450 named frames exist and match manifest size/SHA.
$errors = @()
foreach ($entry in $manifest.frames) {
  $p = Join-Path $framesDir $entry.file
  if (!(Test-Path -LiteralPath $p)) { $errors += "missing $($entry.file)"; continue }
  $item = Get-Item -LiteralPath $p
  if ($item.Length -ne [int64]$entry.bytes) { $errors += "size mismatch $($entry.file)"; continue }
  $h = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower()
  if ($h -ne $entry.sha256) { $errors += "sha mismatch $($entry.file)" }
}
if ($errors.Count -gt 0) { throw ("Frame verification failed:`n" + ($errors -join "`n")) }
if ($manifest.samples.Count -lt 15) { throw 'Fewer than 15 deterministic sample records' }
if (($manifest.samples | Where-Object { $_.all_equal -ne $true }).Count -gt 0) { throw 'A deterministic sample failed; refusing to encode' }

Write-Host "Verified 450 frames, source/timeline SHA and $($manifest.samples.Count) samples."

$ffmpegArgs = @(
  '-y',
  '-framerate', '30',
  '-i', (Join-Path $framesDir 'frame_%06d.png'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-r', '30',
  '-crf', '18',
  '-movflags', '+faststart',
  '-an',
  $outPath
)
Write-Host "Encoding: $outPath"
& ffmpeg @ffmpegArgs
if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed with exit $LASTEXITCODE" }
if (!(Test-Path -LiteralPath $outPath)) { throw 'MP4 was not created' }

# Independent ffprobe validation.
$probeJson = & ffprobe -v error -select_streams v:0 -show_entries 'stream=codec_name,width,height,pix_fmt,avg_frame_rate,nb_frames,duration' -show_entries 'format=duration,size,format_name' -of json $outPath
if ($LASTEXITCODE -ne 0) { throw "ffprobe failed with exit $LASTEXITCODE" }
$probe = $probeJson | ConvertFrom-Json
$v = $probe.streams[0]
$audio = & ffprobe -v error -select_streams a -show_entries 'stream=index' -of csv=p=0 $outPath
$checks = [ordered]@{
  codec_h264 = ($v.codec_name -eq 'h264')
  width_1920 = ([int]$v.width -eq 1920)
  height_1080 = ([int]$v.height -eq 1080)
  yuv420p = ($v.pix_fmt -eq 'yuv420p')
  fps_30 = ($v.avg_frame_rate -eq '30/1')
  frames_450 = ([int]$v.nb_frames -eq 450)
  duration_15 = ([math]::Abs([double]$v.duration - 15.0) -lt 0.05)
  no_audio = [string]::IsNullOrWhiteSpace(($audio -join ''))
}
$failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
$report = [ordered]@{
  output = $outPath
  bytes = (Get-Item -LiteralPath $outPath).Length
  sha256 = (Get-FileHash -LiteralPath $outPath -Algorithm SHA256).Hash.ToLower()
  source_sha256 = $sourceSha
  timeline_sha256 = $timelineSha
  ffprobe = $probe
  checks = $checks
  passed = ($failed.Count -eq 0)
}
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding UTF8

Write-Host ($checks.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Out-String)
if ($failed.Count -gt 0) { throw ("Video validation failed: " + ($failed -join ', ')) }
Write-Host "PASS: $outPath"
Write-Host "Report: $reportPath"
