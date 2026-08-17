param([string]$ScriptDir)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Pastel {
    param([string]$text, [int]$r, [int]$g, [int]$b)
    Write-Host -NoNewline "$([char]27)[38;2;$r;$g;${b}m$text$([char]27)[0m"
}

function Show-Spinner {
    param([string]$text, [scriptblock]$action)
    $frames = @([char]0x280B, [char]0x2819, [char]0x2839, [char]0x2838, [char]0x283C, [char]0x2834, [char]0x2826, [char]0x2827, [char]0x2807, [char]0x280F)
    $i = 0
    $job = Start-Job -ScriptBlock $action
    while ($job.State -eq 'Running') {
        Write-Host -NoNewline "`r  "
        Write-Pastel $frames[$i] 173 216 230
        Write-Pastel " $text" 255 255 255
        $i = ($i + 1) % $frames.Length
        Start-Sleep -Milliseconds 100
    }
    $jobOut = Receive-Job $job -ErrorAction SilentlyContinue -ErrorVariable jErr
    if ($job.State -ne 'Completed') {
        Write-Host -NoNewline "`r  "
        Write-Pastel "[-]" 173 216 230
        Write-Pastel " $text" 255 255 255
        Write-Host ""
        
        Write-Host ""
        Write-Pastel "  > Error Details:" 173 216 230
        Write-Host ""
        if ($jobOut) { Write-Host $jobOut }
        if ($jErr) { Write-Host $jErr }
        if ($job.ChildJobs[0].JobStateInfo.Reason) { Write-Host $job.ChildJobs[0].JobStateInfo.Reason.Message }
        
        Remove-Job $job
        exit 1
    } else {
        Write-Host -NoNewline "`r  "
        Write-Pastel "[+]" 173 216 230
        Write-Pastel " $text" 255 255 255
        Write-Host ""
    }
    Remove-Job $job
    return $jobOut
}

Clear-Host
Write-Host ""
Write-Pastel "  * QuestCompleter Installer *" 173 216 230
Write-Host ""
Write-Pastel "     -- " 173 216 230
Write-Pastel "made by xbl1e" 255 255 255
Write-Pastel " --" 173 216 230
Write-Host ""

$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Show-Spinner "Installing Node.js..." {
        cmd.exe /c "winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "Node.js installation failed" }
    } | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    Show-Spinner "Installing Git..." {
        cmd.exe /c "winget install Git.Git --accept-package-agreements --accept-source-agreements --silent 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "Git installation failed" }
    } | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

$pnpmPath = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpmPath) {
    Show-Spinner "Installing pnpm..." {
        # Refresh PATH inside the job so we can find npm after a fresh Node.js install
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        $npm = "$env:ProgramFiles\nodejs\npm.cmd"
        if (Test-Path $npm) {
            cmd.exe /c "`"$npm`" install -g pnpm 2>&1"
        } else {
            cmd.exe /c "npm install -g pnpm 2>&1"
        }
        if ($LASTEXITCODE -ne 0) { throw "pnpm installation failed" }
    } | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

$PossiblePaths = @(
    (Join-Path $env:USERPROFILE "Downloads\Vencord"),
    (Join-Path $env:USERPROFILE "Documents\Vencord"),
    (Join-Path $env:USERPROFILE "Vencord"),
    (Join-Path $env:USERPROFILE "Desktop\Vencord")
)

$VencordDir = $null
foreach ($path in $PossiblePaths) {
    if (Test-Path $path) {
        $VencordDir = $path
        break
    }
}

if (-not $VencordDir) {
    $VencordDir = Join-Path $env:USERPROFILE "Documents\Vencord"
    Show-Spinner "Cloning Vencord..." {
        $dest = $using:VencordDir
        cmd.exe /c "git clone https://github.com/Vendicated/Vencord `"$dest`" 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "Cloning Vencord failed" }
    } | Out-Null
} else {
    Write-Host -NoNewline "  "
    Write-Pastel ">" 173 216 230
    Write-Pastel " Found Vencord at: $VencordDir" 255 255 255
    Write-Host ""

    $vencordNeedsUpdate = $false
    Show-Spinner "Checking for Vencord updates..." {
        Set-Location $using:VencordDir
        cmd.exe /c "git fetch 2>&1"
        $local = (cmd.exe /c "git rev-parse HEAD 2>&1").Trim()
        $remote = (cmd.exe /c "git rev-parse @{u} 2>&1").Trim()
        if ($local -ne $remote) { return "needs-update" }
        return "up-to-date"
    } -OutVariable vencordResult | Out-Null

    if ($vencordResult -eq "needs-update") {
        Show-Spinner "Updating Vencord..." {
            Set-Location $using:VencordDir
            cmd.exe /c "git pull 2>&1"
            if ($LASTEXITCODE -ne 0) { throw "Updating Vencord failed" }
        } | Out-Null
    } else {
        Write-Host -NoNewline "  "
        Write-Pastel ">" 173 216 230
        Write-Pastel " Vencord is already up to date." 255 255 255
        Write-Host ""
    }
}

