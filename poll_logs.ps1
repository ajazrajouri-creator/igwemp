for ($i=0; $i -lt 30; $i++) {
    node fetchLogs.cjs
    $res = Select-String -Pattern 'BlobNotFound' ci_logs.txt
    if (-not $res) {
        Write-Host "Logs fetched successfully!"
        break
    }
    Write-Host "Waiting 10 seconds..."
    Start-Sleep -Seconds 10
}
Select-String -Pattern 'ERROR|FAIL|pgTAP|ok' ci_logs.txt | Select-Object -Last 30
