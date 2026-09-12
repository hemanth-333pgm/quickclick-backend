<#
.SYNOPSIS
    QuickClick — full order lifecycle test.
#>

param([string]$BaseUrl = 'http://localhost:5000/api/v1')

$Global:passed   = 0
$Global:failed   = 0
$Global:failures = @()

function Section($t) {
    Write-Host "`n$('=' * 72)" -ForegroundColor Cyan
    Write-Host "  $t" -ForegroundColor Cyan
    Write-Host "$('=' * 72)" -ForegroundColor Cyan
}
function Step($n, $t)  { Write-Host "`n  [$n] $t" -ForegroundColor White }
function Pass($m)      { Write-Host "    [OK] $m" -ForegroundColor Green;  $Global:passed++ }
function Fail($m)      { Write-Host "    [X]  $m" -ForegroundColor Red;    $Global:failed++; $Global:failures += $m }
function Info($m)      { Write-Host "    . $m" -ForegroundColor DarkGray }

function Req {
    param(
        [string]$Method, [string]$Url,
        [hashtable]$Headers = @{}, $Body = $null,
        [int]$TimeoutSec = 30
    )
    try {
        $p = @{ Uri = $Url; Method = $Method; UseBasicParsing = $true
                ErrorAction = 'Stop'; Headers = $Headers; TimeoutSec = $TimeoutSec }
        if ($Body) {
            if ($Body -is [string]) { $p.Body = $Body }
            else { $p.Body = ($Body | ConvertTo-Json -Depth 12) }
            $p.ContentType = 'application/json'
        }
        $r = Invoke-WebRequest @p
        $parsed = $null
        try { $parsed = $r.Content | ConvertFrom-Json } catch { $parsed = $r.Content }
        return @{ ok = $true; status = [int]$r.StatusCode; data = $parsed; raw = $r.Content }
    } catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $code = [int]$resp.StatusCode
            try {
                $sr  = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $txt = $sr.ReadToEnd()
            } catch { $txt = "" }
            $parsed = $null
            try { $parsed = $txt | ConvertFrom-Json } catch { $parsed = $txt }
            return @{ ok = $false; status = $code; data = $parsed; raw = $txt }
        }
        return @{ ok = $false; status = 0; data = $null; raw = $_.Exception.Message }
    }
}

function Login {
    param([string]$Mobile, [string]$Label, [string]$Name = $null)

    $body = @{ mobile = $Mobile; purpose = 'LOGIN' }
    if ($Name) { $body.name = $Name }

    $send = Req 'POST' "$BaseUrl/auth/send-otp" @{} $body
    if (-not $send.ok) {
        Fail "send-otp $Label - HTTP $($send.status)"
        return $null
    }

    $otp = $send.data.data.devOtp
    if (-not $otp) {
        Write-Host "      Enter OTP for ${Label}: " -NoNewline -ForegroundColor DarkYellow
        $otp = Read-Host
    }

    $verify = Req 'POST' "$BaseUrl/auth/verify-otp" @{} @{ mobile = $Mobile; otp = $otp }
    if (-not $verify.ok) {
        Fail "verify-otp $Label - HTTP $($verify.status)"
        return $null
    }

    Pass "Login $Label - role=$($verify.data.data.user.role)"
    return @{
        token   = $verify.data.data.accessToken
        user    = $verify.data.data.user
        mobile  = $Mobile
        headers = @{ Authorization = "Bearer $($verify.data.data.accessToken)" }
    }
}

# BANNER
Write-Host "`n========================================================" -ForegroundColor White
Write-Host "  QUICKCLICK - ORDER LIFECYCLE TEST" -ForegroundColor White
Write-Host "  $BaseUrl" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor White

# 0 - Health
Section "0 - Health"
$health = Req 'GET' ($BaseUrl -replace '/api/v1$', '/health')
if ($health.ok) { Pass "GET /health ($($health.data.status))" }
else { Fail "GET /health - HTTP $($health.status)"; return }

# 1 - Customer
Section "1 - Customer"

Step 1 "Login as customer"
$cust = Login '+919999999901' 'Customer'
if (-not $cust) { return }
$ch = $cust.headers

