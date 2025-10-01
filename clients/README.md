# LoopJS Client Implementations

This directory contains various client implementations for the LoopJS remote management system.

## Available Clients

### Qt Client

A cross-platform desktop client built with Qt framework. This is the primary client used for regular remote management operations. Features include:

- WebSocket-based communication
- Command execution
- File operations
- System management features

[Learn more](./qt-client/README.md)

### Stealth Client

An advanced client with additional stealth and evasion features. Designed for security research and penetration testing scenarios. Features include:

- Advanced evasion techniques
- Process injection capabilities
- Memory protection mechanisms
- Extended persistence options

[Learn more](./stealth-client/README.md)

## Building the Clients

Each client has its own build instructions in their respective directories.

## Configuration

All clients connect to the LoopJS backend server using WebSocket connections. Update the configuration files to point to your deployed backend:

```json
{
  "server": {
    "url": "wss://your-backend-url.com/ws"
  }
}
```

## Security Considerations

- Always use secure WebSocket connections (wss://) in production
- Keep backend URLs and authentication tokens confidential
- Use obfuscation and code signing for production deployments
- Ensure proper error handling and logging

## Development

When contributing to client development, follow these guidelines:

1. Maintain consistent coding style with existing codebase
2. Document all public methods and classes
3. Write unit tests for new functionality
4. Follow secure coding practices