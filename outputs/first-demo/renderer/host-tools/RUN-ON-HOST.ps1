# Run in an ordinary Windows PowerShell (Medium integrity), NOT in the DSH pwsh sandbox.
$ErrorActionPreference = 'Stop'
$project = 'D:\CodingData\Github\AICartoonMaking\MotionAtlas_341'
$tools = Join-Path $project 'outputs\first-demo\renderer\host-tools'
$source = Join-Path $project 'outputs\first-demo\renderer\still.html'
if (!(Test-Path -LiteralPath $source)) { throw "Missing renderer: $source" }
if (!(Test-Path -LiteralPath (Join-Path $tools 'capture-stills.cjs'))) { throw "Missing exporter. Extract ZIP to $tools" }
$groups = whoami /groups /fo csv | Out-String
if ($groups -notmatch 'S-1-16-8192') {
    throw 'Please run in a NORMAL Windows PowerShell with a Medium integrity token (not elevated Administrator, not DSH Low sandbox).'
}
Set-Location -LiteralPath $tools
node --version
npm --version
npm install --no-audit --no-fund --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
node .\capture-stills.cjs
if ($LASTEXITCODE -ne 0) { throw "Canvas export needs inspection (exit $LASTEXITCODE); check PNGs, render-manifest.json and console." }
$review = Join-Path $project 'outputs\first-demo\review.html'
Write-Host "Generated review: $review"
Start-Process -FilePath $review