Step 2 "Customer profile"
$me = Req 'GET' "$BaseUrl/users/me" $ch
if ($me.ok) {
    Pass "GET /users/me - $($me.data.data.name) ($($me.data.data.role))"
} else {
    Fail "GET /users/me - HTTP $($me.status)"
    return
}

Step 3 "Create delivery address"
$addr = Req 'POST' "$BaseUrl/addresses" $ch @{
    label      = "Lifecycle $(Get-Random -Maximum 9999)"
    line1      = '123 Test Lane'
    city       = 'Bengaluru'
    state      = 'Karnataka'
    postalCode = '560038'
    latitude   = 12.9716
    longitude  = 77.5946
    isDefault  = $true
}
if ($addr.ok) {
    Pass "POST /addresses"
    $addrId = $addr.data.data._id
} else {
    Fail "POST /addresses - HTTP $($addr.status)"
    return
}

# 2 - Retailer
Section "2 - Retailer"

Step 4 "Login as retailer"
$ret = Login '+918888888801' 'Retailer'
if (-not $ret) { return }
$rh = $ret.headers

Step 5 "Retailer profile"
$retMe = Req 'GET' "$BaseUrl/retailers/me" $rh
if ($retMe.ok) {
    $retailerId = $retMe.data.data._id
    $retStatus  = $retMe.data.data.status
    Pass "GET /retailers/me - $($retMe.data.data.shopName) ($retStatus)"
    if ($retStatus -ne 'APPROVED') {
        Info "Retailer is $retStatus - approving via admin"
        $adm0 = Login '+919888888888' 'Admin'
        if ($adm0) {
            $appr = Req 'PATCH' "$BaseUrl/admin/retailers/$retailerId/status" $adm0.headers @{
                status = 'APPROVED'; remarks = 'Auto-approved'
            }
            if ($appr.ok) { Pass "Retailer auto-approved" }
            else { Fail "Approve failed - HTTP $($appr.status)"; return }
        }
    }
} else {
    Fail "GET /retailers/me - HTTP $($retMe.status)"
    return
}

Step 6 "Retailer creates a product"
$catList = Req 'GET' "$BaseUrl/categories"
$catId = if ($catList.ok -and $catList.data.data.Count -gt 0) { $catList.data.data[0]._id } else { $null }
$prod = Req 'POST' "$BaseUrl/products" $rh @{
    name          = "Lifecycle Product $(Get-Random -Maximum 9999)"
    description   = 'Created by test'
    price         = 100
    discountPrice = 90
    unit          = 'kg'
    stockQty      = 50
    categoryId    = $catId
    imageUrl      = @('https://example.com/test.jpg')
    tags          = @('test')
}
if ($prod.ok) {
    $productId = $prod.data.data._id
    Pass "POST /products - stock=$($prod.data.data.stockQty)"
} else {
    Fail "POST /products - HTTP $($prod.status)"
    return
}

# 3 - Order
Section "3 - Customer places order"

Step 7 "POST /orders"
$order = Req 'POST' "$BaseUrl/orders" $ch @{
    items = @(@{ productId = $productId; quantity = 2 })
    addressId            = $addrId
    paymentMethod        = 'COD'
    deliveryInstructions = 'Call before delivery'
}
if ($order.ok) {
    $orderId     = $order.data.data._id
    $orderNumber = $order.data.data.orderNumber
    Pass "Order $orderNumber created (Rs $($order.data.data.total))"
} else {
    Fail "POST /orders - HTTP $($order.status)"
    return
}

Step 8 "Stock decremented"
$pc = Req 'GET' "$BaseUrl/products/$productId"
if ($pc.ok) {
    if ($pc.data.data.stockQty -eq 48) { Pass "Stock 50 -> 48" }
    else { Fail "Stock is $($pc.data.data.stockQty)" }
}

Step 9 "Cart cleared"
$cart = Req 'GET' "$BaseUrl/cart" $ch
if ($cart.ok) {
    $n = if ($cart.data.data.items) { $cart.data.data.items.Count } else { 0 }
    if ($n -eq 0) { Pass "Cart empty" } else { Fail "Cart has $n items" }
}

# 4 - Retailer progression
Section "4 - Retailer progresses order"

