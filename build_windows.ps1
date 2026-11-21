Write-Output "=== Making sure build/ exisists"
if (-not (Test-Path .\build -PathType Container)) {
	Write-Output "=== Creating build/ directory"
	mkdir build | Out-Null
}

Write-Output "=== Building a .zip of src/ into build/cleandrift.zip"
Compress-Archive -Path src\* -DestinationPath build\cleandrift.zip -Force | Out-Null