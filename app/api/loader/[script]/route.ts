import { NextRequest, NextResponse } from "next/server";
import { listScripts } from "@/lib/store";

export const runtime = "nodejs";

function loaderSource(origin: string, scriptSlug: string) {
  const runUrl = `${origin.replace(/\/$/, "")}/api/loader/${encodeURIComponent(scriptSlug)}/run`;
  return `-- AegisLua protected loader
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local RUN_URL = ${JSON.stringify(runUrl)}

local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local function b64decode(data)
    data = string.gsub(data, '[^'..b..'=]', '')
    return (data:gsub('.', function(x)
        if x == '=' then return '' end
        local r,f='',(b:find(x)-1)
        for i=6,1,-1 do r = r .. (f % 2^i - f % 2^(i-1) > 0 and '1' or '0') end
        return r
    end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)
        if #x ~= 8 then return '' end
        local c=0
        for i=1,8 do c = c + (x:sub(i,i) == '1' and 2^(8-i) or 0) end
        return string.char(c)
    end))
end

local function postJson(url, body)
    local payload = HttpService:JSONEncode(body)
    if syn and syn.request then
        return syn.request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = payload}).Body
    end
    if http_request then
        return http_request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = payload}).Body
    end
    if request then
        return request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = payload}).Body
    end
    return game:HttpPost(url, payload, "application/json")
end

local gui = Instance.new("ScreenGui")
gui.Name = "AL_" .. tostring(math.random(100000, 999999))
gui.ResetOnSpawn = false
gui.Parent = LocalPlayer:WaitForChild("PlayerGui")

local frame = Instance.new("Frame")
frame.Size = UDim2.fromOffset(360, 190)
frame.Position = UDim2.new(0.5, -180, 0.5, -95)
frame.BackgroundColor3 = Color3.fromRGB(12, 12, 16)
frame.BorderSizePixel = 0
frame.Parent = gui

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.Position = UDim2.fromOffset(18, 14)
title.Size = UDim2.new(1, -36, 0, 28)
title.Font = Enum.Font.GothamBold
title.Text = "AegisLua"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 20
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = frame

local input = Instance.new("TextBox")
input.Position = UDim2.fromOffset(18, 62)
input.Size = UDim2.new(1, -36, 0, 42)
input.BackgroundColor3 = Color3.fromRGB(22, 22, 28)
input.TextColor3 = Color3.fromRGB(255, 255, 255)
input.PlaceholderText = "Enter key"
input.Text = ""
input.ClearTextOnFocus = false
input.Font = Enum.Font.Gotham
input.TextSize = 14
input.Parent = frame

local status = Instance.new("TextLabel")
status.BackgroundTransparency = 1
status.Position = UDim2.fromOffset(18, 112)
status.Size = UDim2.new(1, -36, 0, 22)
status.Font = Enum.Font.Gotham
status.Text = "Paste your key to run this script."
status.TextColor3 = Color3.fromRGB(165, 165, 175)
status.TextSize = 13
status.TextXAlignment = Enum.TextXAlignment.Left
status.Parent = frame

local button = Instance.new("TextButton")
button.Position = UDim2.fromOffset(18, 142)
button.Size = UDim2.new(1, -36, 0, 34)
button.BackgroundColor3 = Color3.fromRGB(225, 29, 72)
button.TextColor3 = Color3.fromRGB(255, 255, 255)
button.Text = "Unlock"
button.Font = Enum.Font.GothamBold
button.TextSize = 14
button.Parent = frame

button.MouseButton1Click:Connect(function()
    status.Text = "Checking key..."
    local ok, raw = pcall(postJson, RUN_URL, {
        key = input.Text,
        userId = tostring(LocalPlayer.UserId),
        username = LocalPlayer.Name,
        placeId = tostring(game.PlaceId),
        deviceId = (gethwid and gethwid()) or "missing-device-id",
    })
    if not ok then
        status.Text = "Request failed."
        return
    end
    local decoded = HttpService:JSONDecode(raw)
    if decoded.ok and (decoded.payload or decoded.code) then
        gui:Destroy()
        local source = decoded.payload and b64decode(decoded.payload) or decoded.code
        loadstring(source)()
    else
        status.Text = decoded.reason or "Invalid key."
    end
end)
`;
}

export async function GET(request: NextRequest, context: { params: Promise<{ script: string }> }) {
  const { script: rawScript } = await context.params;
  const scriptId = decodeURIComponent(rawScript || "");
  const scripts = await listScripts();
  const script = scripts.find((item) => item.slug === scriptId || item.id === scriptId);

  if (!script || !script.active || !script.sourceEncrypted) {
    return new NextResponse("-- AegisLua loader unavailable", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(loaderSource(request.nextUrl.origin, script.slug), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