Step 10 "PLACED -> ACCEPTED"
$acc = Req 'PATCH' "$BaseUrl/retailer/orders/$orderId/status" $rh @{ status = 'ACCEPTED' }
if ($acc.ok) { Pass "-> ACCEPTED" } else { Fail "ACCEPTED - HTTP $($acc.status)"; return }

Step 11 "ACCEPTED -> PREPARING"
$prep = Req 'PATCH' "$BaseUrl/retailer/orders/$orderId/status" $rh @{ status = 'PREPARING' }
if ($prep.ok) { Pass "-> PREPARING" } else { Fail "PREPARING - HTTP $($prep.status)"; return }

Step 12 "PREPARING -> READY_FOR_PICKUP (auto-assign)"
$ready = Req 'PATCH' "$BaseUrl/retailer/orders/$orderId/status" $rh @{ status = 'READY_FOR_PICKUP' }
if (-not $ready.ok) {
    Fail "READY_FOR_PICKUP - HTTP $($ready.status)"
    return
}
$assignmentId = $ready.data.data.assignmentId
$newStatus    = $ready.data.data.status
Pass "-> READY_FOR_PICKUP (resulting: $newStatus)"
if (-not $assignmentId) {
    Fail "No assignmentId - auto-assign did not fire"
    return
}
Pass "Auto-assign fired - assignmentId=$($assignmentId.Substring(0,[Math]::Min(12,$assignmentId.Length)))"

# 5 - Discover assigned partner
Section "5 - Discover assigned partner"

Step 13 "Admin login"
$adm = Login '+919888888888' 'Admin'
if (-not $adm) { return }
$ah = $adm.headers

Step 14 "Find which partner holds our job"
$candidates = @(
    @{ mobile = '+917777777701'; label = 'Arun' },
    @{ mobile = '+917777777702'; label = 'Partner2' },
    @{ mobile = '+917777777703'; label = 'Partner3' }
)

$assignedPartner = $null
$jobId           = $null

foreach ($c in $candidates) {
    $mobile = $c.mobile
    $label  = $c.label

    $dLogin = Login $mobile "Delivery $label"
    if (-not $dLogin) { continue }

    Req 'PATCH' "$BaseUrl/delivery/me/availability" $dLogin.headers @{ availability = 'ONLINE' } | Out-Null
    Req 'PATCH' "$BaseUrl/delivery/me/location" $dLogin.headers @{ lat = 12.9716; lng = 77.5946 } | Out-Null

    $jobs = Req 'GET' "$BaseUrl/delivery/jobs" $dLogin.headers
    if (-not $jobs.ok) { continue }

    $match = @($jobs.data.data) | Where-Object {
        $oid = if ($_.orderId._id) { $_.orderId._id } else { $_.orderId }
        $oid -eq $orderId
    } | Select-Object -First 1

    if ($match) {
        $assignedPartner = $dLogin
        $assignedPartner.mobile = $mobile
        $assignedPartner.label  = $label
        $jobId = $match._id
        Pass "Our job is held by $label ($mobile)"
        Info "jobId=$jobId (status=$($match.status))"
        break
    }
}

if (-not $assignedPartner) {
    Fail "Could not find the assigned partner among candidates"
    return
}

# 6 - Delivery lifecycle
Section "6 - Delivery job lifecycle"

Step 15 "Ensure partner ONLINE with location"
Req 'PATCH' "$BaseUrl/delivery/me/availability" $assignedPartner.headers @{ availability = 'ONLINE' } | Out-Null
$loc = Req 'PATCH' "$BaseUrl/delivery/me/location" $assignedPartner.headers @{ lat = 12.9716; lng = 77.5946 }
if ($loc.ok) { Pass "Availability ONLINE + location set" }
else { Fail "Location update - HTTP $($loc.status)" }