Write-Host ""

if (Test-Path (Join-Path $ScriptDir ".git")) {
    $extNeedsUpdate = $false
    Show-Spinner "Checking for extension updates..." {
        Set-Location $using:ScriptDir
        cmd.exe /c "git fetch 2>&1"
        $local = (cmd.exe /c "git rev-parse HEAD 2>&1").Trim()
        $remote = (cmd.exe /c "git rev-parse @{u} 2>&1").Trim()
        if ($local -ne $remote) { return "needs-update" }
        return "up-to-date"
    } -OutVariable extResult | Out-Null

    if ($extResult -eq "needs-update") {
        Show-Spinner "Updating extension..." {
            Set-Location $using:ScriptDir
            cmd.exe /c "git pull 2>&1"
            if ($LASTEXITCODE -ne 0) { throw "Updating extension failed" }
        } | Out-Null
    } else {
        Write-Host -NoNewline "  "
        Write-Pastel ">" 173 216 230
        Write-Pastel " Extension is already up to date." 255 255 255
        Write-Host ""
    }
}

Write-Host ""
$PluginName = "QuestCompleter"
$PluginSource = $ScriptDir.TrimEnd('\')
$PluginDest = Join-Path $VencordDir "src\userplugins\$PluginName"

Show-Spinner "Copying extension..." {
    $src = $using:PluginSource
    $dest = $using:PluginDest
    if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item -Path "$src\*" -Destination $dest -Recurse -Force
} | Out-Null

Show-Spinner "Installing Vencord dependencies..." {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Set-Location $using:VencordDir
    $pnpm = Join-Path $env:APPDATA "npm\pnpm.cmd"
    if (Test-Path $pnpm) {
        cmd.exe /c "`"$pnpm`" install 2>&1"
    } else {
        cmd.exe /c "pnpm install 2>&1"
    }
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
} | Out-Null

Show-Spinner "Building Vencord..." {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Set-Location $using:VencordDir
    $pnpm = Join-Path $env:APPDATA "npm\pnpm.cmd"
    if (Test-Path $pnpm) {
        cmd.exe /c "`"$pnpm`" build 2>&1"
    } else {
        cmd.exe /c "pnpm build 2>&1"
    }
    if ($LASTEXITCODE -ne 0) { throw "pnpm build failed" }
} | Out-Null

Show-Spinner "Injecting client..." {
    $env:VENCORD_USER_DATA_DIR = $using:VencordDir
    $env:VENCORD_DEV_INSTALL = "1"
    $exe = Join-Path $using:VencordDir "dist\Installer\VencordInstallerCli.exe"
    if (-not (Test-Path $exe)) {
        New-Item -ItemType Directory -Force -Path (Split-Path $exe) | Out-Null
        Invoke-WebRequest -Uri "https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli.exe" -OutFile $exe -UseBasicParsing
    }
    & $exe -install -branch stable 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Injection failed" }
} | Out-Null

Write-Host ""
Write-Host -NoNewline "  "
Write-Pastel "*" 173 216 230
Write-Pastel " Installation complete! Restart Discord to apply." 255 255 255
Write-Host ""