Step 16 "Progress job transitions"
$states = @('ACCEPTED', 'REACHED_STORE', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED')
foreach ($st in $states) {
    $r = Req 'PATCH' "$BaseUrl/delivery/jobs/$jobId/status" $assignedPartner.headers @{ status = $st }
    if ($r.ok) {
        $orderStatus = $r.data.data.orderStatus
        Pass "PATCH -> $st (order: $orderStatus)"
    } else {
        Fail "PATCH -> $st - HTTP $($r.status)"
        break
    }
    Start-Sleep -Milliseconds 300
}

# 7 - Customer final
Section "7 - Customer sees delivered order"

Step 17 "Customer fetches order"
$final = Req 'GET' "$BaseUrl/orders/$orderId" $ch
if ($final.ok) {
    Pass "Order final status: $($final.data.data.status)"
    if ($final.data.data.status -eq 'DELIVERED') {
        Pass "Order lifecycle completed successfully"
    } else {
        Fail "Expected DELIVERED, got $($final.data.data.status)"
    }
} else {
    Fail "GET /orders/:id - HTTP $($final.status)"
}

Step 18 "Order in customer list"
$myOrders = Req 'GET' "$BaseUrl/orders?limit=50" $ch
if ($myOrders.ok) {
    $mine = @($myOrders.data.data | Where-Object { $_._id -eq $orderId })
    if ($mine.Count -gt 0) { Pass "Order appears in customer list" }
    else { Fail "Order missing from customer list" }
}

# 8 - Retailer dashboard
Section "8 - Retailer dashboard"

Step 19 "Dashboard stats"
$stats = Req 'GET' "$BaseUrl/retailer/dashboard/stats" $rh
if ($stats.ok) {
    Pass "GET /retailer/dashboard/stats"
    Info "completedOrders=$($stats.data.data.completedOrders), revenueToday=$($stats.data.data.revenueToday)"
    if ($stats.data.data.completedOrders -ge 1) { Pass "Retailer sees completed orders" }
    else { Fail "completedOrders is 0" }
} else {
    Fail "Dashboard stats - HTTP $($stats.status)"
}

Step 20 "DELIVERED order visible to retailer"
$retD = Req 'GET' "$BaseUrl/retailer/orders?status=DELIVERED" $rh
if ($retD.ok) {
    $found = @($retD.data.data | Where-Object { $_._id -eq $orderId })
    if ($found.Count -gt 0) { Pass "Order in retailer DELIVERED list" }
    else { Fail "Order not in retailer DELIVERED list" }
}

# 9 - Admin
Section "9 - Admin dashboard"

Step 21 "Admin sees DELIVERED order"
$adminOrders = Req 'GET' "$BaseUrl/admin/orders?status=DELIVERED&limit=50" $ah
if ($adminOrders.ok) {
    $ordersArray = if ($adminOrders.data.data.orders) { $adminOrders.data.data.orders }
                   else { @($adminOrders.data.data) }
    $found = @($ordersArray | Where-Object { $_._id -eq $orderId })
    if ($found.Count -gt 0) { Pass "Order in admin DELIVERED list" }
    else { Fail "Order missing from admin DELIVERED list" }
} else {
    Fail "Admin orders - HTTP $($adminOrders.status)"
}

Step 22 "Admin dashboard metrics"
$dash = Req 'GET' "$BaseUrl/admin/dashboard" $ah
if ($dash.ok) {
    Pass "GET /admin/dashboard"
    Info "users=$($dash.data.data.metrics.users.total), orders=$($dash.data.data.metrics.orders.total)"
} else {
    Fail "Dashboard - HTTP $($dash.status)"
}

# RESULTS
Section "RESULTS"

$total = $Global:passed + $Global:failed
$pct   = if ($total -gt 0) { [math]::Round(100 * $Global:passed / $total, 1) } else { 0 }

Write-Host ""
Write-Host "  Order Number: $orderNumber"
Write-Host "  Order ID:     $orderId"
if ($assignedPartner) {
    Write-Host "  Assigned to:  $($assignedPartner.label) ($($assignedPartner.mobile))"
}
Write-Host ""
Write-Host "  Passed: $Global:passed" -ForegroundColor Green
Write-Host "  Failed: $Global:failed" -ForegroundColor Red
Write-Host "  Total:  $total"
Write-Host "  Score:  $pct%" -ForegroundColor $(if ($pct -ge 90) { 'Green' } elseif ($pct -ge 70) { 'Yellow' } else { 'Red' })

if ($Global:failures.Count -gt 0) {
    Write-Host "`n  FAILURES:" -ForegroundColor Red
    $Global:failures | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}
Write-Host ""
